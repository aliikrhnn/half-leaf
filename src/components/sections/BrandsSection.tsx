"use client";

import Image from "next/image";
import Link from "next/link";

const BRANDS = [
  {
    name: "HOOB",
    tagline: "Alman Mühendisliği",
    image: "/images/nargilestore/image/cache/catalog/HOOB/hoob-enzo-gold-black-1-550x550.jpg",
    href: "/urunler?q=hoob",
  },
  {
    name: "Alpha Hookah",
    tagline: "İnce İşçilik",
    image: "/images/nargilestore/image/cache/catalog/ALPHA-HOOKAH/SMART-EXZO-TRIBAL-GREEN-FRONT-550x550.jpg",
    href: "/urunler?q=alpha",
  },
  {
    name: "Mr. EDS",
    tagline: "Yerli Premium",
    image: "/images/nargilestore/image/cache/catalog/MR.EDS/E24-Big-Boss-Pro-X-4---Titanyum-Serisi-550x550.jpg",
    href: "/urunler?q=mr+eds",
  },
  {
    name: "MOZE",
    tagline: "Avusturya Tasarımı",
    image: "/images/nargilestore/image/cache/catalog/MOZE/moze-tradi-l-nargile-takimi-550x550.jpg",
    href: "/urunler?q=moze",
  },
  {
    name: "Amotion",
    tagline: "Kompakt & Modern",
    image: "/images/nargilestore/image/cache/catalog/AMOTION/Amotion-Flash-Bang-Teal-550x550.jpg",
    href: "/urunler?q=amotion",
  },
  {
    name: "Maxx",
    tagline: "Royal Seri",
    image: "/images/nargilestore/image/cache/catalog/Maxx/maxx-royal-hookah-emerald-gold-2-550x550.jpg",
    href: "/urunler?q=maxx",
  },
  {
    name: "Darkside",
    tagline: "Rus Tasarımı",
    image: "/images/nargilestore/image/cache/catalog/Darkside/dark-side-evo-550x550.jpg",
    href: "/urunler?q=darkside",
  },
  {
    name: "Oblako",
    tagline: "Seramik Lüle",
    image: "/images/nargilestore/image/cache/catalog/OBLAKO/Oblako-Phunnel-L-Sky-Blue-550x550.jpg",
    href: "/urunler?q=oblako",
  },
];

export default function BrandsSection() {
  return (
    <section
      style={{
        background: "var(--hl-bg-elev-1)",
        borderTop: "1px solid var(--hl-line)",
        borderBottom: "1px solid var(--hl-line)",
        paddingBottom: "7.5rem",
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14">
        {/* Header */}
        <div style={{ paddingTop: "4rem", paddingBottom: "2.5rem" }}>
          <div className="hl-eyebrow" style={{ marginBottom: 8 }}>
            Koleksiyonlar
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <h2
              className="hl-display"
              style={{
                fontSize: "clamp(32px, 4vw, 56px)",
                margin: 0,
                letterSpacing: "-0.02em",
                fontWeight: 400,
                color: "var(--hl-text)",
              }}
            >
              Markalara göre keşfet
            </h2>
            <Link
              href="/urunler"
              style={{
                fontFamily: "var(--hl-font-ui)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--hl-bronze-400)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--hl-bronze-300)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--hl-bronze-400)";
              }}
            >
              Tüm markalar
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Bronze rule */}
        <div className="hl-rule-bronze" style={{ marginBottom: "2rem" }} />

        {/* Brand grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5">
          {BRANDS.map((brand) => (
            <Link
              key={brand.name}
              href={brand.href}
              style={{
                display: "block",
                position: "relative",
                aspectRatio: "1/1",
                borderRadius: 14,
                overflow: "hidden",
                background: "var(--hl-bg-elev-3)",
                border: "1px solid var(--hl-line-strong)",
                textDecoration: "none",
                transition: "border-color 200ms ease, transform 200ms ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--hl-bronze-700)";
                el.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--hl-line-strong)";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Product image */}
              <Image
                src={brand.image}
                alt={brand.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 50vw, 25vw"
                style={{ padding: 16 }}
              />

              {/* Gradient overlay */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(10,11,9,0.92) 100%)",
                  transition: "opacity 200ms ease",
                }}
              />

              {/* Text */}
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  right: 14,
                  bottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--hl-font-display)",
                    fontSize: "clamp(15px, 1.4vw, 19px)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "var(--hl-text)",
                    lineHeight: 1.1,
                    marginBottom: 4,
                  }}
                >
                  {brand.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--hl-font-ui)",
                    fontSize: 9,
                    color: "var(--hl-bronze-300)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {brand.tagline}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
