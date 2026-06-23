"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import ProductForm from "@/components/admin/ProductForm";
import ImageProcessingPanel from "@/components/admin/ImageProcessingPanel";

interface Props {
  params: Promise<{ id: string }>;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  priceCurrency?: "TRY" | "USD";
  stock: number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNew: boolean;
  brand?: string;
  images: { url: string; alt: string; sortOrder: number; colorName?: string; colorHex?: string }[];
  tags: { tag: string }[];
  specs: { key: string; value: string; sortOrder: number }[];
  colors?: { name: string; hex: string; hex2?: string; stock: number }[];
}

export default function UrunDuzenlemePage({ params }: Props) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setProduct(j.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Ürün Düzenle" />
        <div className="p-6">
          <div className="h-96 bg-bg-elevated rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col h-full">
        <AdminHeader title="Ürün Düzenle" />
        <div className="p-6 text-ink-muted">Ürün bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AdminHeader title="Ürün Düzenle" subtitle={product.name} />
      <div className="p-6 max-w-3xl space-y-8">
        <ImageProcessingPanel productId={product.id} />
      </div>
      <ProductForm product={product} />
    </div>
  );
}
