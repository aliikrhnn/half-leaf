"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Check } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

type StockMovementType = "GIRIS" | "SATIS" | "IADE" | "DUZELTME" | "REZERVASYON" | "REZERVASYON_IPTAL";

interface StockMovement {
  id:             string;
  type:           StockMovementType;
  quantityChange: number;
  reason:         string | null;
  createdAt:      string;
}

interface InventoryDetail {
  id:                string;
  quantity:          number;
  reservedQuantity:  number;
  lowStockThreshold: number;
  updatedAt:         string;
  Product:        { id: string; name: string; sku: string } | null;
  ProductVariant: { id: string; name: string; sku: string } | null;
  StockMovement:  StockMovement[];
}

const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  GIRIS:             "Giriş",
  SATIS:             "Satış",
  IADE:              "İade",
  DUZELTME:          "Düzeltme",
  REZERVASYON:       "Rezervasyon",
  REZERVASYON_IPTAL: "Rezervasyon İptal",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function StokDuzeltmePage() {
  const { id } = useParams<{ id: string }>();

  const [inv, setInv]         = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [quantityChange,    setQuantityChange]    = useState("");
  const [reason,            setReason]            = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");

  const [saving,  setSaving]  = useState(false);
  const [saveOk,  setSaveOk]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const loadInv = () => {
    setLoading(true);
    fetch(`/api/admin/stok/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: InventoryDetail; error?: string }>)
      .then(json => {
        if (!json.success || !json.data) { setFetchError(json.error ?? "Stok kaydı yüklenemedi."); return; }
        setInv(json.data);
        setLowStockThreshold(String(json.data.lowStockThreshold));
      })
      .catch(() => setFetchError("Stok kaydı yüklenemedi."))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(loadInv, [id]);

  const handleSave = async () => {
    if (!inv) return;
    const delta     = quantityChange ? parseInt(quantityChange) : 0;
    const threshold = lowStockThreshold !== "" ? parseInt(lowStockThreshold) : undefined;

    if (delta === 0 && threshold === inv.lowStockThreshold) { setSaveErr("Değişiklik yok."); return; }
    if (delta !== 0 && !reason.trim()) { setSaveErr("Stok değişikliği için neden zorunludur."); return; }

    setSaving(true); setSaveOk(false); setSaveErr("");

    const body: Record<string, unknown> = { quantityChange: delta, ...(reason.trim() && { reason: reason.trim() }), ...(threshold !== undefined && { lowStockThreshold: threshold }) };

    try {
      const res  = await fetch(`/api/admin/stok/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Güncelleme başarısız."); return; }
      setQuantityChange("");
      setReason("");
      loadInv();
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch { setSaveErr("Bir hata oluştu."); }
    finally   { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Stok Düzeltme" />
      <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-bg-elevated rounded-xl animate-pulse" />)}</div>
    </div>
  );

  if (fetchError || !inv) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Stok Düzeltme" actions={<Link href="/admin/stok" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Geri</Link>} />
      <div className="p-6"><div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"><AlertCircle size={16} />{fetchError || "Kayıt bulunamadı."}</div></div>
    </div>
  );

  const name = inv.ProductVariant
    ? `${inv.Product?.name ?? "—"} · ${inv.ProductVariant.name}`
    : (inv.Product?.name ?? "—");
  const sku  = inv.ProductVariant?.sku ?? inv.Product?.sku ?? "—";
  const available = inv.quantity - inv.reservedQuantity;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Stok Düzeltme"
        subtitle={name}
        actions={<Link href="/admin/stok" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Stok</Link>}
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">

          {/* Sol: mevcut durum + düzeltme formu */}
          <div className="space-y-5">
            <div className="bg-bg-surface border border-border-default rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ink mb-4">Mevcut Stok Durumu</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <InfoRow label="SKU" value={<span className="font-mono">{sku}</span>} />
                <InfoRow label="Toplam Stok" value={<span className="text-ink font-semibold">{inv.quantity}</span>} />
                <InfoRow label="Kullanılabilir" value={<span className={`font-semibold ${available <= 0 ? "text-red-400" : available <= inv.lowStockThreshold ? "text-amber-400" : "text-emerald-400"}`}>{available}</span>} />
                <InfoRow label="Rezerve" value={inv.reservedQuantity} />
                <InfoRow label="Düşük Stok Eşiği" value={inv.lowStockThreshold} />
                <InfoRow label="Son Güncelleme" value={formatDate(inv.updatedAt)} />
              </div>
            </div>

            <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-ink">Stok Düzeltme</h3>

              <Field label="Miktar Değişimi (+ ekle, − çıkar)">
                <input
                  type="number"
                  step="1"
                  value={quantityChange}
                  onChange={e => setQuantityChange(e.target.value)}
                  placeholder="+10 veya -5"
                  className={inputCls}
                />
                {quantityChange && !isNaN(parseInt(quantityChange)) && (
                  <p className="text-xs text-ink-dim mt-1">
                    Sonuç: {inv.quantity} → <span className="font-semibold text-ink">{inv.quantity + parseInt(quantityChange)}</span>
                  </p>
                )}
              </Field>

              <Field label="Neden *">
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Stok sayım düzeltmesi, hasar, vb."
                  className={inputCls}
                />
              </Field>

              <Field label="Düşük Stok Eşiği">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {saveErr && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"><AlertCircle size={14} /> {saveErr}</div>}
              {saveOk  && <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm"><Check size={14} /> Stok güncellendi.</div>}

              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor…" : "Düzeltmeyi Uygula"}</Button>
            </div>
          </div>

          {/* Sağ: hareket geçmişi */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Son Hareketler</h3>
            {inv.StockMovement.length === 0 ? (
              <p className="text-xs text-ink-dim">Henüz hareket yok.</p>
            ) : (
              <div className="space-y-2">
                {inv.StockMovement.map(m => (
                  <div key={m.id} className="flex items-start justify-between gap-3 py-2 border-b border-border-default last:border-0">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-ink">{MOVEMENT_LABEL[m.type]}</div>
                      {m.reason && <div className="text-[10px] text-ink-dim truncate">{m.reason}</div>}
                      <div className="text-[10px] text-ink-dim">{formatDate(m.createdAt)}</div>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${m.quantityChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                    </span>
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

const inputCls = "w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
