"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Check } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

interface Coupon {
  id:             string;
  code:           string;
  description:    string | null;
  discountType:   "YUZDE" | "SABIT";
  value:          number;
  minOrderAmount: number | null;
  maxUses:        number | null;
  usedCount:      number;
  maxUsesPerUser: number | null;
  startsAt:       string | null;
  expiresAt:      string | null;
  isActive:       boolean;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export default function KuponDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

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

  const [saving,  setSaving]  = useState(false);
  const [saveOk,  setSaveOk]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    fetch(`/api/admin/kuponlar/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: Coupon; error?: string }>)
      .then(json => {
        if (!json.success || !json.data) { setFetchError(json.error ?? "Kupon yüklenemedi."); return; }
        const c = json.data;
        setCoupon(c);
        setCode(c.code);
        setDescription(c.description ?? "");
        setDiscountType(c.discountType);
        setValue(String(c.value));
        setMinOrderAmount(c.minOrderAmount ? String(c.minOrderAmount) : "");
        setMaxUses(c.maxUses ? String(c.maxUses) : "");
        setMaxUsesPerUser(c.maxUsesPerUser ? String(c.maxUsesPerUser) : "");
        setStartsAt(toDatetimeLocal(c.startsAt));
        setExpiresAt(toDatetimeLocal(c.expiresAt));
        setIsActive(c.isActive);
      })
      .catch(() => setFetchError("Kupon yüklenemedi."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!coupon) return;
    setSaving(true); setSaveOk(false); setSaveErr("");

    const body: Record<string, unknown> = {};
    if (code.trim().toUpperCase()          !== coupon.code)           body.code           = code.trim().toUpperCase();
    if (description.trim()                 !== (coupon.description ?? "")) body.description = description.trim() || undefined;
    if (discountType                       !== coupon.discountType)   body.discountType   = discountType;
    if (parseFloat(value)                  !== coupon.value)          body.value          = parseFloat(value);
    if ((minOrderAmount ? parseFloat(minOrderAmount) : null) !== coupon.minOrderAmount) body.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : null;
    if ((maxUses ? parseInt(maxUses) : null)                 !== coupon.maxUses)        body.maxUses        = maxUses ? parseInt(maxUses) : null;
    if ((maxUsesPerUser ? parseInt(maxUsesPerUser) : null)   !== coupon.maxUsesPerUser) body.maxUsesPerUser = maxUsesPerUser ? parseInt(maxUsesPerUser) : null;
    if (isActive !== coupon.isActive) body.isActive = isActive;

    const newStartsAt  = startsAt  ? new Date(startsAt).toISOString()  : null;
    const newExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;
    if (newStartsAt  !== coupon.startsAt)  body.startsAt  = newStartsAt;
    if (newExpiresAt !== coupon.expiresAt) body.expiresAt = newExpiresAt;

    if (Object.keys(body).length === 0) { setSaving(false); return; }

    try {
      const res  = await fetch(`/api/admin/kuponlar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; data?: Coupon; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Güncelleme başarısız."); return; }
      if (json.data) {
        const c = json.data;
        setCoupon(c);
        setStartsAt(toDatetimeLocal(c.startsAt));
        setExpiresAt(toDatetimeLocal(c.expiresAt));
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch { setSaveErr("Bir hata oluştu."); }
    finally   { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Kupon Düzenle" />
      <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-bg-elevated rounded-xl animate-pulse" />)}</div>
    </div>
  );

  if (fetchError || !coupon) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Kupon Düzenle" actions={<Link href="/admin/kuponlar" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Geri</Link>} />
      <div className="p-6"><div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"><AlertCircle size={16} />{fetchError || "Kupon bulunamadı."}</div></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={coupon.code}
        actions={<Link href="/admin/kuponlar" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Kuponlar</Link>}
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="space-y-5 max-w-xl">
          <Field label="Kupon Kodu *">
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className={inputCls} />
          </Field>

          <Field label="Açıklama">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Kullanım Sayısı (salt okunur)">
            <div className="px-3 py-2 text-sm font-mono bg-bg-elevated border border-border-default rounded-lg text-ink-dim select-none">{coupon.usedCount}</div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="İndirim Tipi *">
              <select value={discountType} onChange={e => setDiscountType(e.target.value as "YUZDE" | "SABIT")} className={inputCls}>
                <option value="YUZDE">Yüzde (%)</option>
                <option value="SABIT">Sabit (₺)</option>
              </select>
            </Field>
            <Field label="İndirim Değeri *">
              <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Min. Sipariş Tutarı (₺)">
              <input type="number" min="0" step="0.01" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} placeholder="Yok" className={inputCls} />
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

          {saveErr && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"><AlertCircle size={14} /> {saveErr}</div>}
          {saveOk  && <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm"><Check size={14} /> Değişiklikler kaydedildi.</div>}

          <div className="flex gap-3">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor…" : "Kaydet"}</Button>
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
