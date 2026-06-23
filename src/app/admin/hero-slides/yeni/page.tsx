"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default function YeniHeroSlidePage() {
  const router = useRouter();

  const [title,     setTitle]     = useState("");
  const [subtitle,  setSubtitle]  = useState("");
  const [eyebrow,   setEyebrow]   = useState("");
  const [ctaLabel,  setCtaLabel]  = useState("Keşfet");
  const [ctaHref,   setCtaHref]   = useState("/urunler");
  const [image,     setImage]     = useState("");
  const [mobileImage, setMobileImage] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive,  setIsActive]  = useState(true);
  const [startsAt,  setStartsAt]  = useState("");
  const [endsAt,    setEndsAt]    = useState("");

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    if (!title.trim() || !ctaHref.trim()) { setError("Başlık ve CTA URL zorunludur."); return; }
    setSaving(true); setError("");

    const body: Record<string, unknown> = {
      title:     title.trim(),
      ctaLabel:  ctaLabel.trim() || "Keşfet",
      ctaHref:   ctaHref.trim(),
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
      ...(subtitle && { subtitle: subtitle.trim() }),
      ...(eyebrow  && { eyebrow:  eyebrow.trim() }),
      ...(image    && { image }),
      ...(mobileImage && { mobileImage }),
      ...(startsAt && { startsAt: new Date(startsAt).toISOString() }),
      ...(endsAt   && { endsAt:   new Date(endsAt).toISOString() }),
    };

    try {
      const res  = await fetch("/api/admin/hero-slides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Slide oluşturulamadı."); return; }
      router.push("/admin/hero-slides");
    } catch { setError("Bir hata oluştu."); }
    finally   { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Yeni Hero Slide"
        actions={
          <Link href="/admin/hero-slides" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> Hero Slide&apos;lar
          </Link>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="space-y-5 max-w-xl">
          <Field label="Başlık *">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Özenle Seçilmiş Koleksiyon" className={inputCls} />
          </Field>

          <Field label="Alt Başlık">
            <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Kısa açıklama metni (isteğe bağlı)" className={inputCls} />
          </Field>

          <Field label="Eyebrow (Üst Etiket)">
            <input type="text" value={eyebrow} onChange={e => setEyebrow(e.target.value)} placeholder="Yeni Sezon · 2026" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="CTA Butonu Metni">
              <input type="text" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} placeholder="Keşfet" className={inputCls} />
            </Field>
            <Field label="CTA Bağlantı URL *">
              <input type="text" value={ctaHref} onChange={e => setCtaHref(e.target.value)} placeholder="/urunler" className={inputCls} />
            </Field>
          </div>

          <ImageUploadField label="Hero Görseli (Masaüstü)" value={image} onChange={setImage} />
          <p className="text-[11px] text-ink-dim -mt-2">Geniş yatay görsel — önerilen oran 16:9 veya 21:9. Maks. 5 MB.</p>

          <ImageUploadField label="Mobil Görsel (isteğe bağlı)" value={mobileImage} onChange={setMobileImage} />
          <p className="text-[11px] text-ink-dim -mt-2">Telefonda gösterilir — dikey/kare bir görsel önerilir (ör. 4:5 veya 1:1). Boş bırakılırsa masaüstü görseli kullanılır.</p>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Sıra">
              <input type="number" min="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputCls} />
            </Field>
            <div />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Başlangıç Tarihi">
              <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Bitiş Tarihi">
              <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={inputCls} />
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
