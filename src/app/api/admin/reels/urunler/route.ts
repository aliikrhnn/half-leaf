/**
 * Reels ekranındaki ürün seçici için hafif liste.
 *
 * Neden ayrı bir uç: /api/products şemasında `limit` üst sınırı 100 ve
 * katalog bundan büyük; ayrıca seçici yalnızca id/ad/marka istiyor, ürünün
 * tüm alanlarını (görseller, varyantlar, envanter) taşımanın anlamı yok.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        brand: true,
        // Dolu ise bu ürünün zaten bir reel'i var.
        ProductReel: { select: { id: true } },
      },
    });

    return ok(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        hasReel: p.ProductReel !== null,
      })),
    );
  } catch {
    return serverError();
  }
}
