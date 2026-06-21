"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ImgSlot from "@/components/ui/ImgSlot";

interface ImageData { url: string; alt: string; }

interface Props {
  images: ImageData[];
  name: string;
  isNew: boolean;
}

const arrowBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1px solid var(--hl-line)",
  background: "rgba(10,11,9,0.55)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--hl-text-soft)",
  cursor: "pointer",
  zIndex: 2,
  padding: 0,
};

function GallerySlot({ url, alt, fill, sizes, priority }: { url: string; alt: string; fill?: boolean; sizes?: string; priority?: boolean }) {
  const isReal = url && !url.includes("placehold.co");
  if (!isReal) return <ImgSlot label={alt} className="w-full h-full absolute inset-0" style={{ position: "absolute", inset: 0 }} />;
  return <Image src={url} alt={alt} fill={fill} sizes={sizes} priority={priority} className="object-cover" />;
}

export default function ProductGallery({ images, name, isNew }: Props) {
  const [active, setActive] = useState(0);
  const img = images[active] ?? { url: "", alt: name };
  const multiple = images.length > 1;

  // Sonraki/önceki görsel (başa-sona sarmalı).
  const go = (dir: 1 | -1) => setActive((a) => (a + dir + images.length) % images.length);

  // Dokunmatik/fare ile yatay kaydırma (swipe).
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start || !multiple) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // Yeterince yatay (dikey kaydırma/scroll ile çakışmasın) ve eşik üstü.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!multiple) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  return (
    <div className="flex gap-3" style={{ minHeight: 520 }}>
      {/* Left: vertical thumbnails */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-2" style={{ width: 72, flexShrink: 0 }}>
          {images.map((thumb, i) => {
            const isReal = thumb.url && !thumb.url.includes("placehold.co");
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  overflow: "hidden",
                  position: "relative",
                  border: `1.5px solid ${i === active ? "var(--hl-bronze-400)" : "var(--hl-line-strong)"}`,
                  background: "var(--hl-bg-elev-1)",
                  cursor: "pointer",
                  flexShrink: 0,
                  padding: 0,
                  transition: "border-color 150ms ease",
                }}
                aria-label={`Görsel ${i + 1}`}
              >
                {isReal ? (
                  <Image src={thumb.url} alt={thumb.alt} fill sizes="72px" className="object-cover" />
                ) : (
                  <div className="hl-img-slot" style={{ width: "100%", height: "100%", fontSize: 9 }}>
                    <span>V{i + 1}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Right: main image + dots */}
      <div className="flex flex-col gap-3 flex-1">
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          tabIndex={multiple ? 0 : undefined}
          role={multiple ? "group" : undefined}
          aria-label={multiple ? "Ürün görselleri — kaydırarak veya ok tuşlarıyla gezinin" : undefined}
          style={{
            position: "relative",
            flex: 1,
            borderRadius: 14,
            overflow: "hidden",
            background: "var(--hl-bg-elev-1)",
            border: "1px solid var(--hl-line)",
            minHeight: 460,
            touchAction: "pan-y",
            cursor: multiple ? "grab" : "default",
            outline: "none",
          }}
        >
          <GallerySlot url={img.url} alt={img.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" priority />

          {/* Prev/Next ok butonları */}
          {multiple && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Önceki görsel"
                style={{ ...arrowBtnStyle, left: 12 }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Sonraki görsel"
                style={{ ...arrowBtnStyle, right: 12 }}
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Badges */}
          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6, zIndex: 1 }}>
            {isNew && (
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.08em", background: "var(--hl-bronze-400)",
                color: "#0A0B09", padding: "3px 8px", borderRadius: 4,
              }}>YENİ</span>
            )}
          </div>

          {/* Share button */}
          <button
            style={{
              position: "absolute", top: 14, right: 14, width: 32, height: 32,
              borderRadius: 8, border: "1px solid var(--hl-line)",
              background: "rgba(10,11,9,0.55)", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "var(--hl-text-mute)", cursor: "pointer", zIndex: 1, padding: 0,
            }}
            aria-label="Paylaş"
            onClick={() => {
              if (typeof navigator !== "undefined") {
                if (navigator.share) navigator.share({ title: name, url: window.location.href });
                else navigator.clipboard?.writeText(window.location.href);
              }
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49"/>
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: i === active ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === active ? "var(--hl-bronze-400)" : "var(--hl-line-strong)",
                  border: "none", cursor: "pointer", padding: 0,
                  transition: "width 200ms var(--hl-ease), background 200ms ease",
                }}
                aria-label={`Görsel ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
