"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart";
import { toast } from "@/store/toast";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
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
                background: "var(--hl-bronze-400)", color: "#0A0B09",
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked((v) => !v); }}
            className="hl-card-heart"
            style={{
              position: "absolute", top: 10, right: 10,
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.9)", border: "1px solid #e5e5e5",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: liked ? "#e53e3e" : "var(--hl-text-mute)",
              transition: "color 150ms ease",
            }}
            aria-label="Favorilere ekle"
          >
            <Heart size={12} fill={liked ? "#e53e3e" : "none"} />
          </button>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(10,11,9,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                color: "var(--hl-text-mute)", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>Stokta Yok</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "0 2px" }}>
          <p style={{
            fontFamily: "var(--hl-font-ui)", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.12em", color: "var(--hl-text-mute)",
            textTransform: "uppercase", marginBottom: 5,
          }}>
            {product.categoryName ?? product.categorySlug.replace(/-/g, " ")}
          </p>

          <h3
            className="hl-card-name"
            style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(14px, 1.3vw, 18px)",
              fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)",
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "9px 0",
            background: "transparent",
            color: isOutOfStock ? "var(--hl-text-faint)" : "var(--hl-bronze-400)",
            border: `1px solid ${isOutOfStock ? "var(--hl-line)" : "var(--hl-bronze-700)"}`,
            borderRadius: 8,
            fontFamily: "var(--hl-font-ui)",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.05em",
            cursor: isOutOfStock ? "not-allowed" : "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            if (!isOutOfStock) {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = "var(--hl-bronze-700)";
              b.style.color = "var(--hl-bronze-100)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isOutOfStock) {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = "transparent";
              b.style.color = "var(--hl-bronze-400)";
            }
          }}
        >
          {added ? <Check size={13} /> : <ShoppingCart size={13} />}
          {isOutOfStock ? "Stokta Yok" : added ? "Eklendi" : "Sepete Ekle"}
        </button>
      </div>
    </div>
  );
}
