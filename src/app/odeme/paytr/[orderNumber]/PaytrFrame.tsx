"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PayTR güvenli ödeme formunu iframe içinde gösterir ve PayTR'nin
 * iframeResizer kütüphanesiyle yüksekliği içeriğe göre ayarlar.
 *
 * Not: Çekirdek `paytr.ts` (node:crypto kullanır) bu istemci bileşenine
 * import EDİLMEZ; iframe kaynağı sunucudan prop olarak gelir.
 */

const IFRAME_RESIZER_URL = "https://www.paytr.com/js/iframeResizer.min.js";

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void;
  }
}

interface PaytrFrameProps {
  iframeSrc: string;
}

export default function PaytrFrame({ iframeSrc }: PaytrFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const resizedRef = useRef(false);

  useEffect(() => {
    function applyResize() {
      if (resizedRef.current) return;
      if (typeof window !== "undefined" && typeof window.iFrameResize === "function") {
        window.iFrameResize({}, "#paytriframe");
        resizedRef.current = true;
      }
    }

    // Script zaten yüklüyse hemen uygula.
    if (window.iFrameResize) {
      applyResize();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${IFRAME_RESIZER_URL}"]`,
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () => applyResize();

    if (!existing) {
      script.src = IFRAME_RESIZER_URL;
      script.async = true;
      script.addEventListener("load", onLoad);
      document.body.appendChild(script);
    } else {
      existing.addEventListener("load", onLoad);
      applyResize();
    }

    return () => script.removeEventListener("load", onLoad);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 520 }}>
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--hl-font-ui)",
            fontSize: 13,
            color: "var(--hl-text-mute)",
          }}
        >
          Güvenli ödeme formu yükleniyor…
        </div>
      )}
      <iframe
        src={iframeSrc}
        id="paytriframe"
        title="PayTR Güvenli Ödeme"
        frameBorder={0}
        scrolling="no"
        onLoad={() => setLoaded(true)}
        style={{ width: "100%", minHeight: 520, border: 0 }}
      />
    </div>
  );
}
