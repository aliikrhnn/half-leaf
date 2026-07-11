import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  /** Başlık verilirse bölüm başlığı çizilir; verilmezse kesintisiz devam (grid). */
  eyebrow?: string;
  title?: string;
  href?: string;
}

/**
 * "Tüm ürünler" grid'i. Ana sayfada yeni gelenlerin hemen altında tüm katalog
 * gösterilir; öne çıkanlar/atölyeden seçmeler bölümleri araya serpiştirilir.
 * Başlıksız çağrılan örnekler önceki bloğun kesintisiz devamı gibi görünür.
 */
export default function AllProductsSection({ products, eyebrow, title, href }: Props) {
  if (products.length === 0) return null;
  const hasHeader = Boolean(title);

  return (
    <section
      className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
      style={{ paddingTop: hasHeader ? "1rem" : 0, paddingBottom: "5.5rem" }}
    >
      {hasHeader && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 32,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              {eyebrow && <div className="hl-eyebrow">{eyebrow}</div>}
              <h2
                className="hl-display"
                style={{
                  fontSize: "clamp(32px, 4vw, 56px)",
                  margin: "12px 0 0",
                  letterSpacing: "-0.03em",
                  fontWeight: 600,
                  color: "var(--hl-text)",
                }}
              >
                {title}
              </h2>
            </div>
            {href && (
              <Link href={href} className="hl-brand-all">
                Tümünü gör
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
            )}
          </div>
          <div className="hl-rule-bronze" style={{ marginBottom: "2.5rem" }} />
        </>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
