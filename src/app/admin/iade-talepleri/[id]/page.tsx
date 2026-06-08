"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, RotateCcw, User, Package, FileText } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import { formatPrice } from "@/lib/utils";

type ReturnStatus = "TALEP_OLUSTURULDU" | "INCELENIYOR" | "ONAYLANDI" | "REDDEDILDI" | "TAMAMLANDI";
type ReturnType   = "IADE" | "DEGISIM";

interface ReturnItem {
  id:                   string;
  quantity:             number;
  restockedToInventory: boolean;
  orderItemId:          string;
  productName:          string;
  variantName:          string | null;
  unitPrice:            number;
  sku:                  string;
}

interface ReturnDetail {
  id:              string;
  status:          ReturnStatus;
  type:            ReturnType;
  reason:          string;
  adminNote:       string | null;
  rejectionReason: string | null;
  refundAmount:    number | null;
  refundMethod:    string | null;
  refundedAt:      string | null;
  createdAt:       string;
  updatedAt:       string;
  order:   { id: string; orderNumber: string; grandTotal: number; placedAt: string | null };
  customer:{ id: string; fullName: string; email: string; phone: string | null };
  items:   ReturnItem[];
}

const STATUS_LABEL: Record<ReturnStatus, string> = {
  TALEP_OLUSTURULDU: "Talep Edildi",
  INCELENIYOR:       "İnceleniyor",
  ONAYLANDI:         "Onaylandı",
  REDDEDILDI:        "Reddedildi",
  TAMAMLANDI:        "Tamamlandı",
};

const STATUS_COLORS: Record<ReturnStatus, string> = {
  TALEP_OLUSTURULDU: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  INCELENIYOR:       "bg-blue-500/15 text-blue-400 border-blue-500/20",
  ONAYLANDI:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REDDEDILDI:        "bg-red-500/15 text-red-400 border-red-500/20",
  TAMAMLANDI:        "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const TYPE_LABEL: Record<ReturnType, string> = { IADE: "İade", DEGISIM: "Değişim" };

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border-default pb-2 mb-4">
      <Icon size={14} className="text-ink-dim" />
      {children}
    </h2>
  );
}

