import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Store, MessageSquarePlus } from "lucide-react";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { formatPrice } from "@/lib/utils";
import CancelOrderButton from "./CancelOrderButton";

export const metadata: Metadata = {
  title: "Sipariş Detayı",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  BEKLEMEDE: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  HAZIRLANIYOR: "Hazırlanıyor",
  TESLIME_HAZIR: "Mağazadan teslim alınabilir",
  KARGODA: "Kargoda",
  TESLIM_EDILDI: "Teslim edildi",
  IPTAL_EDILDI: "İptal edildi",
};

const STATUS_COLOR: Record<string, string> = {
  BEKLEMEDE: "var(--hl-text-mute)",
  ONAYLANDI: "#7ab87a",
  HAZIRLANIYOR: "#e0a840",
  TESLIME_HAZIR: "#5f9a52",
  KARGODA: "var(--hl-bronze-400)",
  TESLIM_EDILDI: "#7ab87a",
  IPTAL_EDILDI: "#e05252",
};

/** Müşterinin kendi iptal edebileceği durumlar — uçla (api/siparis/…/iptal) aynı. */
const IPTAL_EDILEBILIR = new Set(["BEKLEMEDE", "ONAYLANDI"]);

interface AddressShape {
  fullName?: string;
  phone?: string;
  adres?: string;
  ilce?: string;
  sehir?: string;
  postaKodu?: string;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{
      background: "var(--hl-bg-elev-1)", border: "1px solid var(--hl-line)",
      borderRadius: 14, padding: 22,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
        <span style={{ color: "var(--hl-bronze-400)", display: "flex" }}>{icon}</span>
        <h2 style={{
          fontFamily: "var(--hl-font-ui)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--hl-text-mute)", margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 14,
      padding: "7px 0", borderBottom: "1px solid var(--hl-line)",
      fontSize: 13,
    }}>
      <span style={{ color: "var(--hl-text-mute)" }}>{label}</span>
      <span style={{ color: "var(--hl-text)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default async function SiparisDetayPage(
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("hl-token")?.value;
  if (!token) redirect(`/giris?redirect=/hesabim/siparisler/${encodeURIComponent(orderNumber)}`);

  let userId = "";
  try {
    const payload = await verifyToken(token);
    userId = payload.userId;
  } catch {
    redirect(`/giris?redirect=/hesabim/siparisler/${encodeURIComponent(orderNumber)}`);
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      userId: true,
      status: true,
      subtotal: true,
      discountTotal: true,
      shippingTotal: true,
      grandTotal: true,
      shippingAddress: true,
      customerNote: true,
      shippingMethod: true,
      placedAt: true,
      OrderItem: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          Product: {
            select: {
              slug: true,
              isActive: true,
              ProductImage: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true, altText: true },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      Payment: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { provider: true, status: true, paidAt: true },
      },
      Shipment: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { provider: true, status: true, trackingNumber: true, trackingUrl: true, shippedAt: true },
      },
    },
  });

  // Başkasının siparişi de "bulunamadı" döner — varlığı sızdırılmaz.
  if (!order || order.userId !== userId) notFound();

  const storePickup = order.shippingMethod === "DUKKAN_TESLIM";
  const addr = (order.shippingAddress ?? {}) as AddressShape;
  const payment = order.Payment[0];
  const shipment = order.Shipment[0];
  const odendi = payment?.status === "ODENDI";
  const iptalEdilebilir = IPTAL_EDILEBILIR.has(order.status);
  const teslimEdildi = order.status === "TESLIM_EDILDI";

  const settings = storePickup
    ? await prisma.siteSettings.findUnique({
        where: { id: "site" },
        select: { contactAddress: true, storeHours: true, contactPhone: true },
      })
    : null;

