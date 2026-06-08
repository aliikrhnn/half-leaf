"use client";

import { useState, useMemo } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

const TABS = ["Tümü", "Pirinç", "Mermer", "Cam"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  products: Product[];
}

export default function FeaturedSection({ products }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Tümü");

  const filtered = useMemo(() => {
    if (activeTab === "Tümü") return products.slice(0, 4);
    const kw = activeTab.toLowerCase();
    const result = products.filter(
      (p) =>
        p.categorySlug.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw)) ||
        p.name.toLowerCase().includes(kw)
    );
    return result.length > 0 ? result.slice(0, 4) : products.slice(0, 4);
  }, [products, activeTab]);

  return (
    <section
      className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
      style={{ paddingBottom: "7.5rem" }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 40,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div className="hl-eyebrow">Öne Çıkan Ürünler</div>
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
            Atölyeden seçmeler
          </h2>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background:
                  activeTab === tab ? "var(--hl-bg-elev-3)" : "transparent",
                border:
                  activeTab === tab
                    ? "1px solid var(--hl-bronze-500)"
                    : "1px solid var(--hl-line)",
                color:
                  activeTab === tab ? "var(--hl-text)" : "var(--hl-text-soft)",
                fontSize: 12,
                letterSpacing: "0.04em",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--hl-font-ui)",
                transition: "all 200ms var(--hl-ease)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
