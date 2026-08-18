"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PayTR güvenli ödeme formu.
 *
 * MASAÜSTÜ: form iframe içinde gösterilir, yükseklik PayTR'nin iframeResizer
 * kütüphanesiyle içeriğe göre ayarlanır.
 *
 * MOBİL: iframe KULLANILMAZ, sayfanın tamamı PayTR'ye taşınır. Sebep: mobil
 * tarayıcılar (özellikle iOS Safari, varsayılan ayarlarıyla) çapraz-site
 * iframe'lerde üçüncü taraf çerezlerini engelliyor. PayTR'nin ödeme oturumu o
 * çereze bağlı olduğu için form "yükleniyor" yazısında asılı kalıyordu —
 * aynı sipariş masaüstünde sorunsuz açılıyordu. Üstüne mobilde iframe
 * yüksekliğinin ölçülememesi ve 3D Secure adımında bankanın sayfasının
 * çerçeve içinde davranışı da ayrı birer risk.
 *
 * Tam sayfa açılış PayTR tarafından desteklenir; ödeme bitince PayTR üst
 * pencereyi merchant_ok_url'e (bizim /odeme/donus köprümüz) götürür ve köprü
 * hem iframe hem tam sayfa durumunu zaten karşılıyor.
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

/** Dar ekran ya da dokunmatik işaretçi → iframe yerine tam sayfa ödeme. */
function tamSayfaGerekli(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 820px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export default function PaytrFrame({ iframeSrc }: PaytrFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [yonlendiriliyor, setYonlendiriliyor] = useState(false);
  const resizedRef = useRef(false);

  /* Mobil: tam sayfa ödemeye geç.
     `replace` bilinçli: PayTR'den geri dönüldüğünde bu sayfa geçmişte
     kalmadığı için "geri → tekrar yönlendirme" döngüsü oluşmaz. */
  useEffect(() => {
    if (!tamSayfaGerekli()) return;
    // Karar yalnızca istemcide verilebilir (matchMedia sunucuda yok); sunucu
    // ve istemcinin ilk render'ı aynı kalsın diye durum efektte değişiyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
    setYonlendiriliyor(true);
    window.location.replace(iframeSrc);
  }, [iframeSrc]);

  // Form belirli sürede gelmediyse kullanıcı boş kutuya bakmakla kalmasın.
  useEffect(() => {
    if (loaded || yonlendiriliyor) return;
    const t = setTimeout(() => setStalled(true), STALL_NOTICE_MS);
    return () => clearTimeout(t);
  }, [loaded, yonlendiriliyor]);

  useEffect(() => {
    if (yonlendiriliyor) return;

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
  }, [yonlendiriliyor]);

  /* ── Mobil: yönlendirme ekranı ── */
  if (yonlendiriliyor) {
    return (
      <div
        style={{
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          fontFamily: "var(--hl-font-ui)",
          textAlign: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid var(--hl-line-strong)",
            borderTopColor: "var(--hl-bronze-400)",
            animation: "hl-spin 0.8s linear infinite",
          }}
        />
        <p style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>
          Güvenli ödeme sayfasına yönlendiriliyorsunuz…
        </p>
        <a href={iframeSrc} style={{ fontSize: 12, color: "var(--hl-bronze-400)" }}>
          Sayfa açılmadıysa buraya dokunun
        </a>
      </div>
    );
  }

  /* ── Masaüstü: iframe ── */
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
        {stalled ? "Ödeme formu açılmadı mı? " : ""}
        <a href={iframeSrc} style={{ color: "var(--hl-bronze-400)" }}>
          Güvenli ödeme sayfasını tam ekran aç
        </a>
        {stalled ? " · Tutar hesabınızdan çekilmedi." : ""}
      </p>
    </div>
  );
}
