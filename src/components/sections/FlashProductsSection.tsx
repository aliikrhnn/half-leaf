"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Timer } from "lucide-react";
import type { Product } from "@/lib/types";

/* ─── countdown ─────────────────────────────────────────── */
function getCountdownTarget(): Date {
  const now = Date.now();
  const threeH = 3 * 60 * 60 * 1000;
  return new Date(Math.ceil(now / threeH) * threeH);
}

function useCountdown(target: Date) {
  // rem starts at 0 on both server and client — no Date.now() in initial state
  const [mounted, setMounted] = useState(false);
  const [rem, setRem] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: timer is client-only
    setMounted(true);
    setRem(Math.max(0, target.getTime() - Date.now()));
    const id = setInterval(() => setRem(Math.max(0, target.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) return { h: "--", m: "--", s: "--" };
  const h = String(Math.floor(rem / 3600000)).padStart(2, "0");
  const m = String(Math.floor((rem % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((rem % 60000) / 1000)).padStart(2, "0");
  return { h, m, s };
}

/* ─── ProductCard (compact, marquee variant) ─────────────── */
function FlashCard({ product }: { product: Product }) {
  const img = product.images?.[0];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0;

  return (
    <Link
      href={`/urunler/${product.slug}`}
      style={{
        display: "block",
        width: 212,
        flexShrink: 0,
        background: "var(--hl-bg-elev-2)",
        border: "1px solid var(--hl-line)",
        borderRadius: 12,
        overflow: "hidden",
        textDecoration: "none",
        transition: "border-color 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--hl-bronze-500)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--hl-line)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--hl-bg-elev-1)" }}>
        {img ? (
          <Image
            src={img.url}
            alt={img.alt || product.name}
            fill
            style={{ objectFit: "contain", padding: 12 }}
            sizes="212px"
          />
        ) : (
          <div className="hl-img-slot" style={{ position: "absolute", inset: 0, borderRadius: 0 }}>
            <span style={{ fontSize: 10, opacity: 0.4 }}>{product.name}</span>
          </div>
        )}
        {hasDiscount && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "var(--hl-bronze-400)",
              color: "#1A1206",
              fontFamily: "var(--hl-font-ui)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <p
          style={{
            fontFamily: "var(--hl-font-ui)",
            fontSize: 12,
            color: "var(--hl-text-soft)",
            margin: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {product.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <span
            style={{
              fontFamily: "var(--hl-font-ui)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--hl-bronze-300)",
            }}
          >
            {product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
          </span>
          {hasDiscount && (
            <span
              style={{
                fontFamily: "var(--hl-font-ui)",
                fontSize: 11,
                color: "var(--hl-text-faint)",
                textDecoration: "line-through",
              }}
            >
              {product.compareAtPrice!.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── section ────────────────────────────────────────────── */
interface Props { products: Product[]; }

export default function FlashProductsSection({ products }: Props) {
  const [target] = useState(() => getCountdownTarget());
  const { h, m, s } = useCountdown(target);
  const [reducedMotion, setRM] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser API not available during SSR
    setRM(mq.matches);
    const cb = (e: MediaQueryListEvent) => setRM(e.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  if (products.length === 0) return null;

  const items = products.slice(0, 12);

  return (
    <section
      style={{
        background: "var(--hl-olive-800)",
        borderTop: "1px solid var(--hl-line)",
        borderBottom: "1px solid var(--hl-line)",
        paddingTop: "3.5rem",
        paddingBottom: "3.5rem",
      }}
    >
      {/* Header */}
      <div
        className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div className="hl-eyebrow" style={{ marginBottom: 4 }}>Sınırlı Süreli Fırsatlar</div>
            <h2
              className="hl-display"
              style={{
                fontSize: "clamp(24px, 3vw, 40px)",
                margin: 0,
                letterSpacing: "-0.02em",
                fontWeight: 400,
                color: "var(--hl-text)",
                lineHeight: 1.1,
              }}
            >
              Flaş Ürünler
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "var(--hl-bg-elev-3)",
              border: "1px solid var(--hl-line-bronze)",
              borderRadius: 999,
              padding: "6px 14px",
              flexShrink: 0,
            }}
          >
            <Timer size={13} style={{ color: "var(--hl-bronze-400)", flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "var(--hl-font-mono)",
                fontSize: "clamp(14px, 1.6vw, 18px)",
                fontWeight: 700,
                color: "var(--hl-bronze-300)",
                letterSpacing: "0.06em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {h}<span style={{ color: "var(--hl-text-mute)", margin: "0 1px" }}>:</span>
              {m}<span style={{ color: "var(--hl-text-mute)", margin: "0 1px" }}>:</span>
              {s}
            </span>
          </div>
        </div>

        <Link
          href="/urunler?indirim=1"
          style={{
            fontFamily: "var(--hl-font-ui)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--hl-bronze-400)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            transition: "color 150ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--hl-bronze-300)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--hl-bronze-400)"; }}
        >
          Tümünü Gör
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </Link>
      </div>

      {/* Bronze rule */}
      <div
        className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
        style={{ marginBottom: 20 }}
      >
        <div className="hl-rule-bronze" />
      </div>

      {/* Marquee strip */}
      {reducedMotion ? (
        /* Reduced motion: static horizontal scroll */
        <div
          ref={trackRef}
          style={{
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            paddingLeft: "clamp(16px, 5vw, 56px)",
            paddingRight: "clamp(16px, 5vw, 56px)",
            paddingBottom: 8,
          }}
        >
          <div style={{ display: "flex", gap: 12, width: "max-content" }}>
            {items.map(p => (
              <div key={p.id} style={{ scrollSnapAlign: "start" }}>
                <FlashCard product={p} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Animated marquee */
        <div
          style={{ overflow: "hidden", position: "relative" }}
          onMouseEnter={() => {
            if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
          }}
          onMouseLeave={() => {
            if (trackRef.current) trackRef.current.style.animationPlayState = "running";
          }}
        >
          {/* Left / right fade masks */}
          <div aria-hidden style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 80,
            background: "linear-gradient(to right, var(--hl-olive-800), transparent)",
            zIndex: 2, pointerEvents: "none",
          }} />
          <div aria-hidden style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 80,
            background: "linear-gradient(to left, var(--hl-olive-800), transparent)",
            zIndex: 2, pointerEvents: "none",
          }} />

          <div
            ref={trackRef}
            style={{
              display: "flex",
              gap: 12,
              width: "max-content",
              animation: `hl-marquee ${items.length * 4}s linear infinite`,
              paddingLeft: 12,
            }}
          >
            {/* Duplicate for seamless loop */}
            {[...items, ...items].map((p, i) => (
              <FlashCard key={`${p.id}-${i}`} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
