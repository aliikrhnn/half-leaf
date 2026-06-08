import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  title:      z.string().trim().min(1).optional(),
  subtitle:   z.string().trim().nullable().optional(),
  eyebrow:    z.string().trim().nullable().optional(),
  ctaLabel:   z.string().trim().min(1).optional(),
  ctaHref:    z.string().trim().min(1).optional(),
  image:      z.string().trim().nullable().optional(),
  sortOrder:  z.number().int().min(0).optional(),
  isActive:   z.boolean().optional(),
  startsAt:   z.string().nullable().optional(),
  endsAt:     z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const slide = await prisma.heroSlide.findUnique({ where: { id } });
    if (!slide) return notFound("Hero slide bulunamadı.");
    return ok(slide);
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
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) return notFound("Hero slide bulunamadı.");

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
      await tx.heroSlide.update({ where: { id }, data });

      if (Object.keys(before).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "HERO_SLIDE_UPDATED",
            entityType:  "HeroSlide",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    const updated = await prisma.heroSlide.findUnique({ where: { id } });
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
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) return notFound("Hero slide bulunamadı.");

    await prisma.$transaction(async (tx) => {
      await tx.heroSlide.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action:      "HERO_SLIDE_DELETED",
          entityType:  "HeroSlide",
          entityId:    id,
          changes:     JSON.parse(JSON.stringify({ title: existing.title })),
          ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
        },
      });
    });

    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
