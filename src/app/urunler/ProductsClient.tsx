"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, X, LayoutGrid, Grid3X3 } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import FilterPanel from "./FilterPanel";
import { formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";
import type { MaterialOption, BrandOption, PriceRange } from "./FilterPanel";

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: "onerilen", label: "Önerilen" },
  { value: "fiyat-artan", label: "Fiyat: Düşükten Yükseğe" },
  { value: "fiyat-azalan", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "yeni", label: "En Yeni" },
] as const;

export const PRICE_RANGES: PriceRange[] = [
  { key: "0-2500", label: "₺0 – ₺2.500", min: 0, max: 2500 },
  { key: "2500-5000", label: "₺2.500 – ₺5.000", min: 2500, max: 5000 },
  { key: "5000-10000", label: "₺5.000 – ₺10.000", min: 5000, max: 10000 },
  { key: "10000+", label: "₺10.000+", min: 10000, max: null },
];

export interface UrlState {
  kategori: string;
  materyal: string;
  marka: string;
  boy: string;
  renk: string;
  fiyat: string;
  indirim: string;
  cokSatanlar: string;
  siralama: string;
  sayfa: string;
  grid: string;
  arama: string;
}

interface Props {
  products: Product[];
  total: number;
  featuredProduct: Product | null;
  categories: Category[];
  materials: MaterialOption[];
  brandOptions: BrandOption[];
  sizeOptions: string[];
  colorOptions: Array<{ name: string; hex: string }>;
  activeCategory: Category | null;
  urlState: UrlState;
}

