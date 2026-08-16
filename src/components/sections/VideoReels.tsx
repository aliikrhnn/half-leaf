"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./VideoReels.module.css";

/* =====================================================================
   ÜRÜN + VİDEO LİSTESİ — sadece burayı düzenle.
   video: public/reels/ içindeki MP4 (dikey 9:16, 10-20 sn, ~720x1280,
   <8MB). Dosya henüz yoksa kart placeholder gösterir, dosya gelince
   otomatik videoya döner.

   DİKKAT — fiyatlar burada SABİT yazılıdır. Katalogdaki bu ürünler USD
   cinsinden fiyatlanıp gösterim anında güncel kurla TL'ye çevriliyor
   (bkz. lib/pricing.ts + haftalık update-exchange-rate cron'u). Kur
   değişince buradaki değerler ürün sayfasındakiyle uyuşmaz; kur
   güncellendiğinde bu listeyi de elden geçirin.
   ===================================================================== */
const REELS = [
  {
    video: "/reels/alpha-oro-prime.mp4",
    handle: "@halfleafstore",
    badge: "%10 İndirim",
    brand: "Alpha Hookah",
    name: "Alpha Oro Prime",
    price: "₺21.508",
    oldPrice: "₺23.898",
    url: "/urunler/alpha-hookah-oro-prime",
  },
  {
    video: "/reels/xhoob-enzoy-wood.mp4",
    handle: "@halfleafstore",
    badge: "",
    brand: "Xhoob",
    name: "Enzoy Wood",
    price: "₺28.678",
    oldPrice: "₺31.498",
    url: "/urunler/xhoob-enzoy-wood",
  },
  {
    video: "/reels/kbro-gold.mp4",
    handle: "@halfleafstore",
    badge: "Çok Satan",
    brand: "K-Bro",
    name: "K-Bro Gold",
    price: "₺21.508",
    oldPrice: "₺23.420",
    url: "/urunler/k-bro-gold",
  },
  {
    video: "/reels/union-fibonacci.mp4",
    handle: "@halfleafstore",
    badge: "Stok Az",
    brand: "Union Hookah",
    name: "Fibonacci Hybrid",
    price: "₺15.772",
    oldPrice: "",
    url: "/urunler/union-fibonacci-hybrid",
  },
  {
    video: "/reels/quasar-blackhole.mp4",
    handle: "@halfleafstore",
    badge: "",
    brand: "Quasar",
    name: "Arguilé Black Hole",
    price: "₺16.728",
    oldPrice: "",
    url: "/urunler/quasar-arguil-black-hole",
  },
  {
    video: "/reels/maklaud-treada.mp4",
    handle: "@halfleafstore",
    badge: "Koleksiyonluk",
    brand: "Maklaud",
    name: "Treada",
    price: "₺66.914",
    oldPrice: "",
    url: "/urunler/maklaud-treada",
  },
];

const AUTO_MS = 4500;

export default function VideoReels() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [index, setIndex] = useState(1);
  const [dragging, setDragging] = useState(false);

  const cardW = () => {
    const card = trackRef.current?.querySelector<HTMLElement>(`.${styles.card}`);
    return card ? card.offsetWidth + 20 : 270;
  };

  const slide = (dir: 1 | -1) =>
    trackRef.current?.scrollBy({ left: dir * cardW(), behavior: "smooth" });

  /* görünürken oynat, görünmeyince durdur + lazy load */
  useEffect(() => {
    const medias = trackRef.current?.querySelectorAll<HTMLElement>(`.${styles.media}`);
    if (!medias) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const v = e.target.querySelector("video");
          if (!v) return;
          if (e.isIntersecting) {
            if (!v.src && v.dataset.src) {
              v.src = v.dataset.src;
              v.addEventListener(
                "loadeddata",
                () => {
                  v.classList.add(styles.ready);
                  (e.target as HTMLElement).classList.add(styles.hasVideo);
                },
                { once: true }
              );
            }
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.35 }
    );
    medias.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, []);

  /* otomatik kaydırma */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth - 4;
      if (el.scrollLeft >= max) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: cardW(), behavior: "smooth" });
    }, AUTO_MS);
    return () => clearInterval(t);
  }, []);

  /* ilerleme çubuğu */
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    setProgress(8 + p * 92);
    setIndex(Math.min(REELS.length, Math.round(p * (REELS.length - 1)) + 1));
  };

  /* fareyle sürükleme */
  const drag = useRef({ down: false, x: 0, scroll: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { down: true, x: e.clientX, scroll: trackRef.current!.scrollLeft };
    setDragging(true);
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!drag.current.down || !trackRef.current) return;
      trackRef.current.scrollLeft = drag.current.scroll - (e.clientX - drag.current.x);
    };
    const up = () => {
      drag.current.down = false;
      setDragging(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  const toggleMute = (e: React.MouseEvent<HTMLButtonElement>) => {
    const v = e.currentTarget.parentElement?.querySelector("video");
    if (v) v.muted = !v.muted;
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className={styles.reels} aria-label="Hangi model sana göre — video koleksiyonu">
      <div className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Half Leaf · Koleksiyon</span>
          <h2 className={styles.title}>
            Hangi model <em>sana</em> göre?
          </h2>
        </div>
        <a
          className={styles.follow}
          href="https://instagram.com/halfleafstore"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          Bizi takip et
        </a>
      </div>

      <div className={styles.trackWrap}>
        <button className={`${styles.nav} ${styles.navPrev}`} aria-label="Önceki" onClick={() => slide(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button className={`${styles.nav} ${styles.navNext}`} aria-label="Sonraki" onClick={() => slide(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        <div
          ref={trackRef}
          className={`${styles.track} ${dragging ? styles.dragging : ""}`}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
        >
          {REELS.map((r) => (
            <article className={styles.card} key={r.url}>
              <div className={styles.media}>
                {r.badge && <span className={styles.badge}>{r.badge}</span>}
                <div className={styles.ph}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
                  </svg>
                  <span>
                    {r.brand}
                    <br />
                    {r.name}
                  </span>
                </div>
                {r.video && <video muted loop playsInline preload="none" data-src={r.video} />}
                <span className={styles.handle}>{r.handle}</span>
                <button className={styles.mute} aria-label="Sesi aç/kapat" onClick={toggleMute}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                </button>
              </div>
              <div className={styles.info}>
                <span className={styles.brand}>{r.brand}</span>
                <h3 className={styles.name}>{r.name}</h3>
                <p className={styles.price}>
                  <b>{r.price}</b>
                  {r.oldPrice && <s>{r.oldPrice}</s>}
                </p>
                <Link className={styles.cta} href={r.url}>
                  Ürüne Git
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress || 8}%` }} />
        </div>
        <span className={styles.progressCount}>
          {pad(index)} / {pad(REELS.length)}
        </span>
      </div>
    </section>
  );
}
