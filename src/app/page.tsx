import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { mapProduct } from "@/lib/db/mappers";
import { getUsdTryRate } from "@/lib/pricing";
import { jsonLd } from "@/lib/utils";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import Hero, { type HeroSlideData } from "@/components/sections/Hero";
import BestsellersSection from "@/components/sections/BestsellersSection";
import NewArrivalsSection from "@/components/sections/NewArrivalsSection";
import FeaturedSection from "@/components/sections/FeaturedSection";
import FlashProductsSection from "@/components/sections/FlashProductsSection";
import BrandsSection from "@/components/sections/BrandsSection";
import ContentCards from "@/components/sections/ContentCards";
import TrustBar from "@/components/sections/TrustBar";
import type { Product } from "@/lib/types";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
  openGraph: { url: siteUrl },
};

async function getNewArrivals(rate: number): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(p => mapProduct(p, rate));
  } catch {
    return [];
  }
}

async function getFeaturedProducts(rate: number): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(p => mapProduct(p, rate));
  } catch {
    return [];
  }
}

async function getFlashProducts(rate: number): Promise<Product[]> {
  try {
    const discounted = await prisma.product.findMany({
      where: { isActive: true, compareAtPrice: { not: null } },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      take: 12,
      orderBy: { updatedAt: "desc" },
    });
    if (discounted.length >= 6) return discounted.map(p => mapProduct(p, rate));

    const recent = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      take: 12,
      orderBy: { updatedAt: "asc" },
    });
    return recent.map(p => mapProduct(p, rate));
  } catch {
    return [];
  }
}

async function getHeroSlides(): Promise<HeroSlideData[]> {
  try {
    const now = new Date();
    const rows = await prisma.heroSlide.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(r => ({
      id:         r.id,
      title:      r.title,
      subtitle:   r.subtitle,
      eyebrow:    r.eyebrow,
      ctaLabel:   r.ctaLabel,
      ctaHref:    r.ctaHref,
      image:      r.image,
    }));
  } catch {
    return [];
  }
}

async function getBestsellerProducts(rate: number): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isBestseller: true, isActive: true },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(p => mapProduct(p, rate));
  } catch {
    return [];
  }
}


export default async function HomePage() {
  const usdTryRate = await getUsdTryRate();
  const [heroSlides, newArrivals, featuredProducts, flashProducts, bestsellerProducts] =
    await Promise.all([
      getHeroSlides(),
      getNewArrivals(usdTryRate),
      getFeaturedProducts(usdTryRate),
      getFlashProducts(usdTryRate),
      getBestsellerProducts(usdTryRate),
    ]);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/urunler?arama={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div style={{ background: "var(--hl-bg)", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
      />
      <Hero slides={heroSlides} />
      <NewArrivalsSection products={newArrivals} />
      <BestsellersSection products={bestsellerProducts} />
      <FeaturedSection products={featuredProducts} />
      <FlashProductsSection products={flashProducts} />
      <BrandsSection />
      <ContentCards />
      <TrustBar />
    </div>
  );
}
