/**
 * Sepet senkronizasyonu — yalnızca giriş yapmış kullanıcılar için.
 *
 * İstemci (CartSync) sepet değiştikçe debounce ile bu uca POST eder. Misafir
 * kullanıcılar için sessizce no-op döner (e-posta bilinmediğinden hatırlatma
 * gönderilemez). Giriş yapmış kullanıcının AKTIF sepeti DB'ye yazılır; böylece
 * terk-edilen-sepet cron'u sepeti tespit edip hatırlatma e-postası gönderebilir.
 *
 * Her senkronizasyon reminderSentAt'i sıfırlar: kullanıcı sepetini her
 * değiştirdiğinde hatırlatma penceresi yeniden başlar (spam'i önler).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { getAuthUser } from "@/lib/auth/middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SyncSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).nullable().optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(100),
});

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return ok({ synced: false });

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = SyncSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const items = parsed.data.items;

  try {
    // Geçerli (aktif) ürünleri ve varyantları doğrula — FK hatasını ve
    // pasif/silinmiş ürünlerin sepete yazılmasını önle.
    const productIds = [...new Set(items.map((i) => i.productId))];
    const validProducts = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true },
        })
      : [];
    const validProductIds = new Set(validProducts.map((p) => p.id));

    const variantIds = [...new Set(items.map((i) => i.variantId).filter((v): v is string => Boolean(v)))];
    const validVariants = variantIds.length
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds }, isActive: true },
          select: { id: true, productId: true },
        })
      : [];
    const variantOwner = new Map(validVariants.map((v) => [v.id, v.productId]));

    const cleanItems = items.filter((i) => {
      if (!validProductIds.has(i.productId)) return false;
      if (i.variantId && variantOwner.get(i.variantId) !== i.productId) return false;
      return true;
    });

    // findFirst transaction İÇİNDE: iki sekme aynı anda senkronize ederken
    // çift AKTIF sepet oluşmasını önler.
    await prisma.$transaction(async (tx) => {
      const existing = await tx.cart.findFirst({
        where: { userId: authUser.userId, status: "AKTIF" },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });

      // Boş sepet + kayıt yok → gereksiz boş kayıt açma.
      if (items.length === 0 && !existing) return;

      const cart = existing
        ? await tx.cart.update({
            where: { id: existing.id },
            data: { reminderSentAt: null, status: "AKTIF" },
            select: { id: true },
          })
        : await tx.cart.create({
            data: { userId: authUser.userId, status: "AKTIF" },
            select: { id: true },
          });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (cleanItems.length > 0) {
        await tx.cartItem.createMany({
          data: cleanItems.map((i) => ({
            cartId: cart.id,
            productId: i.productId,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
          })),
        });
      }
    });

    return ok({ synced: true, items: cleanItems.length });
  } catch {
    return serverError();
  }
}
