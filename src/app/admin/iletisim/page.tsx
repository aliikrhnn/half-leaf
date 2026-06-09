"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Mail, MailOpen, Trash2, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";

interface MessageRow {
  id:        string;
  name:      string;
  email:     string;
  phone:     string | null;
  subject:   string | null;
  isRead:    boolean;
  createdAt: string;
}

interface Meta { total: number; page: number; limit: number; totalPages: number; }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminIletisimPage() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [meta, setMeta]         = useState<Meta | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [readFilter, setReadFilter] = useState<"" | "true" | "false">("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "20",
        ...(search     && { search }),
        ...(readFilter && { isRead: readFilter }),
      });
      const res  = await fetch(`/api/admin/iletisim?${params}`);
      const json = await res.json() as { success: boolean; data?: { items: MessageRow[]; meta: Meta }; error?: string };
      if (!json.success) throw new Error(json.error);
      setMessages(json.data!.items);
      setMeta(json.data!.meta);
    } catch { setError("Mesajlar yüklenirken hata oluştu."); }
    finally  { setLoading(false); }
  }, [page, search, readFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/iletisim/${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      await fetchMessages();
    } catch { setError("Mesaj silinemedi."); }
    finally  { setDeleting(false); setDeleteId(null); }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="İletişim Mesajları"
        subtitle={meta ? `${meta.total} mesaj${unreadCount > 0 ? ` · ${unreadCount} okunmamış` : ""}` : undefined}
      />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchMessages(); }} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Ad veya e-posta ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </form>
          <select
            value={readFilter}
            onChange={(e) => { setReadFilter(e.target.value as typeof readFilter); setPage(1); }}
            className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tüm Durum</option>
            <option value="false">Okunmamış</option>
            <option value="true">Okunmuş</option>
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider w-8"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Gönderen</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Konu</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Tarih</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3" colSpan={5}><div className="h-10 bg-bg-elevated rounded animate-pulse" /></td></tr>
                  ))
                ) : messages.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted">Mesaj bulunamadı.</td></tr>
                ) : (
                  messages.map(m => (
                    <tr
                      key={m.id}
                      className={`hover:bg-bg-elevated/50 transition-colors ${!m.isRead ? "bg-accent/5" : ""}`}
                    >
                      <td className="px-4 py-3">
                        {m.isRead
                          ? <MailOpen size={15} className="text-ink-dim" />
                          : <Mail     size={15} className="text-accent" />
                        }
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/iletisim/${m.id}`} className="hover:text-accent transition-colors">
                          <span className={`block text-sm ${!m.isRead ? "font-semibold text-ink" : "text-ink-muted"}`}>
                            {m.name}
                          </span>
                          <span className="block text-xs text-ink-dim">{m.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-ink-muted text-xs">
                        {m.subject || <span className="text-ink-dim italic">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-ink-dim text-xs">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/admin/iletisim/${m.id}`}>
                            <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors text-xs font-medium" aria-label="Görüntüle">Aç</button>
                          </Link>
                          <button
                            onClick={() => setDeleteId(m.id)}
                            className="p-1.5 text-ink-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            aria-label="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
              <span className="text-xs text-ink-dim">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total} mesaj
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={meta.page === 1}
                  className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page === meta.totalPages}
                  className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Mesajı Sil</h2>
            <p className="text-sm text-ink-muted mb-5">
              Bu mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost"  size="sm" onClick={() => setDeleteId(null)} disabled={deleting}>İptal</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                {deleting ? "Siliniyor…" : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