export default function ProductsClient({
  products,
  total,
  featuredProduct,
  materials,
  brandOptions,
  sizeOptions,
  colorOptions,
  activeCategory,
  urlState,
}: Props) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  const { kategori, materyal, marka, boy, renk, fiyat, indirim, cokSatanlar, siralama, sayfa: sayfaStr, grid: gridStr, arama } = urlState;
  const sayfa = parseInt(sayfaStr || "1", 10);
  const grid = (parseInt(gridStr || "3", 10) === 2 ? 2 : 3) as 2 | 3;
  const activeMateryals = materyal ? materyal.split(",").filter(Boolean) : [];
  const activeBrands = marka ? marka.split(",").filter(Boolean) : [];

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const merged: Record<string, string> = { ...urlState };

      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") {
          delete merged[k];
        } else {
          merged[k] = v;
        }
      }

      if (!("sayfa" in updates)) delete merged.sayfa;

      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(merged)) {
        if (v && v !== "") {
          if (k === "sayfa" && v === "1") continue;
          if (k === "siralama" && v === "onerilen") continue;
          if (k === "grid" && v === "3") continue;
          if (k === "arama" && v === "") continue;
          params.set(k, v);
        }
      }

      router.push(`/urunler?${params.toString()}`);
    },
    [urlState, router]
  );

  const handleFilterChange = (key: string, value: string | null) => {
    if (key === "materyal") {
      const slug = value ?? "";
      const next = activeMateryals.includes(slug)
        ? activeMateryals.filter(m => m !== slug)
        : [...activeMateryals, slug];
      navigate({ materyal: next.join(",") || null });
    } else if (key === "marka") {
      const brand = value ?? "";
      const next = activeBrands.includes(brand)
        ? activeBrands.filter(b => b !== brand)
        : [...activeBrands, brand];
      navigate({ marka: next.join(",") || null });
    } else {
      navigate({ [key]: value });
    }
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    if (kategori) params.set("kategori", kategori);
    router.push(`/urunler?${params.toString()}`);
  };

  const hasFilters = !!(materyal || marka || boy || renk || fiyat || indirim || cokSatanlar);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showing = Math.min(sayfa * PAGE_SIZE, total);

  const categoryTitle = arama
    ? `"${arama}" · Arama Sonuçları`
    : activeCategory
    ? `${activeCategory.name} · Koleksiyon`
    : "Tüm Ürünler · Koleksiyon";
  const categoryDesc = activeCategory?.description ?? "El yapımı, özenle tasarlanmış ürünler";

  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: "var(--hl-r-pill)",
    background: "rgba(201,160,106,0.1)", border: "1px solid rgba(201,160,106,0.3)",
    fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
    color: "var(--hl-bronze-400)", cursor: "pointer", letterSpacing: "0.05em",
  };

  return (
    <div style={{
      maxWidth: 1280, margin: "0 auto",
      padding: "calc(var(--hl-bar-h) + var(--hl-header-h) + 32px) 24px 80px",
    }}>
      {/* Breadcrumb */}
      <nav style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 600,
        letterSpacing: "0.08em", color: "var(--hl-text-mute)",
        textTransform: "uppercase", marginBottom: 28,
      }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Ana Sayfa</Link>
        <span>›</span>
        <Link href="/urunler" style={{ color: "inherit", textDecoration: "none" }}>Koleksiyon</Link>
        {activeCategory && (
          <>
            <span>›</span>
            <span style={{ color: "var(--hl-text-soft)" }}>{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Page title */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(30px, 4vw, 52px)",
          fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)",
          lineHeight: 1.1, marginBottom: 10,
        }}>
          {categoryTitle}
        </h1>
        <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-mute)" }}>
          <span style={{ color: "var(--hl-text-soft)", fontWeight: 600 }}>{total}</span>
          {" "}ürün · {categoryDesc}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {/* Mobile filter toggle */}
        <button
          onClick={() => setFilterOpen(true)}
          className="hl-filter-toggle"
          style={{
            alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: "var(--hl-r-pill)",
            border: "1.5px solid var(--hl-line-strong)", background: "none",
            cursor: "pointer", fontFamily: "var(--hl-font-ui)", fontSize: 11,
            fontWeight: 700, color: "var(--hl-text-soft)", letterSpacing: "0.06em",
            display: "none",
          }}
        >
          <SlidersHorizontal size={13} />
          Filtrele
        </button>

        {/* Active chips */}
        {activeBrands.map(brand => (
          <button key={brand} onClick={() => handleFilterChange("marka", brand)} style={chipStyle}>
            {brand} <X size={10} />
          </button>
        ))}
        {indirim === "1" && (
          <button onClick={() => handleFilterChange("indirim", null)} style={chipStyle}>
            İndirimli <X size={10} />
          </button>
        )}
        {cokSatanlar === "1" && (
          <button onClick={() => handleFilterChange("cokSatanlar", null)} style={chipStyle}>
            Çok Satanlar <X size={10} />
          </button>
        )}
        {activeMateryals.map(slug => {
          const mat = materials.find(x => x.slug === slug);
          return (
            <button key={slug} onClick={() => handleFilterChange("materyal", slug)} style={chipStyle}>
              {mat?.name ?? slug} <X size={10} />
            </button>
          );
        })}
        {boy && (
          <button onClick={() => handleFilterChange("boy", null)} style={chipStyle}>
            Boy: {boy} <X size={10} />
          </button>
        )}
        {renk && (
          <button onClick={() => handleFilterChange("renk", null)} style={chipStyle}>
            Renk: {renk} <X size={10} />
          </button>
        )}
        {fiyat && (
          <button onClick={() => handleFilterChange("fiyat", null)} style={chipStyle}>
            {PRICE_RANGES.find(r => r.key === fiyat)?.label ?? fiyat} <X size={10} />
          </button>
        )}
        {hasFilters && (
          <button
            onClick={clearAll}
            style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
              color: "var(--hl-text-mute)", background: "none", border: "none",
              cursor: "pointer", textDecoration: "underline", letterSpacing: "0.05em",
            }}
          >
            Tümünü temizle
          </button>
        )}

        {/* Right: sort + grid toggle */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={siralama || "onerilen"}
            onChange={e => navigate({ siralama: e.target.value })}
            style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
              color: "var(--hl-text-soft)", background: "var(--hl-bg-elev-1)",
              border: "1.5px solid var(--hl-line-strong)", borderRadius: "var(--hl-r-sm)",
              padding: "7px 12px", cursor: "pointer", outline: "none",
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 4 }}>
            {([2, 3] as const).map(n => (
              <button
                key={n}
                onClick={() => navigate({ grid: String(n) })}
                aria-label={`${n} kolon`}
                style={{
                  width: 32, height: 32, borderRadius: "var(--hl-r-sm)",
                  border: grid === n ? "1.5px solid var(--hl-bronze-400)" : "1.5px solid var(--hl-line-strong)",
                  background: grid === n ? "rgba(201,160,106,0.1)" : "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: grid === n ? "var(--hl-bronze-400)" : "var(--hl-text-mute)",
                  transition: "all 150ms ease",
                }}
              >
                {n === 2 ? <LayoutGrid size={14} /> : <Grid3X3 size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, alignItems: "start" }} className="hl-listing-grid">

        {/* Filter sidebar */}
        <aside className="hl-filter-aside" style={{ position: "sticky", top: "calc(var(--hl-bar-h) + var(--hl-header-h) + 24px)" }}>
          <FilterPanel
            materials={materials}
            brandOptions={brandOptions}
            sizeOptions={sizeOptions}
            colorOptions={colorOptions}
            priceRanges={PRICE_RANGES}
            activeMateryals={activeMateryals}
            activeBrands={activeBrands}
            activeBoy={boy || null}
            activeRenk={renk || null}
            activeFiyat={fiyat || null}
            activeIndirim={indirim === "1"}
            activeCokSatanlar={cokSatanlar === "1"}
            onChange={handleFilterChange}
            categorySlug={activeCategory?.slug}
          />
        </aside>

        {/* Content */}
        <div>
          {/* Featured product banner */}
          {featuredProduct && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              borderRadius: "var(--hl-r-lg)", overflow: "hidden",
              background: "var(--hl-olive-800)", border: "1px solid var(--hl-line)",
              marginBottom: 32,
            }} className="hl-featured-card">
              <div style={{
                padding: "clamp(24px, 4vw, 48px)",
                display: "flex", flexDirection: "column", justifyContent: "center",
              }}>
                <p style={{
                  fontFamily: "var(--hl-font-ui)", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.14em", color: "var(--hl-bronze-400)",
                  textTransform: "uppercase", marginBottom: 10,
                }}>
                  Öne Çıkan
                </p>
                <h2 style={{
                  fontFamily: "var(--hl-font-display)", fontSize: "clamp(20px, 2.5vw, 30px)",
                  fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)",
                  lineHeight: 1.15, marginBottom: 12,
                }}>
                  {featuredProduct.name}
                </h2>
                <p style={{
                  fontFamily: "var(--hl-font-ui)", fontSize: 12, lineHeight: 1.7,
                  color: "var(--hl-text-mute)", marginBottom: 20,
                }}>
                  {featuredProduct.shortDescription}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{
                    fontFamily: "var(--hl-font-ui)", fontSize: 18, fontWeight: 700,
                    color: "var(--hl-bronze-400)",
                  }}>
                    {formatPrice(featuredProduct.price)}
                  </span>
                  <Link
                    href={`/urunler/${featuredProduct.slug}`}
                    style={{
                      padding: "9px 22px", borderRadius: "var(--hl-r-pill)",
                      background: "var(--hl-bronze-400)", color: "#0A0B09",
                      fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      textDecoration: "none", transition: "opacity 150ms ease",
                    }}
                  >
                    İncele →
                  </Link>
                </div>
              </div>
              <div style={{ position: "relative", minHeight: 220 }}>
                {featuredProduct.images?.[0] && (
                  <Image
                    src={featuredProduct.images[0].url}
                    alt={featuredProduct.images[0].alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                )}
              </div>
            </div>
          )}

          {/* Product grid */}
          {products.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
                Bu filtreyle eşleşen ürün bulunamadı.
              </p>
            </div>
          ) : (
            <div
              style={{ display: "grid", gridTemplateColumns: `repeat(${grid}, 1fr)`, gap: 20 }}
              className="hl-product-grid"
            >
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Bottom controls */}
          {total > 0 && (
            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 11, color: "var(--hl-text-mute)" }}>
                <span style={{ color: "var(--hl-text-soft)", fontWeight: 600 }}>{showing}</span>/{total} ürün gösteriliyor
              </p>

              {sayfa < totalPages && (
                <button
                  onClick={() => navigate({ sayfa: String(sayfa + 1) })}
                  className="hl-load-more"
                  style={{
                    padding: "11px 44px", borderRadius: "var(--hl-r-pill)",
                    border: "1.5px solid var(--hl-line-strong)", background: "none",
                    fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "var(--hl-text-soft)", cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  Daha Fazla Yükle
                </button>
              )}

              {totalPages > 1 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => navigate({ sayfa: String(n) })}
                      style={{
                        width: 32, height: 32, borderRadius: "var(--hl-r-sm)",
                        fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
                        cursor: "pointer", transition: "all 150ms ease",
                        border: n === sayfa ? "1.5px solid var(--hl-bronze-400)" : "1.5px solid var(--hl-line-strong)",
                        background: n === sayfa ? "rgba(201,160,106,0.1)" : "none",
                        color: n === sayfa ? "var(--hl-bronze-400)" : "var(--hl-text-mute)",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(10,11,9,0.75)" }}
            onClick={() => setFilterOpen(false)}
          />
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 300,
            background: "var(--hl-bg-elev-1)", borderLeft: "1px solid var(--hl-line)",
            padding: 24, overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 700, color: "var(--hl-text)" }}>
                Filtreler
              </span>
              <button
                onClick={() => setFilterOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--hl-text-mute)" }}
              >
                <X size={18} />
              </button>
            </div>
            <FilterPanel
              materials={materials}
              brandOptions={brandOptions}
              sizeOptions={sizeOptions}
              colorOptions={colorOptions}
              priceRanges={PRICE_RANGES}
              activeMateryals={activeMateryals}
              activeBrands={activeBrands}
              activeBoy={boy || null}
              activeRenk={renk || null}
              activeFiyat={fiyat || null}
              activeIndirim={indirim === "1"}
              activeCokSatanlar={cokSatanlar === "1"}
              onChange={(k, v) => { handleFilterChange(k, v); if (k !== "marka" && k !== "materyal") setFilterOpen(false); }}
              categorySlug={activeCategory?.slug}
            />
          </div>
        </div>
      )}
    </div>
  );
}
