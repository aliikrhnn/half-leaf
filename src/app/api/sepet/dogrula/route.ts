/**
 * Sepet stok doğrulama — misafir + giriş yapmış kullanıcılar için.
 *
 * İstemci (CartPage / CheckoutClient / global StockReconciler) sepet satırlarını
 * `{ productId, variantId }` olarak gönderir; uç her satır için GÜNCEL stok ve
 * ürün/varyantın hâlâ aktif olup olmadığını döner. İstemci buna göre stoğu biten
 * satırları sepetten çıkarır ve adetleri kalan stoğa indirir.
 *
 * Yalnızca okuma yapar (DB'yi değiştirmez); auth gerektirmez.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ValidateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).nullable().optional(),
      }),
    )
    .max(100),
});

export interface StockLine {
  productId: string;
  variantId: string | null;
  /** Bu satır için satılabilir güncel adet (varyant varsa varyant stoğu). */
  available: number;
  /** Ürün (ve varsa varyant) hâlâ aktif ve mevcut mu. */
  active: boolean;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Geçersiz istek.");
  }

  const parsed = ValidateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz istek.");

  const items = parsed.data.items;
  if (items.length === 0) return ok({ stocks: [] as StockLine[] });

  try {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, Inventory: { select: { quantity: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p.Inventory?.quantity ?? 0]));

    const variantIds = [
      ...new Set(items.map((i) => i.variantId).filter((v): v is string => Boolean(v))),
    ];
    const variants = variantIds.length
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds }, isActive: true },
          select: { id: true, productId: true, Inventory: { select: { quantity: true } } },
        })
      : [];
    const variantMap = new Map(
      variants.map((v) => [v.id, { productId: v.productId, quantity: v.Inventory?.quantity ?? 0 }]),
    );

    const stocks: StockLine[] = items.map((line) => {
      const productActive = productMap.has(line.productId);
      if (!productActive) {
        return { productId: line.productId, variantId: line.variantId ?? null, available: 0, active: false };
      }
      if (line.variantId) {
        const variant = variantMap.get(line.variantId);
        // Varyant silinmiş/pasif ya da başka ürüne aitse → satır geçersiz.
        if (!variant || variant.productId !== line.productId) {
          return { productId: line.productId, variantId: line.variantId, available: 0, active: false };
        }
        return { productId: line.productId, variantId: line.variantId, available: variant.quantity, active: true };
      }
      return {
        productId: line.productId,
        variantId: null,
        available: productMap.get(line.productId) ?? 0,
        active: true,
      };
    });

    return ok({ stocks });
  } catch {
    return serverError();
  }
}
