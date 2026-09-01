import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { SiteFlagsProvider } from "@/components/layout/SiteFlags";
import AgeGate from "@/components/layout/AgeGate";
import Footer from "@/components/layout/Footer";
import { SITE_NAME, SITE_DESCRIPTION, CONTACT_EMAIL, CONTACT_PHONE, SOCIAL_LINKS } from "@/lib/constants";
import { jsonLd } from "@/lib/utils";
import { getNavCategories } from "@/lib/site/nav";
import { getPublicSiteSettings } from "@/lib/site/settings";

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

/**
 * Duyuru şeridi + WhatsApp gibi yerleşim düzeyi ayarlar.
 * Sorgu `lib/site/settings.ts` içinde cache'lenir; Footer da aynı satırı okur.
 */
async function getSiteData(): Promise<{ announcementMessages: string[]; giftBoxEnabled: boolean; whatsappNumber: string | null }> {
  const s = await getPublicSiteSettings();
  return {
    announcementMessages: s?.announcementMessages ?? [],
    giftBoxEnabled: s?.giftBoxEnabled ?? true,
    whatsappNumber: s?.whatsappNumber ?? CONTACT_PHONE,
  };
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
  const { announcementMessages, giftBoxEnabled, whatsappNumber } = siteData;

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
          <AppShell footer={<Footer />} navCategories={navCategories} announcementMessages={announcementMessages}>{children}</AppShell>
        </SiteFlagsProvider>
      </body>
    </html>
  );
}
