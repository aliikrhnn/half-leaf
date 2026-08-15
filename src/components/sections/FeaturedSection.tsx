"use client";

import { useState, useMemo, useCallback } from "react";
import ProductCard from "@/components/product/ProductCard";
import SectionHeading from "./SectionHeading";
import type { Product } from "@/lib/types";

const TABS = ["Tümü", "Pirinç", "Mermer", "Cam"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  products: Product[];
}

function matches(p: Product, tab: Tab): boolean {
  if (tab === "Tümü") return true;
  const kw = tab.toLocaleLowerCase("tr");
  return (
    p.categorySlug.toLocaleLowerCase("tr").includes(kw) ||
    p.tags.some((t) => t.toLocaleLowerCase("tr").includes(kw)) ||
    p.name.toLocaleLowerCase("tr").includes(kw)
  );
}

export default function FeaturedSection({ products }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Tümü");

  // Sekme hiçbir ürünle eşleşmediğinde eskiden sessizce filtrelenmemiş listeye
  // düşülüyordu; sekme aktif görünüyor ama grid değişmiyordu. Artık boş olan
  // sekme devre dışı bırakılır ve eşleşme yoksa açık bir boş durum gösterilir.
  const countFor = useCallback(
    (tab: Tab) => products.filter((p) => matches(p, tab)).length,
    [products],
  );

  const filtered = useMemo(
    () => products.filter((p) => matches(p, activeTab)).slice(0, 4),
    [products, activeTab],
  );

  return (
    <section
      className="hl-page-shell"
      style={{ paddingBottom: "7.5rem" }}
    >
      <SectionHeading
        eyebrow="Öne Çıkan Ürünler"
        title="Atölyeden seçmeler"
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TABS.map((tab) => {
              const count = countFor(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="hl-tab"
                  aria-pressed={activeTab === tab}
                  disabled={count === 0}
                  title={count === 0 ? `${tab} kategorisinde ürün yok` : undefined}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        }
      />

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="hl-section-empty">
          {activeTab} seçiminde şu an ürün yok.{" "}
          <button type="button" onClick={() => setActiveTab("Tümü")} className="hl-link-btn">
            Tümünü göster
          </button>
        </p>
      )}
    </section>
  );
}
