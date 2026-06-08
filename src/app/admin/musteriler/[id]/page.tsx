"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, AlertCircle, MapPin, ShoppingBag,
  FileText, Package, TrendingUp, Clock,
} from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import { formatPrice } from "@/lib/utils";

type OrderStatus    = "BEKLEMEDE" | "ONAYLANDI" | "HAZIRLANIYOR" | "KARGODA" | "TESLIM_EDILDI" | "IPTAL_EDILDI";
type PaymentStatus  = "BEKLIYOR"  | "ODENDI"   | "BASARISIZ"   | "IADE_EDILDI" | "KISMI_IADE";
type ConsentType    = "KVKK_AYDINLATMA" | "TICARI_ILETI" | "CEREZ" | "MESAFELI_SATIS" | "ON_BILGILENDIRME";

interface Address {
  id: string; title: string; fullName: string; phone: string;
  city: string; district: string; neighborhood: string;
  fullAddress: string; postalCode: string | null; isDefault: boolean;
}
interface Order {
  id: string; orderNumber: string; status: OrderStatus;
  grandTotal: number; placedAt: string | null; paymentStatus: PaymentStatus | null;
}
interface ConsentLog {
  id: string; consentType: ConsentType; granted: boolean;
  textVersion: string; grantedAt: string;
}
interface Stats { orderCount: number; totalSpend: number; lastOrderAt: string | null }

interface CustomerDetail {
  id: string; fullName: string; email: string; phone: string | null;
  createdAt: string; updatedAt: string; role: string; isActive: boolean;
  addresses: Address[]; orders: Order[]; consentLogs: ConsentLog[]; stats: Stats;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  BEKLEMEDE:     "Beklemede",
  ONAYLANDI:     "Onaylandı",
  HAZIRLANIYOR:  "Hazırlanıyor",
  KARGODA:       "Kargoda",
  TESLIM_EDILDI: "Teslim Edildi",
  IPTAL_EDILDI:  "İptal Edildi",
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  BEKLEMEDE:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  ONAYLANDI:     "bg-blue-500/15 text-blue-400 border-blue-500/20",
  HAZIRLANIYOR:  "bg-purple-500/15 text-purple-400 border-purple-500/20",
  KARGODA:       "bg-orange-500/15 text-orange-400 border-orange-500/20",
  TESLIM_EDILDI: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  IPTAL_EDILDI:  "bg-red-500/15 text-red-400 border-red-500/20",
};

const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  KVKK_AYDINLATMA: "KVKK Aydınlatma",
  TICARI_ILETI:    "Ticari İleti",
  CEREZ:           "Çerez",
  MESAFELI_SATIS:  "Mesafeli Satış",
  ON_BILGILENDIRME:"Ön Bilgilendirme",
};

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2 mb-4">
      <Icon size={14} className="text-ink-dim" />
      {children}
    </h2>
  );
}

