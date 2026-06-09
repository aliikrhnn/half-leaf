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
  lowStockProducts: number;
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
          label: "Düşük Stok",
          value: stats.lowStockProducts,
          icon: AlertTriangle,
          href: "/admin/urunler?lowStock=true",
          color: stats.lowStockProducts > 0 ? "text-red-400" : "text-ink-muted",
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

        {/* Phase 2 placeholder */}
        <div className="rounded-xl bg-bg-card border border-border-default p-6 text-center">
          <p className="text-ink-muted text-sm">
            Grafik ve detaylı raporlar — Phase 5&apos;te eklenecek.
          </p>
        </div>
      </div>
    </>
  );
}
