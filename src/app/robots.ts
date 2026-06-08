import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleaf.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/hesabim/",
          "/hesabim",
          "/odeme",
          "/sepet",
          "/giris",
          "/kayit",
          "/siparis-tamamlandi",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
