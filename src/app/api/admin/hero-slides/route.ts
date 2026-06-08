import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const CreateSchema = z.object({
  title:      z.string().trim().min(1),
  subtitle:   z.string().trim().optional(),
  eyebrow:    z.string().trim().optional(),
  ctaLabel:   z.string().trim().min(1).default("Keşfet"),
  ctaHref:    z.string().trim().min(1),
  image:      z.string().trim().optional(),
  sortOrder:  z.number().int().min(0).default(0),
  isActive:   z.boolean().default(true),
  startsAt:   z.string().optional(),
  endsAt:     z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return ok(slides);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const d = parsed.data;

  try {
    const slide = await prisma.heroSlide.create({
      data: {
        title:      d.title,
        subtitle:   d.subtitle,
        eyebrow:    d.eyebrow,
        ctaLabel:   d.ctaLabel,
        ctaHref:    d.ctaHref,
        image:      d.image,
        sortOrder:  d.sortOrder,
        isActive:   d.isActive,
        startsAt:   d.startsAt ? new Date(d.startsAt) : undefined,
        endsAt:     d.endsAt   ? new Date(d.endsAt)   : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "HERO_SLIDE_CREATED",
        entityType:  "HeroSlide",
        entityId:    slide.id,
        changes:     JSON.parse(JSON.stringify({ title: d.title })),
        ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return created(slide);
  } catch {
    return serverError();
  }
}
