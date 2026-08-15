/**
 * Ürün listesi iskeleti — Suspense fallback'i.
 * Önceden çıplak "Yükleniyor…" metni gösteriliyordu; iskelet, sayfanın
 * yerleşimini önden çizdiği için hem beklemeyi kısa hissettirir hem de
 * içerik gelince layout kaymasını (CLS) azaltır.
 */
export default function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div
      className="hl-page-pad hl-page-shell"
      style={{
        paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 32px)",
        paddingBottom: 80,
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Ürünler yükleniyor…</span>

      <div className="hl-skel hl-skel-line" style={{ width: 180, height: 12, marginBottom: 20 }} />
      <div className="hl-skel hl-skel-line" style={{ width: "min(420px, 70%)", height: 40, marginBottom: 12 }} />
      <div className="hl-skel hl-skel-line" style={{ width: "min(280px, 50%)", height: 14, marginBottom: 36 }} />

      <div className="hl-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <div className="hl-skel" style={{ aspectRatio: "1/1", borderRadius: "var(--hl-r-md)", marginBottom: 12 }} />
            <div className="hl-skel hl-skel-line" style={{ width: "45%", height: 9, marginBottom: 8 }} />
            <div className="hl-skel hl-skel-line" style={{ width: "80%", height: 16, marginBottom: 10 }} />
            <div className="hl-skel hl-skel-line" style={{ width: "35%", height: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
