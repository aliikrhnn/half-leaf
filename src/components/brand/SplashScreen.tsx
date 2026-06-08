"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HL_LOGO_PATH } from "./LeafMark";

// Split compound path into 19 individual subpaths (each M…Z segment)
const PATHS = (HL_LOGO_PATH.match(/M[\s\d.L]+Z/g) ?? []) as string[];

// [delay_s, duration_s, strokeWidth_svgUnits]
// Indices match HL_LOGO_PATH subpath order (see LeafMark.tsx for reference)
const CFG: [number, number, number][] = [
  [0.0,  1.4,  6], // [0]  leaf outer silhouette
  [0.8,  0.9,  6], // [1]  leaf inner counter
  [1.6,  0.25, 4], // [2]  H  (HALF)
  [1.3,  0.5,  4], // [3]  diagonal vein
  [2.3,  0.25, 4], // [4]  A  (LEAF)
  [1.75, 0.25, 4], // [5]  A  (HALF)
  [2.2,  0.25, 4], // [6]  E  (LEAF)
  [2.1,  0.25, 4], // [7]  L  (LEAF)
  [2.45, 0.25, 4], // [8]  F  (LEAF)
  [2.05, 0.25, 4], // [9]  F  (HALF)
  [1.9,  0.25, 4], // [10] L  (HALF)
  [1.2,  0.35, 3], // [11] row accents
  [1.1,  0.25, 3], // [12] small accent
  [2.45, 0.15, 3], // [13] A-dot (LEAF)
  [1.9,  0.15, 3], // [14] A-dot (HALF)
  [1.1,  0.25, 3], // [15] leaf detail
  [1.15, 0.25, 3], // [16] leaf detail
  [1.05, 0.25, 3], // [17] leaf detail
  [1.0,  0.25, 3], // [18] leaf detail
];

const DUST = [
  { l: "14%", t: "78%", d: "0.2s" },
  { l: "38%", t: "68%", d: "0.5s" },
  { l: "57%", t: "72%", d: "0.8s" },
  { l: "72%", t: "81%", d: "0.3s" },
  { l: "82%", t: "65%", d: "1.1s" },
  { l: "28%", t: "62%", d: "0.7s" },
  { l: "65%", t: "61%", d: "1.4s" },
];

export default function SplashScreen() {
  const pathname = usePathname();
  const [show, setShow]           = useState(false);
  const [exiting, setExiting]     = useState(false);
  const [reducedMotion, setRM]    = useState(false);
  const [fillVisible, setFillVis] = useState(false);
  const [strokeFading, setStrFad] = useState(false);
  const [drawReady, setDrawReady] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Mount guard — fires once; sets show=true which triggers the draw effect
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (sessionStorage.getItem("hl-splash")) return;
    sessionStorage.setItem("hl-splash", "1");

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser API not available during SSR, run once
    setRM(mq.matches);
    setShow(true);

    if (mq.matches) {
      const t1 = setTimeout(() => setExiting(true), 600);
      const t2 = setTimeout(() => setShow(false),   900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    const t1 = setTimeout(() => setFillVis(true),  2500);
    const t2 = setTimeout(() => setStrFad(true),   2700);
    const t3 = setTimeout(() => setExiting(true),  3700);
    const t4 = setTimeout(() => setShow(false),    4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount
  }, []);

  // Stroke-draw animations — runs after SVG is in the DOM (show flips to true)
  useEffect(() => {
    if (!show || reducedMotion || !svgRef.current) return;
    const nodes = svgRef.current.querySelectorAll<SVGPathElement>("[data-draw]");
    const anims: Animation[] = [];

    nodes.forEach((path) => {
      const i = parseInt(path.dataset.draw ?? "0", 10);
      const [del, dur] = CFG[i] ?? [0, 0.5, 3];
      const len = path.getTotalLength();
      path.style.strokeDasharray  = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      anims.push(
        path.animate(
          [{ strokeDashoffset: `${len}` }, { strokeDashoffset: "0" }],
          {
            duration: dur * 1000,
            delay:    del * 1000,
            fill:     "forwards",
            easing:   "cubic-bezier(0.4, 0, 0.2, 1)",
          }
        )
      );
    });

    setDrawReady(true);
    return () => anims.forEach((a) => a.cancel());
  }, [show, reducedMotion]);

  if (!show) return null;

  const a = !reducedMotion;

  return (
    <div
      className={`hl-splash${exiting ? " hl-splash-exit" : ""}`}
      aria-hidden="true"
      role="presentation"
    >
      {/* Ambient background glow */}
      <div className="hl-s1-bg" />

      {/* Radial halo behind logo */}
      <div className="hl-s1-halo" />

      {/* Floating dust particles */}
      {a && DUST.map((pt, i) => (
        <span
          key={i}
          className="hl-s1-dust"
          style={{ left: pt.l, top: pt.t, animationDelay: pt.d }}
        />
      ))}

      {/* Logo — static wrapper, animation handled inside SVG */}
      <div className="hl-s1-logo" style={{ animation: "none", opacity: 1 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 835 687"
          aria-label="Half Leaf"
          role="img"
          className="hl-s1-logo-img"
        >
          {/* Layer 1: filled logo — fades in after drawing completes */}
          <path
            d={HL_LOGO_PATH}
            fillRule="evenodd"
            fill="var(--hl-bronze-400)"
            style={{
              opacity: !a || fillVisible ? 1 : 0,
              transition: a && fillVisible ? "opacity 800ms ease-out" : "none",
            }}
          />

          {/* Layer 2: stroke-draw — 19 individual paths drawn sequentially */}
          {a && (
            <g
              fill="none"
              stroke="var(--hl-bronze-400)"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                visibility: drawReady ? "visible" : "hidden",
                opacity: strokeFading ? 0 : 1,
                transition: strokeFading ? "opacity 600ms ease-in" : "none",
                filter: strokeFading
                  ? "none"
                  : "drop-shadow(0 0 5px rgba(201,160,106,0.6))",
              }}
            >
              {PATHS.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  strokeWidth={CFG[i]?.[2] ?? 3}
                  data-draw={String(i)}
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Lens-flare streak — delayed to appear after logo draw completes */}
      {a && (
        <div className="hl-s1-flare" style={{ animationDelay: "3.3s" }}>
          <div className="hl-s1-flare-orb" style={{ animationDelay: "3.3s" }} />
        </div>
      )}

      {/* Progress bar */}
      <div className="hl-progress-track">
        <div
          className="hl-progress-bar"
          style={a ? { animationDuration: "3.7s" } : {}}
        />
      </div>
    </div>
  );
}
