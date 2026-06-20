/**
 * Admin — yorum moderasyonu. Listeleme + onayla/reddet/sil.
 * Onay/red/sil sonrası ilgili ürünün ortalama puanı yeniden hesaplanır.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { recomputeProductRating } from "@/lib/reviews";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const where =
    status === "approved" ? { isApproved: true } :
    status === "pending"  ? { isApproved: false } :
    {};

  try {
    const reviews = await prisma.review.findMany({
      where,
      include: { Product: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(
      reviews.map((r) => ({
        id: r.id,
        productSlug: r.Product.slug,
        productName: r.Product.name,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isApproved: r.isApproved,
        isVerified: r.isVerified,
        createdAt: r.createdAt,
      })),
    );
  } catch {
    return serverError();
  }
}

const PatchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject", "delete"]),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let raw: unknown;
  try { raw = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");
  const { id, action } = parsed.data;

  const review = await prisma.review.findUnique({ where: { id }, select: { id: true, productId: true } });
  if (!review) return notFound("Yorum bulunamadı.");

  try {
    if (action === "delete") {
      await prisma.review.delete({ where: { id } });
    } else {
      await prisma.review.update({
        where: { id },
        data: { isApproved: action === "approve" },
      });
    }
    await recomputeProductRating(review.productId);
    return ok({ updated: true });
  } catch {
    return serverError();
  }
}
