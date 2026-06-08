"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

type BannerPosition = "ANASAYFA_UST" | "ANASAYFA_ALT" | "KATEGORI";

interface BannerRow {
  id:        string;
  title:     string;
  position:  BannerPosition;
  sortOrder: number;
  isActive:  boolean;
  startsAt:  string | null;
  endsAt:    string | null;
  createdAt: string;
}

const POSITION_LABEL: Record<BannerPosition, string> = {
  ANASAYFA_UST: "Anasayfa Üst",
  ANASAYFA_ALT: "Anasayfa Alt",
  KATEGORI:     "Kategori",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminBannerlarPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ ...(activeFilter && { isActive: activeFilter }) });
      const res  = await fetch(`/api/admin/bannerlar?${params}`);
      const json = await res.json() as { success: boolean; data?: BannerRow[]; error?: string };
      if (!json.success) throw new Error(json.error);
      setBanners(json.data ?? []);
    } catch { setError("Bannerlar yüklenirken hata oluştu."); }
    finally  { setLoading(false); }
  }, [activeFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/bannerlar/${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);
      await fetchBanners();
    } catch { setError("Banner silinemedi."); }
    finally  { setDeleting(false); setDeleteId(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Bannerlar"
        subtitle={!loading ? `${banners.length} banner` : undefined}
        actions={
          <div className="flex items-center gap-3">
            <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value as typeof activeFilter); }}
              className="px-3 py-1.5 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent">
              <option value="">Tüm Durum</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
            <Link href="/admin/bannerlar/yeni">
              <Button variant="primary" size="sm"><Plus size={16} />Yeni Banner</Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-5 flex-1 overflow-auto">
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Başlık</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Konum</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Sıra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Tarih Aralığı</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3" colSpan={6}><div className="h-10 bg-bg-elevated rounded animate-pulse" /></td></tr>
                  ))
                ) : banners.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Banner bulunamadı.</td></tr>
                ) : (
                  banners.map(b => (
                    <tr key={b.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{b.title}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-ink-muted text-xs">{POSITION_LABEL[b.position]}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-ink-muted text-xs">{b.sortOrder}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-ink-muted text-xs">
                        {(b.startsAt || b.endsAt) ? `${formatDate(b.startsAt)} – ${formatDate(b.endsAt)}` : "Süresiz"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={b.isActive ? "success" : "muted"}>{b.isActive ? "Aktif" : "Pasif"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`/admin/bannerlar/${b.id}`}>
                            <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors" aria-label="Düzenle"><Edit size={15} /></button>
                          </Link>
                          <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-ink-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" aria-label="Sil"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Bannerı Sil</h2>
            <p className="text-sm text-ink-muted mb-5">Bu bannerı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
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
