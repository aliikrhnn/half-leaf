"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Plus, Trash2, AlertCircle, Check, Settings, Truck, Building2, Phone, Share2, DollarSign, RefreshCw, Lock, Unlock, Bell } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";

/* ── Types ── */
type SiteSettings = {
  maintenanceMode: boolean;
  ecommerceEnabled: boolean;
  freeShippingThreshold: number;
  shippingCost: number;
  bankTransferEnabled: boolean;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  whatsappNumber: string | null;
  announcementMessages: string[];
};

type ShippingOption = {
  id: string;
  code: string;
  label: string;
  description: string;
  price: number;
  alwaysFree: boolean;
  isActive: boolean;
  sortOrder: number;
};

type BankAccount = {
  id: string;
  bankName: string;
  iban: string;
  accountName: string;
  isActive: boolean;
  sortOrder: number;
};

type Tab = "genel" | "kargo" | "odeme" | "iletisim" | "sosyal" | "kur" | "duyurular";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "genel",     label: "Genel",          icon: Settings     },
  { id: "kargo",     label: "Kargo",          icon: Truck        },
  { id: "odeme",     label: "Ödeme",          icon: Building2    },
  { id: "iletisim",  label: "İletişim",       icon: Phone        },
  { id: "sosyal",    label: "Sosyal Medya",   icon: Share2       },
  { id: "kur",       label: "Kur Yönetimi",   icon: DollarSign   },
  { id: "duyurular", label: "Duyuru Şeridi",  icon: Bell         },
];

type KurData = {
  usdTryRate: number | null;
  usdTryRateUpdatedAt: string | null;
  usdTryRateLocked: boolean;
};

/* ── Toggle ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-accent" : "bg-bg-elevated"}`}
      style={{ border: checked ? undefined : "1px solid var(--border-default)" }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

/* ── Field ── */
function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-ink-dim mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim"
      />
    </div>
  );
}

