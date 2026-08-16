import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { SiteFlagsProvider } from "@/components/layout/SiteFlags";
import AgeGate from "@/components/layout/AgeGate";
import Footer from "@/components/layout/Footer";
import { SITE_NAME, SITE_DESCRIPTION, CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from "@/lib/constants";
import { jsonLd } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import type { NavCategory, NavFeaturedProduct } from "@/lib/types";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";

// Tek tipografi ailesi — "Üye ol, fırsatları kaçırma" pop-up'ındaki fontla
// (Manrope) tüm site birebir aynı. Başlıklar dahil her yer bu aileyi kullanır.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

/**
 * Fraunces — YALNIZCA video reel bölümünün başlığı için.
 *
 * VideoReels.module.css `var(--font-display, "Fraunces", serif)` bekliyor.
 * Sitenin geri kalanı `--hl-font-display` (Manrope) kullanmaya devam eder;
 * bu değişken ona dokunmaz. Tek tipografiye dönmek isterseniz aşağıdaki
 * `--font-display` tanımını `var(--hl-font-display)` yapmanız yeterli.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const revalidate = 10;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — Nargile Takımı, Lüle & Nargile Aksesuarları`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "nargile", "nargile takımı", "nargile takımları", "lüle", "rus takım", "ithal takım",
    "yerli takım", "çelik nargile", "cam şişe", "nargile camı", "nargile şişesi",
    "nargile aksesuarları", "nargile kömürü", "marpuç", "premium nargile", "half leaf",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Nargile Takımı, Lüle & Nargile Aksesuarları`,
    description: SITE_DESCRIPTION,
    // OG görseli app/opengraph-image.tsx dosya kuralıyla otomatik üretilir.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Nargile Takımı, Lüle & Nargile Aksesuarları`,
    description: SITE_DESCRIPTION,
  },
};

async function getNavCategories(): Promise<NavCategory[]> {
  try {
    const catRows = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        parentId: true,
        description: true,
        _count: { select: { Product: { where: { isActive: true } } } },
      },
      orderBy: { sortOrder: "asc" },
    });

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

    const [productRows, usdTryRate] = await Promise.all([
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
      getUsdTryRate(),
    ]);

    const featuredByRoot = new Map<string, NavFeaturedProduct>();
    for (const p of productRows) {
      const rootId = catIdToRoot.get(p.categoryId);
      if (rootId && rootIds.has(rootId) && !featuredByRoot.has(rootId)) {
        const cur = (p.priceCurrency ?? "TRY") as PriceCurrency;
        featuredByRoot.set(rootId, {
          id: p.id,
          slug: p.slug,
          name: p.name,
          basePrice: toTRY(Number(p.basePrice), cur, usdTryRate),
          compareAtPrice: p.compareAtPrice != null ? toTRY(Number(p.compareAtPrice), cur, usdTryRate) : undefined,
          priceCurrency: cur,
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
  } catch {
    return [];
  }
}

// Not: `SiteSettings.announcementMessages` alanı ve yönetim panelindeki
// "Duyurular" sekmesi duruyor, ancak üstteki duyuru şeridi kaldırıldığı için
// storefront artık okumuyor.
async function getSiteData(): Promise<{ giftBoxEnabled: boolean; whatsappNumber: string | null }> {
  try {
    const s = await prisma.siteSettings.findUnique({
      where:  { id: "site" },
      select: { giftBoxEnabled: true, whatsappNumber: true },
    });
    return {
      giftBoxEnabled: s?.giftBoxEnabled ?? true,
      whatsappNumber: s?.whatsappNumber ?? CONTACT_PHONE,
    };
  } catch {
    return { giftBoxEnabled: true, whatsappNumber: CONTACT_PHONE };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navCategories, siteData] = await Promise.all([
    getNavCategories(),
    getSiteData(),
  ]);
  const { giftBoxEnabled, whatsappNumber } = siteData;

  return (
    <html
      lang="tr"
      data-theme="dark"
      className={`scroll-smooth ${manrope.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Tema, ilk boyamadan ÖNCE uygulanır — aksi hâlde açık tema seçen
          kullanıcı her sayfa yüklemesinde koyu bir yanıp sönme görür.
          Varsayılan koyu temadır; açık tema açık bir tercihtir.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("hl-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              alternateName: ["Half Leaf Store", "Half Leaf Nargile"],
              url: siteUrl,
              logo: `${siteUrl}/brand/half_leaf_logo.svg`,
              image: `${siteUrl}/brand/half_leaf_logo.svg`,
              email: CONTACT_EMAIL,
              telephone: CONTACT_PHONE,
              address: { "@type": "PostalAddress", addressLocality: "Isparta", addressCountry: "TR" },
              contactPoint: { "@type": "ContactPoint", email: CONTACT_EMAIL, telephone: CONTACT_PHONE, contactType: "customer service", availableLanguage: "Turkish" },
              sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.facebook],
            }),
          }}
        />
        <AgeGate />
        <SiteFlagsProvider flags={{ giftBoxEnabled, whatsappNumber }}>
          <AppShell footer={<Footer />} navCategories={navCategories}>{children}</AppShell>
        </SiteFlagsProvider>
      </body>
    </html>
  );
}
