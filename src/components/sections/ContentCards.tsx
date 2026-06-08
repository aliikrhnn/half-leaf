import Link from "next/link";

const CARDS = [
  {
    label: "01 / Rehber",
    title: "Nargile seçim rehberi",
    desc: "İlk kez mi alıyorsunuz? Model, boyut ve malzeme farkları — bilmeniz gereken her şey.",
    href: "/yardim/secim-rehberi",
    cta: "Devamını oku",
  },
  {
    label: "02 / Bakım",
    title: "Bakım & temizlik",
    desc: "Boru, lüle ve şişe temizliği için adım adım bakım rehberi. Uzun ömür için doğru teknikler.",
    href: "/yardim/bakim-temizlik",
    cta: "Devamını oku",
  },
  {
    label: "03 / Koleksiyon",
    title: "Öne çıkan koleksiyon",
    desc: "Editör seçkisi parçalar, özel seriler ve koleksiyonluk modeller.",
    href: "/urunler?oneCikan=1",
    cta: "Koleksiyonu Gör",
  },
];

export default function ContentCards() {
  return (
    <section
      className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
      style={{ paddingBottom: "7.5rem" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--hl-bg-elev-1)",
              border: "1px solid var(--hl-line)",
              borderRadius: 14,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Image placeholder */}
            <div
              className="hl-img-slot"
              style={{
                height: 280,
                background: "var(--hl-bg-elev-3)",
                flexShrink: 0,
              }}
            />

            {/* Content */}
            <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
              <div className="hl-eyebrow">{card.label}</div>
              <div
                className="hl-display"
                style={{
                  fontSize: 26,
                  marginTop: 8,
                  color: "var(--hl-text)",
                  lineHeight: 1.15,
                }}
              >
                {card.title}
              </div>
              <p
                style={{
                  fontFamily: "var(--hl-font-ui)",
                  fontSize: 13,
                  color: "var(--hl-text-mute)",
                  marginTop: 10,
                  lineHeight: 1.65,
                  flex: 1,
                }}
              >
                {card.desc}
              </p>
              <Link
                href={card.href}
                style={{
                  marginTop: 18,
                  color: "var(--hl-bronze-300)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--hl-font-ui)",
                  textDecoration: "none",
                  transition: "color 150ms ease",
                }}
              >
                {card.cta}
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14m-5-5 5 5-5 5" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
