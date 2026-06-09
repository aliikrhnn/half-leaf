"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

interface CouponRow {
  id:             string;
  code:           string;
  description:    string | null;
  discountType:   "YUZDE" | "SABIT";
  value:          number;
  usedCount:      number;
  maxUses:        number | null;
  expiresAt:      string | null;
  isActive:       boolean;
}

interface Meta { total: number; page: number; limit: number; totalPages: number; }

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminKuponlarPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(search && { search }), ...(activeFilter && { isActive: activeFilter }) });
      const res  = await fetch(`/api/admin/kuponlar?${params}`);
      const json = await res.json() as { success: boolean; data?: { items: CouponRow[]; meta: Meta }; error?: string };
      if (!json.success) throw new Error(json.error);
      setCoupons(json.data!.items);
      setMeta(json.data!.meta);
    } catch { setError("Kuponlar yüklenirken hata oluştu."); }
    finally  { setLoading(false); }
  }, [page, search, activeFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/kuponlar/${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      await fetchCoupons();
    } catch { setError("Kupon silinemedi."); }
    finally  { setDeleting(false); setDeleteId(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Kuponlar"
        subtitle={meta ? `${meta.total} kupon` : undefined}
        actions={
          <Link href="/admin/kuponlar/yeni">
            <Button variant="primary" size="sm"><Plus size={16} />Yeni Kupon</Button>
          </Link>
        }
      />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchCoupons(); }} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Kod veya açıklama ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </form>
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value as typeof activeFilter); setPage(1); }}
            className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tüm Durum</option>
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Kod</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">İndirim</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Kullanım</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Son Geçerlilik</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3" colSpan={6}><div className="h-10 bg-bg-elevated rounded animate-pulse" /></td></tr>
                  ))
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Kupon bulunamadı.</td></tr>
                ) : (
                  coupons.map(c => (
                    <tr key={c.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-ink text-sm">{c.code}</div>
                        {c.description && <div className="text-xs text-ink-dim mt-0.5 truncate max-w-[180px]">{c.description}</div>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gold font-semibold">
                          {c.discountType === "YUZDE" ? `%${c.value}` : formatPrice(c.value)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-ink-muted text-xs">
                        {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-ink-muted text-xs">{formatDate(c.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.isActive ? "success" : "muted"}>{c.isActive ? "Aktif" : "Pasif"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/admin/kuponlar/${c.id}`}>
                            <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors" aria-label="Düzenle"><Edit size={15} /></button>
                          </Link>
                          <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-ink-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" aria-label="Sil"><Trash2 size={15} /></button>
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
              <span className="text-xs text-ink-dim">{(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total} kupon</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page === 1} className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={meta.page === meta.totalPages} className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Kuponu Sil</h2>
            <p className="text-sm text-ink-muted mb-5">Bu kuponu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)} disabled={deleting}>İptal</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deleteId)} disabled={deleting}>{deleting ? "Siliniyor…" : "Evet, Sil"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
