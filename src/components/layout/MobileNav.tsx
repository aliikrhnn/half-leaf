"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronRight, ChevronDown, Search, User, Heart, LogIn, Sparkles, Package } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import ThemeToggle from "./ThemeToggle";
import type { NavCategory } from "@/lib/types";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navCategories?: NavCategory[];
  isAuthed?: boolean;
}

export default function MobileNav({ isOpen, onClose, navCategories = [], isAuthed = false }: MobileNavProps) {
  const rootCategories = navCategories.filter(c => !c.parentId);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // aria-modal="true" sözünü tutar: odak panelin içinde kalır, kapanışta
  // menü butonuna geri döner, ESC kapatır.
  const panelRef = useFocusTrap<HTMLElement>(isOpen, onClose);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/urunler?arama=${encodeURIComponent(q)}`);
    setSearchQuery("");
    onClose();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset accordion when drawer closes
    if (!isOpen) setExpandedId(null);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKey);
      };
    }
    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        ref={panelRef}
        tabIndex={-1}
        className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-bg-surface border-r border-border-default overflow-y-auto animate-slide-in-left"
        aria-label="Mobil menü"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <span className="text-lg font-bold text-gold">{SITE_NAME}</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
              aria-label="Menüyü kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-default">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 bg-bg-elevated border border-border-default rounded-lg px-3 py-2 focus-within:border-gold transition-colors"
          >
            <Search size={15} className="text-ink-dim flex-shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ürün ara…"
              className="flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder:text-ink-dim min-w-0"
              autoComplete="off"
            />
            <button type="submit" className="text-xs font-bold text-gold uppercase tracking-wide flex-shrink-0">
              Ara
            </button>
          </form>
        </div>

        {/* Account / register incentive */}
        <div className="p-4 border-b border-border-default">
          {isAuthed ? (
            <div className="space-y-1">
              <Link href="/hesabim" onClick={onClose} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-ink hover:text-gold hover:bg-bg-elevated rounded-lg transition-colors">
                <User size={17} className="text-ink-dim" /> Hesabım
              </Link>
              <Link href="/favorilerim" onClick={onClose} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-ink hover:text-gold hover:bg-bg-elevated rounded-lg transition-colors">
                <Heart size={17} className="text-ink-dim" /> Favorilerim
              </Link>
              <Link href="/siparis-takip" onClick={onClose} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-ink hover:text-gold hover:bg-bg-elevated rounded-lg transition-colors">
                <Package size={17} className="text-ink-dim" /> Sipariş Takibi
              </Link>
            </div>
          ) : (
            <>
              {/* Üye olma teşvik CTA */}
              <Link
                href="/kayit"
                onClick={onClose}
                className="hl-join-card block rounded-xl p-4 text-center"
              >
                <span className="hl-join-title inline-flex items-center gap-1.5 text-[15px] font-bold">
                  <Sparkles size={16} /> Üye Ol
                </span>
                <span className="hl-join-sub block text-[11px] mt-1 leading-snug">
                  Fırsatlardan ilk sen haberdar ol, siparişlerini takip et, favorilerini kaydet.
                </span>
              </Link>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link href="/giris" onClick={onClose} className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-ink border border-border-default rounded-lg hover:border-border-light hover:bg-bg-elevated transition-colors">
                  <LogIn size={15} /> Giriş Yap
                </Link>
                <Link href="/favorilerim" onClick={onClose} className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-ink border border-border-default rounded-lg hover:border-border-light hover:bg-bg-elevated transition-colors">
                  <Heart size={15} /> Favoriler
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Quick links */}
        <div className="p-4 space-y-1">
          <Link
            href="/urunler"
            onClick={onClose}
            className="flex items-center justify-between w-full px-3 py-3 text-ink hover:text-gold hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <span>Tüm Ürünler</span>
            <ChevronRight size={16} className="text-ink-dim" />
          </Link>
          <Link
            href="/urunler?indirim=1"
            onClick={onClose}
            className="flex items-center justify-between w-full px-3 py-3 text-gold hover:text-gold/80 hover:bg-bg-elevated rounded-lg transition-colors"
          >
            <span>İndirimli Ürünler</span>
            <ChevronRight size={16} className="text-ink-dim" />
          </Link>
        </div>

        {/* Categories with accordion sub-items */}
        <div className="px-4 pb-4">
          <p className="text-xs text-ink-dim uppercase tracking-wider mb-2 px-3">
            Kategoriler
          </p>
          <div className="space-y-1">
            {rootCategories.map((cat) => {
              const children = navCategories.filter(c => c.parentId === cat.id);
              const hasChildren = children.length > 0;
              const isExpanded = expandedId === cat.id;

              return (
                <div key={cat.id}>
                  {/* Root category row */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/kategori/${cat.slug}`}
                      onClick={onClose}
                      className="flex-1 px-3 py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-lg transition-colors"
                    >
                      {cat.name}
                    </Link>
                    {hasChildren ? (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                        className="p-2.5 text-ink-dim hover:text-ink hover:bg-bg-elevated rounded-lg transition-colors flex-shrink-0"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `${cat.name} kapat` : `${cat.name} alt kategoriler`}
                      >
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    ) : (
                      <ChevronRight size={14} className="text-ink-dim mr-1 flex-shrink-0" />
                    )}
                  </div>

                  {/* Sub-categories */}
                  {hasChildren && isExpanded && (
                    <div className="mt-1 ml-2 pl-3 border-l border-border-default space-y-0.5">
                      {children.map(sub => (
                        <Link
                          key={sub.id}
                          href={`/kategori/${sub.slug}`}
                          onClick={onClose}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm text-ink-dim hover:text-ink hover:bg-bg-elevated rounded-lg transition-colors"
                        >
                          <span>{sub.name}</span>
                          <ChevronRight size={13} className="text-ink-dim flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer links */}
        <div className="p-4 border-t border-border-default space-y-2">
          <Link
            href="/yasal/kvkk"
            onClick={onClose}
            className="block text-xs text-ink-dim hover:text-ink-muted transition-colors px-3 py-1"
          >
            KVKK
          </Link>
          <Link
            href="/yardim/sss"
            onClick={onClose}
            className="block text-xs text-ink-dim hover:text-ink-muted transition-colors px-3 py-1"
          >
            Sık Sorulan Sorular
          </Link>
        </div>
      </nav>
    </>
  );
}
