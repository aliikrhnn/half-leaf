/**
 * Ödeme sayfası iskeleti.
 *
 * Bu sayfa sunucuda PayTR'dan token alırken (ağ isteği) render'ı bekletiyor.
 * `loading.tsx` olmadan tarayıcı bu süre boyunca ÖNCEKİ sayfada donuyor,
 * kullanıcıya hiçbir geri bildirim verilmiyordu — "ödeme formu geç geliyor"
 * şikâyetinin görünen yüzü buydu. Artık yönlendirme anında bu iskelet çiziliyor.
 */
export default function Loading() {
  return (
    <div
      style={{
        background: "var(--hl-bg)",
        minHeight: "100vh",
        color: "var(--hl-text)",
        fontFamily: "var(--hl-font-ui)",
      }}
    >
      <div
        style={{
          padding: "16px 40px",
          borderBottom: "1px solid var(--hl-line)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--hl-bronze-400)",
        }}
      >
        Half Leaf
      </div>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 64px" }}>
        <div
          style={{
            height: 68,
            borderRadius: 12,
            background: "var(--hl-bg-elev-1)",
            border: "1px solid var(--hl-line)",
            marginBottom: 18,
          }}
          className="hl-skeleton"
        />
        <div
          style={{
            minHeight: 520,
            borderRadius: 14,
            background: "var(--hl-bg-elev-1)",
            border: "1px solid var(--hl-line)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "3px solid var(--hl-line-strong)",
              borderTopColor: "var(--hl-bronze-400)",
              animation: "hl-spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>
            Güvenli ödeme formu hazırlanıyor…
          </p>
        </div>
      </main>
    </div>
  );
}
