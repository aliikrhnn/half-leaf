"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2,
  AlertCircle, CheckSquare, Square, Download, Tag, Star,
  Zap, Eye, EyeOff,
} from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import BulkProcessingBar from "@/components/admin/BulkProcessingBar";

interface ProductImage {
  url: string;
  alt: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  images: ProductImage[];
  imageCount: number;
  processedCount: number;
  categoryName: string;
  createdAt: string;
}

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  createdAt: string;
  Category: { name: string } | null;
  ProductImage: { url: string; altText: string; isProcessed?: boolean }[] | null;
  Inventory: { quantity: number } | null;
}

function normalize(raw: RawProduct): Product {
  const imgs = raw.ProductImage ?? [];
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    sku: raw.sku,
    price: Number(raw.basePrice),
    stock: raw.Inventory?.quantity ?? 0,
    isActive: raw.isActive,
    isFeatured: raw.isFeatured,
    isBestseller: raw.isBestseller,
    isNew: false,
    images: imgs.map((img) => ({ url: img.url, alt: img.altText })),
    imageCount: imgs.length,
    processedCount: imgs.filter((img) => img.isProcessed).length,
    categoryName: raw.Category?.name ?? "",
    createdAt: raw.createdAt,
  };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortOption = "featured" | "newest" | "price-asc" | "price-desc";

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

type BulkAction =
  | "activate"
  | "deactivate"
  | "markBestseller"
  | "unmarkBestseller"
  | "markFeatured"
  | "unmarkFeatured"
  | "changeCategory"
  | "aiConvert"
  | "export";

interface ConfirmState {
  action: BulkAction;
  label: string;
  description: string;
}

