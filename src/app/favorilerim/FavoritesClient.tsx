"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist";
import { formatPrice } from "@/lib/utils";

export default function FavoritesClient() {
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: must run after SSR mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div style={{ minHeight: "60vh", padding: "calc(var(--hl-bar-h) + var(--hl-header-h) + 40px) 24px", fontFamily: "var(--hl-font-ui)", color: "var(--hl-text-mute)", fontSize: 13 }}>
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="hl-page-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "calc(var(--hl-bar-h) + var(--hl-header-h) + 40px) 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <Heart size={20} color="#e53e3e" fill="#e53e3e" />
        <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)", margin: 0 }}>
          Favorilerim
        </h1>
        <span style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>({items.length})</span>
      </div>

      {items.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "64px 24px", textAlign: "center" }}>
          <Heart size={48} style={{ color: "var(--hl-text-faint)" }} />
          <p style={{ fontSize: 14, color: "var(--hl-text-mute)" }}>Henüz favori ürününüz yok.</p>
          <Link href="/urunler" style={{ padding: "11px 28px", borderRadius: "var(--hl-r-pill)", background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--hl-font-ui)" }}>
            Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: "relative", display: "flex", flexDirection: "column" }}>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Favorilerden çıkar"
                style={{ position: "absolute", top: 8, right: 8, zIndex: 2, width: 28, height: 28, borderRadius: "50%", background: "rgba(10,11,9,0.6)", border: "1px solid var(--hl-line-strong)", color: "var(--hl-text-soft)", display: "grid", placeItems: "center", cursor: "pointer" }}
              >
                <X size={13} />
              </button>
              <Link href={`/urunler/${item.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: "var(--hl-r-md)", overflow: "hidden", background: "var(--hl-bg-elev-1)", marginBottom: 10 }}>
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width:640px) 50vw, 200px" />
                  )}
                </div>
                <div style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, fontWeight: 600, color: "var(--hl-text)", marginBottom: 4, lineHeight: 1.35 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-bronze-400)" }}>{formatPrice(item.price)}</div>
              </Link>
              <Link
                href={`/urunler/${item.slug}`}
                style={{ marginTop: 10, padding: "8px 0", width: "100%", borderRadius: 8, background: "transparent", border: "1px solid var(--hl-bronze-700)", color: "var(--hl-bronze-400)", fontFamily: "var(--hl-font-ui)", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", cursor: "pointer", textAlign: "center", textDecoration: "none" }}
              >
                Ürünü İncele
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
