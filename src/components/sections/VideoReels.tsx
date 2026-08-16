import { prisma } from "@/lib/db/prisma";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";
import VideoReelsCarousel, { type ReelItem } from "./VideoReelsCarousel";

/* =====================================================================
   ÜRÜN + VİDEO LİSTESİ — sadece burayı düzenle.

   video: public/reels/ içindeki MP4 (dikey 9:16, 10-20 sn, ~720x1280,
   <8MB). Dosya henüz yoksa kart placeholder gösterir, dosya gelince
   otomatik videoya döner.

   slug: /urunler/<slug> — ürün veritabanından çekilir.
   FİYAT BURADA YAZILMAZ: güncel fiyat ve indirim, ürünün kendi
   sayfasıyla birebir aynı olacak şekilde veritabanından okunur ve
   güncel USD/TRY kuruyla çevrilir. Ürün silinir/pasife alınırsa kart
   otomatik olarak listeden düşer.
   ===================================================================== */
const REELS = [
  { video: "/reels/alpha-oro-prime.mp4",   handle: "@halfleafstore", badge: "%10 İndirim",   brand: "Alpha Hookah", name: "Alpha Oro Prime",     slug: "alpha-hookah-oro-prime" },
  { video: "/reels/xhoob-enzoy-wood.mp4",  handle: "@halfleafstore", badge: "",              brand: "Xhoob",        name: "Enzoy Wood",          slug: "xhoob-enzoy-wood" },
  { video: "/reels/kbro-gold.mp4",         handle: "@halfleafstore", badge: "Çok Satan",     brand: "K-Bro",        name: "K-Bro Gold",          slug: "k-bro-gold" },
  { video: "/reels/union-fibonacci.mp4",   handle: "@halfleafstore", badge: "Stok Az",       brand: "Union Hookah", name: "Fibonacci Hybrid",    slug: "union-fibonacci-hybrid" },
  { video: "/reels/quasar-blackhole.mp4",  handle: "@halfleafstore", badge: "",              brand: "Quasar",       name: "Arguilé Black Hole",  slug: "quasar-arguil-black-hole" },
  { video: "/reels/maklaud-treada.mp4",    handle: "@halfleafstore", badge: "Koleksiyonluk", brand: "Maklaud",      name: "Treada",              slug: "maklaud-treada" },
] as const;

/** Karusel kartı için kısa biçim: "₺21.508" (kuruş gösterilmez). */
function formatReelPrice(value: number): string {
  return `₺${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
}

/**
 * Video reel karuseli (sunucu bileşeni).
 * Fiyatlar veritabanından okunur; karuselin kendisi istemcide çalışır.
 */
export default async function VideoReels() {
  let items: ReelItem[] = [];

  try {
    const [rows, usdTryRate] = await Promise.all([
      prisma.product.findMany({
        where: { slug: { in: REELS.map((r) => r.slug) }, isActive: true },
        select: { slug: true, basePrice: true, compareAtPrice: true, priceCurrency: true },
      }),
      getUsdTryRate(),
    ]);

    const bySlug = new Map(rows.map((r) => [r.slug, r]));

    items = REELS.flatMap((r) => {
      const p = bySlug.get(r.slug);
      // Ürün yoksa veya pasifse kartı hiç gösterme — ölü bağlantı olmasın.
      if (!p) return [];

      const currency = (p.priceCurrency ?? "TRY") as PriceCurrency;
      const price = toTRY(Number(p.basePrice), currency, usdTryRate);
      const oldPrice =
        p.compareAtPrice != null ? toTRY(Number(p.compareAtPrice), currency, usdTryRate) : null;

      return [{
        video: r.video,
        handle: r.handle,
        badge: r.badge,
        brand: r.brand,
        name: r.name,
        price: formatReelPrice(price),
        // Eski fiyat yalnızca gerçekten yüksekse gösterilir.
        oldPrice: oldPrice != null && oldPrice > price ? formatReelPrice(oldPrice) : "",
        url: `/urunler/${r.slug}`,
      }];
    });
  } catch {
    // Veritabanına ulaşılamıyorsa bölüm sessizce gizlenir (ana sayfa açılmaya devam eder).
    return null;
  }

  return <VideoReelsCarousel reels={items} />;
}
