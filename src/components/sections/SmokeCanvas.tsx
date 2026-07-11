"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** false → hareket kısıtlı; hafif statik sis çizilir, animasyon yok. */
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  growth: number;
  life: number;
  maxLife: number;
  alpha: number;
  phase: number;
  freq: number;
  rot: number;
  vr: number;
}

/**
 * Gerçekçi, canlı duman — canvas parçacık sistemi. Duman nargilenin lülesinden
 * yükselir; sayfa aşağı kaydırıldıkça parçacıklara aşağı yönlü hız eklenir, yani
 * duman aşağı doğru akar. Parçacık sayısı sınırlı, görünmezken
 * (IntersectionObserver) durdurulur, DPR sınırlı.
 */
export default function SmokeCanvas({ active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Yumuşak duman "puf" dokusu (tek sefer çizilir, her parçacıkta drawImage).
    const puff = document.createElement("canvas");
    puff.width = puff.height = 128;
    const pctx = puff.getContext("2d");
    if (pctx) {
      const g = pctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(228,226,220,0.92)");
      g.addColorStop(0.45, "rgba(198,196,188,0.3)");
      g.addColorStop(1, "rgba(198,196,188,0)");
      pctx.fillStyle = g;
      pctx.beginPath();
      pctx.arc(64, 64, 64, 0, Math.PI * 2);
      pctx.fill();
    }

    const parts: Particle[] = [];
    const MAX = 120;

    const emitter = () => {
      const mobile = w < 768;
      return { ex: (mobile ? 0.5 : 0.802) * w, ey: (mobile ? 0.28 : 0.33) * h };
    };

    const spawn = () => {
      const { ex, ey } = emitter();
      parts.push({
        x: ex + (Math.random() - 0.5) * w * 0.028,
        y: ey + (Math.random() - 0.5) * h * 0.02,
        vx: (Math.random() - 0.5) * 0.34 - 0.05,
        vy: -(0.24 + Math.random() * 0.32),
        r: 10 + Math.random() * 16,
        growth: 0.17 + Math.random() * 0.14,
        life: 0,
        maxLife: 250 + Math.random() * 210,
        alpha: 0,
        phase: Math.random() * Math.PI * 2,
        freq: 0.008 + Math.random() * 0.013,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01,
      });
    };

    // Reduced motion → hafif statik sis (resize'da yeniden çizilir).
    const drawStatic = () => {
      parts.length = 0;
      for (let i = 0; i < 26; i++) {
        spawn();
        const p = parts[parts.length - 1];
        p.y -= Math.random() * h * 0.28;
        p.r += Math.random() * 40;
        p.alpha = 0.05;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "screen";
      for (const p of parts) {
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(puff, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    resize();

    if (!active) {
      const roStatic = new ResizeObserver(() => {
        resize();
        drawStatic();
      });
      roStatic.observe(canvas);
      drawStatic();
      return () => roStatic.disconnect();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    let raf = 0;
    let running = true;
    let t = 0;
    let acc = 0;

    const step = () => {
      if (!running) return;
      t++;

      const sy = window.scrollY;
      const dv = sy - lastScrollY;
      lastScrollY = sy;
      scrollVel += (dv - scrollVel) * 0.15;

      acc += 2.3;
      while (acc >= 1 && parts.length < MAX) {
        spawn();
        acc -= 1;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "screen";

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        const lr = p.life / p.maxLife;

        p.vy -= 0.004; // yükseliş (sıcaklık)
        p.vy += scrollVel * 0.011; // kaydırma → aşağı akış
        p.vx += Math.sin(t * p.freq + p.phase) * 0.02; // türbülans
        p.vx *= 0.99;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.growth;
        p.rot += p.vr;

        const env = lr < 0.18 ? lr / 0.18 : 1 - (lr - 0.18) / 0.82;
        p.alpha = Math.max(0, env) * 0.26;

        if (p.life >= p.maxLife || p.alpha <= 0.001) {
          parts.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.alpha;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.drawImage(puff, -p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(step);
    };

    // Görünmezken duraklat (CPU tasarrufu).
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && !running) {
          running = true;
          lastScrollY = window.scrollY;
          raf = requestAnimationFrame(step);
        } else if (!visible && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    raf = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [active]);

  return <canvas ref={canvasRef} className="hl-smoke-canvas" aria-hidden />;
}