export default function AdminIadeTalepDetayPage() {
  const { id } = useParams<{ id: string }>();
  const [detail,    setDetail]    = useState<ReturnDetail | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState("");
  const [saveErr,   setSaveErr]   = useState("");

  // Form state
  const [newStatus,        setNewStatus]        = useState<ReturnStatus | "">("");
  const [adminNote,        setAdminNote]        = useState("");
  const [rejectionReason,  setRejectionReason]  = useState("");
  const [refundAmount,     setRefundAmount]     = useState("");
  const [refundMethod,     setRefundMethod]     = useState("");

  const fetchDetail = () => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/iade-talepleri/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: ReturnDetail; error?: string }>)
      .then(json => {
        if (json.success && json.data) {
          setDetail(json.data);
          setAdminNote(json.data.adminNote ?? "");
          setRejectionReason(json.data.rejectionReason ?? "");
          setRefundAmount(json.data.refundAmount !== null ? String(json.data.refundAmount) : "");
          setRefundMethod(json.data.refundMethod ?? "");
        } else {
          setError(json.error ?? "Yüklenemedi.");
        }
      })
      .catch(() => setError("Bağlantı hatası."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: fetchDetail is called once per id change, no cascade
  useEffect(() => { fetchDetail(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    setSaveErr("");

    const body: Record<string, unknown> = {};
    if (newStatus)                           body.status          = newStatus;
    if (adminNote.trim())                    body.adminNote       = adminNote.trim();
    if (rejectionReason.trim())              body.rejectionReason = rejectionReason.trim();
    if (refundAmount && !isNaN(Number(refundAmount))) body.refundAmount = Number(refundAmount);
    if (refundMethod.trim())                 body.refundMethod    = refundMethod.trim();

    if (Object.keys(body).length === 0) { setSaveErr("Değişiklik yapılmadı."); setSaving(false); return; }

    try {
      const res = await fetch(`/api/admin/iade-talepleri/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Kayıt başarısız."); return; }
      setSaveMsg("Kaydedildi.");
      setNewStatus("");
      fetchDetail();
    } catch {
      setSaveErr("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="İade Talebi" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="İade Talebi" />
        <div className="p-6 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />{error || "Talep bulunamadı."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={`İade #${detail.id.slice(-8).toUpperCase()}`}
        subtitle={`${TYPE_LABEL[detail.type]} · ${STATUS_LABEL[detail.status]}`}
      />

      <div className="p-6 space-y-6 flex-1 overflow-auto">

        <Link
          href="/admin/iade-talepleri"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={14} />İade Talepleri
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Sol: Detaylar */}
          <div className="lg:col-span-2 space-y-6">

            {/* Müşteri + Sipariş */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-bg-card border border-border-default rounded-xl p-5">
                <SectionTitle icon={User}>Müşteri</SectionTitle>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-20 text-ink-dim flex-shrink-0">Ad Soyad</dt>
                    <dd>
                      <Link href={`/admin/musteriler/${detail.customer.id}`} className="text-accent-light hover:text-gold transition-colors">
                        {detail.customer.fullName}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 text-ink-dim flex-shrink-0">E-posta</dt>
                    <dd className="text-ink break-all">{detail.customer.email}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 text-ink-dim flex-shrink-0">Telefon</dt>
                    <dd className="text-ink">{detail.customer.phone ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-bg-card border border-border-default rounded-xl p-5">
                <SectionTitle icon={Package}>Sipariş</SectionTitle>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-20 text-ink-dim flex-shrink-0">Sipariş No</dt>
                    <dd>
                      <Link href={`/admin/siparisler/${detail.order.id}`} className="font-mono text-accent-light hover:text-gold transition-colors">
                        {detail.order.orderNumber}
                      </Link>
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 text-ink-dim flex-shrink-0">Tutar</dt>
                    <dd className="text-ink">{formatPrice(detail.order.grandTotal)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 text-ink-dim flex-shrink-0">Talep Tarihi</dt>
                    <dd className="text-ink">{formatDateTime(detail.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* İade Kalemleri */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <SectionTitle icon={RotateCcw}>İade Kalemleri</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border-default">
                      <th className="pb-2 pr-4 text-xs font-medium text-ink-dim">Ürün</th>
                      <th className="pb-2 pr-4 text-xs font-medium text-ink-dim text-right">Birim Fiyat</th>
                      <th className="pb-2 pr-4 text-xs font-medium text-ink-dim text-center">Adet</th>
                      <th className="pb-2 text-xs font-medium text-ink-dim text-center">Stok Geri?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {detail.items.map(ri => (
                      <tr key={ri.id}>
                        <td className="py-2.5 pr-4">
                          <p className="text-ink text-xs font-medium">{ri.productName}</p>
                          {ri.variantName && <p className="text-ink-dim text-xs">{ri.variantName}</p>}
                          <p className="text-ink-dim text-[10px] font-mono">{ri.sku}</p>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-xs text-ink-muted">{formatPrice(ri.unitPrice)}</td>
                        <td className="py-2.5 pr-4 text-center text-xs text-ink">{ri.quantity}</td>
                        <td className="py-2.5 text-center">
                          {ri.restockedToInventory ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Evet</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-ink-dim border border-border-default">Hayır</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gerekçe */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <SectionTitle icon={FileText}>Müşteri Gerekçesi</SectionTitle>
              <p className="text-sm text-ink leading-relaxed">{detail.reason}</p>
            </div>

            {/* Sonuç */}
            {(detail.rejectionReason || detail.refundAmount !== null || detail.refundedAt) && (
              <div className="bg-bg-card border border-border-default rounded-xl p-5">
                <SectionTitle icon={FileText}>Sonuç Bilgileri</SectionTitle>
                <dl className="space-y-3 text-sm">
                  {detail.rejectionReason && (
                    <div className="flex gap-2">
                      <dt className="w-28 text-ink-dim flex-shrink-0">Red Gerekçesi</dt>
                      <dd className="text-red-400">{detail.rejectionReason}</dd>
                    </div>
                  )}
                  {detail.refundAmount !== null && (
                    <div className="flex gap-2">
                      <dt className="w-28 text-ink-dim flex-shrink-0">İade Tutarı</dt>
                      <dd className="text-ink">{formatPrice(detail.refundAmount)}</dd>
                    </div>
                  )}
                  {detail.refundMethod && (
                    <div className="flex gap-2">
                      <dt className="w-28 text-ink-dim flex-shrink-0">İade Yöntemi</dt>
                      <dd className="text-ink">{detail.refundMethod}</dd>
                    </div>
                  )}
                  {detail.refundedAt && (
                    <div className="flex gap-2">
                      <dt className="w-28 text-ink-dim flex-shrink-0">İade Tarihi</dt>
                      <dd className="text-ink">{formatDateTime(detail.refundedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Sağ: Admin Eylemleri */}
          <div className="lg:col-span-1">
            <div className="bg-bg-card border border-border-default rounded-xl p-5 sticky top-4">
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[detail.status]}`}>
                  {STATUS_LABEL[detail.status]}
                </span>
              </div>

              <div className="space-y-4">
                {/* Durum */}
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Durumu Güncelle</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ReturnStatus | "")}
                    className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="">— Değiştirme —</option>
                    {(Object.keys(STATUS_LABEL) as ReturnStatus[]).map(s => (
                      <option key={s} value={s} disabled={s === detail.status}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>

                {/* Red gerekçesi */}
                {(newStatus === "REDDEDILDI" || detail.status === "REDDEDILDI") && (
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1.5">
                      Red Gerekçesi <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Müşteriye gösterilecek red açıklaması…"
                      className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent resize-none"
                    />
                  </div>
                )}

                {/* İade tutarı & yöntemi */}
                {(newStatus === "ONAYLANDI" || newStatus === "TAMAMLANDI" || detail.status === "ONAYLANDI" || detail.status === "TAMAMLANDI") && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">İade Tutarı (₺)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={refundAmount}
                        onChange={e => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">İade Yöntemi</label>
                      <input
                        type="text"
                        value={refundMethod}
                        onChange={e => setRefundMethod(e.target.value)}
                        placeholder="örn. Banka Havalesi"
                        className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                  </>
                )}

                {/* Admin notu */}
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">
                    Admin Notu <span className="text-ink-dim text-[10px]">(yalnız admin görür)</span>
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Dahili not…"
                    className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                {saveMsg && <p className="text-xs text-emerald-400">{saveMsg}</p>}
                {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>

              {/* Tarih bilgisi */}
              <div className="mt-5 pt-4 border-t border-border-default space-y-1">
                <p className="text-[10px] text-ink-dim">Oluşturuldu: {formatDateTime(detail.createdAt)}</p>
                <p className="text-[10px] text-ink-dim">Güncellendi: {formatDateTime(detail.updatedAt)}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
