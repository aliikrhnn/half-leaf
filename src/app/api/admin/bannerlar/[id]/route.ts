import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  title:     z.string().trim().min(1).optional(),
  imageUrl:  z.string().trim().min(1).optional(),
  linkUrl:   z.string().trim().nullable().optional(),
  position:  z.enum(["ANASAYFA_UST", "ANASAYFA_ALT", "KATEGORI"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive:  z.boolean().optional(),
  startsAt:  z.string().nullable().optional(),
  endsAt:    z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return notFound("Banner bulunamadı.");
    return ok(banner);
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
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return notFound("Banner bulunamadı.");

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};
    const data:   Record<string, unknown> = {};

    for (const [key, val] of Object.entries(d)) {
      if (val === undefined) continue;
      if (key === "startsAt" || key === "endsAt") {
        const newVal = val ? new Date(val as string) : null;
        const oldVal = existing[key as "startsAt" | "endsAt"];
        if (String(newVal) !== String(oldVal)) { before[key] = oldVal; after[key] = newVal; }
        data[key] = newVal;
      } else {
        const existingVal = existing[key as keyof typeof existing];
        if (val !== existingVal) { before[key] = existingVal; after[key] = val; }
        data[key] = val;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.banner.update({ where: { id }, data });

      if (Object.keys(before).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "BANNER_UPDATED",
            entityType:  "Banner",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    const updated = await prisma.banner.findUnique({ where: { id } });
    return ok(updated);
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
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return notFound("Banner bulunamadı.");

    await prisma.$transaction(async (tx) => {
      await tx.banner.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action:      "BANNER_DELETED",
          entityType:  "Banner",
          entityId:    id,
          changes:     JSON.parse(JSON.stringify({ title: existing.title, position: existing.position })),
          ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
        },
      });
    });

    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
