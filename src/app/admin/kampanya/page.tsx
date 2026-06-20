"use client";

import { useEffect, useState } from "react";
import { Send, FlaskConical, Users, AlertCircle, CheckCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";

export default function AdminKampanyaPage() {
  const [audience, setAudience] = useState<number | null>(null);
  const [emailConfigured, setEmailConfigured] = useState(true);

  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [headline, setHeadline] = useState("");
  const [intro, setIntro] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Koleksiyonu Keşfet");
  const [ctaUrl, setCtaUrl] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const [productSlugs, setProductSlugs] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/kampanya")
      .then((r) => r.json() as Promise<{ success: boolean; data?: { audience: number; emailConfigured: boolean } }>)
      .then((j) => {
        if (j.success && j.data) { setAudience(j.data.audience); setEmailConfigured(j.data.emailConfigured); }
      })
      .catch(() => {});
  }, []);

  function buildBody(test: boolean) {
    const slugs = productSlugs.split(",").map((s) => s.trim()).filter(Boolean);
    return {
      subject, preheader, headline, intro, ctaLabel,
      ctaUrl: ctaUrl || undefined,
      discountCode: discountCode || undefined,
      discountNote: discountNote || undefined,
      productSlugs: slugs.length ? slugs : undefined,
      testEmail: test ? testEmail : undefined,
    };
  }

  async function send(test: boolean) {
    setMsg(null);
    if (!subject.trim() || !headline.trim() || intro.trim().length < 5) {
      setMsg({ ok: false, text: "Konu, başlık ve metin zorunludur." });
      return;
    }
    if (test && !testEmail.trim()) { setMsg({ ok: false, text: "Test için bir e-posta adresi girin." }); return; }
    if (!test && !window.confirm(`Bu kampanya ${audience ?? "?"} izinli kişiye gönderilecek. Onaylıyor musunuz?`)) return;

    setBusy(true);
    try {
      const res = await fetch("/api/admin/kampanya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(test)),
      });
      const j = await res.json() as { success: boolean; data?: { sent: number; total: number; test?: boolean }; error?: string };
      if (!j.success) { setMsg({ ok: false, text: j.error ?? "Gönderilemedi." }); return; }
      setMsg({ ok: true, text: test ? `Test e-postası gönderildi (${j.data?.sent}/1).` : `Kampanya gönderildi: ${j.data?.sent}/${j.data?.total} kişi.` });
    } catch {
      setMsg({ ok: false, text: "Bir hata oluştu." });
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-bg rounded-lg border border-border-default text-ink placeholder:text-ink-dim focus:outline-none focus:border-accent";
  const labelCls = "block text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-1.5";

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Kampanya Gönder" />
      <div className="p-3 sm:p-6 max-w-2xl space-y-5">
        {/* Audience + config */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border-default text-sm">
            <Users size={15} className="text-accent" />
            <span className="text-ink-muted">İzinli kitle:</span>
            <span className="font-bold text-ink">{audience ?? "…"}</span>
          </div>
          {!emailConfigured && (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle size={14} /> E-posta yapılandırması eksik (RESEND_API_KEY / EMAIL_FROM)
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4 bg-bg-card border border-border-default rounded-xl p-4 sm:p-5">
          <div>
            <label className={labelCls}>E-posta Konusu *</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="Yaza özel %15 indirim başladı" />
          </div>
          <div>
            <label className={labelCls}>Önizleme Metni (preheader)</label>
            <input value={preheader} onChange={(e) => setPreheader(e.target.value)} className={inputCls} placeholder="Gelen kutusunda konunun yanında görünen kısa metin" />
          </div>
          <div>
            <label className={labelCls}>Başlık *</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} placeholder="Sezonun en iyileri seni bekliyor" />
          </div>
          <div>
            <label className={labelCls}>Metin *</label>
            <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={4} className={inputCls} placeholder="Kampanya metniniz… (satır sonları korunur)" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Buton Metni</label>
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputCls} placeholder="Koleksiyonu Keşfet" />
            </div>
            <div>
              <label className={labelCls}>Buton Linki (boşsa ürünler)</label>
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className={inputCls} placeholder="https://halfleafstore.com/urunler?indirim=1" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>İndirim Kodu (opsiyonel)</label>
              <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} className={inputCls} placeholder="YAZ15" />
            </div>
            <div>
              <label className={labelCls}>İndirim Notu</label>
              <input value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} className={inputCls} placeholder="31 Ağustos'a kadar geçerli" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Öne Çıkan Ürünler (slug, virgülle, en fazla 4)</label>
            <input value={productSlugs} onChange={(e) => setProductSlugs(e.target.value)} className={inputCls} placeholder="alpha-hookah-oro, moze-breeze-pro-candy-blue-yellow" />
          </div>
        </div>

        {/* Test + send */}
        <div className="space-y-3 bg-bg-card border border-border-default rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <label className={labelCls}>Test E-postası</label>
              <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className={inputCls} placeholder="kendi@eposta.com" />
            </div>
            <button onClick={() => send(true)} disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bg-elevated text-ink border border-border-default hover:border-border-light disabled:opacity-50 text-sm font-medium">
              <FlaskConical size={15} /> Test Gönder
            </button>
          </div>
          <button onClick={() => send(false)} disabled={busy || audience === 0} className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-accent text-ink font-semibold hover:bg-accent-light disabled:opacity-50">
            <Send size={16} /> {busy ? "Gönderiliyor…" : `Tümüne Gönder (${audience ?? "?"} kişi)`}
          </button>
          {msg && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${msg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {msg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
            </div>
          )}
        </div>

        <p className="text-[11px] text-ink-dim leading-relaxed">
          Kampanya yalnızca pazarlama iznine sahip (KVKK/İYS) kullanıcılara gönderilir ve her e-posta abonelik iptali linki içerir.
          Göndermeden önce mutlaka kendinize <strong>Test Gönder</strong> ile önizleyin.
        </p>
      </div>
    </div>
  );
}
