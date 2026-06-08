"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  id:          string;
  productName: string;
  variantName: string | null;
  sku:         string;
  unitPrice:   number;
  quantity:    number;
};

type OrderData = {
  id:          string;
  orderNumber: string;
  grandTotal:  number;
  items:       OrderItem[];
};

type SelectedItem = { orderItemId: string; quantity: number };

export default function YeniIadeTalebiPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const orderNumber  = searchParams.get("siparis") ?? "";

  const [order,      setOrder]      = useState<OrderData | null>(null);
  const [loadError,  setLoadError]  = useState(orderNumber ? "" : "Sipariş numarası belirtilmedi.");
  const [loading,    setLoading]    = useState(!!orderNumber);
  const [type,       setType]       = useState<"IADE" | "DEGISIM">("IADE");
  const [reason,     setReason]     = useState("");
  const [selected,   setSelected]   = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/iade-talepleri/siparis-detay?siparis=${orderNumber}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: OrderData; error?: string }>)
      .then(json => {
        if (json.success && json.data) setOrder(json.data);
        else setLoadError(json.error ?? "Sipariş yüklenemedi.");
      })
      .catch(() => setLoadError("Sipariş yüklenemedi."))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelected(prev => {
      const cur = prev[itemId];
      if (cur === undefined) return { ...prev, [itemId]: 1 };
      if (cur >= maxQty) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: cur + 1 };
    });
  };

  const setQty = (itemId: string, qty: number, maxQty: number) => {
    if (qty <= 0) {
      setSelected(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    } else {
      setSelected(prev => ({ ...prev, [itemId]: Math.min(qty, maxQty) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr("");
    const items: SelectedItem[] = Object.entries(selected)
      .filter(([, q]) => q > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

    if (items.length === 0) { setSubmitErr("En az bir ürün seçmelisiniz."); return; }
    if (reason.trim().length < 10) { setSubmitErr("Gerekçe en az 10 karakter olmalıdır."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/iade-talepleri", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderNumber, type, reason: reason.trim(), items }),
      });
      const json = await res.json() as { success: boolean; data?: { id: string }; error?: string };
      if (!json.success || !json.data) { setSubmitErr(json.error ?? "İşlem başarısız."); return; }
      router.push(`/hesabim/iade-taleplerim/${json.data.id}`);
    } catch {
      setSubmitErr("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  const panelStyle: React.CSSProperties = {
    background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
    borderRadius: 14, padding: 24,
  };

  if (loading) {
    return (
      <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 40px)", textAlign: "center" }}>
        <p style={{ color: "var(--hl-text-mute)", fontSize: 13 }}>Yükleniyor…</p>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 40px)", textAlign: "center" }}>
        <p style={{ color: "#e05252", fontSize: 13, marginBottom: 16 }}>{loadError || "Sipariş bulunamadı."}</p>
        <Link href="/hesabim" style={{ color: "var(--hl-text-mute)", fontSize: 12 }}>← Hesabıma dön</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 12px)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ marginBottom: 24 }}>
          <Link href="/hesabim" style={{
            fontSize: 11, color: "var(--hl-text-mute)", textDecoration: "none",
            display: "inline-block", marginBottom: 12,
          }}>
            ← Hesabım
          </Link>
          <h1 style={{
            fontFamily: "var(--hl-font-display)", fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)", margin: 0,
          }}>
            İade Talebi Oluştur
          </h1>
          <p style={{ fontSize: 12, color: "var(--hl-text-mute)", marginTop: 6 }}>
            Sipariş #{order.orderNumber} · {formatPrice(order.grandTotal)}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tip */}
          <div style={panelStyle}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 14 }}>
              Talep Türü
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              {(["IADE", "DEGISIM"] as const).map((t) => (
                <label key={t} style={{
                  display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  fontSize: 13, color: type === t ? "var(--hl-text)" : "var(--hl-text-mute)",
                }}>
                  <input
                    type="radio" name="type" value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    style={{ accentColor: "var(--hl-bronze-400)" }}
                  />
                  {t === "IADE" ? "İade" : "Değişim"}
                </label>
              ))}
            </div>
          </div>

          {/* Ürünler */}
          <div style={panelStyle}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 14 }}>
              İade Edilecek Ürünler
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {order.items.map((item) => {
                const qty = selected[item.id] ?? 0;
                const isSelected = qty > 0;
                return (
                  <div key={item.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", borderRadius: 10,
                    background: isSelected ? "var(--hl-bg-elev-2)" : "var(--hl-bg)",
                    border: `1px solid ${isSelected ? "var(--hl-bronze-400)" : "var(--hl-line-strong)"}`,
                    cursor: "pointer", gap: 12, flexWrap: "wrap",
                    transition: "border-color 0.15s",
                  }}
                    onClick={() => toggleItem(item.id, item.quantity)}
                  >
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-text)", margin: "0 0 2px 0" }}>
                        {item.productName}
                        {item.variantName && ` — ${item.variantName}`}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--hl-text-mute)", margin: 0 }}>
                        {formatPrice(item.unitPrice)} · Siparişteki adet: {item.quantity}
                      </p>
                    </div>
                    {isSelected && (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button type="button"
                          onClick={() => setQty(item.id, qty - 1, item.quantity)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--hl-line-strong)", background: "var(--hl-bg)", color: "var(--hl-text)", cursor: "pointer", fontSize: 14 }}>
                          −
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)", minWidth: 20, textAlign: "center" }}>{qty}</span>
                        <button type="button"
                          onClick={() => setQty(item.id, qty + 1, item.quantity)}
                          disabled={qty >= item.quantity}
                          style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--hl-line-strong)", background: "var(--hl-bg)", color: "var(--hl-text)", cursor: "pointer", fontSize: 14, opacity: qty >= item.quantity ? 0.4 : 1 }}>
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gerekçe */}
          <div style={panelStyle}>
            <label style={{ display: "block" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 10 }}>
                İade Gerekçeniz
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="İade/değişim talebinizin nedenini açıklayınız… (en az 10 karakter)"
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid var(--hl-line-strong)", background: "var(--hl-bg)",
                  color: "var(--hl-text)", fontSize: 13, lineHeight: 1.6,
                  resize: "vertical", outline: "none", boxSizing: "border-box",
                  fontFamily: "var(--hl-font-ui)",
                }}
              />
            </label>
          </div>

          {submitErr && (
            <p style={{ fontSize: 12, color: "#e05252" }}>{submitErr}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "13px 32px", borderRadius: "var(--hl-r-pill)",
              background: submitting ? "var(--hl-line-strong)" : "var(--hl-bronze-400)",
              color: "#0A0B09", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              border: "none", cursor: submitting ? "wait" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {submitting ? "Gönderiliyor…" : "Talebi Gönder"}
          </button>

        </form>
      </div>
    </div>
  );
}
