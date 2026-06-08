import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { paginationMeta } from "@/lib/api/response";
import type { ProductQuery, CreateProductInput, UpdateProductInput } from "@/lib/validations/product.schema";

const PRODUCT_INCLUDE: Prisma.ProductInclude = {
  Category: { select: { id: true, slug: true, name: true } },
  ProductImage: { orderBy: { sortOrder: "asc" } },
  ProductVariant: { orderBy: { isActive: "desc" } },
  Inventory: { select: { quantity: true } },
};

export async function listProducts(query: ProductQuery) {
  const { page, limit, category, search, sort, isActive, isFeatured, isBestseller, cokSatanlar } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    ...(isActive !== undefined && { isActive }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(isBestseller !== undefined && { isBestseller }),
    ...(cokSatanlar && { isBestseller: true }),
    ...(category && { Category: { slug: category } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { shortDescription: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const orderBy = (() => {
    switch (sort) {
      case "price-asc": return { basePrice: "asc" as const };
      case "price-desc": return { basePrice: "desc" as const };
      case "newest": return { createdAt: "desc" as const };
      default: return { isFeatured: "desc" as const };
    }
  })();

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug }, include: PRODUCT_INCLUDE });
}

export async function createProduct(data: CreateProductInput) {
  const { images, variants, ...rest } = data;

  const imagesWithOriginal = (images ?? []).map((img) => ({
    ...img,
    originalUrl: img.url,
  }));

  return prisma.product.create({
    data: {
      ...rest,
      ...(imagesWithOriginal.length && { ProductImage: { create: imagesWithOriginal } }),
      ...(variants?.length && { ProductVariant: { create: variants } }),
    },
    include: PRODUCT_INCLUDE,
  });
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional: excludes variants from rest spread to avoid Prisma field error
  const { images, variants: _v, ...rest } = data;

  const imagesWithOriginal = images?.map((img) => ({
    ...img,
    originalUrl: img.url,
  }));

  return prisma.$transaction(async (tx) => {
    if (imagesWithOriginal !== undefined) {
      await tx.productImage.deleteMany({ where: { productId: id } });
    }

    return tx.product.update({
      where: { id },
      data: {
        ...rest,
        ...(imagesWithOriginal?.length && { ProductImage: { create: imagesWithOriginal } }),
      },
      include: PRODUCT_INCLUDE,
    });
  });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    include: PRODUCT_INCLUDE,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBestsellers(limit = 8) {
  return prisma.product.findMany({
    where: { isBestseller: true, isActive: true },
    include: PRODUCT_INCLUDE,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });
}
