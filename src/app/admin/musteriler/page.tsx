"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Users } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import { formatPrice } from "@/lib/utils";

interface MusteriRow {
  id:          string;
  fullName:    string;
  email:       string;
  phone:       string | null;
  createdAt:   string;
  orderCount:  number;
  totalSpend:  number;
  ticariIleti: boolean;
}

interface Stats { totalCustomers: number; ticariAcik: number }
interface Meta  { total: number; page: number; limit: number; totalPages: number }

type TicariFilter = "" | "acik" | "kapali";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function AdminMusterilerPage() {
  const [musteriler, setMusteriler] = useState<MusteriRow[]>([]);
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [meta,       setMeta]       = useState<Meta  | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [ticariFilter, setTicariFilter] = useState<TicariFilter>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "20",
        ...(search       && { search }),
        ...(ticariFilter && { ticariIleti: ticariFilter }),
      });
      const res  = await fetch(`/api/admin/musteriler?${params}`);
      const json = await res.json() as {
        success: boolean;
        data?: { items: MusteriRow[]; stats: Stats; meta: Meta };
        error?: string;
      };
      if (!json.success) throw new Error(json.error);
      setMusteriler(json.data!.items);
      setStats(json.data!.stats);
      setMeta(json.data!.meta);
    } catch {
      setError("Müşteriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [page, search, ticariFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern
  useEffect(() => { fetchData(); }, [fetchData]);

  const subtitle = meta
    ? `${meta.total} müşteri${stats ? ` · ${stats.ticariAcik} ticari ileti onaylı` : ""}`
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Müşteriler" subtitle={subtitle} />

      <div className="p-6 space-y-5 flex-1 overflow-auto">

        {/* Özet kartlar */}
        {stats && !loading && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-card border border-border-default">
              <div className="p-2.5 rounded-lg bg-bg-elevated w-fit">
                <Users size={16} className="text-ink-muted" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink">{stats.totalCustomers.toLocaleString("tr-TR")}</p>
                <p className="text-xs text-ink-muted">Toplam Müşteri</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-card border border-border-default">
              <div className="p-2.5 rounded-lg bg-accent/10 w-fit">
                <span className="block w-4 h-4 rounded-full bg-accent/60" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink">{stats.ticariAcik.toLocaleString("tr-TR")}</p>
                <p className="text-xs text-ink-muted">Ticari İleti Onaylı</p>
              </div>
            </div>
          </div>
        )}

        {/* Arama + Filtreler */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }}
            className="flex-1 relative"
          >
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
            value={ticariFilter}
            onChange={(e) => { setTicariFilter(e.target.value as TicariFilter); setPage(1); }}
            className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tüm Müşteriler</option>
            <option value="acik">Ticari İleti Açık</option>
            <option value="kapali">Ticari İleti Kapalı</option>
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />{error}
          </div>
        )}

        {/* Tablo */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Ad Soyad</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Telefon</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Kayıt Tarihi</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Sipariş</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Harcama</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Ticari İleti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="h-9 bg-bg-elevated rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : musteriler.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                      Müşteri bulunamadı.
                    </td>
                  </tr>
                ) : (
                  musteriler.map(m => (
                    <tr key={m.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/musteriler/${m.id}`} className="block hover:text-accent transition-colors">
                          <span className="font-medium text-ink">{m.fullName}</span>
                          <span className="block text-xs text-ink-dim">{m.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-ink-muted text-xs">
                        {m.phone ?? <span className="text-ink-dim">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-ink-dim text-xs">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-right text-ink-muted text-xs">
                        {m.orderCount}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-right text-ink-muted text-xs">
                        {formatPrice(m.totalSpend)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.ticariIleti ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                            Açık
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-ink-dim border border-border-default">
                            Kapalı
                          </span>
                        )}
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
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total} müşteri
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
    </div>
  );
}
