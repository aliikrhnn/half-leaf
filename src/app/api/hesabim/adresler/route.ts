/**
 * Kullanıcı kayıtlı adresleri — listele (GET) ve ekle (POST).
 * Yalnızca giriş yapmış kullanıcının kendi adresleri.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAuth, isResponse } from "@/lib/auth/middleware";
import { AddressBookSchema } from "@/lib/validations/address-book.schema";

export const runtime = "nodejs";

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
  const parsed = AddressBookSchema.safeParse(raw);
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
