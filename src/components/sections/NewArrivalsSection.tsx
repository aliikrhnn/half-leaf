"use client";

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
}

export default function NewArrivalsSection({ products }: Props) {
  if (products.length === 0) return null;

  return (
    <section
      className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
      style={{ paddingTop: "5rem", paddingBottom: "7.5rem" }}
    >
      {/* Header row */}
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
          <div className="hl-eyebrow">Yeni Gelenler</div>
          <h2
            className="hl-display"
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              margin: "12px 0 0",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              color: "var(--hl-text)",
            }}
          >
            Yeni gelen ürünler
          </h2>
        </div>

        <Link
          href="/urunler?siralama=yeni"
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
      </div>

      {/* Bronze rule */}
      <div className="hl-rule-bronze" style={{ marginBottom: "2.5rem" }} />

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
