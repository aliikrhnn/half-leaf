"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./VideoReels.module.css";

export interface ReelItem {
  video: string;
  handle: string;
  badge: string;
  brand: string;
  name: string;
  /** Veritabanından, güncel kurla TL'ye çevrilmiş ve biçimlendirilmiş fiyat. */
  price: string;
  /** Üstü çizili eski fiyat (indirim yoksa boş). */
  oldPrice: string;
  url: string;
}

/** Videosu olmayan kart bu sürede geçilir. */
const AUTO_MS = 4500;
/** Video ilerlemiyorsa (yüklenemedi / otomatik oynatma engellendi) emniyet süresi. */
const STALL_MS = 12000;
/** İki geçiş arası en az bu kadar beklenir — `ended` ile emniyet aynı anda tetiklenmesin. */
const ADVANCE_GUARD_MS = 600;

export default function VideoReelsCarousel({ reels }: { reels: ReelItem[] }) {
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
  }, [reels]);

  /* fareyle sürükleme */
  const drag = useRef({ down: false, x: 0, scroll: 0 });

  /** Sola en yakın kart = o an "izlenen" kart. */
  const cardEls = useCallback(
    () => Array.from(trackRef.current?.querySelectorAll<HTMLElement>(`.${styles.card}`) ?? []),
    [],
  );

  const currentCardIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    // getBoundingClientRect: offsetLeft konumlanmış ataya (.trackWrap) göre
    // ölçüldüğü için padding kadar kayıyor; ekran koordinatı belirsizlik bırakmaz.
    const trackLeft = el.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    cardEls().forEach((c, i) => {
      const d = Math.abs(c.getBoundingClientRect().left - trackLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, [cardEls]);

  const currentVideo = useCallback(
    () => cardEls()[currentCardIndex()]?.querySelector("video") ?? null,
    [cardEls, currentCardIndex],
  );

  /* ── otomatik ilerleme ───────────────────────────────────────────────
   * Eskiden sabit 4.5 sn'lik zamanlayıcı vardı; videolar `loop` olduğu için
   * hiç bitmiyor, karusel de onları yarıda kesiyordu. Artık kart, videosu
   * bitene kadar bekliyor.
   *
   * Emniyet şart: reel'lerin çoğunda henüz video yok ve yalnızca `ended`e
   * bağlanmak videosuz tek bir kartın karuseli kalıcı olarak durdurmasına
   * yol açardı. Aynısı yüklenemeyen ya da otomatik oynatması engellenen
   * video için de geçerli.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = trackRef.current;
    if (!el) return;

    let lastAdvance = 0;
    const advance = () => {
      if (drag.current.down) return;
      const now = Date.now();
      if (now - lastAdvance < ADVANCE_GUARD_MS) return;
      lastAdvance = now;
      const max = el.scrollWidth - el.clientWidth - 4;
      if (el.scrollLeft >= max) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: cardW(), behavior: "smooth" });
    };

    /* `ended` baloncuklanmaz; yakalama (capture) fazında dinleniyor. */
    const onEnded = (e: Event) => {
      const v = e.target as HTMLVideoElement;
      const isCurrent = v === currentVideo();
      // Biten videoyu başa sar, yoksa kart son karede donmuş görünür.
      v.currentTime = 0;
      void v.play().catch(() => {});
      if (isCurrent) advance();
    };
    el.addEventListener("ended", onEnded, true);

    /* Emniyet saati */
    let seenIndex = currentCardIndex();
    let enteredAt = Date.now();
    let lastTime = -1;
    let lastProgress = Date.now();

    const watch = window.setInterval(() => {
      const idx = currentCardIndex();
      if (idx !== seenIndex) {
        seenIndex = idx;
        enteredAt = Date.now();
        lastTime = -1;
        lastProgress = Date.now();
        return;
      }

      const now = Date.now();
      const v = currentVideo();

      if (!v) {
        // Videosu olmayan kart: eski davranış, sabit süre.
        if (now - enteredAt >= AUTO_MS) advance();
        return;
      }

      if (!v.paused && v.currentTime !== lastTime) {
        lastTime = v.currentTime;
        lastProgress = now;
        return;
      }
      if (now - lastProgress >= STALL_MS) advance();
    }, 1000);

    return () => {
      el.removeEventListener("ended", onEnded, true);
      clearInterval(watch);
    };
  }, [currentCardIndex, currentVideo]);

  /* ilerleme çubuğu */
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    setProgress(8 + p * 92);
    setIndex(Math.min(reels.length, Math.round(p * (reels.length - 1)) + 1));
  };

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

  /**
   * Sesi açık olan reel'in url'i. Tek bir değer tutuluyor: aynı anda birden
   * fazla videodan ses gelmesi istenmiyor, ikinci karta basınca ilki susuyor.
   * Simge de bu duruma bakıyor — eskiden `v.muted` doğrudan değiştiriliyordu,
   * React haberdar olmadığı için ses açılsa bile simge "sessiz" kalıyordu.
   */
  const [soundOn, setSoundOn] = useState<string | null>(null);

  useEffect(() => {
    cardEls().forEach((c, i) => {
      const v = c.querySelector("video");
      if (v) v.muted = reels[i]?.url !== soundOn;
    });
  }, [soundOn, reels, cardEls]);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (reels.length === 0) return null;

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
          {reels.map((r) => (
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
                {/* `loop` yok: video bitmeden karusel kaymasın diye `ended` gerekiyor. */}
                {r.video && <video muted playsInline preload="none" data-src={r.video} />}
                <span className={styles.handle}>{r.handle}</span>
                <button
                  className={styles.mute}
                  aria-label={soundOn === r.url ? "Sesi kapat" : "Sesi aç"}
                  aria-pressed={soundOn === r.url}
                  onClick={() => setSoundOn((prev) => (prev === r.url ? null : r.url))}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    {soundOn === r.url ? (
                      <>
                        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                      </>
                    ) : (
                      <>
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </>
                    )}
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
          {pad(index)} / {pad(reels.length)}
        </span>
      </div>
    </section>
  );
}
