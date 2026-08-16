import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, conflict, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export const runtime = "nodejs";

const CreateSchema = z.object({
  productId: z.string().min(1).max(40),
  videoUrl:  z.union([z.string().url(), z.literal("")]).nullable().optional(),
  badge:     z.string().trim().max(40).nullable().optional(),
  handle:    z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isActive:  z.boolean().default(true),
});

/** Reel listesi — ürün adı, markası ve görseliyle birlikte. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const reels = await prisma.productReel.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            isActive: true,
            ProductImage: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    });
    return ok(reels);
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
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz alanlar.");
  const d = parsed.data;

  try {
    const product = await prisma.product.findUnique({
      where: { id: d.productId },
      select: { id: true, name: true },
    });
    if (!product) return badRequest("Ürün bulunamadı.");

    // Her ürünün en fazla bir reel'i olur (şemada productId unique).
    const existing = await prisma.productReel.findUnique({ where: { productId: d.productId } });
    if (existing) return conflict("Bu ürünün zaten bir reel kaydı var.");

    const reel = await prisma.productReel.create({
      data: {
        productId: d.productId,
        videoUrl:  d.videoUrl || null,
        badge:     d.badge || null,
        handle:    d.handle || null,
        sortOrder: d.sortOrder,
        isActive:  d.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "PRODUCT_REEL_CREATED",
        entityType:  "ProductReel",
        entityId:    reel.id,
        changes:     JSON.parse(JSON.stringify({ product: product.name })),
      },
    });

    return created(reel);
  } catch {
    return serverError();
  }
}
