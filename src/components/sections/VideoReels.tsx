import { prisma } from "@/lib/db/prisma";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";
import type { ReelItem } from "./VideoReelsCarousel";

/**
 * Ana sayfa video reel karuseli — VERİ KATMANI.
 *
 * TAMAMEN VERİTABANINDAN BESLENİR: yönetim paneli → Reels ekranından
 * yönetilir. Marka, model adı ve fiyat ürünün kendisinden gelir; panelde
 * yalnızca video, rozet ve sıra belirlenir. Fiyat güncel USD/TRY kuruyla
 * çevrilir, yani ürün sayfasıyla birebir aynıdır.
 *
 * Not: Bu fonksiyon ana sayfanın Promise.all grubunda çağrılır. Async bir
 * SUNUCU BİLEŞENİ olarak bırakılsaydı Next.js onu ayrı bir akış (suspense)
 * sınırına alır ve bölüm sonradan yerine otururdu — hero kaldırıldığı için
 * sayfanın ilk bölümü artık bu; geç gelmesi görünür bir kaymaya yol açardı.
 */

const DEFAULT_HANDLE = "@halfleafstore";

/** Karusel kartı için kısa biçim: "₺21.508" (kuruş gösterilmez). */
function formatReelPrice(value: number): string {
  return `₺${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

/** Yayındaki reel'leri karusel formatına çevirir. Hata olursa boş dizi. */
export async function fetchReelItems(): Promise<ReelItem[]> {
  let items: ReelItem[] = [];

  try {
    const [rows, usdTryRate] = await Promise.all([
      prisma.productReel.findMany({
        where: { isActive: true, Product: { isActive: true } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          Product: {
            select: {
              slug: true,
              name: true,
              brand: true,
              basePrice: true,
              compareAtPrice: true,
              priceCurrency: true,
              Category: { select: { name: true } },
            },
          },
        },
      }),
      getUsdTryRate(),
    ]);

    items = rows.map((r) => {
      const p = r.Product;
      const currency = (p.priceCurrency ?? "TRY") as PriceCurrency;
      const price = toTRY(Number(p.basePrice), currency, usdTryRate);
      const oldPrice =
        p.compareAtPrice != null ? toTRY(Number(p.compareAtPrice), currency, usdTryRate) : null;

      return {
        video: r.videoUrl ?? "",
        handle: r.handle?.trim() || DEFAULT_HANDLE,
        badge: r.badge?.trim() ?? "",
        // Marka boşsa kategori adı yedek olarak kullanılır (kartın üst satırı boş kalmasın).
        brand: p.brand?.trim() || p.Category.name,
        name: p.name,
        price: formatReelPrice(price),
        // Eski fiyat yalnızca gerçekten yüksekse üstü çizili gösterilir.
        oldPrice: oldPrice != null && oldPrice > price ? formatReelPrice(oldPrice) : "",
        url: `/urunler/${p.slug}`,
      };
    });
  } catch {
    // Veritabanına ulaşılamıyorsa bölüm sessizce gizlenir.
    return [];
  }

  return items;
}
