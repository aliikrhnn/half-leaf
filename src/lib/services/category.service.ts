import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

export const CreateCategorySchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export async function listCategories(activeOnly = true) {
  return prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      _count: { select: { Product: { where: { isActive: true } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { Product: { where: { isActive: true } } } },
    },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { Product: { where: { isActive: true } } } },
    },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  // Bir kategori kendisinin üst kategorisi olamaz — döngüyü engelle.
  const safe = data.parentId === id ? { ...data, parentId: null } : data;
  return prisma.category.update({ where: { id }, data: safe });
}

export async function deleteCategory(id: string) {
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    throw new Error("Bu kategoride ürün bulunmaktadır. Silmeden önce ürünleri taşıyın.");
  }
  return prisma.category.delete({ where: { id } });
}
