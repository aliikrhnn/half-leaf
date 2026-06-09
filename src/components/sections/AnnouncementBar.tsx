"use client";

const DEFAULT_MESSAGES = [
  "2.500 ₺ ve üzeri siparişlerde ücretsiz kargo",
  "El yapımı pirinç koleksiyon stoklarda",
  "Aynı gün kargo · 14:00 öncesi siparişler",
  "2 yıl pirinç garantisi · Ücretsiz değişim",
  "Hediye ambalajı · Ücretsiz ahşap kutu",
];

interface Props { messages?: string[]; }

export default function AnnouncementBar({ messages }: Props) {
  const MESSAGES = messages && messages.length > 0 ? messages : DEFAULT_MESSAGES;
  const ALL = [...MESSAGES, ...MESSAGES];

  return (
    <div
      role="marquee"
      aria-live="off"
      className="fixed top-0 left-0 right-0 z-50 overflow-hidden flex items-center"
      style={{
        height: "var(--hl-bar-h)",
        background: "var(--hl-olive-800)",
        borderBottom: "1px solid var(--hl-olive-700)",
      }}
    >
      <div className="hl-marquee-track" aria-hidden="true">
        {ALL.map((msg, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-10"
            style={{
              fontFamily: "var(--hl-font-ui)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--hl-bronze-100)",
            }}
          >
            {msg}
            <span style={{ color: "var(--hl-bronze-500)", opacity: 0.6 }}>·</span>
          </span>
        ))}
      </div>

      {/* Accessible static text (reduced-motion) */}
      <p className="sr-only">{MESSAGES[0]}</p>
    </div>
  );
}
