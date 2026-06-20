"use client";

import { useState } from "react";
import ImgSlot from "@/components/ui/ImgSlot";
import ReviewsSection, { type ReviewData } from "./ReviewsSection";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  materialName?: string;
  careInfo?: string;
  weightGrams?: number;
  slug: string;
  reviews: ReviewData[];
  ratingAvg: number | null;
  reviewCount: number;
}

const TABS = ["Açıklama", "Malzeme & Bakım", "Paket İçeriği", "Yorumlar"] as const;
type Tab = (typeof TABS)[number];

export default function ProductTabs({ product, materialName, careInfo, weightGrams, slug, reviews, ratingAvg, reviewCount }: Props) {
  const [active, setActive] = useState<Tab>("Açıklama");

  const specs: Array<[string, string]> = [
    ["SKU", product.sku],
    ...(materialName ? [["Malzeme", materialName] as [string, string]] : []),
    ...(weightGrams ? [["Ağırlık", `${weightGrams} g`] as [string, string]] : []),
    ...Object.entries(product.specs ?? {}),
  ];

  return (
    <div>
      {/* Tab navigation */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid var(--hl-line)",
        marginBottom: 36,
        overflowX: "auto",
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              padding: "12px 22px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
              color: active === tab ? "var(--hl-text-main)" : "var(--hl-text-mute)",
              borderBottom: active === tab
                ? "2px solid var(--hl-bronze-400)"
                : "2px solid transparent",
              marginBottom: -1,
              transition: "color 150ms ease, border-color 150ms ease",
            }}
          >
            {tab}{tab === "Yorumlar" ? ` (${reviewCount})` : ""}
          </button>
        ))}
      </div>

      {/* Açıklama */}
      {active === "Açıklama" && (
        <div className="hl-tabs-desc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 210px", gap: 48, alignItems: "start" }}>
          <div>
            <h2 style={{
              fontFamily: "var(--hl-font-display)",
              fontSize: "clamp(20px, 2.2vw, 28px)",
              fontWeight: 400, fontStyle: "italic",
              color: "var(--hl-text-main)", lineHeight: 1.25, marginBottom: 18,
            }}>
              {product.shortDescription}
            </h2>
            <p style={{
              fontFamily: "var(--hl-font-ui)", fontSize: 13, lineHeight: 1.8,
              color: "var(--hl-text-soft)", marginBottom: 32,
            }}>
              {product.description}
            </p>

            {specs.length > 0 && (
              <dl className="hl-spec-grid" style={{
                display: "grid", gridTemplateColumns: "160px 1fr",
                rowGap: 10, columnGap: 20,
                borderTop: "1px solid var(--hl-line)", paddingTop: 24,
              }}>
                {specs.map(([key, val]) => [
                  <dt
                    key={`dt-${key}`}
                    style={{
                      fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "var(--hl-text-mute)", paddingTop: 3,
                    }}
                  >
                    {key}
                  </dt>,
                  <dd
                    key={`dd-${key}`}
                    style={{
                      fontFamily: "var(--hl-font-ui)", fontSize: 12,
                      color: "var(--hl-text-soft)", margin: 0,
                    }}
                  >
                    {val}
                  </dd>,
                ])}
              </dl>
            )}
          </div>

          {/* Placeholder images */}
          <div className="hl-tabs-desc-aside" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(n => (
              <ImgSlot
                key={n}
                label={`${product.name} görsel ${n}`}
                style={{ height: 130, borderRadius: 10 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Malzeme & Bakım */}
      {active === "Malzeme & Bakım" && (
        <div style={{ maxWidth: 620 }}>
          {materialName ? (
            <div style={{ marginBottom: 24 }}>
              <p style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--hl-text-mute)", marginBottom: 8,
              }}>
                Malzeme
              </p>
              <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, lineHeight: 1.7, color: "var(--hl-text-soft)" }}>
                {materialName}
              </p>
            </div>
          ) : null}
          {careInfo ? (
            <div>
              <p style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--hl-text-mute)", marginBottom: 8,
              }}>
                Bakım Talimatları
              </p>
              <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, lineHeight: 1.7, color: "var(--hl-text-soft)" }}>
                {careInfo}
              </p>
            </div>
          ) : null}
          {!materialName && !careInfo && (
            <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
              Malzeme ve bakım bilgisi henüz eklenmemiş.
            </p>
          )}
        </div>
      )}

      {/* Paket İçeriği */}
      {active === "Paket İçeriği" && (
        <div style={{ maxWidth: 620 }}>
          {product.specs?.["Set İçeriği"] ? (
            <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, lineHeight: 1.7, color: "var(--hl-text-soft)" }}>
              {product.specs["Set İçeriği"]}
            </p>
          ) : (
            <p style={{ fontFamily: "var(--hl-font-ui)", fontSize: 13, color: "var(--hl-text-mute)" }}>
              Paket içeriği bilgisi yakında eklenecek.
            </p>
          )}
        </div>
      )}

      {/* Yorumlar */}
      {active === "Yorumlar" && (
        <ReviewsSection slug={slug} reviews={reviews} ratingAvg={ratingAvg} reviewCount={reviewCount} />
      )}
    </div>
  );
}
