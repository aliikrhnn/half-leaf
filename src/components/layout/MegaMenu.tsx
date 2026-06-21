"use client";

import Link from "next/link";
import Image from "next/image";
import { MEGA_MENU_DESCRIPTIONS } from "@/lib/constants";
import type { NavCategory, NavFeaturedProduct } from "@/lib/types";

interface NavGroup extends NavCategory {
  children: NavCategory[];
}

interface Props {
  activeKey: string;
  allHref: string;
  label: string;
  categories: NavCategory[];
  featuredProduct?: NavFeaturedProduct | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

function getCategoryGroups(key: string, cats: NavCategory[]): NavGroup[] {
  if (key === "all") {
    const roots = cats.filter(c => !c.parentId);
    return roots.map(r => ({ ...r, children: cats.filter(c => c.parentId === r.id) }));
  }

  const matchedRoot = cats.find(c => !c.parentId && c.slug === key);
  if (matchedRoot) {
    const level2 = cats.filter(c => c.parentId === matchedRoot.id);
    if (level2.length > 0) {
      return level2.map(group => ({
        ...group,
        children: cats.filter(c => c.parentId === group.id),
      }));
    }
    return [{ ...matchedRoot, children: [] }];
  }

  const matched = cats.filter(c =>
    c.slug.includes(key) || c.name.toLowerCase().includes(key.toLowerCase())
  );
  const source = matched.length > 0 ? matched : cats.filter(c => !c.parentId);
  return source.map(r => ({ ...r, children: cats.filter(c => c.parentId === r.id) }));
}

function formatPrice(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₺";
}

export default function MegaMenu({
  activeKey,
  allHref,
  label,
  categories,
  featuredProduct,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: Props) {
  const groups = getCategoryGroups(activeKey, categories);
  const activeCat = categories.find(c => c.slug === activeKey);
  const description = MEGA_MENU_DESCRIPTIONS[activeKey] ?? activeCat?.description ?? "";

  return (
    <>
      {/* Page-dim backdrop */}
      <div
        className="hl-mega-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="hl-mega-panel"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="navigation"
        aria-label={`${label} menüsü`}
      >
        <div className="hl-mega-inner">
          {/* LEFT: category intro */}
          <div className="hl-mega-left">
            <span className="hl-eyebrow" style={{ marginBottom: "0.625rem" }}>
              Kategoriler
            </span>
            <p className="hl-mega-left-title">{label}</p>
            {description && (
              <p className="hl-mega-left-desc">{description}</p>
            )}
            <Link href={allHref} className="hl-mega-left-cta" onClick={onClose}>
              Tümünü Gör
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </Link>
          </div>

          {/* Vertical divider */}
          <div className="hl-mega-divider" aria-hidden="true" />

          {/* MIDDLE: vertical category columns */}
          <div className="hl-mega-columns">
            {groups.length > 0 ? (
              groups.map(group => (
                <div key={group.id} className="hl-mega-col">
                  <Link
                    href={`/kategori/${group.slug}`}
                    className="hl-mega-group-title"
                    onClick={onClose}
                  >
                    {group.name}
                  </Link>
                  {group.children.length > 0 && (
                    <ul className="hl-mega-children">
                      {group.children.map(child => (
                        <li key={child.id}>
                          <Link
                            href={`/kategori/${child.slug}`}
                            className="hl-mega-child-link"
                            onClick={onClose}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="hl-mega-empty">Kategori bulunamadı.</p>
            )}
          </div>

          {/* RIGHT: featured product card */}
          {featuredProduct && (
            <>
              <div className="hl-mega-divider" aria-hidden="true" />
              <div className="hl-mega-right">
                <span className="hl-mega-right-label">Öne Çıkan</span>

                <Link
                  href={`/urunler/${featuredProduct.slug}`}
                  className="hl-mega-right-img-wrap"
                  onClick={onClose}
                  aria-label={featuredProduct.name}
                >
                  {featuredProduct.imageUrl ? (
                    <Image
                      src={featuredProduct.imageUrl}
                      alt={featuredProduct.name}
                      fill
                      className="object-contain p-3"
                      sizes="200px"
                    />
                  ) : (
                    <span className="hl-mega-right-img-placeholder">
                      {featuredProduct.name.charAt(0)}
                    </span>
                  )}
                </Link>

                <p className="hl-mega-right-category">{featuredProduct.categoryName}</p>
                <p className="hl-mega-right-name">{featuredProduct.name}</p>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                  <span className="hl-mega-right-price">{formatPrice(featuredProduct.basePrice)}</span>
                  {featuredProduct.compareAtPrice && (
                    <span className="hl-mega-right-compare">{formatPrice(featuredProduct.compareAtPrice)}</span>
                  )}
                </div>

                <Link
                  href={`/urunler/${featuredProduct.slug}`}
                  className="hl-mega-right-cta"
                  onClick={onClose}
                >
                  İncele
                  <svg
                    width={11}
                    height={11}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
