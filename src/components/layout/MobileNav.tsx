"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ChevronRight, Search } from "lucide-react";
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/urunler?arama=${encodeURIComponent(q)}`);
    setSearchQuery("");
    onClose();
  }

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
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-bg-elevated border border-border-default rounded-lg px-3 py-2 focus-within:border-gold transition-colors">
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

        <div className="p-4 space-y-1">
          <Link href="/urunler" onClick={onClose}
            className="flex items-center justify-between w-full px-3 py-3 text-ink hover:text-gold hover:bg-bg-elevated rounded-lg transition-colors">
            <span>Tüm Ürünler</span>
            <ChevronRight size={16} className="text-ink-dim" />
          </Link>
          <Link href="/urunler?indirim=1" onClick={onClose}
            className="flex items-center justify-between w-full px-3 py-3 text-gold hover:text-gold/80 hover:bg-bg-elevated rounded-lg transition-colors">
            <span>İndirimli Ürünler</span>
            <ChevronRight size={16} className="text-ink-dim" />
          </Link>
        </div>

        <div className="px-4 pb-4">
          <p className="text-xs text-ink-dim uppercase tracking-wider mb-2 px-3">
            Kategoriler
          </p>
          <div className="space-y-1">
            {rootCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/urunler?kategori=${cat.slug}`}
                onClick={onClose}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-lg transition-colors"
              >
                <span>{cat.name}</span>
                <ChevronRight size={14} className="text-ink-dim" />
              </Link>
            ))}
          </div>
        </div>

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
