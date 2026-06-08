import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const AdjustSchema = z.object({
  quantityChange:    z.number().int(),
  reason:            z.string().trim().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const inv = await prisma.inventory.findUnique({
      where: { id },
      include: {
        Product:        { select: { id: true, name: true, sku: true, isActive: true } },
        ProductVariant: { select: { id: true, name: true, sku: true, productId: true } },
        StockMovement:  { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!inv) return notFound("Stok kaydı bulunamadı.");
    return ok(inv);
  } catch {
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = AdjustSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const { quantityChange, reason, lowStockThreshold } = parsed.data;
  if (quantityChange === 0 && lowStockThreshold === undefined) return badRequest("Değişiklik yok.");

  try {
    const inv = await prisma.inventory.findUnique({ where: { id } });
    if (!inv) return notFound("Stok kaydı bulunamadı.");

    const newQuantity = inv.quantity + (quantityChange ?? 0);
    if (newQuantity < 0) return badRequest("Stok sıfırın altına düşemez.");

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};

    await prisma.$transaction(async (tx) => {
      if (quantityChange !== 0) {
        before.quantity = inv.quantity;
        after.quantity  = newQuantity;

        await tx.stockMovement.create({
          data: {
            inventoryId:     id,
            type:            "DUZELTME",
            quantityChange,
            reason:          reason || "Admin düzeltmesi",
            createdByUserId: auth.userId,
          },
        });

        await tx.inventory.update({
          where: { id },
          data:  { quantity: newQuantity },
        });
      }

      if (lowStockThreshold !== undefined && lowStockThreshold !== inv.lowStockThreshold) {
        before.lowStockThreshold = inv.lowStockThreshold;
        after.lowStockThreshold  = lowStockThreshold;
        await tx.inventory.update({ where: { id }, data: { lowStockThreshold } });
      }

      if (Object.keys(before).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "STOCK_ADJUSTED",
            entityType:  "Inventory",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after, reason })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    const updated = await prisma.inventory.findUnique({ where: { id } });
    return ok(updated);
  } catch {
    return serverError();
  }
}
