import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const search = (searchParams.get("search") ?? "").trim();

    const inventories = await prisma.inventory.findMany({
      where: search ? {
        OR: [
          { Product:        { name: { contains: search, mode: "insensitive" } } },
          { Product:        { sku:  { contains: search, mode: "insensitive" } } },
          { ProductVariant: { name: { contains: search, mode: "insensitive" } } },
          { ProductVariant: { sku:  { contains: search, mode: "insensitive" } } },
        ],
      } : undefined,
      include: {
        Product:        { select: { id: true, name: true, sku: true, isActive: true } },
        ProductVariant: { select: { id: true, name: true, sku: true, productId: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return ok(
      inventories.map(inv => ({
        id:                inv.id,
        quantity:          inv.quantity,
        reservedQuantity:  inv.reservedQuantity,
        lowStockThreshold: inv.lowStockThreshold,
        updatedAt:         inv.updatedAt,
        isLowStock:        inv.quantity - inv.reservedQuantity <= inv.lowStockThreshold,
        product:           inv.Product     ? { id: inv.Product.id,     name: inv.Product.name,     sku: inv.Product.sku, isActive: inv.Product.isActive } : null,
        variant:           inv.ProductVariant ? { id: inv.ProductVariant.id, name: inv.ProductVariant.name, sku: inv.ProductVariant.sku, productId: inv.ProductVariant.productId } : null,
      }))
    );
  } catch {
    return serverError();
  }
}
