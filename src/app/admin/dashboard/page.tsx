"use client";

import { useEffect, useState } from "react";
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
  dailyStats: {
    date: string;
    label: string;
    orderCount: number;
    deliveredRevenue: number;
  }[];
}

function DashboardChart({ days }: { days: Stats["dailyStats"] }) {
  const maxOrders = Math.max(0, ...days.map((day) => day.orderCount));
  const maxRevenue = Math.max(0, ...days.map((day) => day.deliveredRevenue));

  return (
    <section className="rounded-xl bg-bg-card border border-border-default p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-ink">Son 7 gün</h2>
        <p className="text-xs text-ink-muted mt-1">Sipariş sayısı ve teslim edilmiş sipariş geliri</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-light" /> Sipariş
          </div>
          <div className="grid grid-cols-7 gap-2 h-36 items-end" role="img" aria-label="Son 7 gündeki günlük sipariş sayısı">
            {days.map((day) => {
              const height = maxOrders === 0 ? 0 : (day.orderCount / maxOrders) * 100;
              return (
                <div key={day.date} className="h-full flex flex-col justify-end items-center gap-1" title={`${day.label}: ${day.orderCount} sipariş`}>
                  <span className="text-[10px] text-ink-muted">{day.orderCount}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t bg-accent-light/80 min-h-0.5" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] text-ink-dim capitalize">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-3">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> Teslim edilen gelir
          </div>
          <div className="grid grid-cols-7 gap-2 h-36 items-end" role="img" aria-label="Son 7 gündeki günlük teslim edilmiş sipariş geliri">
            {days.map((day) => {
              const height = maxRevenue === 0 ? 0 : (day.deliveredRevenue / maxRevenue) * 100;
              return (
                <div key={day.date} className="h-full flex flex-col justify-end items-center gap-1" title={`${day.label}: ${formatPrice(day.deliveredRevenue)}`}>
                  <span className="text-[10px] text-ink-muted">{day.deliveredRevenue > 0 ? formatPrice(day.deliveredRevenue) : "—"}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-t bg-green-400/80 min-h-0.5" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] text-ink-dim capitalize">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

        {stats && <DashboardChart days={stats.dailyStats} />}
      </div>
    </>
  );
}
