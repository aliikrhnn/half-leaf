"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Check } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

type OrderStatus    = "BEKLEMEDE" | "ONAYLANDI" | "HAZIRLANIYOR" | "KARGODA" | "TESLIM_EDILDI" | "IPTAL_EDILDI";
type PaymentStatus  = "BEKLIYOR" | "ODENDI" | "BASARISIZ" | "IADE_EDILDI" | "KISMI_IADE";
type ShipmentStatus = "HAZIRLANIYOR" | "KARGOYA_VERILDI" | "YOLDA" | "TESLIM_EDILDI" | "IADE_EDILDI";

interface ShippingAddress {
  fullName?: string;
  phone?: string;
  adres?: string;
  ilce?: string;
  sehir?: string;
  postaKodu?: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  shippingAddress: ShippingAddress;
  customerNote: string | null;
  placedAt: string | null;
  createdAt: string;
  user: { email: string; fullName: string; phone: string | null };
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt: string | null;
  }>;
  shipments: Array<{
    id: string;
    provider: string;
    status: ShipmentStatus;
    trackingNumber: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  }>;
}

const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "BEKLEMEDE",     label: "Beklemede"     },
  { value: "ONAYLANDI",     label: "Onaylandı"     },
  { value: "HAZIRLANIYOR",  label: "Hazırlanıyor"  },
  { value: "KARGODA",       label: "Kargoda"       },
  { value: "TESLIM_EDILDI", label: "Teslim Edildi" },
  { value: "IPTAL_EDILDI",  label: "İptal Edildi"  },
];

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "BEKLIYOR",    label: "Bekliyor"    },
  { value: "ODENDI",      label: "Ödendi"      },
  { value: "BASARISIZ",   label: "Başarısız"   },
  { value: "IADE_EDILDI", label: "İade Edildi" },
  { value: "KISMI_IADE",  label: "Kısmi İade"  },
];

const SHIPMENT_STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: "HAZIRLANIYOR",  label: "Hazırlanıyor"   },
  { value: "KARGOYA_VERILDI", label: "Kargoya Verildi" },
  { value: "YOLDA",         label: "Yolda"           },
  { value: "TESLIM_EDILDI", label: "Teslim Edildi"   },
  { value: "IADE_EDILDI",   label: "İade Edildi"     },
];

const ORDER_STATUS_BADGE: Record<OrderStatus, { label: string; variant: "default" | "new" | "sale" | "featured" | "success" | "danger" | "muted" }> = {
  BEKLEMEDE:    { label: "Beklemede",    variant: "sale"     },
  ONAYLANDI:    { label: "Onaylandı",    variant: "new"      },
  HAZIRLANIYOR: { label: "Hazırlanıyor", variant: "featured" },
  KARGODA:      { label: "Kargoda",      variant: "new"      },
  TESLIM_EDILDI:{ label: "Teslim Edildi",variant: "success"  },
  IPTAL_EDILDI: { label: "İptal Edildi", variant: "danger"   },
};

const PAYMENT_STATUS_BADGE: Record<PaymentStatus, { label: string; variant: "default" | "new" | "sale" | "featured" | "success" | "danger" | "muted" }> = {
  BEKLIYOR:    { label: "Bekliyor",    variant: "muted"   },
  ODENDI:      { label: "Ödendi",      variant: "success" },
  BASARISIZ:   { label: "Başarısız",   variant: "danger"  },
  IADE_EDILDI: { label: "İade Edildi", variant: "default" },
  KISMI_IADE:  { label: "Kısmi İade",  variant: "default" },
};

