import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { mapProduct, mapCategory } from "@/lib/db/mappers";
import { getUsdTryRate } from "@/lib/pricing";
import ProductsClient from "./ProductsClient";
import ProductGridSkeleton from "@/components/product/ProductGridSkeleton";
import { isDefaultSort, interleaveByCategory } from "@/lib/products/list-query";
import { brandFilterCondition } from "@/lib/products/brands";
import type { Product } from "@/lib/types";
import type { MaterialOption, BrandOption } from "./FilterPanel";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

const BASE_DESC =
  "Premium nargile ekipmanları koleksiyonumuzu keşfedin. Cam hazneler, pirinç lüleler, aksesuarlar ve daha fazlası.";

// Filtre/arama/sıralama/sayfalama kombinasyonları sonsuz sayıda duplicate URL üretir;
// bunlar noindex (follow) yapılır, yalnızca temiz /urunler ve tek kategori indekslenir.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const base = `${siteUrl}/urunler`;
  const kategori = sp.kategori?.trim();

  const hasNoiseFilters = Boolean(
    sp.materyal || sp.boy || sp.renk || sp.fiyat || sp.siralama || sp.arama ||
    sp.indirim || sp.cokSatanlar || sp.oneCikan || sp.marka ||
    (sp.sayfa && sp.sayfa !== "1"),
  );

  if (hasNoiseFilters) {
    return {
      title: "Ürünler",
      description: BASE_DESC,
      robots: { index: false, follow: true },
      alternates: { canonical: kategori ? `${base}?kategori=${kategori}` : base },
    };
  }

  if (kategori) {
    return {
      title: "Ürünler",
      description: BASE_DESC,
      alternates: { canonical: `${base}?kategori=${kategori}` },
      openGraph: { url: `${base}?kategori=${kategori}` },
    };
  }

  return {
    title: "Tüm Ürünler",
    description: BASE_DESC,
    alternates: { canonical: base },
    openGraph: { url: base },
  };
}

const PAGE_SIZE = 9;

// Kategoriler nadiren değişir — 60 sn cache
const getCachedCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { Product: { where: { isActive: true } } } },
      },
      // Eşit sortOrder'da rastgeleleşmesin (bkz. category.service.ts).
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ["urunler-categories"],
  { revalidate: 60 },
);
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 5;

const PRICE_RANGE_MAP: Record<string, { min: number; max: number | null }> = {
  "0-2500":      { min: 0,     max: 2500 },
  "2500-5000":   { min: 2500,  max: 5000 },
  "5000-10000":  { min: 5000,  max: 10000 },
  "10000+":      { min: 10000, max: null },
};

