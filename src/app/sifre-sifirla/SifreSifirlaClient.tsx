"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";

interface Props {
  token: string;
  /** Sunucuda doğrulanmış bağlantı durumu. */
  initialError: string | null;
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--hl-text-mute)",
  fontWeight: 600,
  display: "block",
  marginBottom: 6,
  fontFamily: "var(--hl-font-ui)",
};

/** Şifre gücü: uzunluk + büyük harf + rakam (API ile aynı kurallar). */
function strengthOf(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  const labels = ["Çok zayıf", "Zayıf", "Orta", "Güçlü"] as const;
  return { score: score as 0 | 1 | 2 | 3, label: labels[score] };
}

export default function SifreSifirlaClient({ token, initialError }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [fieldError, setFieldError] = useState<{ password?: string; confirm?: string }>({});

  const linkBroken = Boolean(initialError);
  const strength = strengthOf(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: { password?: string; confirm?: string } = {};
    if (password.length < 8) errs.password = "Şifre en az 8 karakter olmalıdır.";
    else if (!/[A-Z]/.test(password)) errs.password = "Şifre en az bir büyük harf içermelidir.";
    else if (!/[0-9]/.test(password)) errs.password = "Şifre en az bir rakam içermelidir.";
    if (confirm !== password) errs.confirm = "Şifreler eşleşmiyor.";
    setFieldError(errs);
    if (Object.keys(errs).length > 0) return;

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? "Şifre güncellenemedi. Lütfen tekrar deneyin.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/giris"), 2500);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Başarılı ── */
  if (done) {
    return (
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(122,184,122,0.12)", border: "1px solid rgba(122,184,122,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
        }}>
          <CheckCircle size={30} color="var(--hl-success)" />
        </div>
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4.5vw, 34px)",
          fontWeight: 600, letterSpacing: "-0.02em", color: "var(--hl-text)",
          lineHeight: 1.15, margin: "0 0 14px",
        }}>
          Şifreniz güncellendi
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--hl-text-mute)", lineHeight: 1.75, marginBottom: 26 }}>
          Güvenliğiniz için tüm cihazlardaki oturumlarınız kapatıldı.
          Giriş sayfasına yönlendiriliyorsunuz…
        </p>
        <Link href="/giris" style={{
          display: "inline-block", padding: "13px 30px", borderRadius: "var(--hl-r-pill)",
          background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          Giriş Yap
        </Link>
      </div>
    );
  }

  /* ── Bağlantı geçersiz / süresi dolmuş ── */
  if (linkBroken) {
    return (
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
        }}>
          <AlertTriangle size={30} color="var(--hl-danger)" />
        </div>
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4.5vw, 34px)",
          fontWeight: 600, letterSpacing: "-0.02em", color: "var(--hl-text)",
          lineHeight: 1.15, margin: "0 0 14px",
        }}>
          Bağlantı kullanılamıyor
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--hl-text-mute)", lineHeight: 1.75, marginBottom: 28 }}>
          {initialError}
        </p>
        <Link href="/sifremi-unuttum" style={{
          display: "inline-block", padding: "13px 30px", borderRadius: "var(--hl-r-pill)",
          background: "var(--hl-bronze-400)", color: "var(--hl-on-bronze)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          Yeni Bağlantı İste
        </Link>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "rgba(182,137,80,0.1)", border: "1px solid var(--hl-line-bronze)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
        }}>
          <KeyRound size={26} color="var(--hl-bronze-400)" />
        </div>
        <h1 style={{
          fontFamily: "var(--hl-font-display)", fontSize: "clamp(26px, 4.5vw, 34px)",
          fontWeight: 600, letterSpacing: "-0.02em", color: "var(--hl-text)",
          lineHeight: 1.15, margin: "0 0 12px",
        }}>
          Yeni şifrenizi belirleyin
        </h1>
        <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, margin: "0 auto", maxWidth: 340 }}>
          En az 8 karakter, bir büyük harf ve bir rakam içermelidir.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="new-password" style={labelStyle}>Yeni Şifre</label>
          <div style={{ position: "relative" }}>
            <input
              id="new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%", height: 46, padding: "0 46px 0 14px",
                background: "var(--hl-bg)", borderRadius: 8,
                border: `1px solid ${fieldError.password ? "var(--hl-danger)" : "var(--hl-line-strong)"}`,
                outline: "none", color: "var(--hl-text)", fontSize: 14,
                fontFamily: "var(--hl-font-ui)", boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
              style={{
                position: "absolute", right: 4, top: 1, width: 44, height: 44,
                display: "grid", placeItems: "center", background: "none",
                border: "none", cursor: "pointer", color: "var(--hl-text-mute)",
              }}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {password.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, flex: 1 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i < strength.score ? "var(--hl-bronze-400)" : "var(--hl-line-strong)",
                      transition: "background 200ms ease",
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 10, color: "var(--hl-text-mute)", minWidth: 54, textAlign: "right" }}>
                {strength.label}
              </span>
            </div>
          )}
          {fieldError.password && (
            <p style={{ fontSize: 11, color: "var(--hl-danger)", marginTop: 6 }}>{fieldError.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" style={labelStyle}>Şifre Tekrar</label>
          <input
            id="confirm-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={{
              width: "100%", height: 46, padding: "0 14px",
              background: "var(--hl-bg)", borderRadius: 8,
              border: `1px solid ${fieldError.confirm ? "var(--hl-danger)" : "var(--hl-line-strong)"}`,
              outline: "none", color: "var(--hl-text)", fontSize: 14,
              fontFamily: "var(--hl-font-ui)", boxSizing: "border-box",
            }}
          />
          {fieldError.confirm && (
            <p style={{ fontSize: 11, color: "var(--hl-danger)", marginTop: 6 }}>{fieldError.confirm}</p>
          )}
        </div>

        {error && (
          <p style={{
            fontSize: 12, color: "var(--hl-danger)", lineHeight: 1.6,
            background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.25)",
            borderRadius: 8, padding: "10px 12px",
          }}>
            {error}
          </p>
        )}

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
          {loading ? "Kaydediliyor…" : "Şifreyi Güncelle"}
        </button>
      </form>
    </div>
  );
}
