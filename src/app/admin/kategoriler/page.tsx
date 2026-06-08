"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
}

export default function AdminKategorilerPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories?isActive=false");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCategories(json.data);
    } catch {
      setError("Kategoriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching pattern: useCallback stabilizes ref, no cascade loop
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchCategories();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kategori silinemedi.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Kategoriler"
        subtitle={`${categories.length} kategori`}
        actions={
          <Link href="/admin/kategoriler/yeni">
            <Button variant="primary" size="sm">
              <Plus size={16} />
              Yeni Kategori
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-5 flex-1 overflow-auto">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-elevated">
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Ürün</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Sıra</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="h-10 bg-bg-elevated rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                    Kategori bulunamadı.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-bg-elevated flex-shrink-0">
                            <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="36px" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-bg-elevated flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent">{cat.name[0]}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-ink">{cat.name}</div>
                          {cat.description && (
                            <div className="text-xs text-ink-dim truncate max-w-48">{cat.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-dim font-mono text-xs hidden sm:table-cell">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {cat._count.products}
                    </td>
                    <td className="px-4 py-3 text-ink-dim hidden md:table-cell">
                      {cat.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      {cat.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="default">Pasif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/kategoriler/${cat.id}`}>
                          <button className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors" aria-label="Düzenle">
                            <Edit size={15} />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          disabled={cat._count.products > 0}
                          className="p-1.5 text-ink-muted hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={cat._count.products > 0 ? "Ürün içeren kategori silinemez" : "Sil"}
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
      </div>

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-default rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-ink mb-2">Kategoriyi Sil</h2>
            <p className="text-sm text-ink-muted mb-5">
              Bu kategoriyi silmek istediğinizden emin misiniz?
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
    </div>
  );
}