export interface SearchParams {
  kategori?: string;
  materyal?: string;
  boy?: string;
  renk?: string;
  fiyat?: string;
  siralama?: string;
  sayfa?: string;
  grid?: string;
  indirim?: string;
  arama?: string;
  cokSatanlar?: string;
  oneCikan?: string;
  marka?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

/** Returns the ID of `slug` plus all descendant category IDs. */
function getDescendantIds(
  slug: string,
  cats: Array<{ id: string; slug: string; parentId: string | null }>
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

export async function fetchAll(sp: SearchParams) {
  const usdTryRate = await getUsdTryRate();
  const kategori = sp.kategori ?? "";
  const materyals = sp.materyal ? sp.materyal.split(",").filter(Boolean) : [];
  const boy = sp.boy ?? "";
  const renk = sp.renk ?? "";
  const fiyat = sp.fiyat ?? "";
  const siralama = sp.siralama ?? "onerilen";
  // NaN koruması + derin offset sınırı (bkz. lib/products/list-query.ts).
  const rawPage = Number.parseInt(sp.sayfa ?? "1", 10);
  const sayfa = Number.isFinite(rawPage) ? Math.min(Math.max(1, rawPage), 1000) : 1;
  const skip = (sayfa - 1) * PAGE_SIZE;
  const indirim = sp.indirim === "1";
  const arama = (sp.arama ?? "").trim();
  const cokSatanlar = sp.cokSatanlar === "1";
  const oneCikan = sp.oneCikan === "1";
  const marcas = sp.marka ? sp.marka.split(",").filter(Boolean) : [];

  // ── Step 1: load all categories (cached 60 sn) ──
  const allCats = await getCachedCategories();

  // Resolve category filter: root slug + all sub-categories (recursively)
  const categoryIds: string[] | null = kategori
    ? getDescendantIds(kategori, allCats)
    : null;

  // If a slug was given but not found → return empty immediately
  if (kategori && categoryIds !== null && categoryIds.length === 0) {
    const categories = allCats.map(mapCategory);
    return {
      products: [] as Product[],
      total: 0,
      categories,
      activeCategory: null,
      materials: [] as MaterialOption[],
      brandOptions: [] as BrandOption[],
      sizeOptions: [] as string[],
      colorOptions: [] as { name: string; hex: string }[],
      featuredProduct: null,
      urlState: {
        kategori: sp.kategori ?? "",
        materyal: sp.materyal ?? "",
        marka: sp.marka ?? "",
        boy: sp.boy ?? "",
        renk: sp.renk ?? "",
        fiyat: sp.fiyat ?? "",
        indirim: sp.indirim ?? "",
        cokSatanlar: sp.cokSatanlar ?? "",
        siralama: sp.siralama ?? "onerilen",
        sayfa: sp.sayfa ?? "1",
        grid: sp.grid ?? "3",
        arama: sp.arama ?? "",
      },
    };
  }

  // ── Build product where clause ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };
  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }
  if (indirim) where.compareAtPrice = { not: null };
  if (cokSatanlar) where.isBestseller = true;
  if (oneCikan) where.isFeatured = true;
  if (materyals.length > 0) where.Material = { slug: { in: materyals } };

  const priceRange = PRICE_RANGE_MAP[fiyat];
  if (priceRange) {
    where.basePrice = {
      gte: priceRange.min,
      ...(priceRange.max !== null ? { lte: priceRange.max } : {}),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andFilters: any[] = [];
  // Marka koşulu AND listesine girer: where.OR arama tarafından kullanılıyor.
  const brandCond = brandFilterCondition(marcas);
  if (brandCond) andFilters.push(brandCond);
  if (boy) {
    andFilters.push({
      ProductVariant: {
        some: { isActive: true, attributes: { path: ["boy"], equals: boy } },
      },
    });
  }
  if (renk) {
    andFilters.push({
      ProductVariant: {
        some: { isActive: true, attributes: { path: ["renk"], equals: renk } },
      },
    });
  }
  if (andFilters.length > 0) where.AND = andFilters;

  if (arama) {
    where.OR = [
      { name: { contains: arama, mode: "insensitive" } },
      { shortDescription: { contains: arama, mode: "insensitive" } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any[] =
    siralama === "fiyat-artan"  ? [{ basePrice: "asc" }]
    : siralama === "fiyat-azalan" ? [{ basePrice: "desc" }]
    : siralama === "yeni"         ? [{ createdAt: "desc" }]
    : [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const productInclude = {
    Category: { select: { id: true, slug: true, name: true } },
    ProductImage: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    Inventory: { select: { quantity: true, lowStockThreshold: true } },
    ProductVariant: {
      where: { isActive: true },
      select: { attributes: true },
    },
  } as const;

  // Sub-query filter reusing the same category IDs
  const catIdFilter =
    categoryIds && categoryIds.length > 0
      ? { categoryId: { in: categoryIds } }
      : {};

  const featuredWhere = {
    isActive: true,
    isFeatured: true,
    ...catIdFilter,
  };

  // Varsayılan ("önerilen") sıralamada ürünler kategoriye göre dağıtılır —
  // /api/urunler ile birebir aynı davranış (bkz. lib/products/list-query.ts).
  // Sayfalama bozulmasın diye sıralama TÜM eşleşen kayıtlar üzerinde kurulur.
  let interleavedPageIds: string[] | null = null;
  if (isDefaultSort(siralama)) {
    const ordering = await prisma.product.findMany({
      where,
      select: { id: true, categoryId: true },
      orderBy,
    });
    interleavedPageIds = interleaveByCategory(ordering)
      .slice(skip, skip + PAGE_SIZE)
      .map((r) => r.id);
  }

  // ── Step 2: run all data queries in parallel ──
  const [dbProductsRaw, totalCount, dbMaterials, allVariants, featuredDb, dbBrands] =
    await Promise.all([
      interleavedPageIds
        ? prisma.product.findMany({
            where: { id: { in: interleavedPageIds } },
            include: productInclude,
          })
        : prisma.product.findMany({
            where,
            include: productInclude,
            orderBy,
            skip,
            take: PAGE_SIZE,
          }),
      prisma.product.count({ where }),
      prisma.material.findMany({
        where: {
          isActive: true,
          Product: { some: { isActive: true, ...catIdFilter } },
        },
        select: {
          slug: true,
          name: true,
          _count: {
            select: {
              Product: { where: { isActive: true, ...catIdFilter } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.productVariant.findMany({
        where: {
          isActive: true,
          Product: { isActive: true, ...catIdFilter },
        },
        select: { attributes: true },
      }),
      prisma.product.findFirst({
        where: featuredWhere,
        include: productInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.groupBy({
        by: ["brand"],
        where: { isActive: true, brand: { not: null }, ...catIdFilter },
        _count: { id: true },
        orderBy: { brand: "asc" },
      }),
    ]);

  // `id in (...)` sorgusu sırayı korumaz — round-robin sırasına geri diz.
  const dbProducts = interleavedPageIds
    ? (() => {
        const byId = new Map(dbProductsRaw.map((r) => [r.id, r]));
        return interleavedPageIds
          .map((id) => byId.get(id))
          .filter((r): r is (typeof dbProductsRaw)[number] => Boolean(r));
      })()
    : dbProductsRaw;

  // Map products
  const products: Product[] = dbProducts.map((p) => {
    const base = mapProduct(p as Parameters<typeof mapProduct>[0], usdTryRate);
    const variantColors: string[] = [];
    for (const v of p.ProductVariant) {
      const attrs = v.attributes as Record<string, string> | null;
      const hex = attrs?.renk_hex ?? attrs?.colorHex ?? attrs?.hex;
      if (hex && !variantColors.includes(hex)) variantColors.push(hex);
    }
    const threshold = p.Inventory?.lowStockThreshold ?? LOW_STOCK_THRESHOLD;
    return {
      ...base,
      isNew: (p as { createdAt: Date }).createdAt.getTime() > Date.now() - SIXTY_DAYS_MS,
      variantColors: variantColors.length > 0 ? variantColors : undefined,
      lowStock: base.stock > 0 && base.stock <= threshold,
    };
  });

  const categories = allCats.map(mapCategory);
  const activeCategory = kategori
    ? (categories.find((c) => c.slug === kategori) ?? null)
    : null;

  const materials: MaterialOption[] = dbMaterials.map((m) => ({
    slug: m.slug,
    name: m.name,
    count: m._count.Product,
  }));

  const brandOptions: BrandOption[] = dbBrands
    .filter((b): b is typeof b & { brand: string } => b.brand !== null)
    .map((b) => ({ name: b.brand, count: b._count.id }));

  const sizeSet = new Set<string>();
  const colorMap = new Map<string, string>();

  for (const v of allVariants) {
    const attrs = v.attributes as Record<string, string> | null;
    if (!attrs) continue;
    const boyVal = attrs.boy ?? attrs.size ?? attrs.boyut;
    if (boyVal) sizeSet.add(boyVal);
    const renkVal = attrs.renk ?? attrs.color;
    const hexVal = attrs.renk_hex ?? attrs.colorHex ?? attrs.hex;
    if (renkVal && hexVal) colorMap.set(renkVal, hexVal);
  }

  const sizeOptions = [...sizeSet].sort();
  const colorOptions = [...colorMap.entries()].map(([name, hex]) => ({ name, hex }));

  const featuredProduct = featuredDb
    ? {
        ...mapProduct(featuredDb as Parameters<typeof mapProduct>[0], usdTryRate),
        categoryName: featuredDb.Category.name,
      }
    : null;

  return {
    products,
    total: totalCount,
    categories,
    activeCategory,
    materials,
    brandOptions,
    sizeOptions,
    colorOptions,
    featuredProduct,
    urlState: {
      kategori: sp.kategori ?? "",
      materyal: sp.materyal ?? "",
      marka: sp.marka ?? "",
      boy: sp.boy ?? "",
      renk: sp.renk ?? "",
      fiyat: sp.fiyat ?? "",
      indirim: sp.indirim ?? "",
      cokSatanlar: sp.cokSatanlar ?? "",
      siralama: sp.siralama ?? "onerilen",
      sayfa: sp.sayfa ?? "1",
      grid: sp.grid ?? "3",
      arama: sp.arama ?? "",
    },
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const data = await fetchAll(sp);

  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsClient {...data} />
    </Suspense>
  );
}
