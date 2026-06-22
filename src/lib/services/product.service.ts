import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { paginationMeta } from "@/lib/api/response";
import type { ProductQuery, CreateProductInput, UpdateProductInput } from "@/lib/validations/product.schema";

const PRODUCT_INCLUDE: Prisma.ProductInclude = {
  Category: { select: { id: true, slug: true, name: true } },
  ProductImage: { orderBy: { sortOrder: "asc" } },
  ProductVariant: { orderBy: { isActive: "desc" } },
  Inventory: { select: { quantity: true } },
};

export async function listProducts(query: ProductQuery) {
  const { page, limit, category, search, sort, isActive, isFeatured, isBestseller, cokSatanlar } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    ...(isActive !== undefined && { isActive }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(isBestseller !== undefined && { isBestseller }),
    ...(cokSatanlar && { isBestseller: true }),
    ...(category && { Category: { slug: category } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { shortDescription: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const orderBy = (() => {
    switch (sort) {
      case "price-asc": return { basePrice: "asc" as const };
      case "price-desc": return { basePrice: "desc" as const };
      case "newest": return { createdAt: "desc" as const };
      default: return { isFeatured: "desc" as const };
    }
  })();

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug }, include: PRODUCT_INCLUDE });
}

/** Admin formu için: ürünün renk varyantları (isim + hex + stok). */
export async function getProductColorVariants(id: string) {
  const variants = await prisma.productVariant.findMany({
    where: { productId: id, isActive: true },
    include: { Inventory: { select: { quantity: true } } },
  });
  return variants
    .map((v) => {
      const a = v.attributes as Record<string, string> | null;
      if (!a?.renk) return null;
      return { name: a.renk, hex: a.renk_hex ?? a.colorHex ?? a.hex ?? "#888888", stock: v.Inventory?.quantity ?? 0 };
    })
    .filter((c): c is { name: string; hex: string; stock: number } => c != null);
}

/**
 * Varyant verisini (stok dahil) Prisma nested-create şekline çevirir.
 * Her varyant kendi Inventory'sini alır; başlangıç stoğu varsa ledger'a GIRIS yazılır.
 */
function buildVariantCreate(variants: CreateProductInput["variants"]) {
  return (variants ?? []).map((v) => {
    const { stock: vStock = 0, ...vRest } = v;
    return {
      ...vRest,
      attributes: vRest.attributes as Prisma.InputJsonValue | undefined,
      Inventory: {
        create: {
          quantity: vStock,
          ...(vStock > 0
            ? { StockMovement: { create: { type: "GIRIS" as const, quantityChange: vStock, reason: "Başlangıç stoğu" } } }
            : {}),
        },
      },
    };
  });
}

export async function createProduct(data: CreateProductInput) {
  const { images, variants, stock, ...rest } = data;
  const qty = stock ?? 0;

  const imagesWithOriginal = (images ?? []).map((img) => ({
    ...img,
    originalUrl: img.url,
  }));

  return prisma.product.create({
    data: {
      ...rest,
      // Inventory'yi her zaman oluştur (0 olsa bile) — okuma tarafı ve sonraki
      // stok hareketleri için kayıt gerekli. Başlangıç stoğu varsa ledger'a GIRIS yaz.
      Inventory: {
        create: {
          quantity: qty,
          ...(qty > 0 && {
            StockMovement: { create: { type: "GIRIS", quantityChange: qty, reason: "Başlangıç stoğu" } },
          }),
        },
      },
      ...(imagesWithOriginal.length && { ProductImage: { create: imagesWithOriginal } }),
      ...(variants?.length && { ProductVariant: { create: buildVariantCreate(variants) } }),
    },
    include: PRODUCT_INCLUDE,
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const { images, variants, stock, ...rest } = data;

  const imagesWithOriginal = images?.map((img) => ({
    ...img,
    originalUrl: img.url,
  }));

  return prisma.$transaction(async (tx) => {
    if (imagesWithOriginal !== undefined) {
      await tx.productImage.deleteMany({ where: { productId: id } });
    }

    // Renk varyantları: form tam renk listesini gönderir → mevcut RENK varyantlarını
    // (attributes.renk olanlar) sil + yeniden oluştur. Boy vb. diğer varyantlara dokunma.
    // Sipariş geçmişi OrderItem.variantName (string snapshot) ile korunur.
    if (variants !== undefined) {
      const existing = await tx.productVariant.findMany({ where: { productId: id }, include: { Inventory: true } });
      const colorVariants = existing.filter((v) => {
        const a = v.attributes as Record<string, unknown> | null;
        return a != null && typeof a === "object" && a.renk != null;
      });
      for (const v of colorVariants) {
        if (v.Inventory) await tx.inventory.delete({ where: { id: v.Inventory.id } }); // StockMovement cascade
      }
      if (colorVariants.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: colorVariants.map((v) => v.id) } } });
      }
      for (const vc of buildVariantCreate(variants)) {
        await tx.productVariant.create({ data: { ...vc, Product: { connect: { id } } } });
      }
    }

    // Stok form'dan geldiyse Inventory'yi senkronla + hareketi ledger'a yaz.
    if (stock !== undefined) {
      const inv = await tx.inventory.findUnique({ where: { productId: id } });
      if (!inv) {
        // Eski (bu düzeltmeden önce oluşturulmuş) ürünlerde Inventory yok — oluştur.
        await tx.inventory.create({
          data: {
            productId: id,
            quantity: stock,
            ...(stock > 0 && {
              StockMovement: { create: { type: "GIRIS", quantityChange: stock, reason: "Ürün düzenleme — başlangıç stoğu" } },
            }),
          },
        });
      } else if (inv.quantity !== stock) {
        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: stock } });
        await tx.stockMovement.create({
          data: {
            inventoryId: inv.id,
            type: "DUZELTME",
            quantityChange: stock - inv.quantity,
            reason: "Ürün düzenlemeden güncellendi",
          },
        });
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        ...rest,
        ...(imagesWithOriginal?.length && { ProductImage: { create: imagesWithOriginal } }),
      },
      include: PRODUCT_INCLUDE,
    });
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    include: PRODUCT_INCLUDE,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBestsellers(limit = 8) {
  return prisma.product.findMany({
    where: { isBestseller: true, isActive: true },
    include: PRODUCT_INCLUDE,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}
