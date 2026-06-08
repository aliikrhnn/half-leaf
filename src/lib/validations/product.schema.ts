import { z } from "zod";

export const ProductImageSchema = z.object({
  url: z.string().min(1, "Görsel URL boş olamaz."),
  altText: z.string().max(200).default(""),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export const ProductVariantSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(100),
  price: z.number().positive("Fiyat 0'dan büyük olmalıdır."),
  attributes: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const CreateProductSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire içerebilir."),
  name: z.string().min(1, "Ürün adı zorunludur.").max(300),
  shortDescription: z.string().max(500).default(""),
  description: z.string().max(10000).default(""),
  sku: z.string().min(1, "SKU zorunludur.").max(100),
  basePrice: z.number().positive("Fiyat 0'dan büyük olmalıdır."),
  compareAtPrice: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  categoryId: z.string().min(1, "Geçerli bir kategori seçiniz."),
  materialId: z.string().optional(),
  careInfo: z.string().max(2000).optional(),
  weightGrams: z.number().int().min(0).optional(),
  images: z.array(ProductImageSchema).default([]),
  variants: z.array(ProductVariantSchema).default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(["featured", "newest", "price-asc", "price-desc"]).default("featured"),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isBestseller: z.coerce.boolean().optional(),
  cokSatanlar: z.coerce.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
