/**
 * Tek adres — güncelle (PATCH) ve sil (DELETE).
 * Yalnızca adresin sahibi (giriş yapmış kullanıcı) erişebilir.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAuth, isResponse } from "@/lib/auth/middleware";
import { AddressSchema } from "../route";

export const runtime = "nodejs";

async function ownAddress(userId: string, id: string) {
  const addr = await prisma.address.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!addr || addr.userId !== userId) return null;
  return addr;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;
  const { id } = await params;

  const owned = await ownAddress(auth.userId, id);
  if (!owned) return notFound("Adres bulunamadı.");

  let raw: unknown;
  try { raw = await req.json(); } catch { return badRequest("Geçersiz istek."); }
  const parsed = AddressSchema.partial().safeParse(raw);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz alanlar.");
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({ where: { userId: auth.userId, isDefault: true }, data: { isDefault: false } });
      }
      await tx.address.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.fullName !== undefined && { fullName: data.fullName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.district !== undefined && { district: data.district }),
          ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
          ...(data.fullAddress !== undefined && { fullAddress: data.fullAddress }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode || null }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });
    });
    return ok({ updated: true });
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;
  const { id } = await params;

  const owned = await ownAddress(auth.userId, id);
  if (!owned) return notFound("Adres bulunamadı.");

  try {
    const deleted = await prisma.address.delete({ where: { id } });
    // Varsayılan adres silindiyse, kalan ilk adresi varsayılan yap.
    if (deleted.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
