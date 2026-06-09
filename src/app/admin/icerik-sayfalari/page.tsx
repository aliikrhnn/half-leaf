"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil, AlertCircle } from "lucide-react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import Badge from "@/components/ui/Badge";

interface LegalPageRow {
  id:          string;
  slug:        string;
  title:       string;
  version:     string;
  isPublished: boolean;
  updatedAt:   string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function IcerikSayfalarPage() {
  const [pages, setPages]   = useState<LegalPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/admin/icerik-sayfalari")
      .then(r => r.json() as Promise<{ success: boolean; data?: LegalPageRow[]; error?: string }>)
      .then(json => {
        if (!json.success) throw new Error(json.error);
        setPages(json.data ?? []);
      })
      .catch(() => setError("Sayfalar yüklenirken hata oluştu."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="İçerik Sayfaları"
        subtitle={!loading ? `${pages.length} sayfa` : undefined}
      />

      <div className="p-3 sm:p-6 space-y-5 flex-1 overflow-auto">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Başlık</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden sm:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden md:table-cell">Versiyon</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-dim uppercase tracking-wider hidden lg:table-cell">Son Güncelleme</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3" colSpan={6}>
                        <div className="h-8 bg-bg-elevated rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                      Sayfa bulunamadı.
                    </td>
                  </tr>
                ) : (
                  pages.map(page => (
                    <tr key={page.id} className="hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-ink">{page.title}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs font-mono text-ink-dim">{page.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={page.isPublished ? "success" : "muted"}>
                          {page.isPublished ? "Yayında" : "Taslak"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-ink-dim">{page.version}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted hidden lg:table-cell">
                        {formatDate(page.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/icerik-sayfalari/${page.id}`}>
                          <button
                            className="p-1.5 text-ink-muted hover:text-ink hover:bg-bg-elevated rounded-md transition-colors"
                            aria-label="Düzenle"
                          >
                            <Pencil size={15} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
