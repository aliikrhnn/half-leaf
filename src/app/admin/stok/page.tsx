"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, AlertCircle, Edit, AlertTriangle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";

interface InventoryRow {
  id:                string;
  quantity:          number;
  reservedQuantity:  number;
  lowStockThreshold: number;
  updatedAt:         string;
  isLowStock:        boolean;
  product:  { id: string; name: string; sku: string; isActive: boolean } | null;
  variant:  { id: string; name: string; sku: string; productId: string } | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminStokPage() {
  const [items, setItems]     = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");

  const fetchStock = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ ...(search && { search }) });
      const res  = await fetch(`/api/admin/stok?${params}`);
      const json = await res.json() as { success: boolean; data?: InventoryRow[]; error?: string };
      if (!json.success) throw new Error(json.error);
      setItems(json.data ?? []);
    } catch { setError("Stok yüklenirken hata oluştu."); }
    finally  { setLoading(false); }
  }, [search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(() => { fetchStock(); }, [fetchStock]);

  const lowCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Stok Yönetimi"
        subtitle={!loading ? `${items.length} kayıt${lowCount > 0 ? ` · ${lowCount} düşük stok` : ""}` : undefined}
      />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">
        <form onSubmit={(e) => { e.preventDefault(); fetchStock(); }} className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
          <input
            type="text"
            placeholder="Ürün adı veya SKU ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
          />
        </form>

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
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Ürün / Varyant</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Stok</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Rezerve</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Eşik</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Güncelleme</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}><td className="px-4 py-3" colSpan={7}><div className="h-10 bg-bg-elevated rounded animate-pulse" /></td></tr>
                  ))
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-muted">Stok kaydı bulunamadı.</td></tr>
                ) : (
                  items.map(item => {
                    const name = item.variant
                      ? `${item.product?.name ?? "—"} · ${item.variant.name}`
                      : (item.product?.name ?? "—");
                    const sku  = item.variant?.sku ?? item.product?.sku ?? "—";
                    const available = item.quantity - item.reservedQuantity;

                    return (
                      <tr key={item.id} className={`hover:bg-bg-elevated/50 transition-colors ${item.isLowStock ? "bg-amber-500/5" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.isLowStock && <AlertTriangle size={13} className="text-amber-400 shrink-0" />}
                            <span className={`text-sm font-medium ${item.isLowStock ? "text-amber-300" : "text-ink"}`}>{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-ink-dim">{sku}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${available <= 0 ? "text-red-400" : item.isLowStock ? "text-amber-400" : "text-ink"}`}>{available}</span>
                          {item.quantity !== available && <span className="text-ink-dim text-xs ml-1">({item.quantity})</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-ink-muted hidden md:table-cell">{item.reservedQuantity}</td>
                        <td className="px-4 py-3 text-right text-ink-muted hidden md:table-cell">{item.lowStockThreshold}</td>
                        <td className="px-4 py-3 text-xs text-ink-muted hidden lg:table-cell">{formatDate(item.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/stok/${item.id}`}>
                            <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors" aria-label="Düzelt"><Edit size={15} /></button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && items.length > 0 && (
          <p className="text-xs text-ink-dim">Stok = Mevcut (parantez içi toplam), Rezerve = bekleyen siparişlerdeki miktar.</p>
        )}
      </div>
    </div>
  );
}
