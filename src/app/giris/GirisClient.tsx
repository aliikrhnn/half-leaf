"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

type Errors = Partial<Record<"email" | "password" | "general", string>>;

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--hl-text-mute)",
    fontWeight: 600,
    display: "block",
    marginBottom: 6,
    fontFamily: "var(--hl-font-ui)",
  };
}

function Field({
  label, value, onChange, error, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle()}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", height: 44, padding: "0 14px",
          background: "var(--hl-bg)", borderRadius: 8,
          border: `1px solid ${error ? "#e05252" : "var(--hl-line-strong)"}`,
          outline: "none", color: "var(--hl-text)", fontSize: 14,
          fontFamily: "var(--hl-font-ui)", boxSizing: "border-box",
        }}
      />
      {error && (
        <p style={{ fontSize: 10, color: "#e05252", marginTop: 4, fontFamily: "var(--hl-font-ui)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function GirisClient({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  // "//evil.com" ve "/\evil.com" protokol-göreli URL'lerdir: startsWith("/")
  // kontrolünü geçip tarayıcıyı dış siteye götürürler (açık yönlendirme →
  // gerçek alan adında giriş yapan kullanıcı sahte siteye düşer).
  const safeRedirect =
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.startsWith("/\\") &&
    !redirectTo.includes("://")
      ? redirectTo
      : "/hesabim";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!email.trim() || !email.includes("@")) e.email = "Geçerli bir e-posta adresi girin.";
    if (!password) e.password = "Şifre boş olamaz.";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        if (res.status === 429) {
          setErrors({ general: data.error ?? "Çok fazla giriş denemesi yaptınız. Lütfen birkaç dakika sonra tekrar deneyin." });
        } else if (res.status === 400 || res.status === 401) {
          setErrors({ general: "E-posta veya şifre hatalı." });
        } else if (res.status >= 500) {
          setErrors({ general: "Sunucuda beklenmedik bir hata oluştu, lütfen daha sonra tekrar deneyin." });
        } else {
          setErrors({ general: "Bir hata oluştu, lütfen tekrar deneyin." });
        }
        return;
      }
      router.push(safeRedirect);
      router.refresh();
    } catch {
      setErrors({ general: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 10,
            }}>
              Hesabınıza Giriş Yapın
            </p>
            <h1 style={{
              fontFamily: "var(--hl-font-display)",
              fontSize: "clamp(32px, 6vw, 44px)",
              fontWeight: 400, fontStyle: "normal",
              color: "var(--hl-text)", lineHeight: 1.1, margin: 0,
            }}>
              Hoş geldiniz
            </h1>
          </div>

          <div style={{
            background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
            borderRadius: 14, padding: "32px 28px",
          }}>
            {errors.general && (
              <div style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 20,
                background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)",
                fontSize: 12, color: "#e05252", fontFamily: "var(--hl-font-ui)",
              }}>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="E-posta" value={email} onChange={setEmail} error={errors.email} type="email" placeholder="ornek@eposta.com" />

              <div>
                <label style={labelStyle()}>Şifre</label>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "var(--hl-bg)", borderRadius: 8, height: 44,
                  border: `1px solid ${errors.password ? "#e05252" : "var(--hl-line-strong)"}`,
                }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      flex: 1, background: "transparent", border: 0, outline: 0,
                      color: "var(--hl-text)", fontSize: 14,
                      fontFamily: "var(--hl-font-ui)", padding: "0 14px",
                    }}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} style={{
                    padding: "0 12px", background: "none", border: "none",
                    cursor: "pointer", color: "var(--hl-text-mute)", display: "flex", alignItems: "center",
                  }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ fontSize: 10, color: "#e05252", marginTop: 4, fontFamily: "var(--hl-font-ui)" }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div style={{ textAlign: "right", marginTop: -4 }}>
                <Link href="/sifremi-unuttum" style={{ fontSize: 11, color: "var(--hl-bronze-400)", textDecoration: "none" }}>
                  Şifremi unuttum
                </Link>
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
                {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--hl-text-mute)" }}>
            Hesabın yok mu?{" "}
            <Link href="/kayit" style={{ color: "var(--hl-bronze-400)", textDecoration: "none", fontWeight: 600 }}>
              Kayıt ol
            </Link>
          </p>
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