/* ── SaveBar ── */
function SaveBar({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error: string; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border-default mt-6">
      {error ? (
        <span className="flex items-center gap-2 text-sm text-red-400"><AlertCircle size={14} />{error}</span>
      ) : saved ? (
        <span className="flex items-center gap-2 text-sm text-emerald-400"><Check size={14} />Kaydedildi</span>
      ) : <span />}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-bg text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        <Save size={14} />
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}

/* ── Main ── */
export default function AdminAyarlarPage() {
  const [tab, setTab]           = useState<Tab>("genel");
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadErr,  setLoadErr]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [saveErr,  setSaveErr]  = useState("");

  /* Kargo */
  const [kargo,      setKargo]      = useState<ShippingOption[]>([]);
  const [kargoErr,   setKargoErr]   = useState("");
  const [newKargo,   setNewKargo]   = useState<Partial<ShippingOption>>({});
  const [showAddK,   setShowAddK]   = useState(false);
  const [addingK,    setAddingK]    = useState(false);

  /* Banka */
  const [bankalar,   setBankalar]   = useState<BankAccount[]>([]);
  const [bankaErr,   setBankaErr]   = useState("");
  const [newBanka,   setNewBanka]   = useState<Partial<BankAccount>>({});
  const [showAddB,   setShowAddB]   = useState(false);
  const [addingB,    setAddingB]    = useState(false);

  /* Duyuru şeridi */
  const [newMsg,       setNewMsg]       = useState("");

  /* Kur */
  const [kurData,      setKurData]      = useState<KurData | null>(null);
  const [kurErr,       setKurErr]       = useState("");
  const [kurSaving,    setKurSaving]    = useState(false);
  const [kurSaved,     setKurSaved]     = useState(false);
  const [kurFetching,  setKurFetching]  = useState(false);
  const [manualRate,   setManualRate]   = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/ayarlar");
      const json = await res.json() as { success: boolean; data?: SiteSettings; error?: string };
      if (json.success && json.data) setSettings(json.data);
      else setLoadErr(json.error ?? "Ayarlar yüklenemedi.");
    } catch {
      setLoadErr("Ayarlar yüklenemedi.");
    }
  }, []);

  const fetchKargo = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/ayarlar/kargo");
      const json = await res.json() as { success: boolean; data?: ShippingOption[] };
      if (json.success && json.data) setKargo(json.data.map(o => ({ ...o, price: Number(o.price) })));
    } catch { /* ignore */ }
  }, []);

  const fetchBanka = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/ayarlar/banka");
      const json = await res.json() as { success: boolean; data?: BankAccount[] };
      if (json.success && json.data) setBankalar(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchKur = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/kur");
      const json = await res.json() as { success: boolean; data?: KurData; error?: string };
      if (json.success && json.data) {
        setKurData(json.data);
        setManualRate(json.data.usdTryRate != null ? String(json.data.usdTryRate) : "");
      } else {
        setKurErr(json.error ?? "Kur verisi alınamadı.");
      }
    } catch { setKurErr("Kur verisi alınamadı."); }
  }, []);

  const handleRefreshKur = async () => {
    setKurFetching(true); setKurErr(""); setKurSaved(false);
    try {
      const res  = await fetch("/api/admin/kur", { method: "POST" });
      const json = await res.json() as { success?: boolean; rate?: number; error?: string };
      if (json.success && json.rate != null) {
        setKurData(prev => prev ? { ...prev, usdTryRate: json.rate!, usdTryRateUpdatedAt: new Date().toISOString() } : prev);
        setManualRate(String(json.rate));
        setKurSaved(true);
      } else {
        setKurErr(json.error ?? "Güncellenemedi.");
      }
    } catch { setKurErr("Bir hata oluştu."); }
    finally { setKurFetching(false); }
  };

  const handleSaveKur = async () => {
    const rate = parseFloat(manualRate);
    if (isNaN(rate) || rate <= 0) { setKurErr("Geçerli bir kur girin."); return; }
    setKurSaving(true); setKurErr(""); setKurSaved(false);
    try {
      const res  = await fetch("/api/admin/kur", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdTryRate: rate }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        setKurData(prev => prev ? { ...prev, usdTryRate: rate, usdTryRateUpdatedAt: new Date().toISOString() } : prev);
        setKurSaved(true);
      } else {
        setKurErr(json.error ?? "Kaydedilemedi.");
      }
    } catch { setKurErr("Bir hata oluştu."); }
    finally { setKurSaving(false); }
  };

  const handleToggleLock = async (locked: boolean) => {
    setKurErr("");
    try {
      const res  = await fetch("/api/admin/kur", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdTryRateLocked: locked }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        setKurData(prev => prev ? { ...prev, usdTryRateLocked: locked } : prev);
      } else {
        setKurErr(json.error ?? "Güncellenemedi.");
      }
    } catch { setKurErr("Bir hata oluştu."); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern
  useEffect(() => { fetchSettings(); fetchKargo(); fetchBanka(); fetchKur(); }, [fetchSettings, fetchKargo, fetchBanka, fetchKur]);

  const update = (key: keyof SiteSettings, value: unknown) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true); setSaved(false); setSaveErr("");
    try {
      const res  = await fetch("/api/admin/ayarlar", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...settings,
          freeShippingThreshold: Number(settings.freeShippingThreshold),
          shippingCost:          Number(settings.shippingCost),
        }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) setSaved(true);
      else setSaveErr(json.error ?? "Kaydedilemedi.");
    } catch {
      setSaveErr("Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const deleteKargo = async (id: string) => {
    if (!confirm("Bu kargo seçeneğini silmek istiyor musunuz?")) return;
    try {
      await fetch(`/api/admin/ayarlar/kargo/${id}`, { method: "DELETE" });
      setKargo(prev => prev.filter(k => k.id !== id));
    } catch { setKargoErr("Silinemedi."); }
  };

  const toggleKargo = async (id: string, isActive: boolean) => {
    try {
      const res  = await fetch(`/api/admin/ayarlar/kargo/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive }),
      });
      const json = await res.json() as { success: boolean; data?: ShippingOption };
      if (json.success && json.data) {
        setKargo(prev => prev.map(k => k.id === id ? { ...json.data!, price: Number(json.data!.price) } : k));
      }
    } catch { setKargoErr("Güncellenemedi."); }
  };

  const addKargo = async () => {
    if (!newKargo.code || !newKargo.label || !newKargo.description) {
      setKargoErr("Kod, etiket ve açıklama zorunludur."); return;
    }
    setAddingK(true); setKargoErr("");
    try {
      const res  = await fetch("/api/admin/ayarlar/kargo", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...newKargo, price: Number(newKargo.price ?? 0), sortOrder: Number(newKargo.sortOrder ?? 0) }),
      });
      const json = await res.json() as { success: boolean; data?: ShippingOption; error?: string };
      if (json.success && json.data) {
        setKargo(prev => [...prev, { ...json.data!, price: Number(json.data!.price) }]);
        setNewKargo({}); setShowAddK(false);
      } else {
        setKargoErr(json.error ?? "Eklenemedi.");
      }
    } catch { setKargoErr("Eklenemedi."); }
    finally { setAddingK(false); }
  };

  const deleteBanka = async (id: string) => {
    if (!confirm("Bu banka hesabını silmek istiyor musunuz?")) return;
    try {
      await fetch(`/api/admin/ayarlar/banka/${id}`, { method: "DELETE" });
      setBankalar(prev => prev.filter(b => b.id !== id));
    } catch { setBankaErr("Silinemedi."); }
  };

  const toggleBanka = async (id: string, isActive: boolean) => {
    try {
      const res  = await fetch(`/api/admin/ayarlar/banka/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive }),
      });
      const json = await res.json() as { success: boolean; data?: BankAccount };
      if (json.success && json.data) {
        setBankalar(prev => prev.map(b => b.id === id ? json.data! : b));
      }
    } catch { setBankaErr("Güncellenemedi."); }
  };

  const addBanka = async () => {
    if (!newBanka.bankName || !newBanka.iban || !newBanka.accountName) {
      setBankaErr("Banka adı, IBAN ve hesap sahibi zorunludur."); return;
    }
    setAddingB(true); setBankaErr("");
    try {
      const res  = await fetch("/api/admin/ayarlar/banka", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...newBanka, sortOrder: Number(newBanka.sortOrder ?? 0) }),
      });
      const json = await res.json() as { success: boolean; data?: BankAccount; error?: string };
      if (json.success && json.data) {
        setBankalar(prev => [...prev, json.data!]);
        setNewBanka({}); setShowAddB(false);
      } else {
        setBankaErr(json.error ?? "Eklenemedi.");
      }
    } catch { setBankaErr("Eklenemedi."); }
    finally { setAddingB(false); }
  };

  if (loadErr) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Ayarlar" />
        <div className="p-3 sm:p-6">
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />{loadErr}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Ayarlar" />
        <div className="p-3 sm:p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-bg-elevated rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Ayarlar" />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Tab nav */}
        <nav className="flex lg:flex-col lg:w-44 lg:border-r lg:border-b-0 border-b border-border-default p-2 lg:p-3 gap-0.5 overflow-x-auto lg:overflow-visible flex-shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left whitespace-nowrap ${tab === id ? "bg-accent/20 text-accent-light font-medium" : "text-ink-muted hover:text-ink hover:bg-bg-elevated"}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">

          {/* ── GENEL ── */}
          {tab === "genel" && (
            <div className="max-w-xl space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-ink">Bakım Modu</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink">Bakım Modunu Etkinleştir</p>
                    <p className="text-xs text-ink-dim mt-0.5">Aktif olduğunda ziyaretçiler bakım sayfasına yönlendirilir.</p>
                  </div>
                  <Toggle checked={settings.maintenanceMode} onChange={v => update("maintenanceMode", v)} />
                </div>
                {settings.maintenanceMode && (
                  <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">
                    <AlertCircle size={13} />
                    Bakım modu aktif — yalnızca admin girişi çalışır.
                  </div>
                )}
              </div>

              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-ink">E-Ticaret Ayarları</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink">E-Ticareti Etkinleştir</p>
                    <p className="text-xs text-ink-dim mt-0.5">Devre dışıyken sepet ve sipariş işlemleri durdurulur.</p>
                  </div>
                  <Toggle checked={settings.ecommerceEnabled} onChange={v => update("ecommerceEnabled", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-ink-dim mb-1.5">Ücretsiz Kargo Eşiği (₺)</label>
                    <input
                      type="number" min={0} step={1}
                      value={settings.freeShippingThreshold}
                      onChange={e => update("freeShippingThreshold", Number(e.target.value))}
                      className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-dim mb-1.5">Standart Kargo Ücreti (₺)</label>
                    <input
                      type="number" min={0} step={1}
                      value={settings.shippingCost}
                      onChange={e => update("shippingCost", Number(e.target.value))}
                      className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <SaveBar saving={saving} saved={saved} error={saveErr} onSave={handleSave} />
            </div>
          )}

          {/* ── KARGO ── */}
          {tab === "kargo" && (
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Kargo Seçenekleri</h2>
                <button
                  onClick={() => { setShowAddK(true); setKargoErr(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/15 text-accent-light rounded-lg hover:bg-accent/25 transition-colors"
                >
                  <Plus size={13} /> Yeni Ekle
                </button>
              </div>

              {kargoErr && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  <AlertCircle size={14} />{kargoErr}
                </div>
              )}

              <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
                {kargo.length === 0 ? (
                  <p className="p-6 text-sm text-ink-dim text-center">Henüz kargo seçeneği yok.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-border-default bg-bg-elevated">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-dim">Kod / Etiket</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-dim hidden sm:table-cell">Açıklama</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-ink-dim">Fiyat</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-ink-dim">Aktif</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {kargo.map(opt => (
                        <tr key={opt.id}>
                          <td className="px-4 py-3">
                            <div className="font-mono text-xs text-accent-light">{opt.code}</div>
                            <div className="text-sm text-ink">{opt.label}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-ink-dim hidden sm:table-cell max-w-[220px]">
                            {opt.description}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {opt.alwaysFree ? (
                              <span className="text-emerald-400 text-xs font-medium">Ücretsiz</span>
                            ) : (
                              <span className="text-ink-muted">₺{opt.price}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Toggle checked={opt.isActive} onChange={v => toggleKargo(opt.id, v)} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => deleteKargo(opt.id)}
                              className="p-1.5 text-ink-dim hover:text-red-400 transition-colors rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {showAddK && (
                <div className="bg-bg-surface border border-border-default rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-ink">Yeni Kargo Seçeneği</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kod (büyük harf)" value={newKargo.code ?? ""} onChange={v => setNewKargo(p => ({ ...p, code: v.toUpperCase() }))} placeholder="ORNEK_KOD" />
                    <Field label="Etiket" value={newKargo.label ?? ""} onChange={v => setNewKargo(p => ({ ...p, label: v }))} placeholder="Kargo adı" />
                  </div>
                  <Field label="Açıklama" value={newKargo.description ?? ""} onChange={v => setNewKargo(p => ({ ...p, description: v }))} placeholder="Kargo açıklaması" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Fiyat (₺)" value={String(newKargo.price ?? "")} onChange={v => setNewKargo(p => ({ ...p, price: Number(v) || 0 }))} type="number" placeholder="0" />
                    <div className="flex items-center gap-3 pt-5">
                      <Toggle checked={newKargo.alwaysFree ?? false} onChange={v => setNewKargo(p => ({ ...p, alwaysFree: v }))} />
                      <span className="text-xs text-ink-dim">Her zaman ücretsiz</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={addKargo} disabled={addingK} className="px-4 py-2 bg-accent text-bg text-xs font-semibold rounded-lg disabled:opacity-50">
                      {addingK ? "Ekleniyor…" : "Ekle"}
                    </button>
                    <button onClick={() => { setShowAddK(false); setNewKargo({}); setKargoErr(""); }} className="px-4 py-2 text-xs text-ink-muted hover:text-ink rounded-lg border border-border-default">
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ÖDEME ── */}
          {tab === "odeme" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Havale / EFT ile Ödeme</p>
                    <p className="text-xs text-ink-dim mt-1">Aktif olduğunda müşteriler banka havalesi seçebilir.</p>
                  </div>
                  <Toggle checked={settings.bankTransferEnabled} onChange={v => update("bankTransferEnabled", v)} />
                </div>
                <SaveBar saving={saving} saved={saved} error={saveErr} onSave={handleSave} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Banka Hesapları</h2>
                  <button
                    onClick={() => { setShowAddB(true); setBankaErr(""); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/15 text-accent-light rounded-lg hover:bg-accent/25 transition-colors"
                  >
                    <Plus size={13} /> Yeni Ekle
                  </button>
                </div>

                {bankaErr && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                    <AlertCircle size={14} />{bankaErr}
                  </div>
                )}

                <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
                  {bankalar.length === 0 ? (
                    <p className="p-6 text-sm text-ink-dim text-center">Henüz banka hesabı yok.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="border-b border-border-default bg-bg-elevated">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-dim">Banka / Hesap Sahibi</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-ink-dim hidden md:table-cell">IBAN</th>
                          <th className="text-center px-4 py-2.5 text-xs font-medium text-ink-dim">Aktif</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {bankalar.map(b => (
                          <tr key={b.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-ink">{b.bankName}</div>
                              <div className="text-xs text-ink-dim">{b.accountName}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-ink-muted hidden md:table-cell">{b.iban}</td>
                            <td className="px-4 py-3 text-center">
                              <Toggle checked={b.isActive} onChange={v => toggleBanka(b.id, v)} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => deleteBanka(b.id)}
                                className="p-1.5 text-ink-dim hover:text-red-400 transition-colors rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {showAddB && (
                  <div className="bg-bg-surface border border-border-default rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-ink">Yeni Banka Hesabı</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Banka Adı" value={newBanka.bankName ?? ""} onChange={v => setNewBanka(p => ({ ...p, bankName: v }))} placeholder="Garanti BBVA" />
                      <Field label="Hesap Sahibi" value={newBanka.accountName ?? ""} onChange={v => setNewBanka(p => ({ ...p, accountName: v }))} placeholder="Half Leaf Ltd." />
                    </div>
                    <Field label="IBAN" value={newBanka.iban ?? ""} onChange={v => setNewBanka(p => ({ ...p, iban: v.toUpperCase() }))} placeholder="TR00 0000 0000 0000 0000 0000 00" />
                    <div className="flex gap-2 pt-1">
                      <button onClick={addBanka} disabled={addingB} className="px-4 py-2 bg-accent text-bg text-xs font-semibold rounded-lg disabled:opacity-50">
                        {addingB ? "Ekleniyor…" : "Ekle"}
                      </button>
                      <button onClick={() => { setShowAddB(false); setNewBanka({}); setBankaErr(""); }} className="px-4 py-2 text-xs text-ink-muted hover:text-ink rounded-lg border border-border-default">
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── İLETİŞİM ── */}
          {tab === "iletisim" && (
            <div className="max-w-xl space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-ink">İletişim Bilgileri</h2>
                <Field label="E-Posta" value={settings.contactEmail} onChange={v => update("contactEmail", v)} type="email" placeholder="info@example.com" />
                <Field label="Telefon" value={settings.contactPhone} onChange={v => update("contactPhone", v)} placeholder="+90 212 000 00 00" />
                <div>
                  <label className="block text-xs text-ink-dim mb-1.5">Adres</label>
                  <textarea
                    value={settings.contactAddress}
                    onChange={e => update("contactAddress", e.target.value)}
                    rows={3}
                    placeholder="Şehir, ülke veya tam adres"
                    className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim resize-none"
                  />
                </div>
              </div>
              <SaveBar saving={saving} saved={saved} error={saveErr} onSave={handleSave} />
            </div>
          )}

          {/* ── SOSYAL ── */}
          {tab === "sosyal" && (
            <div className="max-w-xl space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-ink">Sosyal Medya Bağlantıları</h2>
                <Field label="Instagram" value={settings.instagramUrl ?? ""} onChange={v => update("instagramUrl", v || null)} placeholder="https://instagram.com/kullanici" />
                <Field label="Facebook" value={settings.facebookUrl ?? ""} onChange={v => update("facebookUrl", v || null)} placeholder="https://facebook.com/sayfa" />
                <Field label="Twitter / X" value={settings.twitterUrl ?? ""} onChange={v => update("twitterUrl", v || null)} placeholder="https://twitter.com/kullanici" />
                <Field label="WhatsApp Numarası" value={settings.whatsappNumber ?? ""} onChange={v => update("whatsappNumber", v || null)} placeholder="+905000000000" />
              </div>
              <SaveBar saving={saving} saved={saved} error={saveErr} onSave={handleSave} />
            </div>
          )}

          {/* ── DUYURU ŞERİDİ ── */}
          {tab === "duyurular" && (
            <div className="max-w-xl space-y-6">
              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Duyuru Şeridi Mesajları</h2>
                  <p className="text-xs text-ink-dim mt-1">Sitenin üstündeki kayan şeritte gösterilecek mesajlar. Boş bırakılırsa varsayılan mesajlar kullanılır.</p>
                </div>

                <div className="space-y-2">
                  {(settings.announcementMessages ?? []).length === 0 ? (
                    <p className="text-xs text-ink-dim py-2">Henüz mesaj eklenmedi — varsayılan mesajlar gösterilecek.</p>
                  ) : (
                    (settings.announcementMessages ?? []).map((msg, i) => (
                      <div key={i} className="flex items-center gap-2 bg-bg-elevated rounded-lg px-3 py-2">
                        <span className="flex-1 text-sm text-ink">{msg}</span>
                        <button
                          type="button"
                          onClick={() => update("announcementMessages", (settings.announcementMessages ?? []).filter((_, j) => j !== i))}
                          className="p-1 text-ink-dim hover:text-red-400 transition-colors flex-shrink-0"
                          aria-label="Mesajı sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newMsg.trim()) {
                        update("announcementMessages", [...(settings.announcementMessages ?? []), newMsg.trim()]);
                        setNewMsg("");
                      }
                    }}
                    placeholder="Yeni mesaj ekle…"
                    maxLength={200}
                    className="flex-1 bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-ink-dim"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMsg.trim()) return;
                      update("announcementMessages", [...(settings.announcementMessages ?? []), newMsg.trim()]);
                      setNewMsg("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/15 text-accent-light text-xs font-medium hover:bg-accent/25 transition-colors flex-shrink-0"
                  >
                    <Plus size={13} /> Ekle
                  </button>
                </div>
              </div>

              <SaveBar saving={saving} saved={saved} error={saveErr} onSave={handleSave} />
            </div>
          )}

          {/* ── KUR YÖNETİMİ ── */}
          {tab === "kur" && (
            <div className="max-w-xl space-y-6">
              {/* Status card */}
              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-ink">USD / TRY Kur Durumu</h2>

                {kurData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-semibold text-ink">
                          {kurData.usdTryRate != null ? `₺ ${kurData.usdTryRate.toFixed(4)}` : "—"}
                        </p>
                        <p className="text-xs text-ink-dim mt-1">
                          {kurData.usdTryRateUpdatedAt
                            ? `Son güncelleme: ${new Date(kurData.usdTryRateUpdatedAt).toLocaleString("tr-TR")}`
                            : "Henüz güncellenmedi"}
                        </p>
                      </div>
                      <button
                        onClick={handleRefreshKur}
                        disabled={kurFetching || kurData.usdTryRateLocked}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/15 text-accent-light text-xs font-medium hover:bg-accent/25 disabled:opacity-40 transition-colors"
                      >
                        <RefreshCw size={13} className={kurFetching ? "animate-spin" : ""} />
                        {kurFetching ? "Güncelleniyor…" : "API'den Güncelle"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-default">
                      <div>
                        <p className="text-sm text-ink">Otomatik Güncellemeyi Kilitle</p>
                        <p className="text-xs text-ink-dim mt-0.5">
                          Kilitlendiğinde haftalık cron kuru güncellemez.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {kurData.usdTryRateLocked
                          ? <Lock size={13} className="text-yellow-400" />
                          : <Unlock size={13} className="text-ink-dim" />
                        }
                        <Toggle
                          checked={kurData.usdTryRateLocked}
                          onChange={handleToggleLock}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-16 bg-bg-elevated rounded-lg animate-pulse" />
                )}
              </div>

              {/* Manual rate input */}
              <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-ink">Manuel Kur Gir</h2>
                <p className="text-xs text-ink-dim">Otomatik güncelleme yerine istediğiniz kuru elle girebilirsiniz.</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-ink-dim mb-1.5">1 USD = ? TRY</label>
                    <input
                      type="number" min="0.01" step="0.0001"
                      value={manualRate}
                      onChange={e => { setManualRate(e.target.value); setKurSaved(false); }}
                      placeholder="34.5000"
                      className="w-full bg-bg-elevated border border-border-default text-ink rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSaveKur}
                      disabled={kurSaving}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-bg text-sm font-semibold disabled:opacity-50 transition-opacity"
                    >
                      <Save size={13} />
                      {kurSaving ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                  </div>
                </div>

                {kurErr && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                    <AlertCircle size={13} />{kurErr}
                  </div>
                )}
                {kurSaved && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                    <Check size={13} />Kur güncellendi.
                  </div>
                )}
              </div>

              <div className="bg-bg-surface border border-border-default rounded-xl p-4">
                <p className="text-xs text-ink-dim">
                  <strong className="text-ink-muted">Cron:</strong> Her Pazartesi 06:00 UTC&apos;de otomatik güncellenir
                  (kilitli değilse). Kaynak: fawazahmed0/currency-api (CDN).
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
