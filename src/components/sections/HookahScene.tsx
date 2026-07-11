import type { CSSProperties } from "react";
import LeafMark from "@/components/brand/LeafMark";

interface Props {
  /** false → hareket kısıtlı; sahne dondurulur. */
  animate: boolean;
}

/** Duman tütsüleri — çeşitlilik için elle ayarlı parametreler. */
const WISPS = [
  { size: 152, dx: 30, rot: 10, peak: 0.55, dur: 9, delay: 0, left: 50 },
  { size: 120, dx: -34, rot: -12, peak: 0.48, dur: 10.5, delay: 1.3, left: 46 },
  { size: 184, dx: 22, rot: 8, peak: 0.4, dur: 12, delay: 2.7, left: 55 },
  { size: 112, dx: -20, rot: -8, peak: 0.52, dur: 8.5, delay: 3.9, left: 48 },
  { size: 144, dx: 40, rot: 14, peak: 0.36, dur: 12.5, delay: 5.2, left: 53 },
  { size: 122, dx: -28, rot: -10, peak: 0.46, dur: 9.8, delay: 1.9, left: 47 },
  { size: 100, dx: 14, rot: 6, peak: 0.5, dur: 8, delay: 6.4, left: 51 },
] as const;

/** Yükselen marka yaprakları (kor + duman motifiyle uyumlu). */
const MOTES = [
  { dx: 30, rot: 26, dur: 9, delay: 1, size: 18, left: 52 },
  { dx: -28, rot: -22, dur: 11, delay: 3.8, size: 13, left: 47 },
  { dx: 16, rot: 18, dur: 10, delay: 6.4, size: 15, left: 51 },
] as const;

/**
 * Ana sayfa hero'su için sinematik, dumanlı nargile animasyonu.
 * Half Leaf yaprak ikonu hem korda (parlayan) hem de yükselen dumanda kullanılır.
 * Tamamen dekoratif → aria-hidden. Hareket, transform/opacity ile kompozitör dostu.
 */
export default function HookahScene({ animate }: Props) {
  return (
    <div className={`hl-hero-stage${animate ? "" : " hl-hero-stage--still"}`} aria-hidden>
      <div className="hl-hero-ambience" />

      <div className="hl-hookah-wrap">
        {/* Kor — bowl üstünde parlayan half leaf ikonu */}
        <div className="hl-ember">
          <span className="hl-ember-glow" />
          <LeafMark width={22} height={40} color="var(--hl-bronze-100)" />
        </div>

        {/* Duman */}
        <div className="hl-smoke">
          <span className="hl-smoke-column" />
          {WISPS.map((w, i) => (
            <span
              key={i}
              className="hl-smoke-wisp"
              style={
                {
                  width: w.size,
                  height: w.size,
                  left: `${w.left}%`,
                  "--dx": `${w.dx}px`,
                  "--rot": `${w.rot}deg`,
                  "--peak": w.peak,
                  animationDuration: `${w.dur}s`,
                  animationDelay: `${w.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* Duman içinde yükselen marka yaprakları */}
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="hl-leaf-mote"
            style={
              {
                left: `${m.left}%`,
                "--dx": `${m.dx}px`,
                "--rot": `${m.rot}deg`,
                animationDuration: `${m.dur}s`,
                animationDelay: `${m.delay}s`,
              } as CSSProperties
            }
          >
            <LeafMark width={m.size} height={m.size * 1.85} color="var(--hl-bronze-300)" />
          </span>
        ))}

        {/* Nargile silüeti */}
        <svg
          className="hl-hookah"
          viewBox="0 0 260 780"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hlBronze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E9D6B5" />
              <stop offset="0.5" stopColor="#B68950" />
              <stop offset="1" stopColor="#6E4B26" />
            </linearGradient>
            <radialGradient id="hlGlass" cx="0.42" cy="0.32" r="0.85">
              <stop offset="0" stopColor="#262A21" />
              <stop offset="1" stopColor="#0E100C" />
            </radialGradient>
            <linearGradient id="hlVase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2E3627" stopOpacity="0.9" />
              <stop offset="0.55" stopColor="#1A1E15" stopOpacity="0.94" />
              <stop offset="1" stopColor="#0C0E0A" />
            </linearGradient>
          </defs>

          <g
            stroke="url(#hlBronze)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {/* Hortum (marpuç) */}
            <path
              d="M142 372 C186 376 210 406 205 470 C201 522 180 546 168 566"
              stroke="url(#hlBronze)"
              strokeWidth="7"
              fill="none"
            />
            <rect
              x="159"
              y="555"
              width="19"
              height="13"
              rx="5"
              fill="url(#hlGlass)"
              transform="rotate(30 168 561)"
            />
            <ellipse cx="140" cy="373" rx="5" ry="6" fill="url(#hlGlass)" />

            {/* Vazo (şişe) */}
            <path
              d="M118 560 C112 585 74 600 72 655 C71 700 96 742 130 742 C164 742 189 700 188 655 C186 600 148 585 142 560 Z"
              fill="url(#hlVase)"
            />
            <path
              d="M95 598 C86 624 85 664 99 702"
              stroke="rgba(233,214,181,0.45)"
              strokeWidth="3"
              fill="none"
            />
            <ellipse cx="130" cy="748" rx="27" ry="7" fill="url(#hlGlass)" />
            <ellipse cx="130" cy="558" rx="13" ry="5" fill="url(#hlGlass)" />

            {/* Alt gövde + boncuklar */}
            <path d="M126 493 L134 493 L133 556 L127 556 Z" fill="url(#hlGlass)" />
            <ellipse cx="130" cy="482" rx="13" ry="12" fill="url(#hlGlass)" />
            <path d="M125 386 L135 386 L133 470 L127 470 Z" fill="url(#hlGlass)" />
            <ellipse cx="130" cy="374" rx="15" ry="14" fill="url(#hlGlass)" />

            {/* Tabla (plaka) + üst gövde */}
            <path d="M123 322 L137 322 L134 360 L126 360 Z" fill="url(#hlGlass)" />
            <ellipse cx="130" cy="320" rx="50" ry="9" fill="url(#hlGlass)" />

            {/* Lüle (bowl) */}
            <path d="M122 300 L138 300 L136 316 L124 316 Z" fill="url(#hlGlass)" />
            <path d="M104 252 L156 252 L145 300 L115 300 Z" fill="url(#hlGlass)" />
            <ellipse cx="130" cy="252" rx="27" ry="7" fill="url(#hlGlass)" />
            <ellipse
              cx="130"
              cy="252"
              rx="20"
              ry="4.5"
              stroke="rgba(233,214,181,0.4)"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
