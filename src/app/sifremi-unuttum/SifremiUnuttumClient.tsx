"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle } from "lucide-react";

export default function SifremiUnuttumClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sifremi-unuttum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json() as { success: boolean; data?: { message?: string }; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? "İstek gönderilemedi. Lütfen tekrar deneyin.");
        return;
      }
      setMessage(json.data?.message ?? "");
      setSent(true);
    } catch {
      setError("Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(122,184,122,0.12)", border: "1px solid rgba(122,184,122,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <CheckCircle size={30} color="var(--hl-success)" />
        </div>
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4.5vw, 34px)",
          fontWeight: 600, letterSpacing: "-0.02em", color: "var(--hl-text)",
          lineHeight: 1.15, margin: "0 0 14px",
        }}>
          Bağlantıyı gönderdik
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--hl-text-mute)", lineHeight: 1.75, margin: "0 auto 28px", maxWidth: 380 }}>
          {message}
        </p>
        <p style={{ fontSize: 12, color: "var(--hl-text-faint)", lineHeight: 1.7, marginBottom: 28 }}>
          Bağlantı 60 dakika geçerlidir ve yalnızca bir kez kullanılabilir.
        </p>
        <Link href="/giris" style={{
          display: "inline-block", padding: "13px 30px", borderRadius: "var(--hl-r-pill)",
          background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          Giriş Sayfasına Dön
        </Link>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "rgba(182,137,80,0.1)", border: "1px solid var(--hl-line-bronze)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <Mail size={26} color="var(--hl-bronze-400)" />
        </div>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 10,
        }}>
          Şifre Sıfırlama
        </p>
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4.5vw, 34px)",
          fontWeight: 600, letterSpacing: "-0.02em", color: "var(--hl-text)",
          lineHeight: 1.15, margin: "0 0 12px",
        }}>
          Şifremi unuttum
        </h1>
        <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, margin: "0 auto", maxWidth: 340 }}>
          Hesabınızın e-posta adresini girin; şifrenizi yenilemeniz için bir bağlantı gönderelim.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="reset-email" style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--hl-text-mute)", fontWeight: 600, display: "block",
            marginBottom: 6, fontFamily: "var(--hl-font-ui)",
          }}>
            E-Posta
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com"
            style={{
              width: "100%", height: 46, padding: "0 14px",
              background: "var(--hl-bg)", borderRadius: 8,
              border: `1px solid ${error ? "var(--hl-danger)" : "var(--hl-line-strong)"}`,
              outline: "none", color: "var(--hl-text)", fontSize: 14,
              fontFamily: "var(--hl-font-ui)", boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ fontSize: 11, color: "var(--hl-danger)", marginTop: 6 }}>{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10,
            background: loading ? "var(--hl-bg-elev-3)" : "var(--hl-bronze-400)",
            border: "none",
            color: loading ? "var(--hl-text-mute)" : "var(--hl-on-bronze)",
            fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 150ms ease",
          }}
        >
          {loading ? "Gönderiliyor…" : "Sıfırlama Bağlantısı Gönder"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--hl-text-mute)", marginTop: 4 }}>
          Şifrenizi hatırladınız mı?{" "}
          <Link href="/giris" style={{ color: "var(--hl-bronze-400)", textDecoration: "none", fontWeight: 600 }}>
            Giriş yapın
          </Link>
        </p>
      </form>
    </div>
  );
}
