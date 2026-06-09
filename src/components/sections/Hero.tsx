"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export interface HeroSlideData {
  id:       string;
  title:    string;
  subtitle: string | null;
  eyebrow:  string | null;
  ctaLabel: string;
  ctaHref:  string;
  image:    string | null;
}

const AUTO_MS = 6000;

interface Props { slides: HeroSlideData[]; }

export default function Hero({ slides }: Props) {
  const [idx,          setIdx]    = useState(0);
  const [enterCount,   setEnter]  = useState(0);
  const [paused,       setPaused] = useState(false);
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

  const count = slides.length;
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
    if (dx < 0) { goNext(); } else { goPrev(); }
  };

  if (count === 0) return null;

  return (
    <section
      aria-label="Ana sayfa slayt gösterisi"
      aria-roledescription="carousel"
      className="hl-hero-section"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide stack */}
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
                transition: reducedMotion ? "none" : "opacity 800ms cubic-bezier(0.22,0.61,0.36,1)",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              {/* Background image */}
              <div aria-hidden style={{ position: "absolute", inset: 0 }}>
                {s.image ? (
                  <Image
                    src={s.image}
                    alt=""
                    fill
                    priority={i === 0}
                    style={{ objectFit: "cover" }}
                    className={`hl-hero-img${!reducedMotion && active ? " hero-ken-burns" : ""}`}
                    sizes="100vw"
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(80% 70% at 65% 40%, rgba(110,122,85,0.10), transparent 60%)," +
                        "radial-gradient(50% 50% at 20% 70%, rgba(182,137,80,0.07), transparent 50%)," +
                        "var(--hl-bg)",
                    }}
                  />
                )}
              </div>

              {/* Gradient overlay — left vignette + bottom lift */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to right, rgba(10,10,8,0.78) 0%, rgba(10,10,8,0.48) 45%, rgba(10,10,8,0.08) 100%)," +
                    "linear-gradient(to top, rgba(10,10,8,0.72) 0%, rgba(10,10,8,0.18) 45%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Text block */}
              <div
                className="hl-hero-text-block"
                style={{
                  position: "absolute",
                  bottom: "clamp(80px, 12vh, 130px)",
                  left: "clamp(20px, 8vw, 100px)",
                  maxWidth: 640,
                }}
              >
                <div
                  key={active ? `text-${enterCount}` : `text-idle-${i}`}
                  style={{
                    animation: active && !reducedMotion
                      ? "hl-hero-text-enter 700ms cubic-bezier(0.22,0.61,0.36,1) both"
                      : "none",
                  }}
                >
                  {s.eyebrow && (
                    <div
                      className="hl-eyebrow"
                      style={{ marginBottom: 16, color: "var(--hl-bronze-300)", letterSpacing: "0.14em" }}
                    >
                      {s.eyebrow}
                    </div>
                  )}

                  <h1
                    className="hl-display"
                    style={{
                      fontSize: "clamp(44px, 6vw, 100px)",
                      lineHeight: 1.0,
                      letterSpacing: "-0.03em",
                      fontWeight: 400,
                      margin: 0,
                      color: "#ECEAE2",
                      fontStyle: "italic",
                    }}
                  >
                    {s.title}
                  </h1>

                  {s.subtitle && (
                    <p
                      style={{
                        marginTop: 16,
                        fontSize: "clamp(14px, 1.1vw, 16px)",
                        lineHeight: 1.75,
                        color: "rgba(236,234,226,0.70)",
                        maxWidth: 480,
                        fontFamily: "var(--hl-font-ui)",
                      }}
                    >
                      {s.subtitle}
                    </p>
                  )}

                  <div style={{ marginTop: 28 }}>
                    <Link href={s.ctaHref}>
                      <HLButton>{s.ctaLabel}</HLButton>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows — desktop only (mobile uses touch swipe) */}
      {count > 1 && (
        <div className="hidden lg:contents">
          <button
            onClick={() => { setPaused(true); goPrev(); }}
            aria-label="Önceki slayt"
            style={arrowStyle("left")}
            onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, arrowHover)}
            onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, arrowStyle("left"))}
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => { setPaused(true); goNext(); }}
            aria-label="Sonraki slayt"
            style={arrowStyle("right")}
            onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, arrowHover)}
            onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, arrowStyle("right"))}
          >
            <ChevronRight />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "clamp(20px, 8vw, 100px)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--hl-font-ui)",
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "rgba(236,234,226,0.45)",
          }}
        >
          <span style={{ color: "var(--hl-bronze-400)", fontWeight: 600 }}>
            {String(idx + 1).padStart(2, "0")}
          </span>
          {" / "}
          {String(count).padStart(2, "0")}
        </span>

        {count > 1 && (
          <div role="tablist" aria-label="Slayt göstergeleri" style={{ display: "flex", gap: 6 }}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === idx}
                aria-label={`Slayt ${i + 1}`}
                onClick={() => { setPaused(true); goTo(i); }}
                style={{
                  width: i === idx ? 24 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background: i === idx ? "var(--hl-bronze-400)" : "rgba(182,137,80,0.3)",
                  transition: reducedMotion ? "none" : "width 300ms var(--hl-ease), background 300ms ease",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!paused && !reducedMotion && count > 1 && (
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(182,137,80,0.08)" }}>
          <div
            key={`pb-${idx}`}
            style={{
              height: "100%",
              background: "var(--hl-bronze-400)",
              width: "0%",
              animation: `hl-progress ${AUTO_MS}ms linear forwards`,
            }}
          />
        </div>
      )}
    </section>
  );
}

/* ─── Arrow styles ─── */
const arrowBase: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 10,
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(10,10,8,0.5)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: "rgba(236,234,226,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "border-color 200ms ease, background 200ms ease",
};
const arrowHover: React.CSSProperties = {
  borderColor: "rgba(182,137,80,0.5)",
  background: "rgba(182,137,80,0.15)",
};
function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return { ...arrowBase, [side]: "clamp(8px, 2vw, 24px)" };
}

function ChevronLeft() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function HLButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      style={{
        padding: "16px 28px",
        fontSize: 13,
        background: "linear-gradient(180deg, var(--hl-bronze-400) 0%, var(--hl-bronze-500) 60%, var(--hl-bronze-700) 100%)",
        color: "#1A1206",
        border: "none",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 24px -10px rgba(182,137,80,0.5)",
        fontFamily: "var(--hl-font-ui)",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: "var(--hl-r-sm)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        transition: "all 200ms var(--hl-ease)",
      }}
    >
      {children}
    </button>
  );
}
