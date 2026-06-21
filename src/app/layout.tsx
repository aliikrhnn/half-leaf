import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import AgeGate from "@/components/layout/AgeGate";
import Footer from "@/components/layout/Footer";
import { SITE_NAME, SITE_DESCRIPTION, CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from "@/lib/constants";
import { jsonLd } from "@/lib/utils";
import { prisma } from "@/lib/db/prisma";
import type { NavCategory, NavFeaturedProduct } from "@/lib/types";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const revalidate = 10;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — Premium Nargile Ekipmanları`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["nargile", "nargile ekipmanları", "cam hazne", "lüle", "nargile aksesuar", "premium nargile", "half leaf"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Premium Nargile Ekipmanları`,
    description: SITE_DESCRIPTION,
    // OG görseli app/opengraph-image.tsx dosya kuralıyla otomatik üretilir.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Premium Nargile Ekipmanları`,
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

    // Build categoryId → rootCategoryId map
    const catIdToRoot = new Map<string, string>();
    for (const cat of catRows) {
      let cur: typeof cat | undefined = cat;
      while (cur.parentId) {
        cur = catRows.find(c => c.id === cur!.parentId);
        if (!cur) break;
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
          brand: true,
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

    // Kök kategori bazında markalar (mega menü). Görüntü için normalize:
    // trim + büyük/küçük harf yinelemelerini en sık biçimde birleştir, sıklığa göre sırala.
    const brandsByRoot = new Map<string, string[]>();
    const brandAcc = new Map<string, Map<string, { forms: Map<string, number>; total: number }>>();
    for (const p of productRows) {
      const raw = p.brand?.replace(/\s+/g, " ").trim();
      if (!raw) continue;
      const rootId = catIdToRoot.get(p.categoryId);
      if (!rootId || !rootIds.has(rootId)) continue;
      if (!brandAcc.has(rootId)) brandAcc.set(rootId, new Map());
      const byKey = brandAcc.get(rootId)!;
      const key = raw.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, { forms: new Map(), total: 0 });
      const e = byKey.get(key)!;
      e.forms.set(raw, (e.forms.get(raw) ?? 0) + 1);
      e.total++;
    }
    for (const [rootId, byKey] of brandAcc) {
      const list = [...byKey.values()]
        .map(e => {
          let best = "", bestCount = -1;
          for (const [form, c] of e.forms) if (c > bestCount) { best = form; bestCount = c; }
          return { display: best, total: e.total };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 12)
        .map(x => x.display);
      brandsByRoot.set(rootId, list);
    }

    return catRows.map(r => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      parentId: r.parentId,
      productCount: r._count.Product,
      description: r.description ?? undefined,
      featuredProduct: !r.parentId ? (featuredByRoot.get(r.id) ?? undefined) : undefined,
      brands: !r.parentId ? (brandsByRoot.get(r.id) ?? undefined) : undefined,
    }));
  } catch {
    return [];
  }
}

async function getAnnouncementMessages(): Promise<string[]> {
  try {
    const s = await prisma.siteSettings.findUnique({
      where:  { id: "site" },
      select: { announcementMessages: true },
    });
    return s?.announcementMessages ?? [];
  } catch {
    return [];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navCategories, announcementMessages] = await Promise.all([
    getNavCategories(),
    getAnnouncementMessages(),
  ]);

  return (
    <html lang="tr" className={`scroll-smooth ${inter.variable} ${cormorant.variable} ${manrope.variable}`}>
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
        <AppShell footer={<Footer />} navCategories={navCategories} announcementMessages={announcementMessages}>{children}</AppShell>
      </body>
    </html>
  );
}
