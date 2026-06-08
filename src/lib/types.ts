export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  categoryId: string;
  categorySlug: string;
  tags: string[];
  sku: string;
  stock: number;
  categoryName?: string;
  variantColors?: string[];
  lowStock?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  rating?: number;
  reviewCount?: number;
  specs?: Record<string, string>;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  shippingAddress: Address;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  addresses: Address[];
  orders: Order[];
}

export interface VariantData {
  id: string;
  name: string;
  price: number;
  attributes: Record<string, string> | null;
  stock: number;
}

export interface NavCategory {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  productCount: number;
  description?: string;
  featuredProduct?: NavFeaturedProduct;
}

export interface NavFeaturedProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice?: number;
  imageUrl: string | null;
  categoryName: string;
}

export type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

export interface FilterState {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sort: SortOption;
  search?: string;
}
