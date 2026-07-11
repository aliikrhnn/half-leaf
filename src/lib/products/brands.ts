import { prisma } from "@/lib/db/prisma";

/**
 * "Markalara göre keşfet" vitrini.
 *
 * DB'deki `Product.brand` alanı büyük ölçüde ürün adının ilk kelimesinden
 * türetildiği için ("Coco", "Folyo", "Ay", "El" gibi marka olmayan gürültü
 * içerir). Ana sayfada yalnızca *gerçek* markalar görünsün diye küratörlü bir
 * katalog tutuyoruz; her marka için öne çıkan ürünü ve görselini DB'den
 * dinamik çekiyoruz. Katalogdaki bir marka DB'de yoksa vitrinde de görünmez.
 */
export interface BrandCatalogEntry {
  /** DB'deki tam `Product.brand` değeri (filtre linki bununla eşleşir). */
  key: string;
  /** Vitrin/ekran adı. */
  name: string;
  /** Kısa, iddiasız betimleyici. */
  tagline: string;
}

// Yalnızca donanım/nargile üreticisi markalar. Öncelikli olarak tütünle
// anılan markalar (ör. Darkside) vitrine alınmaz — mağaza tütün/nikotin
// tanıtımı yapmaz.
export const BRAND_CATALOG: readonly BrandCatalogEntry[] = [
  { key: "Alpha", name: "Alpha Hookah", tagline: "Rus Mühendisliği" },
  { key: "Amotion", name: "Amotion", tagline: "Kompakt Tasarım" },
  { key: "Moze", name: "Moze", tagline: "Alman Tasarımı" },
  { key: "Cosmo", name: "Cosmo", tagline: "Seramik Lüle" },
  { key: "Maxx", name: "Maxx Royal", tagline: "Royal Seri" },
  { key: "Blade", name: "Blade Hookah", tagline: "Modern Çizgi" },
  { key: "Hoob", name: "HOOB", tagline: "Alman Mühendisliği" },
  { key: "Japona", name: "Japona", tagline: "Lüle Sanatı" },
  { key: "Quasar", name: "Quasar", tagline: "İnce İşçilik" },
  { key: "Amy", name: "Amy Deluxe", tagline: "Klasik Zarafet" },
  { key: "Union", name: "Union Hookah", tagline: "Modern Seri" },
  { key: "Mattpear", name: "Mattpear", tagline: "Modern Silüet" },
] as const;

export interface ShowcaseBrand {
  key: string;
  name: string;
  tagline: string;
  productCount: number;
  /** Markaya göre filtrelenmiş ürün listesine bağlantı. */
  href: string;
  /** Markanın öne çıkan (featured → bestseller → yeni) ürünü. */
  product: {
    name: string;
    slug: string;
    image: string;
  };
}

/**
 * Katalogdaki markaları DB ile kesiştirir. Yalnızca aktif ürünü ve görseli
 * olan markalar döner — katalog sırasını korur.
 */
export async function getShowcaseBrands(): Promise<ShowcaseBrand[]> {
  try {
    const keys = BRAND_CATALOG.map((b) => b.key);
    const rows = await prisma.product.findMany({
      where: { isActive: true, brand: { in: keys } },
      select: {
        brand: true,
        name: true,
        slug: true,
        ProductImage: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
      // Global sıralama marka içinde de geçerli: her markanın ilk kaydı = öne çıkanı.
      orderBy: [{ isFeatured: "desc" }, { isBestseller: "desc" }, { createdAt: "desc" }],
    });

    interface Agg {
      count: number;
      standout?: { name: string; slug: string; image: string };
    }
    const byBrand = new Map<string, Agg>();
    for (const r of rows) {
      if (!r.brand) continue;
      const entry = byBrand.get(r.brand) ?? { count: 0 };
      entry.count += 1;
      const url = r.ProductImage[0]?.url;
      if (!entry.standout && url) {
        entry.standout = { name: r.name, slug: r.slug, image: url };
      }
      byBrand.set(r.brand, entry);
    }

    return BRAND_CATALOG.flatMap((b) => {
      const agg = byBrand.get(b.key);
      if (!agg || agg.count === 0 || !agg.standout) return [];
      return [
        {
          key: b.key,
          name: b.name,
          tagline: b.tagline,
          productCount: agg.count,
          href: `/urunler?marka=${encodeURIComponent(b.key)}`,
          product: agg.standout,
        } satisfies ShowcaseBrand,
      ];
    });
  } catch {
    return [];
  }
}
