/**
 * Sunucu tarafı sepet — hesaba bağlı sepetin tek doğruluk kaynağı.
 *
 * Sepet daha önce yalnızca tarayıcının localStorage'ında yaşıyordu; sunucudaki
 * `Cart` kaydı tek yönlü bir kopyaydı ve sadece terk-edilen-sepet e-postası
 * için kullanılıyordu. Bunun iki sonucu vardı:
 *
 *  1. Aynı cihazda A çıkış yapıp B giriş yaptığında B, A'nın sepetini görüyordu
 *     (localStorage kime ait olduğunu bilmiyordu).
 *  2. Misafirken doldurulan sepet, üye olunca hesaba taşınmıyordu.
 *
 * Bu modül sepeti hesaba bağlar: giriş yapmış kullanıcının sepeti sunucudan
 * OKUNUR, misafir sepeti girişte hesaba BİRLEŞTİRİLİR.
 */

import { prisma } from "@/lib/db/prisma";
import { mapProduct, type DbProduct } from "@/lib/db/mappers";
import { getUsdTryRate } from "@/lib/pricing";
import type { CartItem } from "@/lib/types";

/** İstemciden gelen ham sepet satırı (ürün verisi taşımaz). */
export interface CartLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

/** Aynı ürün+varyant satırlarını tek anahtarda toplar. */
function lineKey(productId: string, variantId?: string | null): string {
  return `${productId}|${variantId ?? ""}`;
}

const productInclude = {
  Category: { select: { id: true, slug: true, name: true } },
  ProductImage: { orderBy: { sortOrder: "asc" } },
  Inventory: { select: { quantity: true } },
} as const;

/**
 * Ham satırları doğrular, stok üst sınırına kırpar ve istemcinin beklediği
 * `CartItem` biçimine dönüştürür. Pasif/silinmiş ürün ve varyantlar düşer.
 */
async function materialize(lines: ReadonlyArray<CartLineInput>): Promise<CartItem[]> {
  if (lines.length === 0) return [];

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const variantIds = [...new Set(lines.map((l) => l.variantId).filter((v): v is string => Boolean(v)))];

  const [products, variants, usdTryRate] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: productInclude,
    }),
    variantIds.length
      ? prisma.productVariant.findMany({
          where: { id: { in: variantIds }, isActive: true },
          select: {
            id: true,
            productId: true,
            name: true,
            attributes: true,
            Inventory: { select: { quantity: true } },
          },
        })
      : Promise.resolve([]),
    getUsdTryRate(),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const items: CartItem[] = [];
  for (const line of lines) {
    const dbProduct = productById.get(line.productId);
    if (!dbProduct) continue;

    const variant = line.variantId ? variantById.get(line.variantId) : null;
    // Varyant başka ürüne aitse satır geçersizdir (kimlik karıştırma koruması).
    if (line.variantId && (!variant || variant.productId !== line.productId)) continue;

    const maxStock = variant
      ? (variant.Inventory?.quantity ?? 0)
      : (dbProduct.Inventory?.quantity ?? 0);
    if (maxStock <= 0) continue;

    const quantity = Math.min(line.quantity, maxStock);
    if (quantity <= 0) continue;

    const product = mapProduct(dbProduct as unknown as DbProduct, usdTryRate);
    const variantLabel = variant
      ? ((variant.attributes as Record<string, string> | null)?.renk ?? variant.name)
      : undefined;

    items.push({
      productId: product.id,
      product: variant ? { ...product, stock: maxStock } : product,
      quantity,
      variantId: variant?.id,
      variantLabel,
      maxStock,
    });
  }

  return items;
}

/** Kullanıcının AKTIF sepetindeki ham satırları döner. */
async function readActiveCartLines(userId: string): Promise<CartLineInput[]> {
  const cart = await prisma.cart.findFirst({
    where: { userId, status: "AKTIF" },
    orderBy: { updatedAt: "desc" },
    select: {
      CartItem: { select: { productId: true, variantId: true, quantity: true } },
    },
  });
  return cart?.CartItem ?? [];
}

/**
 * Kullanıcının sunucudaki sepetini istemci biçiminde döner.
 * Sepet yoksa boş dizi döner (hata değil).
 */
export async function loadUserCart(userId: string): Promise<CartItem[]> {
  return materialize(await readActiveCartLines(userId));
}

/**
 * Misafir sepetini kullanıcının hesabındaki sepete BİRLEŞTİRİR ve sonucu döner.
 *
 * Birleştirme kuralı: aynı ürün+varyant satırlarının adetleri TOPLANIR (üye,
 * misafirken eklediklerini kaybetmez), sonra güncel stoğa kırpılır. Toplama
 * yerine "en büyüğünü al" seçilmedi; kullanıcı iki farklı yerde gerçekten iki
 * ayrı ekleme yapmış olabilir ve sessizce adet düşürmek veri kaybı gibi görünür.
 */
export async function mergeGuestCartIntoUser(
  userId: string,
  guestLines: ReadonlyArray<CartLineInput>,
): Promise<CartItem[]> {
  const merged = new Map<string, CartLineInput>();

  const addLine = (line: CartLineInput) => {
    const key = lineKey(line.productId, line.variantId);
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + line.quantity, 99);
      return;
    }
    merged.set(key, { ...line, quantity: Math.min(line.quantity, 99) });
  };

  for (const line of await readActiveCartLines(userId)) addLine(line);
  for (const line of guestLines) addLine(line);

  // Doğrula + stoğa kırp: DB'ye yalnızca gerçekten satılabilir satırlar yazılır.
  const items = await materialize([...merged.values()]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.cart.findFirst({
      where: { userId, status: "AKTIF" },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (items.length === 0 && !existing) return;

    const cart = existing
      ? await tx.cart.update({
          where: { id: existing.id },
          data: { reminderSentAt: null, status: "AKTIF" },
          select: { id: true },
        })
      : await tx.cart.create({
          data: { userId, status: "AKTIF" },
          select: { id: true },
        });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (items.length > 0) {
      await tx.cartItem.createMany({
        data: items.map((i) => ({
          cartId: cart.id,
          productId: i.productId,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
      });
    }
  });

  return items;
}
