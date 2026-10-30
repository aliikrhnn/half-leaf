"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ShoppingBag, Users, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import { formatPrice } from "@/lib/utils";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  periodDays: 7 | 30;
  dailyStats: {
    date: string;
    label: string;
    orderCount: number;
    deliveredRevenue: number;
  }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    customer: string;
    total: number;
    createdAt: string;
    itemCount: number;
  }[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  BEKLEMEDE: "Beklemede",
  ONAYLANDI: "Onaylandı",
  HAZIRLANIYOR: "Hazırlanıyor",
  TESLIME_HAZIR: "Teslime hazır",
  KARGODA: "Kargoda",
  TESLIM_EDILDI: "Teslim edildi",
  IPTAL_EDILDI: "İptal edildi",
};

function DashboardChart({ days }: { days: Stats["dailyStats"] }) {
  const maxOrders = Math.max(0, ...days.map((day) => day.orderCount));
  const maxRevenue = Math.max(0, ...days.map((day) => day.deliveredRevenue));

  return (
    <section className="rounded-xl bg-bg-card border border-border-default p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-ink">Son {days.length} gün</h2>
        <p className="text-xs text-ink-muted mt-1">Günlük sipariş sayısı ve teslim edilmiş sipariş geliri</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-light" /> Sipariş
          </div>
          <div className="grid gap-1 h-36 items-end" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }} role="img" aria-label={`Son ${days.length} gündeki günlük sipariş sayısı`}>
            {days.map((day) => {
              const height = maxOrders === 0 ? 0 : (day.orderCount / maxOrders) * 100;
              return (
                <div key={day.date} className="h-full flex flex-col justify-end items-center gap-1" title={`${day.label}: ${day.orderCount} sipariş`}>
                  <span className={`text-[10px] text-ink-muted ${days.length > 7 ? "invisible" : ""}`}>{day.orderCount}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t bg-accent-light/80 min-h-0.5" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-ink-dim">{days.length > 7 ? day.date.slice(-2) : day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Teslim edilen gelir
          </div>
          <div className="grid gap-1 h-36 items-end" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }} role="img" aria-label={`Son ${days.length} gündeki günlük teslim edilmiş sipariş geliri`}>
            {days.map((day) => {
              const height = maxRevenue === 0 ? 0 : (day.deliveredRevenue / maxRevenue) * 100;
              return (
                <div key={day.date} className="h-full flex flex-col justify-end items-center gap-1" title={`${day.label}: ${formatPrice(day.deliveredRevenue)}`}>
                  <span className={`hidden xl:inline text-[10px] text-ink-muted ${days.length > 7 ? "invisible" : ""}`}>{day.deliveredRevenue > 0 ? formatPrice(day.deliveredRevenue) : "—"}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t bg-green-400/80 min-h-0.5" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-ink-dim">{days.length > 7 ? day.date.slice(-2) : day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardReports({ stats }: { stats: Stats }) {
  const maxStatusCount = Math.max(1, ...stats.ordersByStatus.map((item) => item.count));

  return (
    <>
      <div className="grid xl:grid-cols-2 gap-4">
        <section className="rounded-xl bg-bg-card border border-border-default p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Sipariş durumları</h2>
            <p className="text-xs text-ink-muted mt-1">Seçili {stats.periodDays} günlük dönemin dağılımı</p>
          </div>
          {stats.ordersByStatus.length === 0 ? (
            <p className="py-6 text-sm text-ink-muted text-center">Bu dönemde sipariş yok.</p>
          ) : (
            <div className="space-y-3">
              {stats.ordersByStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-muted">{ORDER_STATUS_LABELS[item.status] ?? item.status}</span>
                    <span className="text-ink font-medium">{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-accent-light" style={{ width: `${(item.count / maxStatusCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-bg-card border border-border-default p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Çok satan ürünler</h2>
            <p className="text-xs text-ink-muted mt-1">İptal edilenler hariç, seçili dönem</p>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="py-6 text-sm text-ink-muted text-center">Bu dönemde ürün satışı yok.</p>
          ) : (
            <div className="divide-y divide-border-default">
              {stats.topProducts.map((product, index) => (
                <div key={`${product.name}-${index}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-bg-elevated flex items-center justify-center text-xs text-ink-muted">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink truncate">{product.name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{product.quantity} adet satıldı</p>
                  </div>
                  <span className="text-xs text-ink font-medium whitespace-nowrap">{formatPrice(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl bg-bg-card border border-border-default overflow-hidden">
        <div className="p-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Son siparişler</h2>
            <p className="text-xs text-ink-muted mt-1">En son oluşturulan 6 sipariş</p>
          </div>
          <Link href="/admin/siparisler" className="text-xs text-accent-light hover:text-gold whitespace-nowrap">Tüm siparişler →</Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-ink-muted text-center">Henüz sipariş yok.</p>
        ) : (
          <div className="divide-y divide-border-default">
            {stats.recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/siparisler/${order.id}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.2fr_1fr_auto_auto] items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-bg-elevated/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-ink-muted truncate mt-0.5">{order.customer}</p>
                </div>
                <span className="hidden sm:block text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</span>
                <span className="justify-self-end text-[10px] text-ink-muted">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
                <span className="col-span-2 sm:col-span-1 justify-self-end text-xs font-medium text-ink">{formatPrice(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState<7 | 30>(30);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/stats?days=${periodDays}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error ?? "Rapor verileri alınamadı.");
        if (active) setStats(d.data);
      })
      .catch(() => {
        if (active) setError("Dashboard raporları yüklenemedi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [periodDays]);

  const STAT_CARDS = stats
    ? [
        {
          label: "Toplam Gelir",
          value: formatPrice(stats.totalRevenue),
          icon: TrendingUp,
          color: "text-gold",
          bg: "bg-gold-muted",
        },
        {
          label: "Toplam Sipariş",
          value: stats.totalOrders.toLocaleString("tr-TR"),
          icon: ShoppingBag,
          color: "text-accent-light",
          bg: "bg-accent-muted",
        },
        {
          label: "Toplam Ürün",
          value: stats.totalProducts.toLocaleString("tr-TR"),
          icon: Package,
          color: "text-ink",
          bg: "bg-bg-elevated",
        },
        {
          label: "Müşteriler",
          value: stats.totalCustomers.toLocaleString("tr-TR"),
          icon: Users,
          color: "text-ink",
          bg: "bg-bg-elevated",
        },
      ]
    : [];

  const ALERT_CARDS = stats
    ? [
        {
          label: "Bekleyen Sipariş",
          value: stats.pendingOrders,
          icon: Clock,
          href: "/admin/siparisler?status=BEKLEMEDE",
          color: stats.pendingOrders > 0 ? "text-yellow-400" : "text-ink-muted",
        },
        {
          label: "Düşük Stok Kalemi",
          value: stats.lowStockItems,
          icon: AlertTriangle,
          href: "/admin/stok?lowStock=true",
          color: stats.lowStockItems > 0 ? "text-red-400" : "text-ink-muted",
        },
      ]
    : [];

  return (
    <>
      <AdminHeader
        title="Dashboard"
        subtitle="Mağaza genel durumu"
      />

      <div className="p-3 sm:p-6 space-y-6">
        {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-bg-card border border-border-default animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className="flex flex-col gap-4 p-5 rounded-xl bg-bg-card border border-border-default"
                >
                  <div className={`p-2.5 rounded-lg ${bg} w-fit`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">{value}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Alert cards */}
            {ALERT_CARDS.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {ALERT_CARDS.map(({ label, value, icon: Icon, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-4 p-5 rounded-xl bg-bg-card border border-border-default hover:border-border-light transition-colors"
                  >
                    <Icon size={20} className={color} />
                    <div>
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-ink-muted">{label}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {stats && (
          <>
            <div className="flex justify-end">
              <div role="group" aria-label="Rapor dönemi" className="inline-flex rounded-lg border border-border-default bg-bg-card p-1">
                {([7, 30] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => { setLoading(true); setError(""); setPeriodDays(days); }}
                    aria-pressed={periodDays === days}
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors ${periodDays === days ? "bg-bg-elevated text-ink" : "text-ink-muted hover:text-ink"}`}
                  >
                    {days} gün
                  </button>
                ))}
              </div>
            </div>
            <DashboardChart days={stats.dailyStats} />
            <DashboardReports stats={stats} />
          </>
        )}
      </div>
    </>
  );
}