export default function MusteriDetayPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch(`/api/admin/musteriler/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: CustomerDetail; error?: string }>)
      .then(json => {
        if (json.success && json.data) setCustomer(json.data);
        else setError(json.error ?? "Müşteri yüklenemedi.");
      })
      .catch(() => setError("Müşteri yüklenemedi."))
      .finally(() => setLoading(false));
  }, [id]);

  const ticariAcik = customer?.consentLogs.find(c => c.consentType === "TICARI_ILETI")?.granted ?? false;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Müşteri Detayı" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Müşteri Detayı" />
        <div className="p-6 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error || "Müşteri bulunamadı."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={customer.fullName}
        subtitle={customer.email}
      />

      <div className="p-6 space-y-6 flex-1 overflow-auto">

        {/* Geri linki */}
        <Link
          href="/admin/musteriler"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} />
          Müşteriler
        </Link>

        {/* A) İstatistikler */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Toplam Sipariş", value: customer.stats.orderCount.toLocaleString("tr-TR"), icon: ShoppingBag },
            { label: "Toplam Harcama", value: formatPrice(customer.stats.totalSpend),            icon: TrendingUp  },
            { label: "Son Sipariş",    value: formatDate(customer.stats.lastOrderAt),             icon: Clock       },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-bg-card border border-border-default">
              <div className="p-2.5 rounded-lg bg-bg-elevated w-fit">
                <Icon size={16} className="text-ink-muted" />
              </div>
              <div>
                <p className="text-lg font-bold text-ink">{value}</p>
                <p className="text-xs text-ink-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* B) Profil Bilgileri */}
          <div className="lg:col-span-1 bg-bg-card border border-border-default rounded-xl p-5">
            <SectionTitle icon={Package}>Profil Bilgileri</SectionTitle>
            <dl className="space-y-3 text-sm">
              {[
                { label: "Ad Soyad",      value: customer.fullName },
                { label: "E-posta",       value: customer.email },
                { label: "Telefon",       value: customer.phone ?? "—" },
                { label: "Rol",           value: customer.role === "ADMIN" ? "Yönetici" : "Müşteri" },
                { label: "Durum",         value: customer.isActive ? "Aktif" : "Pasif" },
                { label: "Kayıt Tarihi",  value: formatDateTime(customer.createdAt) },
                { label: "Son Güncelleme",value: formatDateTime(customer.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <dt className="w-32 flex-shrink-0 text-ink-dim">{label}</dt>
                  <dd className="text-ink break-all">{value}</dd>
                </div>
              ))}
              <div className="flex gap-2">
                <dt className="w-32 flex-shrink-0 text-ink-dim">Ticari İleti</dt>
                <dd>
                  {ticariAcik ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Açık</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-ink-dim border border-border-default">Kapalı</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-2 space-y-6">

            {/* C) Adresler */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <SectionTitle icon={MapPin}>Adresler</SectionTitle>
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-ink-dim italic">Kayıtlı adres yok.</p>
              ) : (
                <div className="space-y-3">
                  {customer.addresses.map(addr => (
                    <div
                      key={addr.id}
                      className="p-3 rounded-lg bg-bg-elevated border border-border-default text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-ink">{addr.title}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-accent/15 text-accent rounded-full border border-accent/20">Varsayılan</span>
                        )}
                      </div>
                      <p className="text-ink-muted">{addr.fullName} · {addr.phone}</p>
                      <p className="text-ink-dim text-xs mt-1">
                        {addr.fullAddress}, {addr.neighborhood}, {addr.district}/{addr.city}
                        {addr.postalCode ? ` (${addr.postalCode})` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* D) Sipariş Geçmişi */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <SectionTitle icon={ShoppingBag}>Sipariş Geçmişi</SectionTitle>
              {customer.orders.length === 0 ? (
                <p className="text-sm text-ink-dim italic">Sipariş yok.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2 pr-3 text-xs font-medium text-ink-dim">Sipariş No</th>
                          <th className="pb-2 pr-3 text-xs font-medium text-ink-dim hidden sm:table-cell">Tarih</th>
                          <th className="pb-2 pr-3 text-xs font-medium text-ink-dim">Durum</th>
                          <th className="pb-2 text-xs font-medium text-ink-dim text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {customer.orders.map(o => (
                          <tr key={o.id} className="hover:bg-bg-elevated/50 transition-colors">
                            <td className="py-2.5 pr-3">
                              <Link
                                href={`/admin/siparisler/${o.id}`}
                                className="font-mono text-xs text-accent-light hover:text-gold transition-colors"
                              >
                                {o.orderNumber}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-3 text-xs text-ink-dim hidden sm:table-cell">
                              {formatDate(o.placedAt)}
                            </td>
                            <td className="py-2.5 pr-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${ORDER_STATUS_COLORS[o.status]}`}>
                                {ORDER_STATUS_LABELS[o.status]}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-xs text-ink">
                              {formatPrice(o.grandTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {customer.stats.orderCount > customer.orders.length && (
                    <div className="mt-3 pt-3 border-t border-border-default">
                      <Link
                        href={`/admin/siparisler?musteri=${customer.id}`}
                        className="text-xs text-accent-light hover:text-gold transition-colors"
                      >
                        Tümünü gör → ({customer.stats.orderCount} sipariş)
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {/* E) Onay Geçmişi */}
        <div className="bg-bg-card border border-border-default rounded-xl p-5">
          <SectionTitle icon={FileText}>KVKK / Onay Geçmişi</SectionTitle>
          {customer.consentLogs.length === 0 ? (
            <p className="text-sm text-ink-dim italic">Onay kaydı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border-default">
                    <th className="pb-2 pr-4 text-xs font-medium text-ink-dim">Onay Türü</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-ink-dim text-center">Durum</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-ink-dim hidden sm:table-cell">Metin Versiyonu</th>
                    <th className="pb-2 text-xs font-medium text-ink-dim">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {customer.consentLogs.map(c => (
                    <tr key={c.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="py-2.5 pr-4 text-ink text-xs">{CONSENT_TYPE_LABELS[c.consentType] ?? c.consentType}</td>
                      <td className="py-2.5 pr-4 text-center">
                        {c.granted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Evet</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/20">Hayır</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell text-ink-dim text-xs font-mono">{c.textVersion}</td>
                      <td className="py-2.5 text-ink-dim text-xs">{formatDateTime(c.grantedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
