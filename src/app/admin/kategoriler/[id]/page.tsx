"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import CategoryForm from "@/components/admin/CategoryForm";

interface Props {
  params: Promise<{ id: string }>;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function KategoriDuzenlemePage({ params }: Props) {
  const { id } = use(params);
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/categories/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCategory(j.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Kategori Düzenle" />
        <div className="p-6">
          <div className="h-64 bg-bg-elevated rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Kategori Düzenle" />
        <div className="p-6 text-ink-muted">Kategori bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Kategori Düzenle" subtitle={category.name} />
      <CategoryForm category={category} />
    </div>
  );
}
