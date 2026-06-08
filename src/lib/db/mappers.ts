import type { Product, Category } from "@/lib/types";

export interface DbProductImage {
  url: string;
  altText: string;
  sortOrder: number;
}

export interface DbProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  basePrice: unknown;
  compareAtPrice: unknown | null;
  categoryId: string;
  sku: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;
  Category: { id: string; slug: string; name: string };
  ProductImage: DbProductImage[];
  Inventory: { quantity: number } | null;
}

export interface DbCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  _count: { Product: number };
}

export function mapProduct(p: DbProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    price: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
    images:
      p.ProductImage.length > 0
        ? p.ProductImage.map((img) => ({ url: img.url, alt: img.altText }))
        : [
            {
              url: `https://placehold.co/600x600/191919/c9a96e?text=${encodeURIComponent(p.name)}`,
              alt: p.name,
            },
          ],
    categoryId: p.categoryId,
    categorySlug: p.Category.slug,
    categoryName: p.Category.name,
    tags: [],
    sku: p.sku,
    stock: p.Inventory?.quantity ?? 0,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
  };
}

export function mapCategory(c: DbCategory): Category {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? "",
    image:
      c.imageUrl ??
      `https://placehold.co/600x400/191919/c9a96e?text=${encodeURIComponent(c.name)}`,
    productCount: c._count.Product,
  };
}
