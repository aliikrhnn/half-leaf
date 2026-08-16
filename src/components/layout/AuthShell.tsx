import Link from "next/link";
import { Lock } from "lucide-react";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

/**
 * Giriş/kayıt/şifre sıfırlama sayfalarının ortak kabuğu.
 * (Bu rotalar AppShell dışında kaldığı için kendi header/footer'larını taşır.)
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--hl-bg)", minHeight: "100vh", color: "var(--hl-text)",
      fontFamily: "var(--hl-font-ui)", display: "flex", flexDirection: "column",
    }}>
      <header style={{
        padding: "18px clamp(20px, 5vw, 40px)", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--hl-line)",
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
        {children}
      </main>

      <footer style={{
        borderTop: "1px solid var(--hl-line)", padding: "14px clamp(20px, 5vw, 40px)",
        display: "flex", justifyContent: "space-between",
        fontSize: 10, color: "var(--hl-text-mute)",
      }}>
        <span>© {new Date().getFullYear()} Half Leaf</span>
        <Link href="/iletisim" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>İletişim</Link>
      </footer>
    </div>
  );
}
