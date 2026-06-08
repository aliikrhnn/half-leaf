import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { User, Package, MapPin, RotateCcw } from "lucide-react";
import LogoutButton from "./LogoutButton";

const RETURN_WINDOW_DAYS = 14;

export const metadata: Metadata = { title: "Hesabım", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  BEKLEMEDE: "Beklemede",
  ONAYLANDI: "Onaylandı",
  HAZIRLANIYOR: "Hazırlanıyor",
  KARGODA: "Kargoda",
  TESLIM_EDILDI: "Teslim Edildi",
  IPTAL_EDILDI: "İptal Edildi",
};

const STATUS_COLOR: Record<string, string> = {
  BEKLEMEDE: "var(--hl-text-mute)",
  ONAYLANDI: "#7ab87a",
  HAZIRLANIYOR: "#e0a840",
  KARGODA: "var(--hl-bronze-400)",
  TESLIM_EDILDI: "#7ab87a",
  IPTAL_EDILDI: "#e05252",
};

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <span style={{ color: "var(--hl-bronze-400)" }}>{icon}</span>
      <h2 style={{
        fontFamily: "var(--hl-font-display)", fontSize: 22, fontWeight: 400,
        fontStyle: "italic", color: "var(--hl-text)", margin: 0,
      }}>
        {children}
      </h2>
    </div>
  );
}

