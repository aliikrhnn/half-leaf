"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Check } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

type BannerPosition = "ANASAYFA_UST" | "ANASAYFA_ALT" | "KATEGORI";

interface Banner {
  id:        string;
  title:     string;
  imageUrl:  string;
  linkUrl:   string | null;
  position:  BannerPosition;
  sortOrder: number;
  isActive:  boolean;
  startsAt:  string | null;
  endsAt:    string | null;
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export default function BannerDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [banner, setBanner]   = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [title,     setTitle]     = useState("");
  const [imageUrl,  setImageUrl]  = useState("");
  const [linkUrl,   setLinkUrl]   = useState("");
  const [position,  setPosition]  = useState<BannerPosition>("ANASAYFA_UST");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive,  setIsActive]  = useState(true);
  const [startsAt,  setStartsAt]  = useState("");
  const [endsAt,    setEndsAt]    = useState("");

  const [saving,  setSaving]  = useState(false);
  const [saveOk,  setSaveOk]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    fetch(`/api/admin/bannerlar/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: Banner; error?: string }>)
      .then(json => {
        if (!json.success || !json.data) { setFetchError(json.error ?? "Banner yüklenemedi."); return; }
        const b = json.data;
        setBanner(b);
        setTitle(b.title);
        setImageUrl(b.imageUrl);
        setLinkUrl(b.linkUrl ?? "");
        setPosition(b.position);
        setSortOrder(String(b.sortOrder));
        setIsActive(b.isActive);
        setStartsAt(toDatetimeLocal(b.startsAt));
        setEndsAt(toDatetimeLocal(b.endsAt));
      })
      .catch(() => setFetchError("Banner yüklenemedi."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!banner) return;
    setSaving(true); setSaveOk(false); setSaveErr("");

    const newStartsAt = startsAt ? new Date(startsAt).toISOString() : null;
    const newEndsAt   = endsAt   ? new Date(endsAt).toISOString()   : null;

    const body: Record<string, unknown> = {};
    if (title.trim()    !== banner.title)    body.title    = title.trim();
    if (imageUrl.trim() !== banner.imageUrl) body.imageUrl = imageUrl.trim();
    if ((linkUrl.trim() || null) !== banner.linkUrl)  body.linkUrl  = linkUrl.trim() || null;
    if (position        !== banner.position) body.position = position;
    if (parseInt(sortOrder) !== banner.sortOrder) body.sortOrder = parseInt(sortOrder) || 0;
    if (isActive !== banner.isActive)        body.isActive = isActive;
    if (newStartsAt !== banner.startsAt)     body.startsAt = newStartsAt;
    if (newEndsAt   !== banner.endsAt)       body.endsAt   = newEndsAt;

    if (Object.keys(body).length === 0) { setSaving(false); return; }

    try {
      const res  = await fetch(`/api/admin/bannerlar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json() as { success: boolean; data?: Banner; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Güncelleme başarısız."); return; }
      if (json.data) {
        const b = json.data;
        setBanner(b);
        setStartsAt(toDatetimeLocal(b.startsAt));
        setEndsAt(toDatetimeLocal(b.endsAt));
      }
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch { setSaveErr("Bir hata oluştu."); }
    finally   { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Banner Düzenle" />
      <div className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-bg-elevated rounded-xl animate-pulse" />)}</div>
    </div>
  );

  if (fetchError || !banner) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Banner Düzenle" actions={<Link href="/admin/bannerlar" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Geri</Link>} />
      <div className="p-6"><div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"><AlertCircle size={16} />{fetchError || "Banner bulunamadı."}</div></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={banner.title}
        actions={<Link href="/admin/bannerlar" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Bannerlar</Link>}
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="space-y-5 max-w-xl">
          <Field label="Başlık *">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Görsel URL *">
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bağlantı URL">
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="isteğe bağlı" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Konum *">
              <select value={position} onChange={e => setPosition(e.target.value as BannerPosition)} className={inputCls}>
                <option value="ANASAYFA_UST">Anasayfa Üst</option>
                <option value="ANASAYFA_ALT">Anasayfa Alt</option>
                <option value="KATEGORI">Kategori</option>
              </select>
            </Field>
            <Field label="Sıra">
              <input type="number" min="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputCls} />
            </Field>
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
