"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Eye, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "BEKLEMEDE" | "ONAYLANDI" | "HAZIRLANIYOR" | "KARGODA" | "TESLIM_EDILDI" | "IPTAL_EDILDI";
type PaymentStatus = "BEKLIYOR" | "ODENDI" | "BASARISIZ" | "IADE_EDILDI" | "KISMI_IADE";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  grandTotal: number;
  placedAt: string | null;
  createdAt: string;
  user: { email: string; fullName: string };
  paymentStatus: PaymentStatus | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ORDER_STATUS: Record<OrderStatus, { label: string; variant: "default" | "new" | "sale" | "featured" | "success" | "danger" | "muted" }> = {
  BEKLEMEDE:    { label: "Beklemede",    variant: "sale"    },
  ONAYLANDI:    { label: "Onaylandı",    variant: "new"     },
  HAZIRLANIYOR: { label: "Hazırlanıyor", variant: "featured"},
  KARGODA:      { label: "Kargoda",      variant: "new"     },
  TESLIM_EDILDI:{ label: "Teslim Edildi",variant: "success" },
  IPTAL_EDILDI: { label: "İptal Edildi", variant: "danger"  },
};

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; variant: "default" | "new" | "sale" | "featured" | "success" | "danger" | "muted" }> = {
  BEKLIYOR:    { label: "Bekliyor",    variant: "muted"   },
  ODENDI:      { label: "Ödendi",      variant: "success" },
  BASARISIZ:   { label: "Başarısız",   variant: "danger"  },
  IADE_EDILDI: { label: "İade Edildi", variant: "default" },
  KISMI_IADE:  { label: "Kısmi İade",  variant: "default" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminSiparislerPage() {
  const [orders, setOrders]   = useState<OrderRow[]>([]);
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search       && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res  = await fetch(`/api/admin/siparisler?${params}`);
      const json = await res.json() as { success: boolean; data?: { items: OrderRow[]; meta: Meta }; error?: string };
      if (!json.success) throw new Error(json.error);
      setOrders(json.data!.items);
      setMeta(json.data!.meta);
    } catch {
      setError("Siparişler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Siparişler"
        subtitle={meta ? `${meta.total} sipariş` : undefined}
      />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Sipariş no veya e-posta ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </form>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ""); setPage(1); }}
            className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(ORDER_STATUS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Sipariş No</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Tutar</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Sipariş Durumu</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Ödeme</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={7}>
                        <div className="h-10 bg-bg-elevated rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                      Sipariş bulunamadı.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const statusInfo  = ORDER_STATUS[order.status];
                    const paymentInfo = order.paymentStatus ? PAYMENT_STATUS[order.paymentStatus] : null;
                    return (
                      <tr key={order.id} className="hover:bg-bg-elevated/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-semibold text-ink">
                            #{order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted hidden sm:table-cell text-xs">
                          {formatDate(order.placedAt ?? order.createdAt)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="leading-tight">
                            <div className="text-ink text-xs font-medium">{order.user.fullName}</div>
                            <div className="text-ink-dim text-xs">{order.user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gold font-semibold whitespace-nowrap">
                          {formatPrice(order.grandTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {paymentInfo ? (
                            <Badge variant={paymentInfo.variant}>{paymentInfo.label}</Badge>
                          ) : (
                            <span className="text-ink-dim text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/siparisler/${order.id}`}>
                            <button
                              className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors"
                              aria-label="Detay"
                            >
                              <Eye size={15} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
              <span className="text-xs text-ink-dim">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total} sipariş
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page === 1}
                  className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
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
