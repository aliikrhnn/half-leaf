import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { jsonLd } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import ProductsClient from "@/app/urunler/ProductsClient";
import ProductGridSkeleton from "@/components/product/ProductGridSkeleton";
import { fetchAll, type SearchParams } from "@/app/urunler/page";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

// /kategori/[slug] yalnızca KATEGORİ parametresini path'ten alır; ek filtreler
// query ile gelebilir ama bunlar noindex yapılır (yalnızca temiz kategori indekslenir).
type CategorySearchParams = Omit<SearchParams, "kategori">;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}

async function getCategory(slug: string) {
  try {
    return await prisma.category.findUnique({
      where: { slug },
      select: { name: true, description: true, isActive: true },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategory(slug);
  if (!cat || !cat.isActive) return {};

  const url = `${siteUrl}/kategori/${slug}`;
  const description =
    cat.description?.trim() ||
    `${cat.name} kategorisindeki premium nargile ürünlerini Half Leaf'te keşfedin.`;

  const hasFilters = Boolean(
    sp.materyal || sp.boy || sp.renk || sp.fiyat || sp.siralama || sp.arama ||
    sp.indirim || sp.cokSatanlar || sp.oneCikan || sp.marka ||
    (sp.sayfa && sp.sayfa !== "1"),
  );

  return {
    title: cat.name,
    description: description.length > 155 ? description.slice(0, 152).replace(/\s+\S*$/, "") + "…" : description,
    alternates: { canonical: url },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { url, title: `${cat.name} | ${SITE_NAME}`, description },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const cat = await getCategory(slug);
  if (!cat || !cat.isActive) notFound();

  const data = await fetchAll({ ...sp, kategori: slug });
  // Kategori bulundu ama ürünleri çözemediysek yine de listeyi göster (boş olabilir).
  if (!data.activeCategory) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Ürünler", item: `${siteUrl}/urunler` },
      { "@type": "ListItem", position: 3, name: cat.name, item: `${siteUrl}/kategori/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }} />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductsClient {...data} />
      </Suspense>
    </>
  );
}
