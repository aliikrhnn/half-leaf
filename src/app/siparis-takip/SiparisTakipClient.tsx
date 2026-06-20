"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Truck, Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "BEKLEMEDE" | "ONAYLANDI" | "HAZIRLANIYOR" | "KARGODA" | "TESLIM_EDILDI" | "IPTAL_EDILDI";

interface TrackResult {
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  totals: { subtotal: number; discountTotal: number; shippingTotal: number; grandTotal: number };
  items: Array<{ name: string; variantName: string | null; quantity: number; lineTotal: number }>;
  payment: { provider: string; status: string } | null;
  shipment: {
    provider: string;
    status: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    estimatedDeliveryAt: string | null;
  } | null;
}

const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "ONAYLANDI", label: "Onaylandı" },
  { key: "HAZIRLANIYOR", label: "Hazırlanıyor" },
  { key: "KARGODA", label: "Kargoda" },
  { key: "TESLIM_EDILDI", label: "Teslim Edildi" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  BEKLEMEDE: "Sipariş Alındı",
  ONAYLANDI: "Onaylandı",
  HAZIRLANIYOR: "Hazırlanıyor",
  KARGODA: "Kargoda",
  TESLIM_EDILDI: "Teslim Edildi",
  IPTAL_EDILDI: "İptal Edildi",
};

function fmtDate(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function SiparisTakipClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  useEffect(() => {
    const no = searchParams.get("no");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill from query param on mount
    if (no) setOrderNumber(no);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!orderNumber.trim() || !email.trim()) {
      setError("Sipariş numarası ve e-posta gereklidir.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/siparis-takip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      });
      const data = await res.json() as { order?: TrackResult; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error ?? "Sipariş bulunamadı.");
        return;
      }
      setResult(data.order);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  const isCancelled = result?.status === "IPTAL_EDILDI";
  const currentStepIndex = result ? ORDER_STEPS.findIndex((s) => s.key === result.status) : -1;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "calc(var(--hl-bar-h) + var(--hl-header-h) + 40px) 20px 80px", fontFamily: "var(--hl-font-ui)" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--hl-bronze-400)", marginBottom: 8 }}>Sipariş Takibi</p>
        <h1 style={{ fontFamily: "var(--hl-font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)", margin: 0 }}>
          Siparişini takip et
        </h1>
        <p style={{ fontSize: 13, color: "var(--hl-text-mute)", marginTop: 8, lineHeight: 1.6 }}>
          Üye olmasanız da, sipariş numaranız ve sipariş sırasında kullandığınız e-posta ile siparişinizi takip edebilirsiniz.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)", borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gap: 14 }} className="hl-form-grid-2">
          <div>
            <label style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", fontWeight: 600, display: "block", marginBottom: 6 }}>Sipariş Numarası</label>
            <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="HL..." style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", fontWeight: 600, display: "block", marginBottom: 6 }}>E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" style={inputStyle} />
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: "10px 13px", borderRadius: 8, background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.3)", fontSize: 12, color: "#e05252" }}>{error}</div>
        )}
        <button type="submit" disabled={loading} style={{ marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 10, background: loading ? "var(--hl-bg-elev-3)" : "var(--hl-bronze-400)", color: loading ? "var(--hl-text-mute)" : "#0A0B09", border: "none", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Search size={14} /> {loading ? "Sorgulanıyor…" : "Siparişi Sorgula"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div style={{ background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 4 }}>Sipariş No</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--hl-text)" }}>{result.orderNumber}</p>
              <p style={{ fontSize: 11, color: "var(--hl-text-mute)", marginTop: 2 }}>{fmtDate(result.placedAt)}</p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: isCancelled ? "rgba(224,82,82,0.12)" : result.status === "TESLIM_EDILDI" ? "rgba(122,184,122,0.14)" : "rgba(201,160,106,0.14)",
              color: isCancelled ? "#e05252" : result.status === "TESLIM_EDILDI" ? "#7ab87a" : "var(--hl-bronze-400)" }}>
              {isCancelled ? <XCircle size={13} /> : result.status === "TESLIM_EDILDI" ? <CheckCircle size={13} /> : <Clock size={13} />}
              {STATUS_LABEL[result.status]}
            </span>
          </div>

          {/* Step timeline */}
          {!isCancelled && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              {ORDER_STEPS.map((step, i) => {
                const done = currentStepIndex >= i && currentStepIndex !== -1;
                return (
                  <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                    {i > 0 && (
                      <span style={{ position: "absolute", top: 9, right: "50%", width: "100%", height: 2, background: done ? "var(--hl-bronze-400)" : "var(--hl-line-strong)" }} />
                    )}
                    <span style={{ position: "relative", zIndex: 1, width: 20, height: 20, borderRadius: 999, background: done ? "var(--hl-bronze-400)" : "var(--hl-bg-elev-3)", border: done ? "none" : "1px solid var(--hl-line-strong)", display: "grid", placeItems: "center" }}>
                      {done && <CheckCircle size={12} color="#0A0B09" />}
                    </span>
                    <span style={{ fontSize: 9, color: done ? "var(--hl-text-soft)" : "var(--hl-text-mute)", marginTop: 6, textAlign: "center", letterSpacing: "0.02em" }}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shipment */}
          {result.shipment && (result.shipment.trackingNumber || result.shipment.provider) && (
            <div style={{ display: "flex", gap: 12, padding: "14px 16px", borderRadius: 10, background: "var(--hl-bg)", border: "1px solid var(--hl-line)", marginBottom: 18 }}>
              <Truck size={18} style={{ color: "var(--hl-bronze-400)", flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: "var(--hl-text-soft)", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 600, color: "var(--hl-text)" }}>{result.shipment.provider}</div>
                {result.shipment.trackingNumber && (
                  <div>Takip No: <span style={{ fontFamily: "var(--hl-font-mono)" }}>{result.shipment.trackingNumber}</span></div>
                )}
                {result.shipment.trackingUrl && (
                  <a href={result.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>Kargo takip sayfası →</a>
                )}
                {result.shipment.deliveredAt && <div>Teslim: {fmtDate(result.shipment.deliveredAt)}</div>}
              </div>
            </div>
          )}

          {/* Items */}
          <div style={{ borderTop: "1px solid var(--hl-line)", paddingTop: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={13} /> Sipariş İçeriği
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "var(--hl-text)" }}>{item.name}</span>
                    {item.variantName && <span style={{ fontSize: 11, color: "var(--hl-text-mute)" }}> · {item.variantName}</span>}
                    <span style={{ fontSize: 11, color: "var(--hl-text-mute)" }}> × {item.quantity}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)", whiteSpace: "nowrap" }}>{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--hl-line)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)" }}>Toplam</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--hl-bronze-400)" }}>{formatPrice(result.totals.grandTotal)}</span>
            </div>
          </div>

          {isCancelled && (
            <p style={{ marginTop: 14, fontSize: 12, color: "#e05252" }}>
              Bu sipariş iptal edilmiştir. Kart ödemelerinde tutar otomatik iade edilir.
            </p>
          )}
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--hl-text-mute)", textAlign: "center" }}>
        Sorun mu yaşıyorsunuz?{" "}
        <Link href="/iletisim" style={{ color: "var(--hl-bronze-400)", textDecoration: "underline" }}>Bizimle iletişime geçin</Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  background: "var(--hl-bg)",
  border: "1px solid var(--hl-line-strong)",
  borderRadius: 8,
  padding: "0 14px",
  color: "var(--hl-text)",
  fontSize: 14,
  fontFamily: "var(--hl-font-ui)",
  outline: "none",
};
