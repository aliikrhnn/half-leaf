import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, conflict, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  /** Reel'in bağlı olduğu ürün değiştirilebilir (ürün başına tek reel kuralı korunur). */
  productId: z.string().min(1).max(40).optional(),
  videoUrl:  z.union([z.string().url(), z.literal("")]).nullable().optional(),
  badge:     z.string().trim().max(40).nullable().optional(),
  handle:    z.string().trim().max(60).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive:  z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    const reel = await prisma.productReel.findUnique({
      where: { id },
      include: {
        Product: {
          select: {
            id: true, name: true, slug: true, brand: true,
            ProductImage: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    });
    if (!reel) return notFound("Reel bulunamadı.");
    return ok(reel);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz alanlar.");
  const d = parsed.data;

  // Ürün değişiyorsa: ürün var mı ve BAŞKA bir reel onu kullanıyor mu?
  if (d.productId) {
    const [product, clash] = await Promise.all([
      prisma.product.findUnique({ where: { id: d.productId }, select: { id: true } }),
      prisma.productReel.findUnique({ where: { productId: d.productId }, select: { id: true } }),
    ]);
    if (!product) return badRequest("Ürün bulunamadı.");
    if (clash && clash.id !== id) return conflict("Bu ürünün zaten başka bir reel kaydı var.");
  }

  try {
    const reel = await prisma.productReel.update({
      where: { id },
      data: {
        ...(d.productId !== undefined && { productId: d.productId }),
        ...(d.videoUrl !== undefined && { videoUrl: d.videoUrl || null }),
        ...(d.badge !== undefined && { badge: d.badge || null }),
        ...(d.handle !== undefined && { handle: d.handle || null }),
        ...(d.sortOrder !== undefined && { sortOrder: d.sortOrder }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "PRODUCT_REEL_UPDATED",
        entityType:  "ProductReel",
        entityId:    reel.id,
        changes:     JSON.parse(JSON.stringify(d)),
      },
    });

    return ok(reel);
  } catch {
    return notFound("Reel bulunamadı.");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    await prisma.productReel.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "PRODUCT_REEL_DELETED",
        entityType:  "ProductReel",
        entityId:    id,
      },
    });
    return ok({ deleted: true });
  } catch {
    return notFound("Reel bulunamadı.");
  }
}
