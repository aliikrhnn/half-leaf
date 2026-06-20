"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useToastStore } from "@/store/toast";

/**
 * Erişilebilir toast bildirimleri (aria-live=polite). Sepete ekleme gibi
 * aksiyonlarda görsel + ekran okuyucu geri bildirimi sağlar.
 */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-toast-in"
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 14px",
            borderRadius: 12,
            background: "var(--hl-bg-elev-2)",
            border: "1px solid var(--hl-line-strong)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
            fontFamily: "var(--hl-font-ui)",
            fontSize: 13,
            color: "var(--hl-text)",
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              background: "rgba(122,184,122,0.16)",
              border: "1px solid rgba(122,184,122,0.4)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Check size={12} color="#7ab87a" strokeWidth={2.5} />
          </span>
          <span>{t.message}</span>
          {t.action && (
            <Link
              href={t.action.href}
              onClick={() => dismiss(t.id)}
              style={{
                color: "var(--hl-bronze-400)",
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {t.action.label}
            </Link>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Bildirimi kapat"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--hl-text-mute)",
              display: "grid",
              placeItems: "center",
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
