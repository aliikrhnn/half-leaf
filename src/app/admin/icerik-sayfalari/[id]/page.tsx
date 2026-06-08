"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Check, AlertTriangle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

interface LegalPage {
  id:          string;
  slug:        string;
  title:       string;
  content:     string;
  version:     string;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt:   string;
}

export default function IcerikSayfaDetayPage() {
  const { id } = useParams<{ id: string }>();

  const [page, setPage]     = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const [title,       setTitle]       = useState("");
  const [content,     setContent]     = useState("");
  const [version,     setVersion]     = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [saving,  setSaving]  = useState(false);
  const [saveOk,  setSaveOk]  = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    fetch(`/api/admin/icerik-sayfalari/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: LegalPage; error?: string }>)
      .then(json => {
        if (!json.success || !json.data) { setError(json.error ?? "Sayfa yüklenemedi."); return; }
        const p = json.data;
        setPage(p);
        setTitle(p.title);
        setContent(p.content);
        setVersion(p.version);
        setIsPublished(p.isPublished);
      })
      .catch(() => setError("Sayfa yüklenemedi."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true); setSaveOk(false); setSaveErr("");

    const body: Record<string, unknown> = {};
    if (title       !== page.title)       body.title       = title;
    if (content     !== page.content)     body.content     = content;
    if (version     !== page.version)     body.version     = version;
    if (isPublished !== page.isPublished) body.isPublished = isPublished;

    if (Object.keys(body).length === 0) { setSaving(false); return; }

    try {
      const res  = await fetch(`/api/admin/icerik-sayfalari/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json() as { success: boolean; data?: LegalPage; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Güncelleme başarısız."); return; }
      if (json.data) {
        const p = json.data;
        setPage(p);
        setTitle(p.title);
        setContent(p.content);
        setVersion(p.version);
        setIsPublished(p.isPublished);
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
      <AdminHeader title="İçerik Sayfası" />
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-bg-elevated rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (error || !page) return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="İçerik Sayfası"
        actions={
          <Link href="/admin/icerik-sayfalari" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> Geri
          </Link>
        }
      />
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} />
          {error || "Sayfa bulunamadı."}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={page.title}
        subtitle={`Slug: ${page.slug}`}
        actions={
          <Link href="/admin/icerik-sayfalari" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
            <ChevronLeft size={16} /> İçerik Sayfaları
          </Link>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="space-y-5 max-w-3xl">

          {/* Hukuki uyarı */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-300 leading-relaxed">
              Bu metinler hukuki niteliktedir. Yayına almadan önce bir hukuk uzmanı tarafından kontrol edilmelidir.
            </p>
          </div>

          {/* Slug — salt okunur */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
              Slug (değiştirilemez)
            </label>
            <div className="px-3 py-2 text-sm font-mono bg-bg-elevated border border-border-default rounded-lg text-ink-dim select-none">
              {page.slug}
            </div>
          </div>

          {/* Başlık */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </div>

          {/* Versiyon */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
              Versiyon
            </label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="örn. 1.0"
              className="w-full px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </div>

          {/* Yayın durumu toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setIsPublished(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isPublished ? "bg-accent" : "bg-bg-elevated border border-border-default"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublished ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-ink">
              {isPublished ? "Yayında" : "Taslak"}
            </span>
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5">
              İçerik
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={24}
              className="w-full px-3 py-2.5 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent resize-y font-mono leading-relaxed"
            />
          </div>

          {/* Geri bildirim */}
          {saveErr && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle size={14} /> {saveErr}
            </div>
          )}
          {saveOk && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm">
              <Check size={14} /> Değişiklikler kaydedildi.
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="w-full justify-center sm:w-auto"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>

        </div>
      </div>
    </div>
  );
}
