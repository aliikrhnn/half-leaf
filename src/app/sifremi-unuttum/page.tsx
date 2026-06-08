import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

export const metadata: Metadata = { title: "Şifremi Unuttum" };

export default function SifremiUnuttumPage() {
  return (
    <div style={{
      background: "var(--hl-bg)", minHeight: "100vh", color: "var(--hl-text)",
      fontFamily: "var(--hl-font-ui)", display: "flex", flexDirection: "column",
    }}>
      <header style={{
        padding: "18px 40px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid var(--hl-line)",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <HalfLeafLogo width={13} height={22} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)" }}>Half Leaf</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--hl-text-soft)", fontSize: 11 }}>
          <Lock size={12} /> Güvenli
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(182,137,80,0.1)", border: "1px solid rgba(182,137,80,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <Mail size={28} color="var(--hl-bronze-400)" />
          </div>

          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 10,
          }}>
            Şifre Sıfırlama
          </p>
          <h1 style={{
            fontFamily: "var(--hl-font-display)",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 400, fontStyle: "italic",
            color: "var(--hl-text)", lineHeight: 1.1, margin: "0 0 16px",
          }}>
            Şifremi unuttum
          </h1>
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 32, maxWidth: 360, margin: "0 auto 32px" }}>
            Bu özellik yakında kullanıma açılacak. Şimdilik müşteri hizmetlerimizle iletişime geçebilirsiniz.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/giris" style={{
              padding: "12px 28px", borderRadius: "var(--hl-r-pill)",
              background: "var(--hl-bronze-400)", color: "#0A0B09",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", textDecoration: "none",
            }}>
              Giriş Sayfasına Dön
            </Link>
            <Link href="/iletisim" style={{
              padding: "12px 28px", borderRadius: "var(--hl-r-pill)",
              border: "1.5px solid var(--hl-line-strong)", background: "none",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", textDecoration: "none", color: "var(--hl-text-soft)",
            }}>
              İletişim
            </Link>
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: "1px solid var(--hl-line)", padding: "14px 40px",
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "var(--hl-text-mute)",
      }}>
        <span>© {new Date().getFullYear()} Half Leaf</span>
        <Link href="/iletisim" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>İletişim</Link>
      </footer>
    </div>
  );
}
