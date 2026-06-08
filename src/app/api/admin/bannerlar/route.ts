import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const CreateSchema = z.object({
  title:     z.string().trim().min(1),
  imageUrl:  z.string().trim().min(1),
  linkUrl:   z.string().trim().optional(),
  position:  z.enum(["ANASAYFA_UST", "ANASAYFA_ALT", "KATEGORI"]),
  sortOrder: z.number().int().min(0).default(0),
  isActive:  z.boolean().default(true),
  startsAt:  z.string().optional(),
  endsAt:    z.string().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const isActive = searchParams.get("isActive");

    const where = {
      ...(isActive === "true"  ? { isActive: true  } : {}),
      ...(isActive === "false" ? { isActive: false } : {}),
    };

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ position: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return ok(banners);
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
    const banner = await prisma.banner.create({
      data: {
        title:     d.title,
        imageUrl:  d.imageUrl,
        linkUrl:   d.linkUrl,
        position:  d.position,
        sortOrder: d.sortOrder,
        isActive:  d.isActive,
        startsAt:  d.startsAt ? new Date(d.startsAt) : undefined,
        endsAt:    d.endsAt   ? new Date(d.endsAt)   : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "BANNER_CREATED",
        entityType:  "Banner",
        entityId:    banner.id,
        changes:     JSON.parse(JSON.stringify({ title: d.title, position: d.position })),
        ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return created(banner);
  } catch {
    return serverError();
  }
}
