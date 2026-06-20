import { prisma } from "@/lib/db/prisma";

/**
 * Bir ürünün ortalama puanını ve yorum sayısını YALNIZCA onaylanmış yorumlardan
 * yeniden hesaplar ve Product'a yazar. Yorum onaylandığında/reddedildiğinde çağrılır.
 */
export async function recomputeProductRating(productId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const count = agg._count._all;
  const avg = agg._avg.rating;

  await prisma.product.update({
    where: { id: productId },
    data: {
      reviewCount: count,
      ratingAvg: count > 0 && avg != null ? Math.round(avg * 100) / 100 : null,
    },
  });
}
