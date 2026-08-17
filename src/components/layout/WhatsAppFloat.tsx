"use client";

import { useEffect, useState } from "react";
import { useSiteFlags } from "./SiteFlags";

const PRESET_MESSAGE = "Merhaba, Half Leaf hakkında bilgi almak istiyorum.";

export default function WhatsAppFloat() {
  const { whatsappNumber } = useSiteFlags();
  const [bubble, setBubble] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return Boolean(sessionStorage.getItem("hl-wa-dismissed")); } catch { return false; }
  });

  // Birkaç saniye sonra teaser balonunu göster (oturum başına bir kez kapatılabilir).
  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(() => setBubble(true), 3500);
    return () => clearTimeout(t);
  }, [dismissed]);

  // Balon göründükten 5 saniye sonra kendiliğinden kapansın.
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(false), 5000);
    return () => clearTimeout(t);
  }, [bubble]);

  if (!whatsappNumber) return null;
  const digits = whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(PRESET_MESSAGE)}`;

  const closeBubble = () => {
    setBubble(false);
    setDismissed(true);
    try { sessionStorage.setItem("hl-wa-dismissed", "1"); } catch { /* ignore */ }
  };

  return (
    <div className="hl-wa-float" aria-live="polite">
      {bubble && !dismissed && (
        <div className="hl-wa-bubble">
          <button className="hl-wa-bubble-close" onClick={closeBubble} aria-label="Kapat">×</button>
          <p className="hl-wa-bubble-title">Yardımcı olalım 👋</p>
          <p className="hl-wa-bubble-text">Ürünler, sipariş veya kargo — WhatsApp&apos;tan hemen yazın.</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="hl-wa-bubble-cta" onClick={closeBubble}>
            WhatsApp&apos;tan Yaz
          </a>
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hl-wa-btn"
        aria-label="WhatsApp ile iletişime geç"
        onClick={() => { setBubble(false); }}
      >
        <svg width={28} height={28} viewBox="0 0 32 32" fill="currentColor" aria-hidden>
          <path d="M16.003 3C9.38 3 4 8.38 4 15c0 2.27.63 4.4 1.73 6.22L4 29l7.97-1.7A12 12 0 0 0 16 27c6.62 0 12-5.38 12-12S22.62 3 16.003 3Zm0 21.8c-1.86 0-3.6-.5-5.1-1.37l-.37-.22-4.73 1.01 1.01-4.6-.24-.38A9.77 9.77 0 0 1 6.2 15c0-5.4 4.4-9.8 9.8-9.8 5.4 0 9.8 4.4 9.8 9.8 0 5.4-4.4 9.8-9.8 9.8Zm5.4-7.33c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.4.24-.7.24-1.28.17-1.4-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      </a>
    </div>
  );
}
