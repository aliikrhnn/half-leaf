"use client";

const DEFAULT_MESSAGES = [
  "2.500 ₺ ve üzeri siparişlerde ücretsiz kargo",
  "Özenle seçilmiş premium nargile koleksiyonu",
  "Aynı gün kargo · 14:00 öncesi siparişler",
  "256-bit SSL ile güvenli ödeme · PayTR 3D Secure",
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
      className="hl-announce fixed top-0 left-0 right-0 z-50 overflow-hidden flex items-center"
    >
      <div className="hl-marquee-track" aria-hidden="true">
        {ALL.map((msg, i) => (
          <span key={i} className="hl-announce-item inline-flex items-center gap-2 px-10">
            {msg}
            <span className="hl-announce-sep">·</span>
          </span>
        ))}
      </div>

      {/* Accessible static text (reduced-motion) */}
      <p className="sr-only">{MESSAGES[0]}</p>
    </div>
  );
}
