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

/** 3D Secure ekranları 520 px'e sığmayabiliyor; taban yükseklik yükseltildi. */
const MIN_HEIGHT = 620;

/**
 * Bu süre sonunda form hâlâ yüklenmediyse kullanıcıya açıklama gösterilir.
 * Yavaş mobil bağlantılarda yanlış alarm vermemesi için bilinçli olarak uzun.
 */
const STALL_NOTICE_MS = 20_000;

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
  const [stalled, setStalled] = useState(false);
  const resizedRef = useRef(false);

  // Form belirli sürede gelmediyse kullanıcı boş kutuya bakmakla kalmasın.
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setStalled(true), STALL_NOTICE_MS);
    return () => clearTimeout(t);
  }, [loaded]);

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
    <div style={{ position: "relative", width: "100%", minHeight: MIN_HEIGHT }}>
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
            /* Katman iframe'in üstünde duruyor: tıklamaları yutmamalı.
               `onLoad` gecikirse müşteri kart alanlarına dokunamıyordu. */
            pointerEvents: "none",
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
        /* `scrolling="no"` DEĞİL: 3D Secure adımında iframe, bankanın kendi
           sayfasına gider. O sayfa PayTR'nin iframeResizer istemcisini
           içermediği için yükseklik ölçülemez; kaydırma da kapalıysa form
           kırpılır ve müşteri "onayla" düğmesine ulaşamaz. */
        scrolling="auto"
        onLoad={() => setLoaded(true)}
        style={{ width: "100%", minHeight: MIN_HEIGHT, border: 0 }}
      />
      {stalled && (
        <p
          style={{
            marginTop: 10,
            textAlign: "center",
            fontFamily: "var(--hl-font-ui)",
            fontSize: 11,
            color: "var(--hl-text-mute)",
            lineHeight: 1.7,
          }}
        >
          Ödeme formu açılmadıysa sayfayı yenilemeyi deneyin. Tutar hesabınızdan
          çekilmedi.
        </p>
      )}
    </div>
  );
}
