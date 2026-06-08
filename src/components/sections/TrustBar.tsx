const ITEMS = [
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
      </svg>
    ),
    title: "Aynı Gün Kargo",
    sub: "14:00 öncesi siparişler",
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z"/>
      </svg>
    ),
    title: "2 Yıl Garanti",
    sub: "Tüm pirinç parçalar",
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 7 12 3l9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>
      </svg>
    ),
    title: "Hediye Ambalajı",
    sub: "Ücretsiz · ahşap kutu",
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 19c0-9 6-14 14-14 0 9-5 14-14 14Z"/><path d="M5 19 14 10"/>
      </svg>
    ),
    title: "Sürdürülebilir",
    sub: "Geri dönüştürülebilir paket",
  },
];

export default function TrustBar() {
  return (
    <section
      className="max-w-[1440px] mx-auto px-4 sm:px-10 xl:px-14"
      style={{
        paddingTop: 48,
        paddingBottom: 48,
        borderTop: "1px solid var(--hl-line)",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            style={{ display: "flex", gap: 14, alignItems: "center" }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "var(--hl-olive-800)",
                border: "1px solid var(--hl-olive-700)",
                display: "grid",
                placeItems: "center",
                color: "var(--hl-bronze-300)",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--hl-text)",
                  fontFamily: "var(--hl-font-ui)",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--hl-text-mute)",
                  fontFamily: "var(--hl-font-ui)",
                  marginTop: 2,
                }}
              >
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
