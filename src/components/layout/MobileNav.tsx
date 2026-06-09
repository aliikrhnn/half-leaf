"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronRight, ChevronDown, Search } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import type { NavCategory } from "@/lib/types";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navCategories?: NavCategory[];
}

export default function MobileNav({ isOpen, onClose, navCategories = [] }: MobileNavProps) {
  const rootCategories = navCategories.filter(c => !c.parentId);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] bg-bg-surface border-r border-border-default overflow-y-auto animate-slide-in-right"
        aria-label="Mobil menü"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <span className="text-lg font-bold text-gold">{SITE_NAME}</span>
          <button
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
            aria-label="Menüyü kapat"
          >
            <X size={20} />
          </button>
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
                      href={`/urunler?kategori=${cat.slug}`}
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
                          href={`/urunler?kategori=${sub.slug}`}
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
