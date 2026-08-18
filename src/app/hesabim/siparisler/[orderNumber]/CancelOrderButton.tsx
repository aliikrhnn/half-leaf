"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

interface Props {
  orderNumber: string;
  /** Tahsilat yapılmışsa iptal, para iadesi sürecini de başlatır — uyarı metni değişir. */
  paid: boolean;
}

/**
 * Sipariş iptali. Onay adımı BİLİNÇLİ: iptal geri alınamaz ve stok/kupon
 * hareketlerini tetikler. `window.confirm` kullanılmaz — tarayıcı diyalogları
 * mobilde sayfayı kilitleyebiliyor; onay satır içinde alınır.
 */
export default function CancelOrderButton({ orderNumber, paid }: Props) {
  const router = useRouter();
  const [onayIstendi, setOnayIstendi] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");

  const iptalEt = async () => {
    setGonderiliyor(true);
    setHata("");
    try {
      const res = await fetch(`/api/siparis/${encodeURIComponent(orderNumber)}/iptal`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setHata(json.error ?? "Sipariş iptal edilemedi.");
        return;
      }
      router.refresh();
    } catch {
      setHata("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setGonderiliyor(false);
    }
  };

  if (!onayIstendi) {
    return (
      <button
        onClick={() => setOnayIstendi(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: "var(--hl-r-pill)",
          border: "1px solid var(--hl-line-strong)", background: "transparent",
          color: "var(--hl-text-soft)", fontFamily: "var(--hl-font-ui)",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", cursor: "pointer",
        }}
      >
        <XCircle size={13} /> Siparişi İptal Et
      </button>
    );
  }

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      border: "1px solid rgba(224,82,82,0.35)", background: "rgba(224,82,82,0.06)",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <p style={{ fontSize: 12, color: "var(--hl-text-soft)", lineHeight: 1.7, margin: 0 }}>
        Bu siparişi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        {paid && " Ödemeniz alınmıştı; iadeniz mağaza tarafından başlatılacak ve kartınıza yansıması birkaç iş günü sürebilir."}
      </p>
      {hata && (
        <p style={{ fontSize: 12, color: "#e05252", margin: 0 }}>{hata}</p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={iptalEt}
          disabled={gonderiliyor}
          style={{
            padding: "9px 18px", borderRadius: "var(--hl-r-pill)", border: "none",
            background: "#c04545", color: "#fff", fontFamily: "var(--hl-font-ui)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: gonderiliyor ? "not-allowed" : "pointer",
            opacity: gonderiliyor ? 0.6 : 1,
          }}
        >
          {gonderiliyor ? "İptal ediliyor…" : "Evet, iptal et"}
        </button>
        <button
          onClick={() => setOnayIstendi(false)}
          disabled={gonderiliyor}
          style={{
            padding: "9px 18px", borderRadius: "var(--hl-r-pill)",
            border: "1px solid var(--hl-line-strong)", background: "transparent",
            color: "var(--hl-text-soft)", fontFamily: "var(--hl-font-ui)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: "pointer",
          }}
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
