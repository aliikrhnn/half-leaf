"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart";
import { toast } from "@/store/toast";
import { useWishlistStore } from "@/store/wishlist";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must run after SSR mount
  useEffect(() => setMounted(true), []);
  const inWishlist = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const liked = mounted && inWishlist;
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.lowStock ?? (!isOutOfStock && product.stock <= 5);
  const hasVariants = (product.variantColors?.length ?? 0) > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasVariants) {
      router.push(`/urunler/${product.slug}`);
      return;
    }
    addItem(product);
    toast("Sepete eklendi", { label: "Sepete git", href: "/sepet" });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="hl-product-card" style={{ display: "flex", flexDirection: "column" }}>
      <Link href={`/urunler/${product.slug}`} style={{ display: "block", textDecoration: "none", flex: 1 }}>
        {/* Image */}
        <div style={{
          position: "relative", aspectRatio: "1/1",
          background: "var(--hl-bg-elev-1)", borderRadius: "var(--hl-r-md)",
          overflow: "hidden", marginBottom: 12,
        }}>
          {product.images?.[0] && (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt}
              fill
              className="object-cover hl-card-img"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={isOutOfStock ? { filter: "grayscale(100%)", opacity: 0.65 } : undefined}
            />
          )}

          {/* Badges */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {product.compareAtPrice && (
              <span style={{
                padding: "3px 9px", borderRadius: "var(--hl-r-pill)",
                background: "#FF5A00", color: "#fff",
                fontFamily: "var(--hl-font-ui)", fontSize: 9, fontWeight: 800,
                letterSpacing: "0.06em",
              }}>
                %{Math.round((1 - product.price / product.compareAtPrice) * 100)}
              </span>
            )}
            {product.isNew && !product.compareAtPrice && (
              <span style={{
                padding: "3px 9px", borderRadius: "var(--hl-r-pill)",
                background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
                fontFamily: "var(--hl-font-ui)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.09em", textTransform: "uppercase",
              }}>Yeni</span>
            )}
            {isLowStock && (
              <span style={{
                padding: "3px 9px", borderRadius: "var(--hl-r-pill)",
                background: "rgba(212,160,74,0.18)", border: "1px solid rgba(212,160,74,0.4)",
                color: "var(--hl-bronze-300)", fontFamily: "var(--hl-font-ui)",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
              }}>Stok Az</span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist({
                id: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images?.[0]?.url ?? null,
                price: product.price,
              });
            }}
            className="hl-card-heart"
            style={{
              position: "absolute", top: 10, right: 10,
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--hl-overlay-chip)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: `1px solid ${liked ? "var(--hl-bronze-500)" : "var(--hl-line-strong)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: liked ? "var(--hl-bronze-300)" : "var(--hl-text-soft)",
              transition: "color 150ms ease, border-color 150ms ease, background 150ms ease",
            }}
            aria-label={liked ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={liked}
          >
            <Heart size={15} fill={liked ? "currentColor" : "none"} />
          </button>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div style={{
              position: "absolute", inset: 0, background: "var(--hl-media-scrim)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                color: "var(--hl-text)", letterSpacing: "0.08em", textTransform: "uppercase",
                background: "var(--hl-overlay-chip)", padding: "5px 12px",
                borderRadius: "var(--hl-r-pill)", border: "1px solid var(--hl-line-strong)",
              }}>Stokta Yok</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "0 2px", opacity: isOutOfStock ? 0.5 : 1, transition: "opacity 150ms ease" }}>
          <p style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em", color: "var(--hl-text-mute)",
            textTransform: "uppercase", marginBottom: 5,
          }}>
            {product.categoryName ?? product.categorySlug.replace(/-/g, " ")}
          </p>

          <h3
            className="hl-card-name"
            style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(14px, 1.3vw, 18px)",
              fontWeight: 500, fontStyle: "normal", color: "var(--hl-text)",
              lineHeight: 1.2, marginBottom: 8,
            }}
          >
            {product.name}
          </h3>

          {/* Color dots */}
          {product.variantColors && product.variantColors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              {product.variantColors.slice(0, 5).map((hex, i) => (
                <span key={i} style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: hex, border: "1px solid var(--hl-line-strong)", flexShrink: 0,
                }} />
              ))}
              {product.variantColors.length > 5 && (
                <span style={{ fontFamily: "var(--hl-font-ui)", fontSize: 9, color: "var(--hl-text-mute)" }}>
                  +{product.variantColors.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            {product.compareAtPrice && (
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 11,
                color: "var(--hl-text-mute)", textDecoration: "line-through",
              }}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            <span style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 14, fontWeight: 700,
              color: product.compareAtPrice ? "#FF5A00" : "var(--hl-bronze-400)",
              letterSpacing: "-0.01em",
            }}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>

      {/* Add to cart — outside Link to prevent navigation */}
      <div style={{ padding: "0 2px 2px" }}>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`hl-add-btn${added ? " hl-add-btn--added" : ""}`}
        >
          {added ? <Check size={14} /> : <ShoppingCart size={14} />}
          {isOutOfStock ? "Stokta Yok" : added ? "Eklendi" : "Sepete Ekle"}
        </button>
      </div>
    </div>
  );
}
