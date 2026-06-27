"use client";

import { AlertTriangle, X } from "lucide-react";
import type { StockNotice } from "@/lib/cart/reconcile";

interface Props {
  notice: StockNotice;
  onDismiss: () => void;
}

/**
 * Stok düzeltmesi sonrası kullanıcıyı bilgilendiren kalıcı bant: hangi ürünlerin
 * stok bitiminden ötürü çıkarıldığı ve hangilerinin adedinin düşürüldüğü.
 * Sepet ve ödeme sayfalarında paylaşılır.
 */
export default function StockNoticeBanner({ notice, onDismiss }: Props) {
  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px", borderRadius: "var(--hl-r-md, 12px)",
        background: "rgba(212,160,74,0.10)", border: "1px solid rgba(212,160,74,0.35)",
      }}
    >
      <AlertTriangle size={16} style={{ color: "var(--hl-bronze-300)", flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {notice.removed.length > 0 && (
          <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12.5, color: "var(--hl-text-soft)", lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: "var(--hl-text)" }}>Stokta kalmadığı için çıkarıldı:</strong>{" "}
            {notice.removed.join(", ")}
          </p>
        )}
        {notice.adjusted.length > 0 && (
          <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 12.5, color: "var(--hl-text-soft)", lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: "var(--hl-text)" }}>Adet güncellendi:</strong>{" "}
            {notice.adjusted.map((a) => `${a.name} → ${a.to} adet`).join(", ")}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Bildirimi kapat"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--hl-bronze-300)", padding: 0, lineHeight: 1, flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
