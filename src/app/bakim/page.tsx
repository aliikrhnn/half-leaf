import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

export default function BakimPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--hl-bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "var(--hl-font-ui)",
      textAlign: "center",
    }}>
      <div style={{ marginBottom: 32 }}>
        <HalfLeafLogo full width={90} height={74} />
      </div>

      <div style={{
        width: 48,
        height: 1,
        background: "var(--hl-bronze-400)",
        margin: "0 auto 32px",
        opacity: 0.5,
      }} />

      <p style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--hl-bronze-400)",
        marginBottom: 16,
      }}>
        Bakım Modu
      </p>

      <h1 style={{
        fontFamily: "var(--hl-font-display)",
        fontSize: "clamp(28px, 5vw, 48px)",
        fontWeight: 400,
        fontStyle: "normal",
        color: "var(--hl-text)",
        lineHeight: 1.15,
        margin: "0 0 18px",
        maxWidth: 520,
      }}>
        Kısa süreliğine bakımdayız
      </h1>

      <p style={{
        fontSize: 14,
        color: "var(--hl-text-mute)",
        lineHeight: 1.7,
        maxWidth: 400,
        marginBottom: 40,
      }}>
        Siteyi sizin için daha iyi hale getiriyoruz.
        En kısa sürede geri döneceğiz.
      </p>

      <div style={{
        padding: "12px 24px",
        borderRadius: "var(--hl-r-pill)",
        border: "1px solid var(--hl-line-strong)",
        fontSize: 12,
        color: "var(--hl-text-faint)",
        letterSpacing: "0.06em",
      }}>
        halfleafstore.com
      </div>
    </div>
  );
}
