"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Check } from "lucide-react";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";

type Errors = Partial<Record<
  "name" | "email" | "phone" | "password" | "confirmPassword" | "kvkk" | "general",
  string
>>;

const labelCss: React.CSSProperties = {
  fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
  color: "var(--hl-text-mute)", fontWeight: 600, display: "block",
  marginBottom: 6, fontFamily: "var(--hl-font-ui)",
};

function Field({
  label, value, onChange, error, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; placeholder?: string;
}) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label style={labelCss}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center", background: "var(--hl-bg)",
        borderRadius: 8, height: 44,
        border: `1px solid ${error ? "#e05252" : "var(--hl-line-strong)"}`,
      }}>
        <input
          type={isPassword ? (showPw ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "transparent", border: 0, outline: 0,
            color: "var(--hl-text)", fontSize: 14,
            fontFamily: "var(--hl-font-ui)", padding: "0 14px",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw((v) => !v)} style={{
            padding: "0 12px", background: "none", border: "none",
            cursor: "pointer", color: "var(--hl-text-mute)", display: "flex", alignItems: "center",
          }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 10, color: "#e05252", marginTop: 4, fontFamily: "var(--hl-font-ui)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        background: checked ? "var(--hl-bronze-400)" : "transparent",
        border: checked ? "1px solid var(--hl-bronze-400)" : "1px solid var(--hl-line-strong)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}
    >
      {checked && <Check size={10} color="#1A1206" strokeWidth={2.5} />}
    </button>
  );
}

export default function KayitClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kvkk, setKvkk] = useState(false);
  const [ticariIleti, setTicariIleti] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Ad en az 2 karakter olmalıdır.";
    if (!email.trim() || !email.includes("@")) e.email = "Geçerli bir e-posta adresi girin.";
    if (phoneSuffix.replace(/\D/g, "").length < 10) e.phone = "10 haneli numara girin (başında 0 olmadan).";
    if (password.length < 8) e.password = "Şifre en az 8 karakter olmalıdır.";
    else if (!/[A-Z]/.test(password)) e.password = "Şifre en az bir büyük harf içermelidir.";
    else if (!/[0-9]/.test(password)) e.password = "Şifre en az bir rakam içermelidir.";
    if (confirmPassword !== password) e.confirmPassword = "Şifreler eşleşmiyor.";
    if (!kvkk) e.kvkk = "KVKK Aydınlatma Metni'ni onaylamanız gereklidir.";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: "+90" + phoneSuffix.replace(/\s/g, ""),
          password,
          kvkkAccepted: true,
          ticariIletiConsent: ticariIleti,
          ageVerified: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: "Bu e-posta adresi zaten kayıtlı." });
        } else if (res.status === 429) {
          setErrors({ general: data.error ?? "Çok fazla kayıt denemesi yapıldı. Lütfen bir süre sonra tekrar deneyin." });
        } else if (res.status >= 500) {
          setErrors({ general: "Sunucuda beklenmedik bir hata oluştu, lütfen daha sonra tekrar deneyin." });
        } else {
          setErrors({ general: data.error ?? "Bir hata oluştu. Lütfen tekrar deneyin." });
        }
        return;
      }
      router.push("/hesabim");
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
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 10,
            }}>
              Yeni Hesap
            </p>
            <h1 style={{
              fontFamily: "var(--hl-font-display)",
              fontSize: "clamp(30px, 6vw, 44px)",
              fontWeight: 400, fontStyle: "italic",
              color: "var(--hl-text)", lineHeight: 1.1, margin: 0,
            }}>
              Hesap oluşturun
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
                fontSize: 12, color: "#e05252",
              }}>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Ad Soyad" value={name} onChange={setName} error={errors.name} placeholder="Adınız Soyadınız" />

              <Field label="E-posta" value={email} onChange={setEmail} error={errors.email} type="email" placeholder="ornek@eposta.com" />

              {/* Telefon with +90 prefix */}
              <div>
                <label style={labelCss}>Telefon</label>
                <div style={{
                  display: "flex", alignItems: "center", background: "var(--hl-bg)",
                  borderRadius: 8, height: 44,
                  border: `1px solid ${errors.phone ? "#e05252" : "var(--hl-line-strong)"}`,
                }}>
                  <span style={{
                    padding: "0 10px 0 14px", fontSize: 13, fontWeight: 600,
                    color: "var(--hl-text-soft)", fontFamily: "var(--hl-font-ui)",
                    borderRight: "1px solid var(--hl-line-strong)", height: "100%",
                    display: "flex", alignItems: "center", flexShrink: 0, whiteSpace: "nowrap",
                  }}>
                    +90
                  </span>
                  <input
                    type="tel"
                    value={phoneSuffix}
                    onChange={(e) => setPhoneSuffix(e.target.value)}
                    placeholder="532 000 00 00"
                    style={{
                      flex: 1, background: "transparent", border: 0, outline: 0,
                      color: "var(--hl-text)", fontSize: 14,
                      fontFamily: "var(--hl-font-ui)", padding: "0 14px",
                    }}
                  />
                </div>
                {errors.phone && (
                  <p style={{ fontSize: 10, color: "#e05252", marginTop: 4, fontFamily: "var(--hl-font-ui)" }}>
                    {errors.phone}
                  </p>
                )}
              </div>

              <Field label="Şifre" value={password} onChange={setPassword} error={errors.password} type="password" placeholder="En az 8 karakter" />
              <Field label="Şifre Tekrar" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} type="password" placeholder="Şifrenizi tekrar girin" />

              {/* Consent */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
                {/* KVKK — zorunlu */}
                <div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <CheckBox checked={kvkk} onChange={() => setKvkk((v) => !v)} />
                    <span style={{ fontSize: 12, color: "var(--hl-text-soft)", lineHeight: 1.5 }}>
                      <Link href="/yasal/kvkk" target="_blank" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>
                        KVKK Aydınlatma Metni
                      </Link>
                      {"'ni okudum ve kabul ediyorum."}
                      <span style={{ color: "#e05252" }}> *</span>
                    </span>
                  </label>
                  {errors.kvkk && (
                    <p style={{ fontSize: 10, color: "#e05252", marginTop: 5, marginLeft: 26, fontFamily: "var(--hl-font-ui)" }}>
                      {errors.kvkk}
                    </p>
                  )}
                </div>

                {/* Ticari ileti — opsiyonel */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <CheckBox checked={ticariIleti} onChange={() => setTicariIleti((v) => !v)} />
                  <span style={{ fontSize: 12, color: "var(--hl-text-mute)", lineHeight: 1.5 }}>
                    Kampanyalar, yeni ürünler ve özel teklifler hakkında e-posta ve SMS ile haberdar olmak istiyorum.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !kvkk}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 10, marginTop: 4,
                  background: loading || !kvkk ? "var(--hl-bg-elev-3)" : "var(--hl-bronze-400)",
                  border: "none",
                  color: loading || !kvkk ? "var(--hl-text-mute)" : "#0A0B09",
                  fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  cursor: loading || !kvkk ? "not-allowed" : "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--hl-text-mute)" }}>
            Zaten hesabın var mı?{" "}
            <Link href="/giris" style={{ color: "var(--hl-bronze-400)", textDecoration: "none", fontWeight: 600 }}>
              Giriş yap
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
