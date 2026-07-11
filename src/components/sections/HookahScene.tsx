import LeafMark from "@/components/brand/LeafMark";
import SmokeCanvas from "./SmokeCanvas";

interface Props {
  /** false → hareket kısıtlı; sahne dondurulur. */
  animate: boolean;
}

/**
 * Ana sayfa hero'su: nargile + gerçekçi canlı duman (canvas). Half Leaf yaprak
 * ikonu, lülenin üstünde parlayan kor olarak marka dokunuşunu verir.
 * Tamamen dekoratif → aria-hidden.
 */
export default function HookahScene({ animate }: Props) {
  return (
    <div className="hl-hero-stage" aria-hidden>
      <div className="hl-hero-ambience" />

      {/* Gerçekçi duman (nargile lülesinden; kaydırıldıkça aşağı akar) */}
      <SmokeCanvas active={animate} />

      <div className="hl-hookah-wrap">
        {/* Kor — lülenin üstünde parlayan half leaf ikonu */}
        <div className="hl-ember">
          <span className="hl-ember-glow" />
          <LeafMark width={22} height={40} color="var(--hl-bronze-100)" />
        </div>

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
