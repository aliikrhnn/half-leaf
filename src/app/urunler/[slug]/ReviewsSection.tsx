"use client";

import { useState } from "react";
import { Star, BadgeCheck } from "lucide-react";

export interface ReviewData {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  createdAt: string;
}

interface Props {
  slug: string;
  reviews: ReviewData[];
  ratingAvg: number | null;
  reviewCount: number;
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }} aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          color="var(--hl-bronze-400)"
          fill={n <= Math.round(value) ? "var(--hl-bronze-400)" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function ReviewsSection({ slug, reviews, ratingAvg, reviewCount }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating < 1) { setError("Lütfen bir puan seçin."); return; }
    if (authorName.trim().length < 2) { setError("Adınızı girin."); return; }
    if (body.trim().length < 5) { setError("Yorumunuzu yazın (en az 5 karakter)."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/urunler/${encodeURIComponent(slug)}/yorumlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          authorName: authorName.trim(),
          email: email.trim() || undefined,
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) { setError(data.error ?? "Yorum gönderilemedi."); return; }
      setDone(data.message ?? "Yorumunuz alındı.");
      setRating(0); setAuthorName(""); setEmail(""); setTitle(""); setBody("");
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Aggregate */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        {reviewCount > 0 && ratingAvg != null ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--hl-font-display)", fontSize: 40, fontWeight: 400, color: "var(--hl-text)" }}>{ratingAvg.toFixed(1)}</span>
              <span style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>/ 5</span>
            </div>
            <div>
              <Stars value={ratingAvg} size={16} />
              <p style={{ fontSize: 12, color: "var(--hl-text-mute)", marginTop: 4 }}>{reviewCount} değerlendirme</p>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>Henüz değerlendirme yok. İlk yorumu siz yazın.</p>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ marginLeft: "auto", padding: "10px 20px", borderRadius: "var(--hl-r-pill)", background: "transparent", border: "1.5px solid var(--hl-bronze-700)", color: "var(--hl-bronze-400)", fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
        >
          {open ? "Vazgeç" : "Değerlendirme Yaz"}
        </button>
      </div>

      {/* Form */}
      {open && (
        done ? (
          <div style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(122,184,122,0.1)", border: "1px solid rgba(122,184,122,0.3)", fontSize: 13, color: "#7ab87a", marginBottom: 28 }}>
            {done}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)", borderRadius: 12, padding: 20, marginBottom: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--hl-text-mute)" }}>Puanınız:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} aria-label={`${n} yıldız`} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 0 }}>
                  <Star size={22} color="var(--hl-bronze-400)" fill={n <= (hover || rating) ? "var(--hl-bronze-400)" : "none"} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="hl-form-grid-2">
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Adınız" style={fieldStyle} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta (opsiyonel)" style={fieldStyle} />
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Başlık (opsiyonel)" style={fieldStyle} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ürün hakkındaki düşünceleriniz…" rows={4} style={{ ...fieldStyle, height: "auto", padding: "10px 14px", resize: "vertical" }} />
            {error && <p style={{ fontSize: 12, color: "#e05252" }}>{error}</p>}
            <p style={{ fontSize: 11, color: "var(--hl-text-mute)" }}>Yorumlar moderasyon sonrası yayınlanır. E-posta girerseniz, satın aldığınız doğrulanırsa &quot;Doğrulanmış Alışveriş&quot; rozeti eklenir.</p>
            <button type="submit" disabled={submitting} style={{ alignSelf: "flex-start", padding: "11px 26px", borderRadius: 10, background: submitting ? "var(--hl-bg-elev-3)" : "var(--hl-bronze-400)", color: submitting ? "var(--hl-text-mute)" : "#0A0B09", border: "none", fontFamily: "var(--hl-font-ui)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: submitting ? "default" : "pointer" }}>
              {submitting ? "Gönderiliyor…" : "Gönder"}
            </button>
          </form>
        )
      )}

      {/* Review list */}
      {reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ borderTop: "1px solid var(--hl-line)", paddingTop: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <Stars value={r.rating} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--hl-text)" }}>{r.authorName}</span>
                {r.isVerified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#7ab87a", fontWeight: 700 }}>
                    <BadgeCheck size={12} /> Doğrulanmış Alışveriş
                  </span>
                )}
                <span style={{ fontSize: 11, color: "var(--hl-text-mute)", marginLeft: "auto" }}>{fmtDate(r.createdAt)}</span>
              </div>
              {r.title && <p style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)", marginBottom: 4 }}>{r.title}</p>}
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--hl-text-soft)", whiteSpace: "pre-wrap" }}>{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  background: "var(--hl-bg)",
  border: "1px solid var(--hl-line-strong)",
  borderRadius: 8,
  padding: "0 14px",
  color: "var(--hl-text)",
  fontSize: 13,
  fontFamily: "var(--hl-font-ui)",
  outline: "none",
};
