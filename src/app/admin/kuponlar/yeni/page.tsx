"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

export default function YeniKuponPage() {
  const router = useRouter();

  const [code,           setCode]           = useState("");
  const [description,    setDescription]    = useState("");
  const [discountType,   setDiscountType]   = useState<"YUZDE" | "SABIT">("YUZDE");
  const [value,          setValue]          = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses,        setMaxUses]        = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("");
  const [startsAt,       setStartsAt]       = useState("");
  const [expiresAt,      setExpiresAt]      = useState("");
  const [isActive,       setIsActive]       = useState(true);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    if (!code.trim() || !value) { setError("Kod ve indirim değeri zorunludur."); return; }
    setSaving(true); setError("");

    const body: Record<string, unknown> = {
      code:         code.trim().toUpperCase(),
      discountType,
      value:        parseFloat(value),
      isActive,
      ...(description    && { description:    description.trim()    }),
      ...(minOrderAmount && { minOrderAmount: parseFloat(minOrderAmount) }),
      ...(maxUses        && { maxUses:        parseInt(maxUses)        }),
      ...(maxUsesPerUser && { maxUsesPerUser: parseInt(maxUsesPerUser) }),
      ...(startsAt       && { startsAt:       new Date(startsAt).toISOString() }),
      ...(expiresAt      && { expiresAt:      new Date(expiresAt).toISOString() }),
    };

    try {
      const res  = await fetch("/api/admin/kuponlar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Kupon oluşturulamadı."); return; }
      router.push("/admin/kuponlar");
    } catch { setError("Bir hata oluştu."); }
    finally   { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Yeni Kupon"
        actions={
          <Link href="/admin/kuponlar" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> Kuponlar
          </Link>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="space-y-5 max-w-xl">
          <Field label="Kupon Kodu *">
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="YENIYIL20" className={inputCls} />
          </Field>

          <Field label="Açıklama">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="İsteğe bağlı açıklama" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="İndirim Tipi *">
              <select value={discountType} onChange={e => setDiscountType(e.target.value as "YUZDE" | "SABIT")} className={inputCls}>
                <option value="YUZDE">Yüzde (%)</option>
                <option value="SABIT">Sabit (₺)</option>
              </select>
            </Field>
            <Field label="İndirim Değeri *">
              <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder={discountType === "YUZDE" ? "20" : "50"} className={inputCls} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Min. Sipariş Tutarı (₺)">
              <input type="number" min="0" step="0.01" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Max. Kullanım Sayısı">
              <input type="number" min="1" step="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Sınırsız" className={inputCls} />
            </Field>
          </div>

          <Field label="Kullanıcı Başına Max. Kullanım">
            <input type="number" min="1" step="1" value={maxUsesPerUser} onChange={e => setMaxUsesPerUser(e.target.value)} placeholder="Sınırsız" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Başlangıç Tarihi">
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Bitiş Tarihi">
              <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" role="switch" aria-checked={isActive} onClick={() => setIsActive(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? "bg-accent" : "bg-bg-elevated border border-border-default"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-ink">{isActive ? "Aktif" : "Pasif"}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor…" : "Oluştur"}</Button>
            <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={saving}>İptal</Button>
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
