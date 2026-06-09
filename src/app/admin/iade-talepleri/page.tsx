"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, AlertCircle, RotateCcw } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";

type ReturnStatus = "TALEP_OLUSTURULDU" | "INCELENIYOR" | "ONAYLANDI" | "REDDEDILDI" | "TAMAMLANDI";
type ReturnType   = "IADE" | "DEGISIM";

interface ReturnRow {
  id:          string;
  status:      ReturnStatus;
  type:        ReturnType;
  createdAt:   string;
  updatedAt:   string;
  orderNumber: string;
  orderId:     string;
  customer: { id: string; fullName: string; email: string };
}

interface Meta { total: number; page: number; limit: number; totalPages: number }

const STATUS_LABEL: Record<ReturnStatus, string> = {
  TALEP_OLUSTURULDU: "Talep Edildi",
  INCELENIYOR:       "İnceleniyor",
  ONAYLANDI:         "Onaylandı",
  REDDEDILDI:        "Reddedildi",
  TAMAMLANDI:        "Tamamlandı",
};

const STATUS_COLORS: Record<ReturnStatus, string> = {
  TALEP_OLUSTURULDU: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  INCELENIYOR:       "bg-blue-500/15 text-blue-400 border-blue-500/20",
  ONAYLANDI:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REDDEDILDI:        "bg-red-500/15 text-red-400 border-red-500/20",
  TAMAMLANDI:        "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const TYPE_LABEL: Record<ReturnType, string> = {
  IADE:    "İade",
  DEGISIM: "Değişim",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminIadeTaleplerisPage() {
  const [rows,         setRows]         = useState<ReturnRow[]>([]);
  const [meta,         setMeta]         = useState<Meta | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "">("");
  const [typeFilter,   setTypeFilter]   = useState<ReturnType | "">("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "20",
        ...(search       && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter   && { type:   typeFilter }),
      });
      const res  = await fetch(`/api/admin/iade-talepleri?${params}`);
      const json = await res.json() as {
        success: boolean;
        data?: { items: ReturnRow[]; pendingCount: number; meta: Meta };
        error?: string;
      };
      if (!json.success) throw new Error(json.error);
      setRows(json.data!.items);
      setPendingCount(json.data!.pendingCount);
      setMeta(json.data!.meta);
    } catch {
      setError("İade talepleri yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern
  useEffect(() => { fetchData(); }, [fetchData]);

  const subtitle = meta
    ? `${meta.total} talep${pendingCount > 0 ? ` · ${pendingCount} yeni` : ""}`
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="İade Talepleri" subtitle={subtitle} />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">

        {/* Özet */}
        {!loading && pendingCount > 0 && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <RotateCcw size={16} className="text-yellow-400" />
            <p className="text-sm text-yellow-400">
              <span className="font-bold">{pendingCount}</span> yeni iade talebi inceleme bekliyor.
            </p>
          </div>
        )}

        {/* Filtreler */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }}
            className="flex-1 relative"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Sipariş no veya müşteri e-postası…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </form>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ReturnStatus | ""); setPage(1); }}
            className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tüm Durumlar</option>
            {(Object.keys(STATUS_LABEL) as ReturnStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as ReturnType | ""); setPage(1); }}
            className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tüm Türler</option>
            <option value="IADE">İade</option>
            <option value="DEGISIM">Değişim</option>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Sipariş</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Tür</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Durum</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={5}>
                        <div className="h-9 bg-bg-elevated rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-ink-muted">İade talebi bulunamadı.</td>
                  </tr>
                ) : (
                  rows.map(r => (
                    <tr key={r.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/iade-talepleri/${r.id}`} className="block hover:text-accent transition-colors">
                          <span className="font-medium text-ink">{r.customer.fullName}</span>
                          <span className="block text-xs text-ink-dim">{r.customer.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link
                          href={`/admin/siparisler/${r.orderId}`}
                          className="font-mono text-xs text-accent-light hover:text-gold transition-colors"
                        >
                          {r.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className="text-xs text-ink-muted">{TYPE_LABEL[r.type]}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-ink-dim hidden lg:table-cell">
                        {formatDate(r.createdAt)}
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
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total} talep
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
