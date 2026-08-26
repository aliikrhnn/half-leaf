import { Prisma } from "@prisma/client";
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
    // Kardeş grupları 1..N numaralandığı için FARKLI ebeveynlerin çocukları
    // aynı sortOrder'ı paylaşır (7 kategori birden sortOrder=1). Düz liste tek
    // anahtarla sıralanınca bu satırlar rastgele düzende geliyordu — ada göre
    // ikincil sıralama sonucu deterministik yapar.
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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

/**
 * Bir kategoriyi kardeşleri arasında istenen KONUMA yerleştirir ve tüm
 * kardeşleri 1..N olarak yeniden numaralandırır.
 *
 * NEDEN: `sortOrder` serbest bir ağırlıktı ve panelde "Sıra" diye sunuluyordu.
 * Mağaza sahibi oraya "kaçıncı sırada görünsün" diye yazıyor; mevcut kayıtlar
 * ise 10'ar 10'ar arttığı için (10, 20, 30…) "8" yazılan kategori listenin
 * BAŞINA geçiyordu. Artık girilen sayı gerçek konumdur: 1 = ilk sıra.
 *
 * Kardeş kümesi `parentId`'ye göre belirlenir; kök kategoriler için
 * `parentId IS NULL`. Numaralandırma tek transaction içinde yapılır ki
 * yarıda kalan bir güncelleme sırayı bozuk bırakmasın.
 *
 * @param position 1 tabanlı hedef konum. Aralık dışı değerler kırpılır.
 */
async function reorderSiblings(
  tx: Prisma.TransactionClient,
  args: { id: string; parentId: string | null; position: number },
): Promise<void> {
  const siblings = await tx.category.findMany({
    where: { parentId: args.parentId, id: { not: args.id } },
    select: { id: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const mevcutSira = new Map(siblings.map((c) => [c.id, c.sortOrder]));

  const hedef = Math.min(Math.max(Math.trunc(args.position), 1), siblings.length + 1) - 1;
  const sirali = [...siblings.map((c) => c.id)];
  sirali.splice(hedef, 0, args.id);

  /* Sıra numaraları 1'den başlar: panelde görünen değer ile gerçek konum aynı olsun.
     Güncellemeler SIRAYLA yapılır — Prisma'nın interactive transaction'ında
     paralel sorgular tek bağlantıyı paylaşır ve kalabalık gruplarda varsayılan
     zaman aşımını zorlar. Değeri zaten doğru olan satır atlanır. */
  for (const [index, catId] of sirali.entries()) {
    if (mevcutSira.get(catId) === index + 1) continue;
    await tx.category.update({ where: { id: catId }, data: { sortOrder: index + 1 } });
  }
}

export async function createCategory(data: CreateCategoryInput) {
  const { sortOrder, ...rest } = data;
  return prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      // Geçici değer; gerçek konum hemen ardından reorderSiblings ile veriliyor.
      data: { ...rest, sortOrder: 9999 },
    });
    await reorderSiblings(tx, {
      id: created.id,
      parentId: rest.parentId ?? null,
      // Sıra girilmediyse (0/boş) sona eklenir.
      position: sortOrder && sortOrder > 0 ? sortOrder : Number.MAX_SAFE_INTEGER,
    });
    return tx.category.findUniqueOrThrow({ where: { id: created.id } });
  });
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

  const { sortOrder, ...rest } = safe;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({ where: { id }, data: rest });

    // Sıra verildiyse (ya da ebeveyn değiştiyse) kardeşler yeniden numaralanır.
    if (sortOrder !== undefined || rest.parentId !== undefined) {
      await reorderSiblings(tx, {
        id,
        parentId: updated.parentId,
        position: sortOrder && sortOrder > 0 ? sortOrder : Number.MAX_SAFE_INTEGER,
      });
    }

    return tx.category.findUniqueOrThrow({ where: { id } });
  });
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
