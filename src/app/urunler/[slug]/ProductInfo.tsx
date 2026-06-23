"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Gift, Truck, ShieldCheck, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import type { Product, VariantData } from "@/lib/types";

interface Props {
  product: Product;
  categoryName: string;
  categorySlug: string;
  variants: VariantData[];
  lowStockThreshold: number;
  /** Eski (varyantsız) ürünler için görsellerden türetilen renkler — kozmetik fallback. */
  imageColors?: { renk: string; hex: string }[];
  selectedColor: string | null;
  onSelectColor: (color: string | null) => void;
}

function getAttr(attrs: Record<string, string> | null, ...keys: string[]): string | undefined {
  if (!attrs) return undefined;
  for (const k of keys) {
    if (attrs[k] !== undefined) return attrs[k];
    const lower = k.toLowerCase();
    if (attrs[lower] !== undefined) return attrs[lower];
  }
  return undefined;
}

export default function ProductInfo({ product, categoryName, categorySlug, variants, lowStockThreshold, imageColors, selectedColor, onSelectColor }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { addItem, openCart } = useCartStore();

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must run after SSR mount
  useEffect(() => setMounted(true), []);
  const inWishlist = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const liked = mounted && inWishlist;

  // Renk seçenekleri önce varyantlardan (her renk kendi stoğunu taşır).
  const variantColorEntries = [...new Map(
    variants
      .filter(v => getAttr(v.attributes, "renk", "color"))
      .map(v => {
        const renk = getAttr(v.attributes, "renk", "color")!;
        const hex = getAttr(v.attributes, "renk_hex", "colorHex", "hex") ?? "#888888";
        const hex2 = getAttr(v.attributes, "renk_hex2", "colorHex2");
        return [renk, { renk, hex, hex2 }] as [string, { renk: string; hex: string; hex2?: string }];
      })
  ).values()];

  // Varyant rengi yoksa görsellerden gelen renklere düş (eski ürünler — kozmetik).
  const useVariantColors = variantColorEntries.length > 0;
  const colorEntries: { renk: string; hex: string; hex2?: string }[] = useVariantColors
    ? variantColorEntries
    : (imageColors ?? []).map(c => ({ renk: c.renk, hex: c.hex, hex2: undefined }));

  const sizeEntries = [...new Map(
    variants
      .filter(v => getAttr(v.attributes, "boy", "size", "boyut"))
      .map(v => {
        const boy = getAttr(v.attributes, "boy", "size", "boyut")!;
        return [boy, boy] as [string, string];
      })
  ).values()];

  // Stoklu (varyant) renkli üründe renk seçimi zorunlu; kozmetik (görsel) renklerde değil.
  const colorRequired = useVariantColors;
  const needsColor = colorRequired && !selectedColor;

  const activeVariant = (!colorRequired || selectedColor)
    ? variants.find(v => {
        const matchColor = !selectedColor || getAttr(v.attributes, "renk", "color") === selectedColor;
        const matchSize = !selectedSize || getAttr(v.attributes, "boy", "size", "boyut") === selectedSize;
        return matchColor && matchSize;
      }) ?? null
    : null;

  // Fiyat her renkte aynı (ürün fiyatı); product.price zaten TRY'ye çevrilmiş.
  const displayPrice = product.price;
  const displayStock = needsColor ? 0 : (activeVariant ? activeVariant.stock : product.stock);
  const maxQty = displayStock > 0 ? displayStock : 99;

  const stockLabel =
    needsColor ? "Renk seçiniz"
    : displayStock === 0 ? "Stokta yok"
    : displayStock <= lowStockThreshold ? `Son ${displayStock} ürün`
    : "Stokta";
  const stockDot =
    needsColor ? "var(--hl-text-mute)"
    : displayStock === 0 ? "#e05252"
    : displayStock <= lowStockThreshold ? "#d4a04a"
    : "#7ab87a";

  const handleAddToCart = () => {
    if (needsColor || displayStock === 0) return;
    addItem(
      product,
      qty,
      activeVariant && selectedColor
        ? { id: activeVariant.id, label: selectedColor, stock: activeVariant.stock }
        : undefined,
    );
    openCart();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Category */}
      <Link
        href={`/urunler?kategori=${categorySlug}`}
        style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.14em", color: "var(--hl-bronze-400)",
          textTransform: "uppercase", textDecoration: "none",
        }}
      >
        {categoryName}
      </Link>

      {/* Name + SKU */}
      <div>
        <h1
          style={{
            fontFamily: "var(--hl-font-display)",
            fontSize: "clamp(26px, 2.8vw, 36px)",
            fontWeight: 400, fontStyle: "italic",
            lineHeight: 1.15, color: "var(--hl-text-main)", margin: 0,
          }}
        >
          {product.name}
        </h1>
        <p style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 10,
          color: "var(--hl-text-mute)", marginTop: 7, letterSpacing: "0.05em",
        }}>
          SKU: {product.sku}
        </p>
      </div>

      {/* Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 32, fontWeight: 700,
          color: "var(--hl-bronze-400)", letterSpacing: "-0.01em", lineHeight: 1,
        }}>
          {formatPrice(displayPrice)}
        </span>
        {product.compareAtPrice && (
          <span style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 16,
            color: "var(--hl-text-mute)", textDecoration: "line-through",
          }}>
            {formatPrice(product.compareAtPrice)}
          </span>
        )}
        <span style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 11, color: "var(--hl-text-mute)",
        }}>
          kdv dahil
        </span>
      </div>

      {/* Stock indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: stockDot, flexShrink: 0, display: "inline-block",
        }} />
        <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12, color: "var(--hl-text-soft)" }}>
          {stockLabel}
        </span>
      </div>

      {/* Color swatches */}
      {colorEntries.length > 0 && (
        <div>
          <p style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", color: "var(--hl-text-mute)",
            textTransform: "uppercase", marginBottom: 10,
          }}>
            Renk
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {colorEntries.map(({ renk, hex, hex2 }) => (
              <button
                key={renk}
                onClick={() => onSelectColor(selectedColor === renk ? null : renk)}
                title={renk}
                aria-label={renk}
                aria-pressed={selectedColor === renk}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: hex2 ? `linear-gradient(135deg, ${hex} 0 50%, ${hex2} 50% 100%)` : hex,
                  padding: 0, cursor: "pointer",
                  border: selectedColor === renk
                    ? "2px solid var(--hl-bronze-400)"
                    : "2px solid var(--hl-line-strong)",
                  boxShadow: selectedColor === renk
                    ? "0 0 0 2px rgba(201,169,110,0.25)"
                    : "none",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {sizeEntries.length > 0 && (
        <div>
          <p style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", color: "var(--hl-text-mute)",
            textTransform: "uppercase", marginBottom: 10,
          }}>
            Boy
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sizeEntries.map(boy => {
              const sv = variants.find(v => getAttr(v.attributes, "boy", "size", "boyut") === boy);
              const inStock = (sv?.stock ?? 0) > 0;
              const isSelected = selectedSize === boy;
              return (
                <button
                  key={boy}
                  onClick={() => inStock && setSelectedSize(isSelected ? null : boy)}
                  disabled={!inStock}
                  style={{
                    padding: "6px 14px", borderRadius: 7,
                    fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 600,
                    border: isSelected
                      ? "1.5px solid var(--hl-bronze-400)"
                      : "1.5px solid var(--hl-line-strong)",
                    background: isSelected
                      ? "rgba(201,169,110,0.1)"
                      : "var(--hl-bg-elev-1)",
                    color: !inStock
                      ? "var(--hl-text-mute)"
                      : isSelected
                      ? "var(--hl-bronze-400)"
                      : "var(--hl-text-soft)",
                    cursor: inStock ? "pointer" : "not-allowed",
                    opacity: inStock ? 1 : 0.4,
                    textDecoration: inStock ? "none" : "line-through",
                    transition: "all 150ms ease",
                  }}
                >
                  {boy}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity + add to cart */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Qty stepper */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            border: "1.5px solid var(--hl-line-strong)",
            borderRadius: 9, overflow: "hidden", flexShrink: 0,
          }}>
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              style={{
                width: 40, height: 48, display: "flex", alignItems: "center",
                justifyContent: "center", background: "none", border: "none",
                color: "var(--hl-text-soft)", cursor: "pointer",
                fontSize: 20, fontWeight: 300, lineHeight: 1,
              }}
              aria-label="Azalt"
            >−</button>
            <span style={{
              width: 36, textAlign: "center",
              fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 600,
              color: "var(--hl-text-main)",
            }}>
              {qty}
            </span>
            <button
              onClick={() => setQty(Math.min(maxQty, qty + 1))}
              style={{
                width: 40, height: 48, display: "flex", alignItems: "center",
                justifyContent: "center", background: "none", border: "none",
                color: "var(--hl-text-soft)", cursor: "pointer",
                fontSize: 20, fontWeight: 300, lineHeight: 1,
              }}
              aria-label="Artır"
            >+</button>
          </div>

          {/* Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={needsColor || displayStock === 0}
            style={{
              flex: 1, height: 48, borderRadius: 9, border: "none",
              background: (needsColor || displayStock === 0) ? "var(--hl-line-strong)" : "var(--hl-bronze-400)",
              color: (needsColor || displayStock === 0) ? "var(--hl-text-mute)" : "#0A0B09",
              cursor: (needsColor || displayStock === 0) ? "not-allowed" : "pointer",
              fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              transition: "opacity 150ms ease",
            }}
          >
            {needsColor
              ? "Renk Seçin"
              : displayStock === 0
              ? "Stokta Yok"
              : `Sepete Ekle · ${formatPrice(displayPrice * qty)}`}
          </button>

          {/* Wishlist */}
          <button
            type="button"
            onClick={() =>
              toggleWishlist({
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images?.[0]?.url ?? null,
                price: displayPrice,
              })
            }
            style={{
              width: 48, height: 48, flexShrink: 0, borderRadius: 9,
              border: `1.5px solid ${liked ? "#e53e3e" : "var(--hl-line-strong)"}`,
              background: "var(--hl-bg-elev-1)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: liked ? "#e53e3e" : "var(--hl-text-mute)", transition: "all 150ms ease",
            }}
            aria-label={liked ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={liked}
          >
            <Heart size={16} fill={liked ? "#e53e3e" : "none"} />
          </button>
        </div>

        {/* Gift button */}
        <button
          style={{
            width: "100%", height: 44, borderRadius: 9,
            background: "var(--hl-olive-700)",
            border: "1px solid var(--hl-line)",
            color: "var(--hl-text-soft)", cursor: "pointer",
            fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          }}
        >
          <Gift size={12} />
          Hediye Paketi Olarak Gönder
        </button>
      </div>

      {/* Info rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--hl-line)", paddingTop: 16 }}>
        {[
          { Icon: Truck, text: `${formatPrice(FREE_SHIPPING_THRESHOLD)} üzeri siparişlerde ücretsiz kargo` },
          { Icon: ShieldCheck, text: "PayTR ile güvenli ödeme · 3D Secure" },
          { Icon: Package, text: "Özenli hediye paketleme seçeneği" },
        ].map(({ Icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon size={13} style={{ color: "var(--hl-bronze-400)", flexShrink: 0 }} />
            <span style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 11,
              color: "var(--hl-text-mute)",
            }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
