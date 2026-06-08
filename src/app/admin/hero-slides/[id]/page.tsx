"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import ImageUploadField from "@/components/admin/ImageUploadField";

interface HeroSlide {
  id:        string;
  title:     string;
  subtitle:  string | null;
  eyebrow:   string | null;
  ctaLabel:  string;
  ctaHref:   string;
  image:     string | null;
  sortOrder: number;
  isActive:  boolean;
  startsAt:  string | null;
  endsAt:    string | null;
}

function toLocalDt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const [title,     setTitle]     = useState("");
  const [subtitle,  setSubtitle]  = useState("");
  const [eyebrow,   setEyebrow]   = useState("");
  const [ctaLabel,  setCtaLabel]  = useState("Keşfet");
  const [ctaHref,   setCtaHref]   = useState("");
  const [image,     setImage]     = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive,  setIsActive]  = useState(true);
  const [startsAt,  setStartsAt]  = useState("");
  const [endsAt,    setEndsAt]    = useState("");

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`/api/admin/hero-slides/${id}`);
        const json = await res.json() as { success: boolean; data?: HeroSlide; error?: string };
        if (!json.success || !json.data) { setError("Slide bulunamadı."); return; }
        const s = json.data;
        setTitle(s.title);
        setSubtitle(s.subtitle ?? "");
        setEyebrow(s.eyebrow ?? "");
        setCtaLabel(s.ctaLabel);
        setCtaHref(s.ctaHref);
        setImage(s.image ?? "");
        setSortOrder(String(s.sortOrder));
        setIsActive(s.isActive);
        setStartsAt(toLocalDt(s.startsAt));
        setEndsAt(toLocalDt(s.endsAt));
      } catch { setError("Slide yüklenirken hata oluştu."); }
      finally  { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() || !ctaHref.trim()) { setError("Başlık ve CTA URL zorunludur."); return; }
    setSaving(true); setError("");

    const body: Record<string, unknown> = {
      title:     title.trim(),
      subtitle:  subtitle.trim() || null,
      eyebrow:   eyebrow.trim() || null,
      ctaLabel:  ctaLabel.trim() || "Keşfet",
      ctaHref:   ctaHref.trim(),
      image:     image || null,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
      startsAt:  startsAt ? new Date(startsAt).toISOString() : null,
      endsAt:    endsAt   ? new Date(endsAt).toISOString()   : null,
    };

    try {
      const res  = await fetch(`/api/admin/hero-slides/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Slide güncellenemedi."); return; }
      router.push("/admin/hero-slides");
    } catch { setError("Bir hata oluştu."); }
    finally   { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Hero Slide Düzenle" />
        <div className="p-6"><div className="h-64 bg-bg-elevated rounded-xl animate-pulse" /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Hero Slide Düzenle"
        actions={
          <Link href="/admin/hero-slides" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> Hero Slide&apos;lar
          </Link>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="space-y-5 max-w-xl">
          <Field label="Başlık *">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Alt Başlık">
            <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Kısa açıklama metni (isteğe bağlı)" className={inputCls} />
          </Field>

          <Field label="Eyebrow (Üst Etiket)">
            <input type="text" value={eyebrow} onChange={e => setEyebrow(e.target.value)} placeholder="Yeni Sezon · 2026" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="CTA Butonu Metni">
              <input type="text" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} className={inputCls} />
            </Field>
            <Field label="CTA Bağlantı URL *">
              <input type="text" value={ctaHref} onChange={e => setCtaHref(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <ImageUploadField label="Hero Görseli" value={image} onChange={setImage} />
          <p className="text-[11px] text-ink-dim -mt-2">Önerilen oran 16:9 veya 21:9, geniş yatay görsel. Maks. 5 MB.</p>

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
