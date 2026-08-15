"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Menu, Search, User, X, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { SITE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import MobileNav from "./MobileNav";
import CartDrawer from "@/components/cart/CartDrawer";
import MegaMenu from "./MegaMenu";
import ThemeToggle from "./ThemeToggle";
import type { NavCategory } from "@/lib/types";

interface Props {
  navCategories?: NavCategory[];
}

interface SearchSuggestion {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
}

export default function Header({ navCategories = [] }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const { getTotalItems, openCart, isOpen: cartOpen } = useCartStore();

  useEffect(() => {
    useCartStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must run after SSR mount
    setMounted(true);
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => { if (r.ok) setIsAuthed(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state: close mega menu when user scrolls away
    if (scrolled) setActiveKey(null);
  }, [scrolled]);

  // Close search panel on ESC at document level
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const trimmedQuery = searchQuery.trim();
  const showSuggest = searchOpen && trimmedQuery.length >= 2;

  // Debounce'lu canlı arama önerileri
  useEffect(() => {
    if (!showSuggest) return;
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async arama yükleniyor göstergesi
    setSearchLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
        .then((d: { items?: SearchSuggestion[]; total?: number }) => {
          setSuggestions(d.items ?? []);
          setSearchTotal(d.total ?? 0);
        })
        .catch(() => { /* abort/hata yoksay */ })
        .finally(() => setSearchLoading(false));
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [trimmedQuery, showSuggest]);

  const totalItems = mounted ? getTotalItems() : 0;
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const favCount = mounted ? wishlistCount : 0;

  function openMega(key: string) {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveKey(key);
  }

  function scheduleClose() {
    closeTimerRef.current = setTimeout(() => setActiveKey(null), 150);
  }

  function cancelClose() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
    setSearchTotal(0);
  }

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/urunler?arama=${encodeURIComponent(q)}`);
    closeSearch();
  }, [searchQuery, router]);

  const rootCategories = navCategories.filter(c => !c.parentId);
  const activeCatObj = navCategories.find(c => c.slug === activeKey);

  return (
    <>
      <header
        className={`hl-header fixed top-10 left-0 right-0 z-40 transition-all duration-300${
          scrolled ? " hl-header--scrolled" : ""
        }`}
      >
        {/* ── Row 1: Logo + Actions ── */}
        <div className="hl-page-shell">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label={SITE_NAME + " Ana Sayfa"}
            >
              <span className="hl-logo-hover">
                <HalfLeafLogo full width={76} height={63} />
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <ThemeToggle />

              <button
                onClick={() => setSearchOpen(v => !v)}
                className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center transition-colors rounded-lg hover:bg-bg-elevated ${searchOpen ? "text-ink bg-bg-elevated" : "text-ink-muted hover:text-ink"}`}
                aria-label="Ürün ara"
                aria-expanded={searchOpen}
              >
                <Search size={20} />
              </button>

              <Link
                href="/favorilerim"
                className="relative min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
                aria-label={`Favorilerim${favCount > 0 ? `, ${favCount} ürün` : ""}`}
              >
                <Heart size={20} />
                {favCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-bg text-[10px] font-bold rounded-full flex items-center justify-center">
                    {favCount > 9 ? "9+" : favCount}
                  </span>
                )}
              </Link>

              <Link
                href={isAuthed ? "/hesabim" : "/giris"}
                className="hidden sm:flex p-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
                aria-label="Hesabım"
              >
                <User size={20} />
              </Link>

              <button
                onClick={openCart}
                className="relative min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
                aria-label={`Sepet, ${totalItems} ürün`}
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-bg text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Full-width category nav (desktop only) ── */}
        <div
          className="hidden lg:block"
          style={{ borderTop: "1px solid var(--hl-line)" }}
        >
          <nav className="hl-catbar" aria-label="Kategori menüsü">
            <div className="hl-catbar-inner">
              {rootCategories.map((cat) => {
                const hasChildren = navCategories.some(c => c.parentId === cat.id);
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => { if (hasChildren) openMega(cat.slug); }}
                    onMouseLeave={scheduleClose}
                  >
                    <Link
                      href={`/kategori/${cat.slug}`}
                      className={`hl-nav-link${activeKey === cat.slug ? " hl-nav-link--active" : ""}`}
                    >
                      {cat.name}
                      {hasChildren && (
                        <svg
                          className={`hl-nav-chevron${activeKey === cat.slug ? " hl-nav-chevron--open" : ""}`}
                          width={10}
                          height={10}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Separator + accent link */}
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <span className="hl-nav-vsep" aria-hidden="true" />
              <Link
                href="/urunler?indirim=1"
                className="hl-nav-link hl-nav-link--accent"
                onMouseEnter={() => setActiveKey(null)}
              >
                İndirimli Ürünler
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Search panel ── */}
      {searchOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[45] bg-black/40"
            aria-hidden="true"
            onClick={closeSearch}
          />
          {/* Panel */}
          <div
            className="fixed left-0 right-0 z-[46] hl-search-panel"
            style={{ top: "calc(var(--hl-bar-h) + var(--hl-header-h))" }}
            role="search"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="hl-search-panel-form"
            >
              <div className="hl-search-panel-inner">
                <Search size={18} className="hl-search-panel-icon" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara…"
                  className="hl-search-panel-input"
                  autoFocus
                  autoComplete="off"
                />
                <button type="submit" className="hl-search-panel-btn">
                  Ara
                </button>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="hl-search-panel-close"
                  aria-label="Aramayı kapat"
                >
                  <X size={18} />
                </button>
              </div>
            </form>

            {showSuggest && (
              <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 16px" }}>
                <div style={{ background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)", borderRadius: "var(--hl-r-sm)", overflow: "hidden" }}>
                  {searchLoading && suggestions.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 13, color: "var(--hl-text-mute)", fontFamily: "var(--hl-font-ui)" }}>Aranıyor…</div>
                  ) : suggestions.length === 0 ? (
                    <div style={{ padding: 16, fontSize: 13, color: "var(--hl-text-mute)", fontFamily: "var(--hl-font-ui)" }}>
                      &quot;{trimmedQuery}&quot; için sonuç bulunamadı.
                    </div>
                  ) : (
                    <>
                      {suggestions.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/urunler/${s.slug}`}
                          onClick={closeSearch}
                          className="hl-search-result-row"
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", textDecoration: "none", borderBottom: "1px solid var(--hl-line)" }}
                        >
                          <span style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "var(--hl-bg-elev-2)", flexShrink: 0 }}>
                            {s.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.image} alt={s.name} width={44} height={44} style={{ width: 44, height: 44, objectFit: "cover", display: "block" }} />
                            )}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--hl-text)", fontFamily: "var(--hl-font-ui)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                            {s.category && <span style={{ display: "block", fontSize: 11, color: "var(--hl-text-mute)", fontFamily: "var(--hl-font-ui)" }}>{s.category}</span>}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)", whiteSpace: "nowrap", fontFamily: "var(--hl-font-ui)" }}>{formatPrice(s.price)}</span>
                        </Link>
                      ))}
                      <Link
                        href={`/urunler?arama=${encodeURIComponent(trimmedQuery)}`}
                        onClick={closeSearch}
                        className="hl-search-result-row"
                        style={{ display: "block", padding: "11px 14px", textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "var(--hl-bronze-400)", textDecoration: "none", fontFamily: "var(--hl-font-ui)" }}
                      >
                        Tüm sonuçları gör ({searchTotal}) →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mega menu — desktop only */}
      {activeKey && (
        <div className="hidden lg:block">
          <MegaMenu
            key={activeKey}
            activeKey={activeKey}
            allHref={`/kategori/${activeKey}`}
            label={activeCatObj?.name ?? ""}
            categories={navCategories}
            featuredProduct={activeCatObj?.featuredProduct ?? null}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onClose={() => setActiveKey(null)}
          />
        </div>
      )}

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} navCategories={navCategories} isAuthed={isAuthed} />
      {cartOpen && <CartDrawer />}
    </>
  );
}
