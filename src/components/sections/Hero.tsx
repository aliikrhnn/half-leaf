"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import HookahScene from "./HookahScene";

export interface HeroSlideData {
  id:          string;
  title:       string;
  subtitle:    string | null;
  eyebrow:     string | null;
  ctaLabel:    string;
  ctaHref:     string;
  image:       string | null;
  mobileImage: string | null;
}

const AUTO_MS = 6500;

/** Slayt yoksa hero yine de animasyonlu sahneyle görünsün. */
const DEFAULT_SLIDE: HeroSlideData = {
  id: "hl-default",
  eyebrow: "Half Leaf",
  title: "Dumanın ardındaki zanaat",
  subtitle: "Özenle seçilmiş premium nargile takımları, lüleler ve aksesuarlar.",
  ctaLabel: "Koleksiyonu Keşfet",
  ctaHref: "/urunler",
  image: null,
  mobileImage: null,
};

interface Props { slides: HeroSlideData[]; }

export default function Hero({ slides }: Props) {
  const data = slides.length > 0 ? slides : [DEFAULT_SLIDE];

  const [idx,           setIdx]   = useState(0);
  const [enterCount,    setEnter] = useState(0);
  const [paused,        setPaused] = useState(false);
  const [reducedMotion, setRM]    = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchX   = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- matchMedia not available during SSR, must read in effect
    setRM(mq.matches);
    const cb = (e: MediaQueryListEvent) => setRM(e.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  const count  = data.length;
  const goNext = useCallback(() => { setIdx(i => (i + 1) % count); setEnter(c => c + 1); }, [count]);
  const goPrev = useCallback(() => { setIdx(i => (i - 1 + count) % count); setEnter(c => c + 1); }, [count]);
  const goTo   = useCallback((n: number) => { setIdx(n); setEnter(c => c + 1); }, []);

  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;
    timerRef.current = setTimeout(goNext, AUTO_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, paused, reducedMotion, goNext, count]);

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 44) return;
    setPaused(true);
    if (dx < 0) goNext(); else goPrev();
  };

  const cur = data[idx];

  return (
    <section
      aria-label="Ana sayfa tanıtımı"
      aria-roledescription="carousel"
      className="hl-hero-section"
      style={{ position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Animasyonlu dumanlı nargile sahnesi (dekoratif arka plan) ── */}
      <HookahScene animate={!reducedMotion} />

      {/* ── Sinematik scrim (okunabilirlik + derinlik) ── */}
      <div aria-hidden className="hl-hero-scrim" />

      {/* ── İçerik (aktif slayt metni) ── */}
      {/* Otomatik dönerken canlı bölge kapalı (SR'ı rahatsız etmesin); duraklayınca/tek slaytta açık. */}
      <div className="hl-hero-content" aria-live={paused || reducedMotion || count < 2 ? "polite" : "off"} aria-atomic="true">
        <div
          key={`hero-text-${enterCount}`}
          style={{ animation: reducedMotion ? "none" : "hl-hero-text-enter 700ms cubic-bezier(0.22,0.61,0.36,1) both" }}
        >
          {cur.eyebrow && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <span aria-hidden style={{ width: 38, height: 1, background: "var(--hl-bronze-400)", flexShrink: 0 }} />
              <span className="hl-eyebrow" style={{ color: "var(--hl-bronze-300)", letterSpacing: "0.16em" }}>
                {cur.eyebrow}
              </span>
            </div>
          )}

          <h1 className="hl-display hl-hero-title">{cur.title}</h1>

          {cur.subtitle && <p className="hl-hero-subtitle">{cur.subtitle}</p>}

          <div className="hl-hero-ctas">
            <Link href={cur.ctaHref} className="hl-hero-cta">
              {cur.ctaLabel}
              <svg className="hl-hero-cta-arrow" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
            {cur.ctaHref !== "/urunler" && (
              <Link href="/urunler" className="hl-hero-ghost">Tüm Koleksiyon</Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Alt kontrol çubuğu ── */}
      <div className="hl-hero-bar">
        <div className="hl-hero-bar-left">
          <span className="hl-hero-counter">
            <span style={{ color: "var(--hl-bronze-400)", fontWeight: 700 }}>{String(idx + 1).padStart(2, "0")}</span>
            <span style={{ opacity: 0.4 }}> / {String(count).padStart(2, "0")}</span>
          </span>
          {count > 1 && (
            <div role="group" aria-label="Slayt seçici" style={{ display: "flex", gap: 7 }}>
              {data.map((s, i) => (
                <button
                  key={s.id}
                  aria-label={`Slayt ${i + 1}`}
                  aria-current={i === idx ? "true" : undefined}
                  onClick={() => { setPaused(true); goTo(i); }}
                  className="hl-hero-dot"
                  style={{
                    width: i === idx ? 26 : 7,
                    background: i === idx ? "var(--hl-bronze-400)" : "rgba(236,234,226,0.32)",
                    transition: reducedMotion ? "none" : "width 320ms var(--hl-ease), background 320ms ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {count > 1 && (
          <div className="hl-hero-bar-arrows">
            <button onClick={() => { setPaused(true); goPrev(); }} aria-label="Önceki slayt" className="hl-hero-arrow">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button onClick={() => { setPaused(true); goNext(); }} aria-label="Sonraki slayt" className="hl-hero-arrow">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── İnce ilerleme çizgisi ── */}
      {!paused && !reducedMotion && count > 1 && (
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(182,137,80,0.10)", zIndex: 3 }}>
          <div key={`pb-${idx}`} style={{ height: "100%", background: "var(--hl-bronze-400)", width: "0%", animation: `hl-progress ${AUTO_MS}ms linear forwards` }} />
        </div>
      )}
    </section>
  );
}
