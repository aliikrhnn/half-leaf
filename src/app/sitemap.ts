import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: siteUrl, lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
  { url: `${siteUrl}/urunler`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
  { url: `${siteUrl}/hakkimizda`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/iletisim`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/siparis-takip`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/yardim/sss`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/yardim/kargo-teslimat`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/yardim/iade-degisim`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/yardim/secim-rehberi`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/yardim/bakim-temizlik`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${siteUrl}/yasal/gizlilik-politikasi`,    lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/yasal/kvkk`,                   lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/yasal/cerez-politikasi`,       lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/yasal/mesafeli-satis-sozlesmesi`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/yasal/on-bilgilendirme-formu`,    lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];

  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch {
    // DB erişilemiyorsa statik rotalar döner
  }

  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${siteUrl}/urunler/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map(c => ({
    url: `${siteUrl}/kategori/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...STATIC_ROUTES, ...categoryRoutes, ...productRoutes];
}
