import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { mapProduct } from "@/lib/db/mappers";
import { getUsdTryRate } from "@/lib/pricing";
import { jsonLd } from "@/lib/utils";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { fetchReelItems } from "@/components/sections/VideoReels";
import VideoReelsCarousel from "@/components/sections/VideoReelsCarousel";
import BestsellersSection from "@/components/sections/BestsellersSection";
import NewArrivalsSection from "@/components/sections/NewArrivalsSection";
import FeaturedSection from "@/components/sections/FeaturedSection";
import FlashProductsSection from "@/components/sections/FlashProductsSection";
import BrandsSection from "@/components/sections/BrandsSection";
import AllProductsSection from "@/components/sections/AllProductsSection";
import { getShowcaseBrands } from "@/lib/products/brands";
import ContentCards from "@/components/sections/ContentCards";
import SeoIntro from "@/components/sections/SeoIntro";
import TrustBar from "@/components/sections/TrustBar";
import type { Product } from "@/lib/types";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
  openGraph: { url: siteUrl },
};

/**
 * Yeni gelenler. Son 40 ürün çekilip kategoriye göre dağıtılır, sonra ilk 8
 * alınır: hepsi gerçekten yeni ama tek bir kategoriden 8 ürün yerine farklı
 * kategorilerden bir seçki çıkar (toplu ürün girişinde kümelenme oluyordu).
 */
async function getNewArrivals(rate: number): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      take: 40,
      orderBy: { createdAt: "desc" },
    });
    return interleaveByCategory(rows.map(p => mapProduct(p, rate))).slice(0, 8);
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


async function getAllProducts(rate: number): Promise<Product[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        Category: { select: { id: true, slug: true, name: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
        Inventory: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(p => mapProduct(p, rate));
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


/**
 * Ürünleri kategorilerine göre sırayla dağıtır (round-robin).
 * 1. tur: her kategoriden 1 ürün · 2. tur: her kategoriden 2. ürün …
 * Kategori içindeki özgün sıra (en yeni önce) korunur.
 */
function interleaveByCategory(products: Product[]): Product[] {
  const buckets = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.categorySlug || "diger";
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p);
    else buckets.set(key, [p]);
  }

  const queues = [...buckets.values()];
  const out: Product[] = [];
  for (let round = 0; out.length < products.length; round++) {
    let placedThisRound = false;
    for (const queue of queues) {
      const item = queue[round];
      if (item) {
        out.push(item);
        placedThisRound = true;
      }
    }
    if (!placedThisRound) break; // güvenlik ağı: sonsuz döngü olmasın
  }
  return out;
}

export default async function HomePage() {
  const usdTryRate = await getUsdTryRate();
  const [reelItems, newArrivals, featuredProducts, flashProducts, bestsellerProducts, brands, allProducts] =
    await Promise.all([
      fetchReelItems(),
      getNewArrivals(usdTryRate),
      getFeaturedProducts(usdTryRate),
      getFlashProducts(usdTryRate),
      getBestsellerProducts(usdTryRate),
      getShowcaseBrands(),
      getAllProducts(usdTryRate),
    ]);

  // "Tüm ürünler" grid'i: küratörlü bölümlerde (flaş / yeni gelenler / öne
  // çıkanlar / çok satanlar) zaten gösterilen ürünler çıkarılır ki aynı ürün
  // sayfada tekrarlanmasın. Performans için makul bir sayıyla sınırlanır;
  // kalanı "Tümünü gör" ile /urunler'e gider.
  const shownIds = new Set(
    [...flashProducts, ...newArrivals, ...featuredProducts, ...bestsellerProducts].map(p => p.id)
  );
  // Kategorilere göre sıra sıra dağıt: ürünler createdAt'e göre geldiği için
  // toplu eklenen bir kategori grid'de arka arkaya kümeleniyordu. Round-robin
  // sayesinde ilk tur HER kategoriden bir ürün gösterir, sonraki turlar
  // ikinciyi/üçüncüyü ekler — vitrin baştan sona çeşitli kalır.
  const restProducts = interleaveByCategory(
    allProducts.filter(p => !shownIds.has(p.id))
  ).slice(0, 60);
  const allChunk1 = restProducts.slice(0, 16);
  const allChunk2 = restProducts.slice(16, 40);
  const allChunk3 = restProducts.slice(40);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Half Leaf Store", "Half Leaf Nargile"],
    url: siteUrl,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/urunler?arama={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    /* Hero kaldırıldı: header + duyuru şeridi `fixed` olduğu için ilk bölüm
       onların altında kalmasın diye üstten boşluk verilir. */
    <div
      style={{
        background: "var(--hl-bg)",
        minHeight: "100vh",
        paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h))",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
      />
      <VideoReelsCarousel reels={reelItems} />
      <FlashProductsSection products={flashProducts} />
      <NewArrivalsSection products={newArrivals} />
      <AllProductsSection products={allChunk1} eyebrow="Tüm Koleksiyon" title="Tüm ürünler" href="/urunler" />
      <FeaturedSection products={featuredProducts} />
      <AllProductsSection products={allChunk2} />
      <BestsellersSection products={bestsellerProducts} />
      <AllProductsSection products={allChunk3} href="/urunler" />
      <BrandsSection brands={brands} />
      <ContentCards />
      <SeoIntro />
      <TrustBar />
    </div>
  );
}