  return (
    <div style={{ paddingTop: "calc(var(--hl-bar-h) + var(--hl-header-h) + 12px)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>

        <Link href="/hesabim" style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
          fontSize: 12, color: "var(--hl-text-mute)", textDecoration: "none",
          fontFamily: "var(--hl-font-ui)",
        }}>
          <ArrowLeft size={13} /> Hesabıma dön
        </Link>

        {/* Başlık */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1 style={{
              fontFamily: "var(--hl-font-display)", fontSize: "clamp(24px, 3.5vw, 34px)",
              fontWeight: 400, color: "var(--hl-text)", margin: 0, lineHeight: 1.1,
            }}>
              #{order.orderNumber}
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: STATUS_COLOR[order.status] ?? "var(--hl-text-mute)",
              padding: "4px 11px", borderRadius: 99,
              border: `1px solid ${STATUS_COLOR[order.status] ?? "var(--hl-line-strong)"}`,
            }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--hl-text-mute)", margin: 0 }}>
            {order.placedAt
              ? new Date(order.placedAt).toLocaleDateString("tr-TR", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : ""}
          </p>
        </div>

        {/* Mağazadan teslim: hazır bilgisi */}
        {storePickup && order.status === "TESLIME_HAZIR" && (
          <div style={{
            marginBottom: 22, padding: "16px 18px", borderRadius: 12,
            background: "rgba(95,154,82,0.1)", border: "1px solid rgba(95,154,82,0.35)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-text)", margin: "0 0 6px" }}>
              Siparişiniz hazır — mağazamızdan teslim alabilirsiniz.
            </p>
            {settings?.contactAddress && (
              <p style={{ fontSize: 12, color: "var(--hl-text-soft)", margin: "0 0 3px" }}>
                {settings.contactAddress}
              </p>
            )}
            {settings?.storeHours && (
              <p style={{ fontSize: 12, color: "var(--hl-text-soft)", margin: "0 0 3px" }}>
                Çalışma saatleri: {settings.storeHours}
              </p>
            )}
            {settings?.contactPhone && (
              <p style={{ fontSize: 12, color: "var(--hl-text-soft)", margin: 0 }}>
                Telefon: {settings.contactPhone}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Ürünler */}
          <Panel title="Ürünler" icon={<Package size={15} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {order.OrderItem.map((item) => {
                const img = item.Product?.ProductImage[0];
                const slug = item.Product?.slug;
                const linkVerilebilir = Boolean(slug && item.Product?.isActive);

                const gorsel = (
                  <div style={{
                    width: 68, height: 68, borderRadius: 10, overflow: "hidden",
                    background: "var(--hl-bg-elev-2)", border: "1px solid var(--hl-line)",
                    flexShrink: 0, position: "relative",
                  }}>
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.altText || item.productName}
                        fill
                        sizes="68px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : null}
                  </div>
                );

                return (
                  <div key={item.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    {linkVerilebilir ? (
                      <Link href={`/urunler/${slug}`} style={{ textDecoration: "none" }}>{gorsel}</Link>
                    ) : gorsel}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {linkVerilebilir ? (
                        <Link href={`/urunler/${slug}`} style={{
                          fontSize: 14, fontWeight: 600, color: "var(--hl-text)",
                          textDecoration: "none", display: "block", marginBottom: 3,
                        }}>
                          {item.productName}
                        </Link>
                      ) : (
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--hl-text)", margin: "0 0 3px" }}>
                          {item.productName}
                        </p>
                      )}

                      {item.variantName && (
                        <p style={{ fontSize: 12, color: "var(--hl-text-mute)", margin: "0 0 3px" }}>
                          {item.variantName}
                        </p>
                      )}
                      <p style={{ fontSize: 12, color: "var(--hl-text-mute)", margin: 0 }}>
                        {item.quantity} adet × {formatPrice(Number(item.unitPrice))}
                      </p>

                      {/* Yorum yazma: yalnızca teslim edilmiş siparişlerde ve ürün
                          hâlâ yayındaysa anlamlı. Bağlantı ürün sayfasındaki
                          Yorumlar sekmesini doğrudan açar. */}
                      {teslimEdildi && linkVerilebilir && (
                        <Link
                          href={`/urunler/${slug}#yorumlar`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8,
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                            textTransform: "uppercase", color: "var(--hl-bronze-400)",
                            textDecoration: "none", padding: "4px 10px", borderRadius: 99,
                            border: "1px solid var(--hl-line-strong)",
                          }}
                        >
                          <MessageSquarePlus size={11} /> Yorum Yaz
                        </Link>
                      )}
                    </div>

                    <span style={{
                      fontSize: 14, fontWeight: 700, color: "var(--hl-bronze-400)", whiteSpace: "nowrap",
                    }}>
                      {formatPrice(Number(item.lineTotal))}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--hl-line)" }}>
              <Row label="Ara toplam" value={formatPrice(Number(order.subtotal))} />
              {Number(order.discountTotal) > 0 && (
                <Row label="İndirim" value={`− ${formatPrice(Number(order.discountTotal))}`} />
              )}
              <Row
                label="Kargo"
                value={Number(order.shippingTotal) > 0 ? formatPrice(Number(order.shippingTotal)) : "Ücretsiz"}
              />
              <div style={{
                display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 4,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--hl-text)" }}>Toplam</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--hl-bronze-400)" }}>
                  {formatPrice(Number(order.grandTotal))}
                </span>
              </div>
            </div>
          </Panel>

          {/* Teslimat */}
          <Panel
            title={storePickup ? "Teslimat · Mağazadan Teslim" : "Teslimat · Kargo"}
            icon={storePickup ? <Store size={15} /> : <Truck size={15} />}
          >
            {storePickup ? (
              <div style={{ fontSize: 13, color: "var(--hl-text-soft)", lineHeight: 1.8 }}>
                <p style={{ margin: 0 }}>Siparişinizi mağazamızdan teslim alacaksınız.</p>
                {settings?.contactAddress && <p style={{ margin: "6px 0 0" }}>{settings.contactAddress}</p>}
                {settings?.storeHours && <p style={{ margin: "4px 0 0" }}>Çalışma saatleri: {settings.storeHours}</p>}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--hl-text-soft)", lineHeight: 1.8, marginBottom: 12 }}>
                  {addr.fullName && <div style={{ color: "var(--hl-text)", fontWeight: 600 }}>{addr.fullName}</div>}
                  {addr.adres && <div>{addr.adres}</div>}
                  <div>{[addr.ilce, addr.sehir, addr.postaKodu].filter(Boolean).join(" · ")}</div>
                  {addr.phone && <div>{addr.phone}</div>}
                </div>
                {shipment?.trackingNumber ? (
                  <div style={{ paddingTop: 12, borderTop: "1px solid var(--hl-line)" }}>
                    <Row label="Kargo firması" value={shipment.provider} />
                    <Row
                      label="Takip numarası"
                      value={<span style={{ fontFamily: "monospace" }}>{shipment.trackingNumber}</span>}
                    />
                    {shipment.trackingUrl && /^https?:\/\//i.test(shipment.trackingUrl) && (
                      <div style={{ marginTop: 10 }}>
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "var(--hl-bronze-400)" }}
                        >
                          Kargoyu takip et →
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--hl-text-mute)", margin: 0 }}>
                    Kargoya verildiğinde takip numarası burada görünecek.
                  </p>
                )}
              </>
            )}
          </Panel>

          {/* Ödeme */}
          <Panel title="Ödeme" icon={<CreditCard size={15} />}>
            <Row
              label="Yöntem"
              value={payment?.provider === "paytr" ? "Kredi/Banka kartı" : "Havale / EFT"}
            />
            <Row
              label="Durum"
              value={odendi ? "Ödendi" : payment?.status === "BASARISIZ" ? "Başarısız" : "Bekliyor"}
            />
            {payment?.paidAt && (
              <Row
                label="Ödeme tarihi"
                value={new Date(payment.paidAt).toLocaleDateString("tr-TR", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
          </Panel>

          {order.customerNote && (
            <Panel title="Sipariş Notunuz" icon={<MapPin size={15} />}>
              <p style={{ fontSize: 13, color: "var(--hl-text-soft)", lineHeight: 1.8, margin: 0 }}>
                {order.customerNote}
              </p>
            </Panel>
          )}

          {/* İptal */}
          {iptalEdilebilir && (
            <div>
              <CancelOrderButton orderNumber={order.orderNumber} paid={odendi} />
              <p style={{ fontSize: 11, color: "var(--hl-text-mute)", margin: "8px 0 0", lineHeight: 1.7 }}>
                Sipariş hazırlanmaya başladıktan sonra iptal edilemez; bu durumda bizimle iletişime geçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
