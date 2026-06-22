"use client";

import { useState } from "react";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import type { Product, VariantData } from "@/lib/types";

interface Props {
  product: Product;
  isNew: boolean;
  categoryName: string;
  categorySlug: string;
  variants: VariantData[];
  lowStockThreshold: number;
}

/**
 * Galeri ile bilgi panelini sarmalar; renk seçimini ikisi arasında paylaşır.
 * Renk seçenekleri görsellerden türetilir; renk seçilince galeri o renge filtrelenir.
 */
export default function ProductDetailMain({
  product,
  isNew,
  categoryName,
  categorySlug,
  variants,
  lowStockThreshold,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(32px, 5vw, 64px)",
        marginBottom: 72,
        alignItems: "start",
      }}
      className="product-detail-grid"
    >
      <ProductGallery
        images={product.images}
        name={product.name}
        isNew={isNew}
        selectedColor={selectedColor}
      />
      <ProductInfo
        product={product}
        categoryName={categoryName}
        categorySlug={categorySlug}
        variants={variants}
        lowStockThreshold={lowStockThreshold}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />
    </div>
  );
}