export default async function HesabimPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hl-token")?.value;
  if (!token) redirect("/giris?redirect=/hesabim");

  let tokenError = false;
  let parsedUserId = "";

  try {
    const payload = await verifyToken(token);
    parsedUserId = payload.userId;
  } catch {
    tokenError = true;
  }

  if (tokenError) redirect("/giris?redirect=/hesabim");
  const userId = parsedUserId;

  const [user, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, fullName: true, phone: true,
        role: true, createdAt: true, isActive: true,
        Address: { orderBy: { isDefault: "desc" } },
      },
    }),
    prisma.order.findMany({
      where: { userId },
      select: {
        id: true, orderNumber: true, status: true,
        grandTotal: true, placedAt: true,
        OrderItem: { select: { productName: true }, take: 1 },
        Shipment: {
          select:  { deliveredAt: true },
          orderBy: { createdAt: "desc" },
          take:    1,
        },
        ReturnRequest: {
          where:  { status: { in: ["TALEP_OLUSTURULDU", "INCELENIYOR", "ONAYLANDI"] } },
          select: { id: true, status: true },
          take:   1,
        },
      },
      orderBy: { placedAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user || !user.isActive) redirect("/giris");

  const panelStyle: React.CSSProperties = {
    background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
    borderRadius: 14, padding: 24,
  };

  return (
    <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 12px)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* Welcome */}
        <div style={{ marginBottom: 36 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 8,
          }}>
            Hesabım
          </p>
          <h1 style={{
            fontFamily: "var(--hl-font-display)",
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 400, fontStyle: "italic",
            color: "var(--hl-text)", lineHeight: 1.1, margin: 0,
          }}>
            Merhaba, {user.fullName?.split(" ")[0] ?? "Değerli Üyemiz"}
          </h1>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
          alignItems: "start",
        }} className="hl-account-grid">

          {/* LEFT: Profile + Addresses */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Profile */}
            <div style={panelStyle}>
              <SectionTitle icon={<User size={16} />}>Profil</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <InfoRow label="Ad Soyad" value={user.fullName ?? "—"} />
                <InfoRow label="E-posta" value={user.email} />
                <InfoRow label="Telefon" value={user.phone ?? "—"} />
                <InfoRow
                  label="Üyelik tarihi"
                  value={new Date(user.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })}
                />
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hl-line)" }}>
                <LogoutButton />
              </div>
            </div>

            {/* Addresses */}
            <div style={panelStyle}>
              <SectionTitle icon={<MapPin size={16} />}>Adreslerim</SectionTitle>
              {user.Address.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--hl-text-mute)", lineHeight: 1.6 }}>
                  Kayıtlı adresiniz bulunmuyor.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {user.Address.map((addr) => (
                    <div key={addr.id} style={{
                      padding: "12px 14px", borderRadius: 10,
                      background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--hl-text)" }}>{addr.title}</span>
                        {addr.isDefault && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", color: "var(--hl-bronze-400)",
                            padding: "2px 7px", borderRadius: 99,
                            border: "1px solid var(--hl-bronze-400)",
                          }}>
                            Varsayılan
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--hl-text-soft)", lineHeight: 1.6, margin: 0 }}>
                        {addr.fullName} · {addr.phone}<br />
                        {addr.fullAddress}<br />
                        {addr.district}, {addr.city}
                        {addr.postalCode ? ` ${addr.postalCode}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Orders */}
          <div style={panelStyle}>
            <SectionTitle icon={<Package size={16} />}>Siparişlerim</SectionTitle>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontSize: 13, color: "var(--hl-text-mute)", marginBottom: 20 }}>
                  Henüz sipariş vermediniz.
                </p>
                <Link href="/urunler" style={{
                  display: "inline-block", padding: "11px 28px", borderRadius: "var(--hl-r-pill)",
                  background: "var(--hl-bronze-400)", color: "#0A0B09",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", textDecoration: "none",
                }}>
                  Alışverişe Başla
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {orders.map((order) => (
                  <div key={order.id} style={{
                    padding: "16px 18px", borderRadius: 10,
                    background: "var(--hl-bg)", border: "1px solid var(--hl-line-strong)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: 10,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)", letterSpacing: "0.02em" }}>
                          #{order.orderNumber}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: STATUS_COLOR[order.status] ?? "var(--hl-text-mute)",
                          padding: "2px 8px", borderRadius: 99,
                          background: "var(--hl-bg-elev-2)",
                        }}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      {order.OrderItem[0] && (
                        <p style={{ fontSize: 11, color: "var(--hl-text-mute)", margin: "0 0 2px 0" }}>
                          {order.OrderItem[0].productName}
                          {orders.find((o) => o.id === order.id)?.OrderItem?.length === 1
                            ? ""
                            : " ve diğerleri"}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: "var(--hl-text-mute)", margin: 0 }}>
                        {order.placedAt
                          ? new Date(order.placedAt).toLocaleDateString("tr-TR", {
                              year: "numeric", month: "long", day: "numeric",
                            })
                          : ""}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--hl-bronze-400)", whiteSpace: "nowrap" }}>
                        {formatPrice(Number(order.grandTotal))}
                      </span>
                      {order.status === "TESLIM_EDILDI" && (() => {
                        const deliveredAt = order.Shipment[0]?.deliveredAt ?? order.placedAt;
                        const daysSince = deliveredAt
                          ? (Date.now() - new Date(deliveredAt).getTime()) / 86_400_000
                          : 999;
                        const activeReturn = order.ReturnRequest[0];
                        if (activeReturn) {
                          return (
                            <Link href={`/hesabim/iade-taleplerim/${activeReturn.id}`} style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                              textTransform: "uppercase", color: "var(--hl-text-mute)",
                              padding: "3px 8px", borderRadius: 99,
                              border: "1px solid var(--hl-line-strong)",
                              textDecoration: "none",
                            }}>
                              İade İncelemede →
                            </Link>
                          );
                        }
                        if (daysSince <= RETURN_WINDOW_DAYS) {
                          return (
                            <Link href={`/hesabim/iade-taleplerim/yeni?siparis=${order.orderNumber}`} style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                              textTransform: "uppercase", color: "var(--hl-text-soft)",
                              padding: "3px 8px", borderRadius: 99,
                              border: "1px solid var(--hl-line-strong)",
                              textDecoration: "none",
                            }}>
                              <RotateCcw size={10} />
                              İade Talebi
                            </Link>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--hl-text-mute)",
        fontFamily: "var(--hl-font-ui)",
      }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--hl-text)", fontFamily: "var(--hl-font-ui)" }}>
        {value}
      </span>
    </div>
  );
}
