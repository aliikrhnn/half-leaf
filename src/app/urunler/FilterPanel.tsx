"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getCategoryTip } from "@/data/category-tips";

export interface MaterialOption {
  slug: string;
  name: string;
  count: number;
}

export interface BrandOption {
  name: string;
  count: number;
}

export interface PriceRange {
  key: string;
  label: string;
  min: number;
  max: number | null;
}

interface Props {
  materials: MaterialOption[];
  brandOptions: BrandOption[];
  sizeOptions: string[];
  colorOptions: Array<{ name: string; hex: string }>;
  priceRanges: PriceRange[];
  activeMateryals: string[];
  activeBrands: string[];
  activeBoy: string | null;
  activeRenk: string | null;
  activeFiyat: string | null;
  activeIndirim: boolean;
  activeCokSatanlar: boolean;
  onChange: (key: string, value: string | null) => void;
  categorySlug?: string;
}

function Section({ title, children, defaultOpen = true }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--hl-line)", paddingBottom: open ? 18 : 0, marginBottom: 18 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 0 14px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--hl-text-soft)",
        }}>
          {title}
        </span>
        <ChevronDown size={12} style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease", color: "var(--hl-text-mute)", flexShrink: 0,
        }} />
      </button>
      {open && children}
    </div>
  );
}

const checkboxStyle: React.CSSProperties = {
  width: 14, height: 14, accentColor: "var(--hl-bronze-400)", cursor: "pointer", flexShrink: 0,
};

export default function FilterPanel({
  materials,
  brandOptions,
  sizeOptions,
  colorOptions,
  priceRanges,
  activeMateryals,
  activeBrands,
  activeBoy,
  activeRenk,
  activeFiyat,
  activeIndirim,
  activeCokSatanlar,
  onChange,
  categorySlug,
}: Props) {
  const tip = getCategoryTip(categorySlug);
  return (
    <div style={{ width: "100%" }}>

      {/* ÖZELLIKLER */}
      <Section title="Özellikler">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={activeIndirim}
              onChange={() => onChange("indirim", activeIndirim ? null : "1")}
              style={checkboxStyle}
            />
            <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-soft)", flex: 1 }}>
              İndirimli Ürünler
            </span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={activeCokSatanlar}
              onChange={() => onChange("cokSatanlar", activeCokSatanlar ? null : "1")}
              style={checkboxStyle}
            />
            <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-soft)", flex: 1 }}>
              Çok Satanlar
            </span>
          </label>
        </div>
      </Section>

      {/* MARKA */}
      {brandOptions.length > 0 && (
        <Section title="Marka">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {brandOptions.map(b => (
              <label key={b.name} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={activeBrands.includes(b.name)}
                  onChange={() => onChange("marka", b.name)}
                  style={checkboxStyle}
                />
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-soft)", flex: 1 }}>
                  {b.name}
                </span>
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 10, color: "var(--hl-text-mute)" }}>
                  ({b.count})
                </span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* MATERYAL */}
      {materials.length > 0 && (
        <Section title="Materyal">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {materials.map(m => (
              <label key={m.slug} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={activeMateryals.includes(m.slug)}
                  onChange={() => onChange("materyal", m.slug)}
                  style={checkboxStyle}
                />
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-soft)", flex: 1 }}>
                  {m.name}
                </span>
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 10, color: "var(--hl-text-mute)" }}>
                  ({m.count})
                </span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* BOY */}
      {sizeOptions.length > 0 && (
        <Section title="Boy">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sizeOptions.map(boy => (
              <button
                key={boy}
                onClick={() => onChange("boy", activeBoy === boy ? null : boy)}
                style={{
                  padding: "4px 13px", borderRadius: "var(--hl-r-pill)", cursor: "pointer",
                  border: activeBoy === boy ? "1.5px solid var(--hl-bronze-400)" : "1.5px solid var(--hl-line-strong)",
                  background: activeBoy === boy ? "rgba(201,160,106,0.1)" : "transparent",
                  color: activeBoy === boy ? "var(--hl-bronze-400)" : "var(--hl-text-mute)",
                  fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
                  transition: "all 150ms ease",
                }}
              >
                {boy}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* RENK */}
      {colorOptions.length > 0 && (
        <Section title="Renk">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {colorOptions.map(({ name, hex }) => (
              <button
                key={name}
                onClick={() => onChange("renk", activeRenk === name ? null : name)}
                title={name}
                aria-label={name}
                aria-pressed={activeRenk === name}
                style={{
                  width: 24, height: 24, borderRadius: "50%", background: hex,
                  padding: 0, cursor: "pointer",
                  border: activeRenk === name ? "2px solid var(--hl-bronze-400)" : "2px solid var(--hl-line-strong)",
                  boxShadow: activeRenk === name ? "0 0 0 2px rgba(201,160,106,0.3)" : "none",
                  transition: "all 150ms ease",
                }}
              />
            ))}
          </div>
        </Section>
      )}

      {/* FİYAT */}
      <Section title="Fiyat">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {priceRanges.map(r => (
            <label key={r.key} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
              <input
                type="radio"
                name="fiyat-filter"
                checked={activeFiyat === r.key}
                onChange={() => onChange("fiyat", activeFiyat === r.key ? null : r.key)}
                style={{ width: 14, height: 14, accentColor: "var(--hl-bronze-400)", cursor: "pointer", flexShrink: 0 }}
              />
              <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-soft)" }}>
                {r.label}
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* HALF LEAF'TEN ÖNERİLER */}
      {tip && (
        <div style={{
          padding: "14px 16px", background: "var(--hl-olive-800)",
          borderRadius: "var(--hl-r-sm)", border: "1px solid var(--hl-line)", marginTop: 4,
        }}>
          <p style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--hl-bronze-400)", marginBottom: 6,
          }}>
            Half Leaf&apos;ten Öneriler
          </p>
          <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 11, lineHeight: 1.65, color: "var(--hl-text-mute)" }}>
            {tip}
          </p>
        </div>
      )}
    </div>
  );
}
