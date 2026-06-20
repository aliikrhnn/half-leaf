/**
 * Kullanıcı kayıtlı adresleri — listele (GET) ve ekle (POST).
 * Yalnızca giriş yapmış kullanıcının kendi adresleri.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAuth, isResponse } from "@/lib/auth/middleware";

export const runtime = "nodejs";

export const AddressSchema = z.object({
  title: z.string().trim().min(1, "Başlık girin.").max(40),
  fullName: z.string().trim().min(2, "Ad soyad girin."),
  phone: z.string().trim().min(10, "Telefon girin."),
  city: z.string().trim().min(1, "İl seçin."),
  district: z.string().trim().min(1, "İlçe seçin."),
  neighborhood: z.string().trim().max(120).optional().default(""),
  fullAddress: z.string().trim().min(5, "Açık adres girin."),
  postalCode: z.string().trim().max(10).optional(),
  isDefault: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: auth.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return ok(addresses);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  let raw: unknown;
  try { raw = await req.json(); } catch { return badRequest("Geçersiz istek."); }
  const parsed = AddressSchema.safeParse(raw);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz alanlar.");
  const data = parsed.data;

  try {
    // İlk adres otomatik varsayılan olur.
    const count = await prisma.address.count({ where: { userId: auth.userId } });
    const makeDefault = data.isDefault || count === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId: auth.userId, isDefault: true }, data: { isDefault: false } });
      }
      return tx.address.create({
        data: {
          userId: auth.userId,
          title: data.title,
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          district: data.district,
          neighborhood: data.neighborhood,
          fullAddress: data.fullAddress,
          postalCode: data.postalCode || null,
          isDefault: makeDefault,
        },
      });
    });

    return created(address);
  } catch {
    return serverError();
  }
}
