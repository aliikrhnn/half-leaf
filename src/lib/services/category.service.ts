import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// Baştan/sondan ve ardışık tireye izin verilmez — aksi hâlde "/kategori/-el-bomber"
// veya "cosmo-bowl-" gibi hem çirkin hem de yinelenen kategorileri gizleyen
// slug'lar oluşuyor.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateCategorySchema = z.object({
  slug: z.string().min(1).max(200).regex(SLUG_RE, "Slug yalnızca küçük harf, rakam ve tek tire içerebilir (başta/sonda tire olamaz)."),
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

/**
 * `candidateParentId`, `id`'nin kendisi veya alt ağacındaki bir kategori mi?
 * Öyleyse ebeveyn yapılması döngü kurar (A→B→A) ve navigasyonu üreten
 * özyineleme sonsuza girer.
 */
async function wouldCreateCycle(id: string, candidateParentId: string): Promise<boolean> {
  if (candidateParentId === id) return true;
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const byId = new Map(all.map((c) => [c.id, c.parentId]));

  let cur: string | null | undefined = candidateParentId;
  const seen = new Set<string>();
  while (cur) {
    if (cur === id) return true;
    if (seen.has(cur)) break; // veride zaten döngü var — daha fazla ilerleme
    seen.add(cur);
    cur = byId.get(cur) ?? null;
  }
  return false;
}

export async function updateCategory(id: string, data: UpdateCategoryInput) {
  // Bir kategori kendisinin ya da torunlarının altına taşınamaz — döngüyü engelle.
  let safe = data;
  if (data.parentId) {
    if (await wouldCreateCycle(id, data.parentId)) {
      throw new Error("Bir kategori kendisinin veya alt kategorilerinden birinin altına taşınamaz.");
    }
  } else if (data.parentId === id) {
    safe = { ...data, parentId: null };
  }
  return prisma.category.update({ where: { id }, data: safe });
}

export async function deleteCategory(id: string) {
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (productCount > 0) {
    throw new Error("Bu kategoride ürün bulunmaktadır. Silmeden önce ürünleri taşıyın.");
  }
  // Alt kategorisi olan kategori silinirse Prisma çocukların parentId'sini
  // null yapar ve onlar sessizce kök kategoriye terfi eder — navigasyonda
  // beklenmedik kökler belirir. Bu yüzden önce alt kategoriler taşınmalı.
  if (childCount > 0) {
    throw new Error(
      `Bu kategorinin ${childCount} alt kategorisi var. Silmeden önce alt kategorileri taşıyın veya silin.`,
    );
  }
  return prisma.category.delete({ where: { id } });
}
