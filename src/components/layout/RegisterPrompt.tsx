"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "hl-reg-dismissed";

/**
 * Misafir kullanıcılar için kapatılabilir üye olma teşvik banner'ı (mobil-uyumlu).
 * Giriş yapılmışsa veya kapatılmışsa gösterilmez.
 */
export default function RegisterPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch { /* ignore */ }

    // Giriş durumu: üye ise gösterme
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (cancelled) return;
        if (!r.ok) {
          // misafir → kısa gecikmeyle göster
          setTimeout(() => { if (!cancelled) setShow(true); }, 1800);
        }
      })
      .catch(() => {
        if (!cancelled) setTimeout(() => setShow(true), 1800);
      });

    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  }

  if (!show) return null;

  return (
    <div
      role="complementary"
      aria-label="Üye ol"
      className="hl-join-card"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        zIndex: 90,
        maxWidth: 460,
        margin: "0 auto",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: "toastIn 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hl-join-title" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--hl-font-ui)", fontSize: 14, fontWeight: 800 }}>
          <Sparkles size={15} /> Üye ol, fırsatları kaçırma
        </div>
        <div className="hl-join-sub" style={{ fontFamily: "var(--hl-font-ui)", fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
          Özel kampanyalar, sipariş takibi ve favoriler seni bekliyor.
        </div>
      </div>
      <Link
        href="/kayit"
        onClick={dismiss}
        className="hl-join-btn"
        style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 999, fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}
      >
        Üye Ol
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Kapat"
        className="hl-join-close"
        style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 999, border: "none", display: "grid", placeItems: "center", cursor: "pointer" }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
