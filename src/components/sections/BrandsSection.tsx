import Image from "next/image";
import Link from "next/link";
import SectionHeading from "./SectionHeading";
import type { ShowcaseBrand } from "@/lib/products/brands";

interface Props {
  brands: ShowcaseBrand[];
}

/**
 * "Markalara göre keşfet" — yalnızca DB'de gerçekten bulunan küratörlü markalar
 * ve her markanın öne çıkan ürünü. Veri kaynağı: getShowcaseBrands().
 * Salt sunum: hover davranışları CSS ile (istemci JS gerektirmez).
 */
export default function BrandsSection({ brands }: Props) {
  if (brands.length === 0) return null;

  return (
    <section
      style={{
        background: "var(--hl-bg-elev-1)",
        borderTop: "1px solid var(--hl-line)",
        borderBottom: "1px solid var(--hl-line)",
        paddingBottom: "7.5rem",
      }}
    >
      <div className="hl-page-shell">
        {/* Header */}
        <div style={{ paddingTop: "4rem" }}>
          <SectionHeading
            eyebrow="Koleksiyonlar"
            title="Markalara göre keşfet"
            href="/urunler"
            linkLabel="Tüm markalar"
          />
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {brands.map((brand) => (
            <Link
              key={brand.key}
              href={brand.href}
              className="hl-brand-card"
              aria-label={`${brand.name} — ${brand.productCount} ürün`}
            >
              {/* Öne çıkan ürün görseli + spot ışığı */}
              <div className="hl-brand-media">
                <span aria-hidden className="hl-brand-spot" />
                <Image
                  src={brand.product.image}
                  alt={brand.product.name}
                  fill
                  className="hl-brand-img object-contain"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <span aria-hidden className="hl-brand-scrim" />
                {/* Ürün adedi rozeti */}
                <span className="hl-brand-count">{brand.productCount} ürün</span>
              </div>

              {/* Marka bilgisi */}
              <div className="hl-brand-info">
                <div className="hl-brand-name">
                  {brand.name}
                  <svg
                    className="hl-brand-arrow"
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </div>
                <div className="hl-brand-tagline">{brand.tagline}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
