import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import AgeGate from "@/components/layout/AgeGate";
import { SITE_NAME, SITE_DESCRIPTION, CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import type { NavCategory, NavFeaturedProduct } from "@/lib/types";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleaf.com";

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
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Premium Nargile Ekipmanları`,
    description: SITE_DESCRIPTION,
    images: ["/og-default.jpg"],
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

    // Single query ordered by isFeatured desc then newest — pick first per root category
    const productRows = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        basePrice: true,
        compareAtPrice: true,
        categoryId: true,
        Category: { select: { name: true } },
        ProductImage: {
          orderBy: { sortOrder: "asc" as const },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    const featuredByRoot = new Map<string, NavFeaturedProduct>();
    for (const p of productRows) {
      const rootId = catIdToRoot.get(p.categoryId);
      if (rootId && rootIds.has(rootId) && !featuredByRoot.has(rootId)) {
        featuredByRoot.set(rootId, {
          id: p.id,
          slug: p.slug,
          name: p.name,
          basePrice: Number(p.basePrice),
          compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
          imageUrl: p.ProductImage[0]?.url ?? null,
          categoryName: p.Category.name,
        });
        if (featuredByRoot.size === rootIds.size) break;
      }
    }

    return catRows.map(r => ({
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navCategories = await getNavCategories();

  return (
    <html lang="tr" className={`scroll-smooth ${inter.variable} ${cormorant.variable} ${manrope.variable}`}>
      <body className="bg-bg text-ink font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              contactPoint: { "@type": "ContactPoint", email: CONTACT_EMAIL, contactType: "customer service", availableLanguage: "Turkish" },
              sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.facebook],
            }),
          }}
        />
        <AgeGate />
        <AppShell navCategories={navCategories}>{children}</AppShell>
      </body>
    </html>
  );
}
