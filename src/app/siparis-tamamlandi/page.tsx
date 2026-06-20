import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, Package, Truck, ShoppingBag, Clock } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import HalfLeafLogo from "@/components/brand/HalfLeafLogo";
import SuccessClient from "./SuccessClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sipariş Alındı", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ no?: string }>;
}

export default async function SiparisTamamlandiPage({ searchParams }: Props) {
  const { no } = await searchParams;

  const order = no
    ? await prisma.order.findUnique({
        where: { orderNumber: no },
        include: {
          OrderItem: true,
          Shipment: { take: 1 },
          Payment: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      })
    : null;

  const payment = order?.Payment[0] ?? null;
  const isPaytr = payment?.provider === "paytr";
  const isHavale = payment?.provider === "HAVALE_EFT";
  const isPaid = payment?.status === "ODENDI";
  // PayTR kart ödemesi henüz onaylanmadıysa (bildirim gecikmiş) sayfayı izle.
  const isPaytrPending = isPaytr && payment?.status === "BEKLIYOR";

  // Ödeme başarısız/iptal olduysa bu sayfada "başarılı" gösterme — hata sayfasına yönlendir.
  // (Kullanıcı pending iken buraya gelip, callback sonradan failed işlerse bu yakalar.)
  if (order && (payment?.status === "BASARISIZ" || order.status === "IPTAL_EDILDI")) {
    redirect(`/odeme/hata?no=${encodeURIComponent(order.orderNumber)}`);
  }

  return (
    <div style={{
      background: "var(--hl-bg)", minHeight: "100vh", color: "var(--hl-text)",
      fontFamily: "var(--hl-font-ui)",
    }}>
      {/* Minimal header */}
      <header style={{
        padding: "18px 56px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid var(--hl-line)",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <HalfLeafLogo width={14} height={24} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-bronze-400)" }}>Half Leaf</span>
        </Link>
        <span style={{ fontSize: 11, color: "var(--hl-text-mute)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Sipariş Onayı
        </span>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "64px 24px 80px", textAlign: "center" }}>
        {!order ? (
          /* Order not found */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <ShoppingBag size={56} style={{ color: "var(--hl-text-mute)" }} />
            <h1 style={{
              fontFamily: "var(--hl-font-display)", fontSize: 36, fontWeight: 400,
              fontStyle: "italic", color: "var(--hl-text)", margin: 0,
            }}>
              Sipariş bulunamadı
            </h1>
            <p style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>
              Sipariş numaranızı kontrol edin veya müşteri hizmetlerimizle iletişime geçin.
            </p>
            <Link href="/urunler" style={{
              padding: "12px 32px", borderRadius: "var(--hl-r-pill)",
              background: "var(--hl-bronze-400)", color: "#0A0B09",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", textDecoration: "none",
            }}>
              Alışverişe Dön
            </Link>
          </div>
        ) : (
          /* Success */
          <>
            <SuccessClient clear={isPaid} watch={isPaytrPending} />

            {/* Status icon */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: isPaytrPending ? "rgba(201,160,106,0.12)" : "rgba(122,184,122,0.12)",
              border: isPaytrPending ? "1px solid rgba(201,160,106,0.3)" : "1px solid rgba(122,184,122,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              {isPaytrPending
                ? <Clock size={36} color="var(--hl-bronze-400)" />
                : <CheckCircle size={36} color="#7ab87a" />}
            </div>

            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 12,
            }}>
              {isPaytrPending ? "Ödeme Onaylanıyor" : "Siparişiniz Alındı"}
            </p>

            <h1 style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 400, fontStyle: "italic", color: "var(--hl-text)",
              lineHeight: 1.1, margin: "0 0 16px 0",
            }}>
              {isPaytrPending ? "Ödemeniz işleniyor…" : "Teşekkürler!"}
            </h1>

            {/* Status-aware message */}
            {isPaytrPending ? (
              <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 32 }}>
                Ödemeniz bankadan onaylanıyor. Bu işlem birkaç saniye sürebilir — sayfa onaylandığında
                otomatik olarak güncellenecektir.
              </p>
            ) : isHavale ? (
              <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 32 }}>
                Siparişiniz alındı. Havale/EFT ödemeniz hesabımıza ulaştığında siparişiniz onaylanır.
                Açıklamaya <strong style={{ color: "var(--hl-text-soft)" }}>sipariş numaranızı</strong> yazmayı unutmayın.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--hl-text-mute)", lineHeight: 1.7, marginBottom: 32 }}>
                {isPaid ? "Ödemeniz onaylandı ve siparişiniz hazırlanıyor. " : "Siparişiniz başarıyla alındı. "}
                Onay e-postası adresinize gönderildi.
              </p>
            )}

            {/* Order number badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 24px", borderRadius: 12,
              background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line-strong)",
              marginBottom: 40,
            }}>
              <Package size={16} style={{ color: "var(--hl-bronze-400)" }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--hl-text-mute)", marginBottom: 2 }}>
                  Sipariş Numarası
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--hl-text)", letterSpacing: "0.02em" }}>
                  {order.orderNumber}
                </p>
              </div>
            </div>

            {/* Order items */}
            <div style={{
              background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
              borderRadius: 14, padding: 24, marginBottom: 24, textAlign: "left",
            }}>
              <h3 style={{
                fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--hl-text-mute)",
                marginBottom: 16,
              }}>
                Sipariş İçeriği
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {order.OrderItem.map(item => (
                  <div key={item.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    paddingBottom: 12, borderBottom: "1px solid var(--hl-line)",
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--hl-text)", marginBottom: 2 }}>
                        {item.productName}
                      </p>
                      {item.variantName && (
                        <p style={{ fontSize: 11, color: "var(--hl-text-mute)" }}>{item.variantName}</p>
                      )}
                      <p style={{ fontSize: 11, color: "var(--hl-text-mute)" }}>× {item.quantity}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-bronze-400)" }}>
                      {formatPrice(Number(item.lineTotal))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {Number(order.discountTotal) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>İndirim</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e05252" }}>
                      −{formatPrice(Number(order.discountTotal))}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--hl-text-mute)" }}>Kargo</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: Number(order.shippingTotal) === 0 ? "var(--hl-success)" : "var(--hl-text-soft)" }}>
                    {Number(order.shippingTotal) === 0 ? "Ücretsiz" : formatPrice(Number(order.shippingTotal))}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--hl-line)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hl-text)" }}>TOPLAM</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--hl-bronze-400)" }}>
                    {formatPrice(Number(order.grandTotal))}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment info */}
            {order.Shipment[0] && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
                borderRadius: 12, background: "var(--hl-bg-elev-1)",
                border: "1px solid var(--hl-line)", marginBottom: 36, textAlign: "left",
              }}>
                <Truck size={18} style={{ color: "var(--hl-bronze-400)", flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--hl-text)", marginBottom: 2 }}>
                    {order.Shipment[0].provider}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--hl-text-mute)" }}>
                    Kargo takip bilgileri hazırlandığında e-posta ile iletilecektir.
                  </p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/urunler" style={{
                padding: "13px 32px", borderRadius: "var(--hl-r-pill)",
                background: "var(--hl-bronze-400)", color: "#0A0B09",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", textDecoration: "none",
              }}>
                Alışverişe Devam Et
              </Link>
              <Link href="/hesabim/siparisler" style={{
                padding: "13px 32px", borderRadius: "var(--hl-r-pill)",
                border: "1.5px solid var(--hl-line-strong)", background: "none",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", textDecoration: "none", color: "var(--hl-text-soft)",
              }}>
                Siparişlerim
              </Link>
            </div>
          </>
        )}
      </main>

      {/* Minimal footer */}
      <footer style={{
        borderTop: "1px solid var(--hl-line)", padding: "16px 56px",
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: "var(--hl-text-mute)",
      }}>
        <span>© {new Date().getFullYear()} Half Leaf</span>
        <Link href="/iletisim" style={{ color: "var(--hl-text-mute)", textDecoration: "none" }}>İletişim</Link>
      </footer>
    </div>
  );
}
