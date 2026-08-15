/**
 * Ürün listeleme sorgusu — paylaşılan tek doğruluk kaynağı.
 * Hem /urunler sunucu sayfası (fetchAll) hem de /api/urunler istemci API'si
 * bunu kullanır; böylece sunucu ilk render'ı ile istemci filtreleme/sayfalama
 * sonuçları BİREBİR aynıdır.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { mapProduct } from "@/lib/db/mappers";
import { getUsdTryRate } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export const PAGE_SIZE = 9;
export const LOW_STOCK_THRESHOLD = 5;
export const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export const PRICE_RANGE_MAP: Record<string, { min: number; max: number | null }> = {
  "0-2500": { min: 0, max: 2500 },
  "2500-5000": { min: 2500, max: 5000 },
  "5000-10000": { min: 5000, max: 10000 },
  "10000+": { min: 10000, max: null },
};

export interface ProductListParams {
  kategori?: string;
  materyal?: string;
  boy?: string;
  renk?: string;
  fiyat?: string;
  siralama?: string;
  sayfa?: string;
  indirim?: string;
  arama?: string;
  cokSatanlar?: string;
  oneCikan?: string;
  marka?: string;
}

/** Kategoriler nadiren değişir — 60 sn cache. */
export const getCachedCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { Product: { where: { isActive: true } } } } },
      orderBy: { sortOrder: "asc" },
    }),
  ["urunler-categories"],
  { revalidate: 60 },
);

/** `slug` + tüm alt kategori ID'leri. */
export function getDescendantIds(
  slug: string,
  cats: Array<{ id: string; slug: string; parentId: string | null }>,
): string[] {
  const root = cats.find((c) => c.slug === slug);
  if (!root) return [];
  const ids = new Set<string>([root.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of cats) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return [...ids];
}

const productInclude = {
  Category: { select: { id: true, slug: true, name: true } },
  ProductImage: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  Inventory: { select: { quantity: true, lowStockThreshold: true } },
  ProductVariant: { where: { isActive: true }, select: { attributes: true } },
} as const;

/** Filtre parametrelerinden Prisma where koşulu kurar. */
export function buildProductWhere(
  sp: ProductListParams,
  categoryIds: string[] | null,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };
  const materyals = sp.materyal ? sp.materyal.split(",").filter(Boolean) : [];
  const marcas = sp.marka ? sp.marka.split(",").filter(Boolean) : [];

  if (categoryIds && categoryIds.length > 0) where.categoryId = { in: categoryIds };
  if (sp.indirim === "1") where.compareAtPrice = { not: null };
  if (sp.cokSatanlar === "1") where.isBestseller = true;
  if (sp.oneCikan === "1") where.isFeatured = true;
  if (materyals.length > 0) where.Material = { slug: { in: materyals } };
  if (marcas.length > 0) where.brand = { in: marcas };

  const priceRange = PRICE_RANGE_MAP[sp.fiyat ?? ""];
  if (priceRange) {
    where.basePrice = { gte: priceRange.min, ...(priceRange.max !== null ? { lte: priceRange.max } : {}) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andFilters: any[] = [];
  if (sp.boy) andFilters.push({ ProductVariant: { some: { isActive: true, attributes: { path: ["boy"], equals: sp.boy } } } });
  if (sp.renk) andFilters.push({ ProductVariant: { some: { isActive: true, attributes: { path: ["renk"], equals: sp.renk } } } });
  if (andFilters.length > 0) where.AND = andFilters;

  const arama = (sp.arama ?? "").trim();
  if (arama) {
    where.OR = [
      { name: { contains: arama, mode: "insensitive" } },
      { shortDescription: { contains: arama, mode: "insensitive" } },
    ];
  }
  return where;
}

export function buildOrderBy(siralama?: string) {
  return siralama === "fiyat-artan" ? [{ basePrice: "asc" as const }]
    : siralama === "fiyat-azalan" ? [{ basePrice: "desc" as const }]
    : siralama === "yeni" ? [{ createdAt: "desc" as const }]
    : [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];
}

/** Tek bir ürün satırını storefront Product şekline çevirir (variantColors/isNew/lowStock). */
export function mapProductRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: any,
  usdTryRate: number,
  now: number,
): Product {
  const base = mapProduct(p as Parameters<typeof mapProduct>[0], usdTryRate);
  const variantColors: string[] = [];
  for (const v of p.ProductVariant ?? []) {
    const attrs = v.attributes as Record<string, string> | null;
    const hex = attrs?.renk_hex ?? attrs?.colorHex ?? attrs?.hex;
    if (hex && !variantColors.includes(hex)) variantColors.push(hex);
  }
  const threshold = p.Inventory?.lowStockThreshold ?? LOW_STOCK_THRESHOLD;
  return {
    ...base,
    isNew: (p.createdAt as Date).getTime() > now - SIXTY_DAYS_MS,
    variantColors: variantColors.length > 0 ? variantColors : undefined,
    lowStock: base.stock > 0 && base.stock <= threshold,
  };
}

/**
 * Filtre + sayfa için ürünleri ve toplam sayıyı döndürür.
 * @param now request-time timestamp (isNew hesabı için).
 */
export async function fetchProductsPage(
  sp: ProductListParams,
  now: number,
): Promise<{ products: Product[]; total: number }> {
  const usdTryRate = await getUsdTryRate();
  const kategori = sp.kategori ?? "";
  // parseInt("abc") → NaN ve Math.max(1, NaN) → NaN; bu değer Prisma'ya
  // geçersiz `skip` olarak gidip 500 üretiyordu. Üst sınır da derin offset
  // taramalarını (DoS) engeller.
  const rawPage = Number.parseInt(sp.sayfa ?? "1", 10);
  const sayfa = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), 1000) : 1;
  const skip = (sayfa - 1) * PAGE_SIZE;

  const allCats = await getCachedCategories();
  const categoryIds: string[] | null = kategori ? getDescendantIds(kategori, allCats) : null;

  // Kategori verildi ama bulunamadıysa boş sonuç.
  if (kategori && categoryIds !== null && categoryIds.length === 0) {
    return { products: [], total: 0 };
  }

  const where = buildProductWhere(sp, categoryIds);
  const orderBy = buildOrderBy(sp.siralama);

  const [dbProducts, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, orderBy, skip, take: PAGE_SIZE }),
    prisma.product.count({ where }),
  ]);

  const products = dbProducts.map((p) => mapProductRow(p, usdTryRate, now));
  return { products, total };
}
