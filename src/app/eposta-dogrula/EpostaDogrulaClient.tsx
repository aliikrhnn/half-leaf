"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle, Loader2, MailCheck } from "lucide-react";

interface Props {
  token: string;
  /** Sunucuda önden yapılan kontrol; "ok" ise doğrulama POST ile tamamlanır. */
  initialState: "ok" | "already" | "error";
  initialMessage: string;
}

type View = "working" | "done" | "error";

export default function EpostaDogrulaClient({ token, initialState, initialMessage }: Props) {
  const [view, setView] = useState<View>(
    initialState === "ok" ? "working" : initialState === "already" ? "done" : "error",
  );
  const [message, setMessage] = useState(initialMessage);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (initialState !== "ok" || ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/auth/eposta-dogrula", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json() as { success: boolean; data?: { message?: string }; error?: string };
        if (res.ok && json.success) {
          setMessage(json.data?.message ?? "E-posta adresiniz doğrulandı.");
          setView("done");
        } else {
          setMessage(json.error ?? "Doğrulama tamamlanamadı.");
          setView("error");
        }
      } catch {
        setMessage("Bağlantı hatası. Lütfen tekrar deneyin.");
        setView("error");
      }
    })();
  }, [token, initialState]);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim() || !resendEmail.includes("@")) {
      setResendMsg("Geçerli bir e-posta adresi girin.");
      return;
    }
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/eposta-dogrula", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });
      const json = await res.json() as { success: boolean; data?: { message?: string }; error?: string };
      setResendMsg(json.data?.message ?? json.error ?? "İstek gönderildi.");
    } catch {
      setResendMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setResending(false);
    }
  }

  const icon =
    view === "done" ? <CheckCircle size={30} color="var(--hl-success)" />
    : view === "working" ? <Loader2 size={30} color="var(--hl-bronze-400)" className="animate-spin" />
    : <AlertTriangle size={30} color="var(--hl-danger)" />;

  const ringBg =
    view === "done" ? "rgba(122,184,122,0.12)"
    : view === "working" ? "rgba(182,137,80,0.1)"
    : "rgba(224,82,82,0.1)";
  const ringBorder =
    view === "done" ? "1px solid rgba(122,184,122,0.3)"
    : view === "working" ? "1px solid var(--hl-line-bronze)"
    : "1px solid rgba(224,82,82,0.3)";

  const heading =
    view === "done" ? "E-postanız doğrulandı"
    : view === "working" ? "Doğrulanıyor…"
    : "Bağlantı kullanılamıyor";

  return (
    <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: ringBg, border: ringBorder,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        {icon}
      </div>

      <h1 style={{
        fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4.5vw, 34px)",
        fontWeight: 600, letterSpacing: "-0.02em", color: "var(--hl-text)",
        lineHeight: 1.15, margin: "0 0 14px",
      }}>
        {heading}
      </h1>

      <p style={{ fontSize: 13.5, color: "var(--hl-text-mute)", lineHeight: 1.75, marginBottom: 26 }}>
        {message}
      </p>

      {view === "done" && (
        <Link href="/giris" style={{
          display: "inline-block", padding: "13px 30px", borderRadius: "var(--hl-r-pill)",
          background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          Giriş Yap
        </Link>
      )}

      {view === "error" && (
        <form onSubmit={resend} style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          <label htmlFor="resend-email" style={{
            fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--hl-text-mute)", fontWeight: 600, fontFamily: "var(--hl-font-ui)",
          }}>
            Yeni bağlantı iste
          </label>
          <input
            id="resend-email"
            type="email"
            autoComplete="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="ornek@mail.com"
            style={{
              width: "100%", height: 46, padding: "0 14px",
              background: "var(--hl-bg)", borderRadius: 8,
              border: "1px solid var(--hl-line-strong)", outline: "none",
              color: "var(--hl-text)", fontSize: 14,
              fontFamily: "var(--hl-font-ui)", boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={resending}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10,
              background: resending ? "var(--hl-bg-elev-3)" : "var(--hl-bronze-400)",
              border: "none",
              color: resending ? "var(--hl-text-mute)" : "var(--hl-on-bronze)",
              fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: resending ? "not-allowed" : "pointer",
            }}
          >
            {resending ? "Gönderiliyor…" : "Doğrulama Bağlantısı Gönder"}
          </button>
          {resendMsg && (
            <p style={{
              display: "flex", alignItems: "flex-start", gap: 7,
              fontSize: 12, color: "var(--hl-text-mute)", lineHeight: 1.6,
            }}>
              <MailCheck size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              {resendMsg}
            </p>
          )}
          <Link href="/giris" style={{ fontSize: 12, color: "var(--hl-bronze-400)", textDecoration: "none", textAlign: "center", marginTop: 4 }}>
            Giriş sayfasına dön
          </Link>
        </form>
      )}
    </div>
  );
}
