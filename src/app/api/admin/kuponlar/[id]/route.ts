import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  code:           z.string().trim().min(1).max(50).toUpperCase().optional(),
  description:    z.string().trim().optional(),
  discountType:   z.enum(["YUZDE", "SABIT"]).optional(),
  value:          z.number().positive().optional(),
  minOrderAmount: z.number().min(0).nullable().optional(),
  maxUses:        z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),
  startsAt:       z.string().nullable().optional(),
  expiresAt:      z.string().nullable().optional(),
  isActive:       z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return notFound("Kupon bulunamadı.");
    return ok({ ...coupon, value: Number(coupon.value), minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null });
  } catch {
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const d = parsed.data;
  if (Object.keys(d).length === 0) return badRequest("En az bir alan gerekli.");

  try {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFound("Kupon bulunamadı.");

    if (d.code && d.code !== existing.code) {
      const conflict = await prisma.coupon.findUnique({ where: { code: d.code } });
      if (conflict) return badRequest("Bu kupon kodu zaten kullanımda.");
    }

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};

    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(d)) {
      if (val === undefined) continue;
      if (key === "startsAt" || key === "expiresAt") {
        const newVal = val ? new Date(val as string) : null;
        const oldVal = existing[key as "startsAt" | "expiresAt"];
        if (String(newVal) !== String(oldVal)) { before[key] = oldVal; after[key] = newVal; }
        data[key] = newVal;
      } else {
        const existingVal = existing[key as keyof typeof existing];
        if (val !== existingVal) { before[key] = existingVal; after[key] = val; }
        data[key] = val;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.coupon.update({ where: { id }, data });

      if (Object.keys(before).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "COUPON_UPDATED",
            entityType:  "Coupon",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    const updated = await prisma.coupon.findUnique({ where: { id } });
    return ok({ ...updated!, value: Number(updated!.value), minOrderAmount: updated!.minOrderAmount ? Number(updated!.minOrderAmount) : null });
  } catch {
    return serverError();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return notFound("Kupon bulunamadı.");

    await prisma.$transaction(async (tx) => {
      await tx.coupon.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action:      "COUPON_DELETED",
          entityType:  "Coupon",
          entityId:    id,
          changes:     JSON.parse(JSON.stringify({ code: existing.code })),
          ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
        },
      });
    });

    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
