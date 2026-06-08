"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertCircle, Check, Trash2, Mail, MailOpen } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

interface ContactMessage {
  id:        string;
  name:      string;
  email:     string;
  phone:     string | null;
  subject:   string | null;
  message:   string;
  isRead:    boolean;
  adminNote: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function IletisimDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [msg, setMsg]           = useState<ContactMessage | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [saveErr, setSaveErr]     = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => {
    fetch(`/api/admin/iletisim/${id}`)
      .then(r => r.json() as Promise<{ success: boolean; data?: ContactMessage; error?: string }>)
      .then(async json => {
        if (!json.success || !json.data) { setFetchError(json.error ?? "Mesaj yüklenemedi."); return; }
        setMsg(json.data);
        setAdminNote(json.data.adminNote ?? "");
        // mark as read if not already
        if (!json.data.isRead) {
          await fetch(`/api/admin/iletisim/${id}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ isRead: true }),
          });
          setMsg(prev => prev ? { ...prev, isRead: true } : prev);
        }
      })
      .catch(() => setFetchError("Mesaj yüklenemedi."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNote = async () => {
    setSaving(true); setSaveOk(false); setSaveErr("");
    try {
      const res  = await fetch(`/api/admin/iletisim/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminNote: adminNote.trim() || null }),
      });
      const json = await res.json() as { success: boolean; data?: ContactMessage; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Kayıt başarısız."); return; }
      if (json.data) setMsg(json.data);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch { setSaveErr("Bir hata oluştu."); }
    finally  { setSaving(false); }
  };

  const handleMarkUnread = async () => {
    await fetch(`/api/admin/iletisim/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isRead: false }),
    });
    setMsg(prev => prev ? { ...prev, isRead: false } : prev);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/iletisim/${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Silme başarısız."); return; }
      router.push("/admin/iletisim");
    } catch { setSaveErr("Bir hata oluştu."); }
    finally  { setDeleting(false); setDeleteModal(false); }
  };

  if (loading) return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Mesaj Detayı" />
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-bg-elevated rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (fetchError || !msg) return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Mesaj Detayı"
        actions={<Link href="/admin/iletisim" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"><ChevronLeft size={16} /> Geri</Link>}
      />
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} />{fetchError || "Mesaj bulunamadı."}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title={msg.subject || "Konu Belirtilmemiş"}
        subtitle={`${msg.name} · ${formatDate(msg.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={msg.isRead ? handleMarkUnread : undefined}
              title={msg.isRead ? "Okunmadı olarak işaretle" : "Okundu"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ink-muted hover:text-ink hover:bg-bg-elevated transition-colors"
            >
              {msg.isRead
                ? <><MailOpen size={14} /> Okundu</>
                : <><Mail     size={14} className="text-accent" /> Okunmamış</>
              }
            </button>
            <button
              onClick={() => setDeleteModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} /> Sil
            </button>
            <Link href="/admin/iletisim" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
              <ChevronLeft size={16} /> Geri
            </Link>
          </div>
        }
      />

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-2xl space-y-6">

          {/* Sender info */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-3">Gönderen Bilgileri</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Ad Soyad" value={msg.name} />
              <InfoRow label="E-Posta">
                <a href={`mailto:${msg.email}`} className="text-accent hover:underline">{msg.email}</a>
              </InfoRow>
              {msg.phone   && <InfoRow label="Telefon"  value={msg.phone} />}
              {msg.subject && <InfoRow label="Konu"     value={msg.subject} />}
              {msg.ipAddress && <InfoRow label="IP Adresi" value={msg.ipAddress} />}
            </div>
          </div>

          {/* Message body */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim mb-3">Mesaj İçeriği</h3>
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{msg.message}</p>
          </div>

          {/* Admin note */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">Admin Notu</h3>
            <textarea
              rows={4}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Bu mesajla ilgili dahili not ekleyin…"
              className="w-full px-3 py-2.5 text-sm bg-bg-elevated border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent resize-none"
            />
            {saveErr && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                <AlertCircle size={13} /> {saveErr}
              </div>
            )}
            {saveOk && (
              <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                <Check size={13} /> Not kaydedildi.
              </div>
            )}
            <Button variant="primary" size="sm" onClick={handleSaveNote} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Notu Kaydet"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Mesajı Sil</h2>
            <p className="text-sm text-ink-muted mb-5">
              Bu mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost"  size="sm" onClick={() => setDeleteModal(false)} disabled={deleting}>İptal</Button>
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Siliniyor…" : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-ink-dim block mb-0.5">{label}</span>
      {children ?? <span className="text-ink">{value}</span>}
    </div>
  );
}
