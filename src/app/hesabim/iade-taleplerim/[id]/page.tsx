import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import CancelButton from "./CancelButton";

export const metadata: Metadata = {
  title: "İade Talebi Detayı",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  TALEP_OLUSTURULDU: "Talep Edildi",
  INCELENIYOR:       "İnceleniyor",
  ONAYLANDI:         "Onaylandı",
  REDDEDILDI:        "Reddedildi",
  TAMAMLANDI:        "Tamamlandı",
};

const STATUS_COLOR: Record<string, string> = {
  TALEP_OLUSTURULDU: "var(--hl-text-mute)",
  INCELENIYOR:       "#e0a840",
  ONAYLANDI:         "#7ab87a",
  REDDEDILDI:        "#e05252",
  TAMAMLANDI:        "var(--hl-bronze-400)",
};

const TYPE_LABEL: Record<string, string> = {
  IADE:    "İade",
  DEGISIM: "Değişim",
};

function formatDate(iso: string | Date | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

type Props = { params: Promise<{ id: string }> };

export default async function IadeTalepDetayPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("hl-token")?.value;
  if (!token) redirect(`/giris?redirect=/hesabim/iade-taleplerim/${id}`);

  let userId = "";
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    redirect(`/giris?redirect=/hesabim/iade-taleplerim/${id}`);
  }

  const rr = await prisma.returnRequest.findFirst({
    where:  { id, userId },
    select: {
      id:              true,
      status:          true,
      type:            true,
      reason:          true,
      rejectionReason: true,
      refundAmount:    true,
      refundMethod:    true,
      refundedAt:      true,
      createdAt:       true,
      updatedAt:       true,
      Order: {
        select: { id: true, orderNumber: true, grandTotal: true, placedAt: true },
      },
      ReturnItem: {
        select: {
          id:       true,
          quantity: true,
          OrderItem: {
            select: { productName: true, variantName: true, unitPrice: true, sku: true },
          },
        },
      },
    },
  });

  if (!rr) notFound();

  const panelStyle: React.CSSProperties = {
    background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
    borderRadius: 14, padding: 24,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: 2,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "var(--hl-text-mute)",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 13, color: "var(--hl-text)",
  };

  return (
    <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 12px)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ marginBottom: 24 }}>
          <Link href="/hesabim/iade-taleplerim" style={{
            fontSize: 11, color: "var(--hl-text-mute)", textDecoration: "none",
            display: "inline-block", marginBottom: 12,
          }}>
            ← İade Taleplerim
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h1 style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(20px, 3vw, 28px)",
              fontWeight: 400, fontStyle: "normal", color: "var(--hl-text)", margin: 0,
            }}>
              İade Talebi Detayı
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "4px 12px", borderRadius: 99,
              background: "var(--hl-bg-elev-2)",
              color: STATUS_COLOR[rr.status] ?? "var(--hl-text-mute)",
              border: `1px solid ${STATUS_COLOR[rr.status] ?? "var(--hl-line)"}`,
            }}>
              {STATUS_LABEL[rr.status] ?? rr.status}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Sipariş Özeti */}
          <div style={panelStyle}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 12 }}>Sipariş</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={rowStyle}>
                <span style={labelStyle}>Sipariş No</span>
                <span style={valueStyle}>#{rr.Order.orderNumber}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Sipariş Tutarı</span>
                <span style={valueStyle}>{formatPrice(Number(rr.Order.grandTotal))}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Talep Türü</span>
                <span style={valueStyle}>{TYPE_LABEL[rr.type] ?? rr.type}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Talep Tarihi</span>
                <span style={valueStyle}>{formatDate(rr.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* İade Kalemleri */}
          <div style={panelStyle}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 12 }}>İade Edilen Ürünler</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rr.ReturnItem.map((ri) => (
                <div key={ri.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: 10,
                  background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)",
                }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-text)", margin: "0 0 2px 0" }}>
                      {ri.OrderItem.productName}
                      {ri.OrderItem.variantName && ` — ${ri.OrderItem.variantName}`}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--hl-text-mute)", margin: 0 }}>
                      SKU: {ri.OrderItem.sku} · {formatPrice(Number(ri.OrderItem.unitPrice))} / adet
                    </p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)", whiteSpace: "nowrap" }}>
                    × {ri.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gerekçe */}
          <div style={panelStyle}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 8 }}>Gerekçeniz</p>
            <p style={{ fontSize: 13, color: "var(--hl-text)", lineHeight: 1.6, margin: 0 }}>{rr.reason}</p>
          </div>

          {/* Durum Bilgileri */}
          {(rr.rejectionReason || rr.refundAmount !== null || rr.refundedAt) && (
            <div style={panelStyle}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 12 }}>Sonuç Bilgileri</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rr.rejectionReason && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>Red Gerekçesi</span>
                    <span style={{ fontSize: 13, color: "#e05252", lineHeight: 1.6 }}>{rr.rejectionReason}</span>
                  </div>
                )}
                {rr.refundAmount !== null && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>İade Tutarı</span>
                    <span style={valueStyle}>{formatPrice(Number(rr.refundAmount))}</span>
                  </div>
                )}
                {rr.refundMethod && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>İade Yöntemi</span>
                    <span style={valueStyle}>{rr.refundMethod}</span>
                  </div>
                )}
                {rr.refundedAt && (
                  <div style={rowStyle}>
                    <span style={labelStyle}>Para İadesi Tarihi</span>
                    <span style={valueStyle}>{formatDate(rr.refundedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* İptal */}
          {rr.status === "TALEP_OLUSTURULDU" && (
            <div style={{ paddingTop: 8 }}>
              <CancelButton returnId={rr.id} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