export default function AdminUrunlerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("newest");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setCategories(
            (j.data as CategoryOption[]).sort((a, b) =>
              a.name.localeCompare(b.name, "tr")
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sort,
        ...(search && { search }),
        ...(activeFilter && { isActive: activeFilter }),
        ...(categorySlug && { category: categorySlug }),
      });
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setProducts((json.data ?? []).map(normalize));
      setMeta(json.meta ?? null);
      // Clear selection on data reload
      setSelected(new Set());
    } catch {
      setError("Ürünler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, activeFilter, categorySlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchProducts();
    } catch {
      setError("Ürün silinemedi.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // Selection helpers
  const allPageIds = products.map((p) => p.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));
  const someSelected = allPageIds.some((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedIds = Array.from(selected);

  // Bulk action executor
  const execBulkAction = async (action: BulkAction, extra?: { categoryId?: string }) => {
    setBulkLoading(true);
    setBulkError("");
    try {
      if (action === "export") {
        const res = await fetch("/api/admin/products/bulk-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        });
        if (!res.ok) throw new Error("Export başarısız.");
        const blob = await res.blob();
        const cd = res.headers.get("content-disposition") ?? "";
        const match = cd.match(/filename="([^"]+)"/);
        const filename = match?.[1] ?? "urunler.xlsx";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (action === "aiConvert") {
        const res = await fetch("/api/admin/image-processing/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: selectedIds }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "AI dönüştürme başlatılamadı.");
        return;
      }

      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, ...extra }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "İşlem başarısız.");
      await fetchProducts();
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setBulkLoading(false);
      setConfirm(null);
      setCategoryModalOpen(false);
      setAiModalOpen(false);
    }
  };

  const openConfirm = (action: BulkAction, label: string, description: string) =>
    setConfirm({ action, label, description });

  const pendingImagesCount = products
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + (p.imageCount - p.processedCount), 0);

  const estimatedCost = (pendingImagesCount * 0.04).toFixed(2);

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Ürünler"
        subtitle={meta ? `${meta.total} ürün` : undefined}
        actions={
          <Link href="/admin/urunler/yeni">
            <Button variant="primary" size="sm">
              <Plus size={16} />
              Yeni Ürün
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-5 flex-1 overflow-auto">
        {/* Bulk Image Processing */}
        <BulkProcessingBar />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Ürün adı, SKU veya etiket ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink placeholder-ink-dim focus:outline-none focus:border-accent"
            />
          </form>

          <div className="flex flex-wrap gap-2">
            <select
              value={categorySlug}
              onChange={(e) => { setCategorySlug(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value as typeof activeFilter); setPage(1); }}
              className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
            >
              <option value="">Tüm Durum</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>

            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
              className="px-3 py-2 text-sm bg-bg-surface border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent"
            >
              <option value="newest">En Yeni</option>
              <option value="featured">Öne Çıkan</option>
              <option value="price-asc">Fiyat: Düşük</option>
              <option value="price-desc">Fiyat: Yüksek</option>
            </select>
          </div>
        </div>

        {/* Active category badge */}
        {categorySlug && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>
              Kategori: <strong className="text-ink">
                {categories.find((c) => c.slug === categorySlug)?.name ?? categorySlug}
              </strong>
            </span>
            <button
              onClick={() => { setCategorySlug(""); setPage(1); }}
              className="text-ink-dim hover:text-red-400 transition-colors"
              aria-label="Filtreyi temizle"
            >
              ×
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Bulk error */}
        {bulkError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />
            {bulkError}
            <button onClick={() => setBulkError("")} className="ml-auto text-red-400/60 hover:text-red-400">×</button>
          </div>
        )}

        {/* Selection info band */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-accent/10 border border-accent/30 rounded-lg text-sm text-ink">
            <CheckSquare size={15} className="text-accent flex-shrink-0" />
            <span><strong>{selected.size}</strong> ürün seçildi</span>
            <button
              onClick={clearSelection}
              className="text-ink-dim hover:text-ink text-xs underline underline-offset-2"
            >
              Seçimi Temizle
            </button>
          </div>
        )}

        {/* Bulk Toolbar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-bg-surface border border-border-default rounded-xl">
            <span className="text-xs text-ink-dim mr-1">Toplu İşlem:</span>

            <button
              onClick={() => openConfirm("activate", "Aktifleştir", `${selected.size} ürün aktif hale getirilecek.`)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
            >
              <Eye size={13} />
              Aktifleştir
            </button>

            <button
              onClick={() => openConfirm("deactivate", "Pasifleştir", `${selected.size} ürün pasif hale getirilecek.`)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-500/10 text-ink-muted border border-border-default rounded-md hover:bg-zinc-500/20 disabled:opacity-40 transition-colors"
            >
              <EyeOff size={13} />
              Pasifleştir
            </button>

            <button
              onClick={() => openConfirm("markBestseller", "Çok Satan İşaretle", `${selected.size} ürün "Çok Satan" olarak işaretlenecek.`)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-md hover:bg-amber-500/20 disabled:opacity-40 transition-colors"
            >
              <Star size={13} />
              Çok Satan
            </button>

            <button
              onClick={() => openConfirm("unmarkBestseller", "Çok Satan Kaldır", `${selected.size} üründen "Çok Satan" etiketi kaldırılacak.`)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-500/10 text-ink-muted border border-border-default rounded-md hover:bg-zinc-500/20 disabled:opacity-40 transition-colors"
            >
              <Star size={13} />
              Çok Satan Kaldır
            </button>

            <button
              onClick={() => openConfirm("markFeatured", "Öne Çıkar", `${selected.size} ürün öne çıkarılacak.`)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-md hover:bg-purple-500/20 disabled:opacity-40 transition-colors"
            >
              <Zap size={13} />
              Öne Çıkar
            </button>

            <button
              onClick={() => openConfirm("unmarkFeatured", "Öne Çıkarma Kaldır", `${selected.size} üründen "Öne Çıkan" etiketi kaldırılacak.`)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-500/10 text-ink-muted border border-border-default rounded-md hover:bg-zinc-500/20 disabled:opacity-40 transition-colors"
            >
              <Zap size={13} />
              Öne Çıkarma Kaldır
            </button>

            <button
              onClick={() => { setSelectedCategoryId(""); setCategoryModalOpen(true); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/20 disabled:opacity-40 transition-colors"
            >
              <Tag size={13} />
              Kategori Değiştir
            </button>

            <button
              onClick={() => setAiModalOpen(true)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-md hover:bg-violet-500/20 disabled:opacity-40 transition-colors"
            >
              <Zap size={13} />
              AI Dönüştür
            </button>

            <button
              onClick={() => execBulkAction("export")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-md hover:bg-teal-500/20 disabled:opacity-40 transition-colors"
            >
              <Download size={13} />
              Excel Export
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated">
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleAll}
                      aria-label="Tümünü seç"
                      className="text-ink-dim hover:text-ink transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare size={16} className="text-accent" />
                      ) : someSelected ? (
                        <CheckSquare size={16} className="text-ink-dim opacity-50" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Ürün</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Fiyat</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Stok</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Durum</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={7}>
                        <div className="h-10 bg-bg-elevated rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                      Ürün bulunamadı.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className={`hover:bg-bg-elevated/50 transition-colors ${selected.has(product.id) ? "bg-accent/5" : ""}`}
                    >
                      <td className="px-4 py-3 w-10">
                        <button
                          onClick={() => toggleOne(product.id)}
                          aria-label={`${product.name} seç`}
                          className="text-ink-dim hover:text-ink transition-colors"
                        >
                          {selected.has(product.id) ? (
                            <CheckSquare size={16} className="text-accent" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-bg-elevated flex-shrink-0">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.images[0].alt}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ink-dim text-xs">
                                —
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-ink leading-tight">{product.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-ink-dim">{product.sku}</span>
                              {product.imageCount > 0 && (
                                <span className="text-xs text-ink-dim">
                                  {product.processedCount > 0 ? (
                                    <span className="text-emerald-400/80">
                                      {product.processedCount}/{product.imageCount} AI
                                    </span>
                                  ) : (
                                    `${product.imageCount} görsel`
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted hidden md:table-cell">
                        {product.categoryName}
                      </td>
                      <td className="px-4 py-3 text-gold font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={product.stock <= 5 ? "text-yellow-400 font-medium" : "text-ink-muted"}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {product.isActive ? (
                            <Badge variant="success">Aktif</Badge>
                          ) : (
                            <Badge variant="default">Pasif</Badge>
                          )}
                          {product.isFeatured && <Badge variant="new">Öne Çıkan</Badge>}
                          {product.isBestseller && <Badge variant="sale">Çok Satan</Badge>}
                          {product.isNew && <Badge variant="sale">Yeni</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/admin/urunler/${product.id}`}>
                            <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors" aria-label="Düzenle">
                              <Edit size={15} />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-1.5 text-ink-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                            aria-label="Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
              <span className="text-xs text-ink-dim">
                {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} / {meta.total} ürün
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

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Ürünü Sil</h2>
            <p className="text-sm text-ink-muted mb-5">
              Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)} disabled={deleting}>
                İptal
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">{confirm.label}</h2>
            <p className="text-sm text-ink-muted mb-5">{confirm.description}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setConfirm(null)} disabled={bulkLoading}>
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => execBulkAction(confirm.action)}
                disabled={bulkLoading}
              >
                {bulkLoading ? "İşleniyor..." : "Onayla"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Change Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Kategori Değiştir</h2>
            <p className="text-sm text-ink-muted mb-4">
              {selected.size} ürünün kategorisi değiştirilecek.
            </p>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-bg-elevated border border-border-default rounded-lg text-ink focus:outline-none focus:border-accent mb-5"
            >
              <option value="">Kategori seçin...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setCategoryModalOpen(false)} disabled={bulkLoading}>
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => execBulkAction("changeCategory", { categoryId: selectedCategoryId })}
                disabled={bulkLoading || !selectedCategoryId}
              >
                {bulkLoading ? "İşleniyor..." : "Uygula"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Convert Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">AI Görsel Dönüştürme</h2>
            <div className="text-sm text-ink-muted space-y-2 mb-5">
              <p>
                <strong className="text-ink">{selected.size}</strong> seçili ürünün{" "}
                <strong className="text-ink">{pendingImagesCount}</strong> bekleyen görseli dönüştürülecek.
              </p>
              {pendingImagesCount > 0 && (
                <p className="text-amber-400/80 text-xs">
                  Tahmini maliyet: ~<strong>${estimatedCost}</strong> (görsel başına ~$0.04)
                </p>
              )}
              {pendingImagesCount === 0 && (
                <p className="text-emerald-400/80 text-xs">
                  Seçili ürünlerin tüm görselleri zaten dönüştürülmüş.
                </p>
              )}
              <p className="text-xs text-ink-dim">
                İşlem arka planda çalışır. Bu sayfadan ayrılabilirsiniz.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAiModalOpen(false)} disabled={bulkLoading}>
                İptal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => execBulkAction("aiConvert")}
                disabled={bulkLoading || pendingImagesCount === 0}
              >
                {bulkLoading ? "Başlatılıyor..." : "Dönüştürmeyi Başlat"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
