"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

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

interface Props { slides: HeroSlideData[]; }

export default function Hero({ slides }: Props) {
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

  const count  = slides.length;
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

  if (count === 0) return null;
  const cur = slides[idx];

  return (
    <section
      aria-label="Ana sayfa slayt gösterisi"
      aria-roledescription="carousel"
      className="hl-hero-section"
      style={{ position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Slide stack (images crossfade) ── */}
      <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", inset: 0 }}>
        {slides.map((s, i) => {
          const active = i === idx;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slayt ${i + 1} / ${count}`}
              aria-hidden={!active}
              style={{
                position: "absolute",
                inset: 0,
                opacity: active ? 1 : 0,
                transition: reducedMotion ? "none" : "opacity 900ms cubic-bezier(0.22,0.61,0.36,1)",
              }}
            >
              <div aria-hidden style={{ position: "absolute", inset: 0 }}>
                {s.image || s.mobileImage ? (
                  <>
                    <Image
                      src={s.image ?? s.mobileImage!}
                      alt=""
                      fill
                      priority={i === 0}
                      style={{ objectFit: "cover" }}
                      className={`hl-hero-img${s.mobileImage ? " hidden sm:block" : ""}${!reducedMotion && active ? " hero-ken-burns" : ""}`}
                      sizes="100vw"
                    />
                    {s.mobileImage && (
                      <Image
                        src={s.mobileImage}
                        alt=""
                        fill
                        priority={i === 0}
                        style={{ objectFit: "cover" }}
                        className={`hl-hero-img block sm:hidden${!reducedMotion && active ? " hero-ken-burns" : ""}`}
                        sizes="100vw"
                      />
                    )}
                  </>
                ) : (
                  <div style={{
                    position: "absolute", inset: 0,
                    background:
                      "radial-gradient(80% 70% at 65% 40%, rgba(110,122,85,0.10), transparent 60%)," +
                      "radial-gradient(50% 50% at 20% 70%, rgba(182,137,80,0.07), transparent 50%)," +
                      "var(--hl-bg)",
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Cinematic scrim (okunabilirlik + derinlik) ── */}
      <div aria-hidden className="hl-hero-scrim" />

      {/* ── Content (aktif slayt) ── */}
      <div className="hl-hero-content">
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
            <div role="tablist" aria-label="Slayt göstergeleri" style={{ display: "flex", gap: 7 }}>
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Slayt ${i + 1}`}
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
