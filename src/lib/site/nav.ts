/**
 * Gezinme menüsü kategorileri — cache'lenmiş.
 *
 * Bu veri app/layout.tsx içinde duruyordu ve SİTEDEKİ HER SAYFA İSTEĞİNDE
 * yeniden hesaplanıyordu; içindeki `product.findMany` tüm aktif ürünleri
 * (kategori ve görsel join'leriyle) çekiyor. Eşzamanlı bir istek dalgasında
 * bu sorgu Prisma bağlantı havuzunu tüketip `P2024` hatalarına yol açtı.
 *
 * Artık sonuç 5 dakika cache'lenir; kategori ve ürün değişiklikleri
 * `revalidateNavCache()` ile anında yayına alınır (bkz. lib/site/tags.ts).
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { NAV_CATEGORIES_TAG } from "@/lib/site/tags";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";
import type { NavCategory, NavFeaturedProduct } from "@/lib/types";

/**
 * Cache'lenen ara biçim: vitrin ürünlerinin fiyatları HENÜZ TL'ye çevrilmemiş,
 * ürünün kendi para biriminde durur.
 *
 * Kur cache anahtarına GİRMEZ. Girseydi kur her güncellendiğinde (kur cron'u)
 * yeni bir cache anahtarı oluşur, eskisi bir daha okunmadan depoda kalırdı;
 * ayrıca kur değişikliği menü fiyatlarına ancak 5 dakika sonra yansırdı.
 * Çevrim cache'in DIŞINDA, her istekte güncel kurla yapılır.
 */
type RawNavCategory = Omit<NavCategory, "featuredProduct"> & {
  featuredProduct?: NavFeaturedProduct;
};

const fetchNavCategories = unstable_cache(
  async (): Promise<RawNavCategory[]> => {
    /* Kategori ve ürün sorguları birbirine bağlı değil — paralel çalışırlar.
       (Cache ıskalandığında toplam gecikmeyi kısaltır.) */
    const [catRows, productRows] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          parentId: true,
          description: true,
          _count: { select: { Product: { where: { isActive: true } } } },
        },
        // Eşit sortOrder'da rastgeleleşmesin (bkz. category.service.ts).
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          basePrice: true,
          compareAtPrice: true,
          priceCurrency: true,
          categoryId: true,
          Category: { select: { name: true } },
          ProductImage: {
            orderBy: { sortOrder: "asc" as const },
            take: 1,
            select: { url: true },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    const rootIds = new Set(catRows.filter(c => !c.parentId).map(c => c.id));

    // Build categoryId → rootCategoryId map.
    // Yönetim panelinden yanlışlıkla döngüsel bir ebeveyn zinciri kurulursa
    // (A→B→A) burası sonsuz döngüye girip TÜM siteyi kilitler; ziyaret edilen
    // id'ler takip edilerek döngü kırılır.
    const catIdToRoot = new Map<string, string>();
    for (const cat of catRows) {
      let cur: typeof cat | undefined = cat;
      const seen = new Set<string>([cat.id]);
      while (cur?.parentId) {
        const next = catRows.find(c => c.id === cur!.parentId);
        if (!next || seen.has(next.id)) break;
        seen.add(next.id);
        cur = next;
      }
      if (cur) catIdToRoot.set(cat.id, cur.id);
    }

    const featuredByRoot = new Map<string, NavFeaturedProduct>();
    for (const p of productRows) {
      const rootId = catIdToRoot.get(p.categoryId);
      if (rootId && rootIds.has(rootId) && !featuredByRoot.has(rootId)) {
        featuredByRoot.set(rootId, {
          id: p.id,
          slug: p.slug,
          name: p.name,
          // Decimal → number: Decimal nesnesi cache'te JSON'a serileştirilirken
          // tipini kaybeder. Çevrim değil, yalnızca tip dönüşümü.
          basePrice: Number(p.basePrice),
          compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
          priceCurrency: (p.priceCurrency ?? "TRY") as PriceCurrency,
          imageUrl: p.ProductImage[0]?.url ?? null,
          categoryName: p.Category.name,
        });
        if (featuredByRoot.size === rootIds.size) break;
      }
    }

    // Alt ağacında (kendisi + tüm alt kategoriler) aktif ürünü olmayan kategorileri
    // navigasyondan gizle (silme değil — ürün eklenince yeniden görünür).
    const directCount = new Map(catRows.map(c => [c.id, c._count.Product]));
    const subtreeCache = new Map<string, number>();
    // `visiting` döngüsel ebeveynlikte sonsuz özyinelemeyi (stack overflow) önler.
    const subtreeCount = (catId: string, visiting = new Set<string>()): number => {
      const cached = subtreeCache.get(catId);
      if (cached !== undefined) return cached;
      if (visiting.has(catId)) return 0;
      visiting.add(catId);
      let sum = directCount.get(catId) ?? 0;
      for (const c of catRows) if (c.parentId === catId) sum += subtreeCount(c.id, visiting);
      visiting.delete(catId);
      subtreeCache.set(catId, sum);
      return sum;
    };

    return catRows
      .filter(r => subtreeCount(r.id) > 0)
      .map(r => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        parentId: r.parentId,
        productCount: r._count.Product,
        description: r.description ?? undefined,
        featuredProduct: !r.parentId ? (featuredByRoot.get(r.id) ?? undefined) : undefined,
      }));
  },
  ["nav-categories"],
  { revalidate: 300, tags: [NAV_CATEGORIES_TAG] },
);

/** Vitrin fiyatlarını güncel kurla TL'ye çevirir (cache dışında). */
function toDisplayCurrency(rows: RawNavCategory[], usdTryRate: number): NavCategory[] {
  return rows.map((r) => {
    const f = r.featuredProduct;
    if (!f) return r;
    return {
      ...r,
      featuredProduct: {
        ...f,
        basePrice: toTRY(f.basePrice, f.priceCurrency, usdTryRate),
        compareAtPrice:
          f.compareAtPrice != null ? toTRY(f.compareAtPrice, f.priceCurrency, usdTryRate) : undefined,
      },
    };
  });
}

/**
 * Menü kategorilerini döndürür; hata hâlinde boş liste (menü kaybolur ama
 * sayfa açılır). Hata yakalaması cache'in DIŞINDADIR ki geçici bir veritabanı
 * arızası boş menüyü 5 dakika sabitlemesin.
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const [rows, usdTryRate] = await Promise.all([fetchNavCategories(), getUsdTryRate()]);
    return toDisplayCurrency(rows, usdTryRate);
  } catch {
    return [];
  }
}
