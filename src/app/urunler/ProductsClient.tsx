"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, X, LayoutGrid, Grid3X3 } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import FilterPanel from "./FilterPanel";
import { formatPrice } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";
import type { MaterialOption, BrandOption, PriceRange } from "./FilterPanel";

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

/** API sorgu dizesi (grid hariç — grid yalnızca UI). */
function buildApiQuery(f: UrlState): string {
  const params = new URLSearchParams();
  (Object.keys(f) as (keyof UrlState)[]).forEach((k) => {
    const v = f[k];
    if (!v || k === "grid") return;
    if (k === "sayfa" && v === "1") return;
    if (k === "siralama" && v === "onerilen") return;
    params.set(k, v);
  });
  return params.toString();
}

/**
 * URL'i tam navigasyon olmadan günceller (paylaşılabilirlik için).
 *
 * Aynı bileşen hem /urunler hem de /kategori/[slug] altında çalışır.
 * Yol sabit yazılırsa kategori sayfasında ilk filtre tıklamasında adres
 * çubuğu sessizce /urunler'e döner ve kanonik kategori URL'i kaybolur —
 * bu yüzden mevcut yol korunur, kategori sayfasında `kategori` parametresi
 * de yola gömülü olduğu için sorgudan çıkarılır.
 */
function syncUrl(f: UrlState): void {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  const onCategoryPath = path.startsWith("/kategori/");

  const params = new URLSearchParams();
  (Object.keys(f) as (keyof UrlState)[]).forEach((k) => {
    const v = f[k];
    if (!v) return;
    if (k === "sayfa" && v === "1") return;
    if (k === "siralama" && v === "onerilen") return;
    if (k === "grid" && v === "3") return;
    if (k === "kategori" && onCategoryPath) return;
    params.set(k, v);
  });

  const qs = params.toString();
  const base = onCategoryPath ? path : "/urunler";
  window.history.replaceState(null, "", `${base}${qs ? "?" + qs : ""}`);
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
  const [filters, setFilters] = useState<UrlState>(urlState);
  const [items, setItems] = useState<Product[]>(products);
  const [curTotal, setCurTotal] = useState<number>(total);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const filterPanelRef = useFocusTrap<HTMLDivElement>(filterOpen, closeFilter);

  // Panel açıkken arka planın kaydırılmasını engelle.
  useEffect(() => {
    if (!filterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [filterOpen]);

  const { materyal, marka, boy, renk, fiyat, indirim, cokSatanlar, grid: gridStr, arama } = filters;
  const grid = (parseInt(gridStr || "3", 10) === 2 ? 2 : 3) as 2 | 3;
  const activeMateryals = materyal ? materyal.split(",").filter(Boolean) : [];
  const activeBrands = marka ? marka.split(",").filter(Boolean) : [];

  // İstemci tarafı ürün getirme (tam sayfa navigasyonu yerine → anında tepki).
  // reqId: hızlı tıklamalarda eski yanıtın yeniyi ezmesini engeller.
  const reqIdRef = useRef(0);
  const fetchProducts = useCallback(async (f: UrlState, append: boolean) => {
    const reqId = ++reqIdRef.current;
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await fetch(`/api/urunler?${buildApiQuery(f)}`);
      const data = await res.json() as { products: Product[]; total: number };
      if (reqId === reqIdRef.current) {
        setItems((prev) => (append ? [...prev, ...(data.products ?? [])] : (data.products ?? [])));
        setCurTotal(data.total ?? 0);
      }
    } catch {
      /* mevcut listeyi koru */
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, []);

  const applyFilters = useCallback((updates: Record<string, string | null>) => {
    const merged: UrlState = { ...filters };
    for (const [k, v] of Object.entries(updates)) {
      merged[k as keyof UrlState] = v ?? "";
    }
    if (!("sayfa" in updates)) merged.sayfa = "1"; // filtre değişince ilk sayfaya dön
    setFilters(merged);
    syncUrl(merged);
    fetchProducts(merged, false);
  }, [filters, fetchProducts]);

  const handleFilterChange = (key: string, value: string | null) => {
    if (key === "materyal") {
      const slug = value ?? "";
      const next = activeMateryals.includes(slug) ? activeMateryals.filter((m) => m !== slug) : [...activeMateryals, slug];
      applyFilters({ materyal: next.join(",") || null });
    } else if (key === "marka") {
      const brand = value ?? "";
      const next = activeBrands.includes(brand) ? activeBrands.filter((b) => b !== brand) : [...activeBrands, brand];
      applyFilters({ marka: next.join(",") || null });
    } else {
      applyFilters({ [key]: value });
    }
  };

  const clearAll = () => {
    applyFilters({ materyal: null, marka: null, boy: null, renk: null, fiyat: null, indirim: null, cokSatanlar: null, siralama: null, arama: null });
  };

  const setGrid = (n: 2 | 3) => {
    const merged: UrlState = { ...filters, grid: String(n) };
    setFilters(merged);
    syncUrl(merged);
  };

  const loadMore = () => {
    const next = parseInt(filters.sayfa || "1", 10) + 1;
    const merged: UrlState = { ...filters, sayfa: String(next) };
    setFilters(merged);
    syncUrl(merged);
    fetchProducts(merged, true); // aşağı ekle (append)
  };

  const hasFilters = !!(materyal || marka || boy || renk || fiyat || indirim || cokSatanlar);
  const hasMore = items.length < curTotal;
  const siralama = filters.siralama;

  const categoryTitle = arama
    ? `"${arama}" · Arama Sonuçları`
    : activeCategory
    ? `${activeCategory.name} · Koleksiyon`
    : "Tüm Ürünler · Koleksiyon";
  const categoryDesc = activeCategory?.description ?? "Özenle seçilmiş, tasarım ürünler";

  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: "var(--hl-r-pill)",
    background: "rgba(201,160,106,0.1)", border: "1px solid rgba(201,160,106,0.3)",
    fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
    color: "var(--hl-bronze-400)", cursor: "pointer", letterSpacing: "0.05em",
  };

  return (
    <div className="hl-page-pad hl-page-shell" style={{
      paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 32px)",
      paddingBottom: 80,
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
          fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)",
          lineHeight: 1.1, marginBottom: 10,
        }}>
          {categoryTitle}
        </h1>
        <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-mute)" }}>
          <span style={{ color: "var(--hl-text-soft)", fontWeight: 600 }}>{curTotal}</span>
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
        <div className="hl-listing-controls-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={siralama || "onerilen"}
            onChange={e => applyFilters({ siralama: e.target.value })}
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

          <div className="hl-grid-toggle" style={{ display: "flex", gap: 4 }}>
            {([2, 3] as const).map(n => (
              <button
                key={n}
                onClick={() => setGrid(n)}
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
                  fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)",
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
                      background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
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
          {!loading && items.length === 0 ? (
            <div className="hl-empty-state">
              <SlidersHorizontal size={26} aria-hidden />
              <p className="hl-empty-title">
                {arama
                  ? `"${arama}" için sonuç bulunamadı`
                  : "Bu filtrelerle eşleşen ürün yok"}
              </p>
              <p className="hl-empty-desc">
                {hasFilters || arama
                  ? "Filtreleri gevşetip tekrar deneyebilir ya da tüm koleksiyona göz atabilirsiniz."
                  : "Bu kategoriye yakında ürün eklenecek."}
              </p>
              {(hasFilters || arama) && (
                <div className="hl-empty-actions">
                  <button type="button" onClick={clearAll} className="hl-empty-btn">
                    Filtreleri temizle
                  </button>
                  <Link href="/urunler" className="hl-empty-link">
                    Tüm ürünlere git
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`,
                gap: 20,
                opacity: loading ? 0.5 : 1,
                transition: "opacity 150ms ease",
              }}
              className="hl-product-grid"
            >
              {items.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Bottom controls — "Daha Fazla Yükle" yeni ürünleri aşağı ekler */}
          {curTotal > 0 && (
            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 11, color: "var(--hl-text-mute)" }}>
                <span style={{ color: "var(--hl-text-soft)", fontWeight: 600 }}>{items.length}</span>/{curTotal} ürün gösteriliyor
              </p>

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="hl-load-more"
                  style={{
                    padding: "11px 44px", borderRadius: "var(--hl-r-pill)",
                    border: "1.5px solid var(--hl-line-strong)", background: "none",
                    fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "var(--hl-text-soft)", cursor: loadingMore ? "default" : "pointer",
                    opacity: loadingMore ? 0.6 : 1,
                    transition: "all 150ms ease",
                  }}
                >
                  {loadingMore ? "Yükleniyor…" : "Daha Fazla Yükle"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer — ESC ile kapanır, odak içeride kalır,
          açıkken arka plan kaydırması kilitlenir. */}
      {filterOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "var(--hl-scrim)" }}
            onClick={() => setFilterOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={filterPanelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Ürün filtreleri"
            style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: 300, maxWidth: "88vw",
              background: "var(--hl-bg-elev-1)", borderLeft: "1px solid var(--hl-line)",
              padding: 24, overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 700, color: "var(--hl-text)" }}>
                Filtreler
              </span>
              <button
                onClick={() => setFilterOpen(false)}
                aria-label="Filtreleri kapat"
                style={{
                  minWidth: 44, minHeight: 44, display: "inline-flex",
                  alignItems: "center", justifyContent: "center",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--hl-text-mute)",
                }}
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
