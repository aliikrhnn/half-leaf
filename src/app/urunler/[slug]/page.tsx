import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { mapProduct } from "@/lib/db/mappers";
import { getUsdTryRate } from "@/lib/pricing";
import { jsonLd } from "@/lib/utils";
import { SITE_NAME, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/constants";
import ProductCard from "@/components/product/ProductCard";
import ProductDetailMain from "./ProductDetailMain";
import ProductTabs from "./ProductTabs";
import type { VariantData } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      name: true, shortDescription: true, description: true, basePrice: true, brand: true,
      Category: { select: { name: true } },
      ProductImage: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, altText: true } },
    },
  });
  if (!p) return {};

  // Meta açıklama: önce shortDescription (zorunlu, öz), sonra description; ~155 karakterde kelime sınırında kes.
  const rawDesc = p.shortDescription?.trim() || p.description?.trim() || `${p.name} — ${SITE_NAME}'da satışta.`;
  const description = rawDesc.length > 155 ? rawDesc.slice(0, 152).replace(/\s+\S*$/, "") + "…" : rawDesc;
  // Başlık: ürün adı – kategori (+ marka) — nargile bağlamı kategoriden gelir.
  const titleBase = [p.name, p.Category?.name].filter(Boolean).join(" – ");
  const title = p.brand ? `${titleBase} | ${p.brand}` : titleBase;
  const image = p.ProductImage[0];
  const url = `${siteUrl}/urunler/${slug}`;
  const ogImages = image ? [{ url: image.url, alt: image.altText ?? p.name }] : [{ url: `${siteUrl}/opengraph-image`, alt: SITE_NAME }];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: image ? [image.url] : [`${siteUrl}/opengraph-image`],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const dbProduct = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      Category: { select: { id: true, slug: true, name: true } },
      ProductImage: { orderBy: { sortOrder: "asc" } },
      Inventory: { select: { quantity: true, lowStockThreshold: true } },
      ProductVariant: {
        where: { isActive: true },
        include: { Inventory: { select: { quantity: true } } },
        orderBy: { createdAt: "asc" },
      },
      Material: { select: { name: true } },
    },
  });

  if (!dbProduct) notFound();

  const usdTryRate = await getUsdTryRate();

  // eslint-disable-next-line react-hooks/purity -- intentional: request-time freshness check, Server Component renders per-request
  const now = Date.now();
  const product = {
    ...mapProduct(dbProduct, usdTryRate),
    isNew: dbProduct.createdAt.getTime() > now - SIXTY_DAYS_MS,
  };

  const variants: VariantData[] = dbProduct.ProductVariant.map(v => ({
    id: v.id,
    name: v.name,
    price: Number(v.price),
    attributes: v.attributes as Record<string, string> | null,
    stock: v.Inventory?.quantity ?? 0,
  }));

  const lowStockThreshold = dbProduct.Inventory?.lowStockThreshold ?? 5;

  const relatedRows = await prisma.product.findMany({
    where: {
      categoryId: dbProduct.categoryId,
      isActive: true,
      NOT: { id: dbProduct.id },
    },
    include: {
      Category: { select: { id: true, slug: true, name: true } },
      ProductImage: { orderBy: { sortOrder: "asc" }, take: 1 },
      Inventory: { select: { quantity: true } },
    },
    take: 4,
    orderBy: { isFeatured: "desc" },
  });

  const related = relatedRows.map(p => mapProduct(p, usdTryRate));

  // Onaylanmış yorumlar + ürün puanı
  const reviewRows = await prisma.review.findMany({
    where: { productId: dbProduct.id, isApproved: true },
    select: { id: true, authorName: true, rating: true, title: true, body: true, isVerified: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const reviews = reviewRows.map(r => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerified: r.isVerified,
    createdAt: r.createdAt.toISOString(),
  }));
  const ratingAvg = dbProduct.ratingAvg != null ? Number(dbProduct.ratingAvg) : null;
  const reviewCount = dbProduct.reviewCount;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: dbProduct.description ?? undefined,
    sku: dbProduct.sku,
    url: `${siteUrl}/urunler/${slug}`,
    image: product.images.map(img => img.url),
    brand: { "@type": "Brand", name: "Half Leaf" },
    // Gerçek (uydurma değil) değerlendirmeler varsa yıldız zengin sonucu için ekle.
    ...(reviewCount > 0 && ratingAvg != null
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: ratingAvg.toFixed(1), reviewCount } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: product.price.toFixed(2),
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: `${new Date(now).getFullYear()}-12-31`,
      url: `${siteUrl}/urunler/${slug}`,
      seller: { "@type": "Organization", name: "Half Leaf" },
      // Google "Satıcı girişleri" için: kargo bilgisi (eşik üstü ücretsiz) + iade politikası.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: (product.price >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST).toFixed(2),
          currency: "TRY",
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "TR" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Ürünler", item: `${siteUrl}/urunler` },
      { "@type": "ListItem", position: 3, name: dbProduct.Category.name, item: `${siteUrl}/kategori/${dbProduct.Category.slug}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${siteUrl}/urunler/${slug}` },
    ],
  };

  return (
    <div
      className="hl-page-pad hl-page-shell"
      style={{
        paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 32px)",
        paddingBottom: 80,
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex", alignItems: "center", gap: 4,
          fontFamily: "var(--hl-font-ui)", fontSize: 11,
          color: "var(--hl-text-mute)", marginBottom: 32,
        }}
        aria-label="Breadcrumb"
      >
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Ana Sayfa</Link>
        <ChevronRight size={11} />
        <Link href="/urunler" style={{ color: "inherit", textDecoration: "none" }}>Ürünler</Link>
        <ChevronRight size={11} />
        <Link
          href={`/kategori/${dbProduct.Category.slug}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {dbProduct.Category.name}
        </Link>
        <ChevronRight size={11} />
        <span style={{ color: "var(--hl-text-soft)" }}>{product.name}</span>
      </nav>

      {/* Main two-column layout */}
      <ProductDetailMain
        product={product}
        isNew={!!product.isNew}
        categoryName={dbProduct.Category.name}
        categorySlug={dbProduct.Category.slug}
        variants={variants}
        lowStockThreshold={lowStockThreshold}
      />

      {/* Tabs section */}
      <div style={{ marginBottom: 72 }}>
        <ProductTabs
          product={product}
          materialName={dbProduct.Material?.name}
          careInfo={dbProduct.careInfo ?? undefined}
          weightGrams={dbProduct.weightGrams ?? undefined}
          slug={slug}
          reviews={reviews}
          ratingAvg={ratingAvg}
          reviewCount={reviewCount}
        />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 24,
          }}>
            <h2 style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(20px, 2vw, 26px)",
              fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)", margin: 0,
            }}>
              Benzer parçalar
            </h2>
            <Link
              href={`/kategori/${product.categorySlug}`}
              style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
                color: "var(--hl-text-mute)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4,
                transition: "color 150ms ease",
              }}
            >
              Tümünü gör →
            </Link>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
            className="related-grid"
          >
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
