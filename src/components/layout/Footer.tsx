import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";
import { SITE_NAME, FOOTER_LINKS, CONTACT_ADDRESS } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { jsonLd } from "@/lib/utils";
import { buildStoreLocation } from "@/lib/store-location";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import StoreLocation from "./StoreLocation";
import PayTrLogo from "./PayTrLogo";
import CardSchemes from "./CardSchemes";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://halfleafstore.com";

async function getSiteSettings() {
  try {
    return await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: {
        contactEmail: true,
        contactPhone: true,
        contactAddress: true,
        mapsUrl: true,
        mapEmbedUrl: true,
        instagramUrl: true,
        facebookUrl: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function Footer() {
  const s = await getSiteSettings();

  const contactPhone   = s?.contactPhone   ?? "+90 543 533 2998";
  const contactEmail   = s?.contactEmail   ?? "info@halfleafstore.com";
  const contactAddress = s?.contactAddress || CONTACT_ADDRESS;
  const instagramUrl   = s?.instagramUrl   ?? "https://instagram.com/halfleafstore";
  const facebookUrl    = s?.facebookUrl    ?? "https://facebook.com/halfleafstore";

  const loc = buildStoreLocation(contactAddress, s?.mapsUrl, s?.mapEmbedUrl);

  // Google'ın mağazayı haritalarda/yerel sonuçlarda tanıyabilmesi için
  // yapısal veri (schema.org Store).
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${siteUrl}/#store`,
    name: SITE_NAME,
    url: siteUrl,
    image: `${siteUrl}/brand/half_leaf_logo.svg`,
    telephone: contactPhone,
    email: contactEmail,
    priceRange: "₺₺",
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.lines[0] ?? "",
      addressLocality: loc.locality || "Isparta",
      addressCountry: "TR",
    },
    hasMap: loc.mapsUrl,
    sameAs: [instagramUrl, facebookUrl],
  };

  return (
    <footer className="hl-footer">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(storeJsonLd) }}
      />

      <div className="hl-footer-inner hl-page-shell">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 lg:gap-8 hl-footer-grid">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <div style={{ marginBottom: 10 }}>
              <span className="hl-logo-hover">
                <HalfLeafLogo full width={70} height={58} />
              </span>
            </div>
            <p className="hl-footer-tagline">
              Modern nargile ekipmanları için seçilmiş premium koleksiyon.
            </p>
            <div className="hl-footer-social">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram sayfamız"
                className="hl-footer-social-btn"
              >
                <Instagram size={16} />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook sayfamız"
                className="hl-footer-social-btn"
              >
                <Facebook size={16} />
              </a>
            </div>
            <div className="hl-footer-contact">
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`}>{contactPhone}</a>
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </div>
          </div>

          {/* Link columns */}
          {(
            [
              { title: "Kurumsal", links: FOOTER_LINKS.kurumsallar },
              { title: "Yardım", links: FOOTER_LINKS.yardim },
              { title: "Yasal", links: FOOTER_LINKS.yasal },
            ] as const
          ).map((col) => (
            <div key={col.title}>
              <h3 className="hl-footer-col-title">{col.title}</h3>
              <ul className="hl-footer-list">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hl-footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mağaza konumu + Google Haritalar */}
        <StoreLocation
          address={contactAddress}
          phone={contactPhone}
          mapsUrl={s?.mapsUrl}
          mapEmbedUrl={s?.mapEmbedUrl}
        />

        {/* Payment trust strip */}
        <div className="hl-footer-pay">
          <span className="hl-footer-col-title" style={{ marginBottom: 0 }}>
            Güvenli Ödeme
          </span>
          <span className="hl-footer-pay-logo">
            <PayTrLogo />
          </span>
          <CardSchemes />
          <span className="hl-footer-pay-text">
            256-bit SSL · 3D Secure · Kredi / Banka Kartı · Havale / EFT
          </span>
        </div>

        {/* Bottom bar */}
        <div className="hl-footer-bottom">
          <p>© {new Date().getFullYear()} {SITE_NAME}. Tüm hakları saklıdır.</p>
          <div className="hl-footer-bottom-right">
            <span className="hl-footer-ssl">
              <span className="hl-footer-dot" aria-hidden />
              SSL Güvenli Alışveriş
            </span>
            <span className="hl-footer-age">+18</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