const SHIPMENT_STATUS_BADGE: Record<ShipmentStatus, { label: string; variant: "default" | "new" | "sale" | "featured" | "success" | "danger" | "muted" }> = {
  HAZIRLANIYOR:    { label: "Hazırlanıyor",    variant: "muted"   },
  KARGOYA_VERILDI: { label: "Kargoya Verildi", variant: "featured"},
  YOLDA:           { label: "Yolda",           variant: "new"     },
  TESLIM_EDILDI:   { label: "Teslim Edildi",   variant: "success" },
  IADE_EDILDI:     { label: "İade Edildi",      variant: "danger"  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-5">
      <h3 className="text-sm font-semibold text-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function SiparisDetayPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { id } = params;

  const [order, setOrder]   = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  /* Update form state */
  const [updateStatus,   setUpdateStatus]   = useState<OrderStatus>("BEKLEMEDE");
  const [updatePayment,  setUpdatePayment]  = useState<PaymentStatus>("BEKLIYOR");
  const [updateShipment, setUpdateShipment] = useState<ShipmentStatus>("HAZIRLANIYOR");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [saving, setSaving]   = useState(false);
  const [saveOk, setSaveOk]   = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    fetch(`/api/admin/siparisler/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: OrderDetail; error?: string }>)
      .then(json => {
        if (!json.success || !json.data) { setError(json.error ?? "Sipariş yüklenemedi."); return; }
        const o = json.data;
        setOrder(o);
        setUpdateStatus(o.status);
        setUpdatePayment(o.payments[0]?.status ?? "BEKLIYOR");
        setUpdateShipment(o.shipments[0]?.status ?? "HAZIRLANIYOR");
        setTrackingNumber(o.shipments[0]?.trackingNumber ?? "");
      })
      .catch(() => setError("Sipariş yüklenemedi."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true); setSaveOk(false); setSaveErr("");

    const body: Record<string, string> = {};
    if (updateStatus   !== order.status)                                body.status          = updateStatus;
    if (updatePayment  !== (order.payments[0]?.status  ?? "BEKLIYOR")) body.paymentStatus   = updatePayment;
    if (updateShipment !== (order.shipments[0]?.status ?? "HAZIRLANIYOR")) body.shipmentStatus = updateShipment;
    if (trackingNumber !== (order.shipments[0]?.trackingNumber ?? "")) body.trackingNumber  = trackingNumber;

    if (Object.keys(body).length === 0) { setSaving(false); return; }

    try {
      const res  = await fetch(`/api/admin/siparisler/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Güncelleme başarısız."); return; }

      /* Refetch to get fresh data */
      const fresh = await fetch(`/api/admin/siparisler/${id}`).then(r => r.json() as Promise<{ success: boolean; data?: OrderDetail }>);
      if (fresh.success && fresh.data) {
        const o = fresh.data;
        setOrder(o);
        setUpdateStatus(o.status);
        setUpdatePayment(o.payments[0]?.status ?? "BEKLIYOR");
        setUpdateShipment(o.shipments[0]?.status ?? "HAZIRLANIYOR");
        setTrackingNumber(o.shipments[0]?.trackingNumber ?? "");
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch {
      setSaveErr("Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Sipariş Detayı" />
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-bg-elevated rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Sipariş Detayı"
        actions={
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> Geri
          </button>
        }
      />
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} />
          {error || "Sipariş bulunamadı."}
        </div>
      </div>
    </div>
  );

  const statusInfo = ORDER_STATUS_BADGE[order.status];
  const addr       = order.shippingAddress;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={`Sipariş #${order.orderNumber}`}
        subtitle={formatDate(order.placedAt ?? order.createdAt)}
        actions={
          <Link href="/admin/siparisler" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> Siparişler
          </Link>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <span className="text-xs text-ink-dim">{formatDate(order.placedAt ?? order.createdAt)}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">

          {/* ── LEFT ── */}
          <div className="space-y-5">

            {/* Order items */}
            <SectionCard title="Sipariş Kalemleri">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left pb-2 text-xs font-medium text-ink-dim uppercase tracking-wider">Ürün</th>
                      <th className="text-left pb-2 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">SKU</th>
                      <th className="text-right pb-2 text-xs font-medium text-ink-dim uppercase tracking-wider">Adet</th>
                      <th className="text-right pb-2 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Birim</th>
                      <th className="text-right pb-2 text-xs font-medium text-ink-dim uppercase tracking-wider">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {order.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-ink leading-tight">{item.productName}</div>
                          {item.variantName && <div className="text-xs text-ink-dim mt-0.5">{item.variantName}</div>}
                        </td>
                        <td className="py-3 pr-4 text-ink-dim font-mono text-xs hidden sm:table-cell">{item.sku}</td>
                        <td className="py-3 text-right text-ink">{item.quantity}</td>
                        <td className="py-3 text-right text-ink-muted hidden sm:table-cell">{formatPrice(item.unitPrice)}</td>
                        <td className="py-3 text-right font-semibold text-gold">{formatPrice(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Customer */}
            <SectionCard title="Müşteri ve İletişim">
              <div className="grid sm:grid-cols-3 gap-4">
                <InfoRow label="Ad Soyad"  value={order.user.fullName} />
                <InfoRow label="E-posta"   value={order.user.email}    />
                <InfoRow label="Telefon"   value={order.user.phone ?? "—"} />
              </div>
            </SectionCard>

            {/* Shipping address */}
            <SectionCard title="Teslimat Adresi">
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoRow label="Ad Soyad" value={addr.fullName ?? "—"} />
                <InfoRow label="Telefon"  value={addr.phone    ?? "—"} />
                <InfoRow label="Adres"    value={addr.adres    ?? "—"} />
                <InfoRow label="İlçe / İl" value={[addr.ilce, addr.sehir].filter(Boolean).join(", ") || "—"} />
                {addr.postaKodu && <InfoRow label="Posta Kodu" value={addr.postaKodu} />}
              </div>
            </SectionCard>

            {/* Customer note */}
            {order.customerNote && (
              <SectionCard title="Müşteri Notu">
                <p className="text-sm text-ink-muted leading-relaxed">{order.customerNote}</p>
              </SectionCard>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-5 xl:sticky xl:top-4">

            {/* Amounts */}
            <SectionCard title="Tutar Özeti">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Ara toplam</span>
                  <span className="text-ink">{formatPrice(order.subtotal)}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">İndirim</span>
                    <span className="text-red-400">−{formatPrice(order.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-muted">Kargo</span>
                  <span className={order.shippingTotal === 0 ? "text-emerald-400" : "text-ink"}>
                    {order.shippingTotal === 0 ? "Ücretsiz" : formatPrice(order.shippingTotal)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-default">
                  <span className="font-semibold text-ink">Genel Toplam</span>
                  <span className="font-bold text-lg text-gold">{formatPrice(order.grandTotal)}</span>
                </div>
              </div>
            </SectionCard>

            {/* Payment */}
            <SectionCard title="Ödeme Bilgisi">
              {order.payments.length === 0 ? (
                <p className="text-xs text-ink-dim">Ödeme kaydı yok.</p>
              ) : (
                <div className="space-y-3">
                  {order.payments.map(p => (
                    <div key={p.id} className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Yöntem</span>
                        <span className="text-ink capitalize">{p.provider}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Durum</span>
                        <Badge variant={PAYMENT_STATUS_BADGE[p.status].variant}>
                          {PAYMENT_STATUS_BADGE[p.status].label}
                        </Badge>
                      </div>
                      {p.paidAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Ödeme Tarihi</span>
                          <span className="text-ink text-xs">{formatDate(p.paidAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Shipment */}
            <SectionCard title="Kargo Bilgisi">
              {order.shipments.length === 0 ? (
                <p className="text-xs text-ink-dim">Kargo kaydı yok.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {order.shipments.slice(0, 1).map(s => (
                    <div key={s.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Firma</span>
                        <span className="text-ink">{s.provider}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Durum</span>
                        <Badge variant={SHIPMENT_STATUS_BADGE[s.status].variant}>
                          {SHIPMENT_STATUS_BADGE[s.status].label}
                        </Badge>
                      </div>
                      {s.trackingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Takip No</span>
                          <span className="text-ink font-mono text-xs">{s.trackingNumber}</span>
                        </div>
                      )}
                      {s.shippedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Kargoya Verildi</span>
                          <span className="text-ink text-xs">{formatDate(s.shippedAt)}</span>
                        </div>
                      )}
                      {s.deliveredAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-ink-muted">Teslim Edildi</span>
                          <span className="text-ink text-xs">{formatDate(s.deliveredAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Update controls */}
            <SectionCard title="Durumu Güncelle">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
                    Sipariş Durumu
                  </label>
                  <select
                    value={updateStatus}
                    onChange={e => setUpdateStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-sm bg-bg rounded-lg border border-border-default text-ink focus:outline-none focus:border-accent"
                  >
                    {ORDER_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
                    Ödeme Durumu
                  </label>
                  <select
                    value={updatePayment}
                    onChange={e => setUpdatePayment(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-sm bg-bg rounded-lg border border-border-default text-ink focus:outline-none focus:border-accent"
                    disabled={order.payments.length === 0}
                  >
                    {PAYMENT_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {order.payments.length === 0 && (
                    <p className="text-[10px] text-ink-dim mt-1">Ödeme kaydı yok.</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
                    Kargo Durumu
                  </label>
                  <select
                    value={updateShipment}
                    onChange={e => setUpdateShipment(e.target.value as ShipmentStatus)}
                    className="w-full px-3 py-2 text-sm bg-bg rounded-lg border border-border-default text-ink focus:outline-none focus:border-accent"
                  >
                    {SHIPMENT_STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
                    Kargo Takip No
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="Takip numarası girin…"
                    className="w-full px-3 py-2 text-sm bg-bg rounded-lg border border-border-default text-ink placeholder-ink-dim focus:outline-none focus:border-accent font-mono"
                  />
                </div>

                {saveErr && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                    <AlertCircle size={13} /> {saveErr}
                  </div>
                )}
                {saveOk && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                    <Check size={13} /> Değişiklikler kaydedildi.
                  </div>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full justify-center"
                >
                  {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
                </Button>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </div>
  );
}
