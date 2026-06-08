"use client";

import { useState } from "react";
import Image from "next/image";
import ImgSlot from "@/components/ui/ImgSlot";

interface ImageData { url: string; alt: string; }

interface Props {
  images: ImageData[];
  name: string;
  isNew: boolean;
}

function GallerySlot({ url, alt, fill, sizes, priority }: { url: string; alt: string; fill?: boolean; sizes?: string; priority?: boolean }) {
  const isReal = url && !url.includes("placehold.co");
  if (!isReal) return <ImgSlot label={alt} className="w-full h-full absolute inset-0" style={{ position: "absolute", inset: 0 }} />;
  return <Image src={url} alt={alt} fill={fill} sizes={sizes} priority={priority} className="object-cover" />;
}

export default function ProductGallery({ images, name, isNew }: Props) {
  const [active, setActive] = useState(0);
  const img = images[active] ?? { url: "", alt: name };

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
          style={{
            position: "relative",
            flex: 1,
            borderRadius: 14,
            overflow: "hidden",
            background: "var(--hl-bg-elev-1)",
            border: "1px solid var(--hl-line)",
            minHeight: 460,
          }}
        >
          <GallerySlot url={img.url} alt={img.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" priority />

          {/* Badges */}
          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6, zIndex: 1 }}>
            {isNew && (
              <span style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.08em", background: "var(--hl-bronze-400)",
                color: "#0A0B09", padding: "3px 8px", borderRadius: 4,
              }}>YENİ</span>
            )}
            <span style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em", background: "var(--hl-olive-700)",
              color: "var(--hl-text-soft)", padding: "3px 8px", borderRadius: 4,
              border: "1px solid var(--hl-line)",
            }}>EL YAPIMI</span>
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
