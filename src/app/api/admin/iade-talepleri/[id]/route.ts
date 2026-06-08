import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

type Params = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  status:          z.enum(["TALEP_OLUSTURULDU", "INCELENIYOR", "ONAYLANDI", "REDDEDILDI", "TAMAMLANDI"]).optional(),
  adminNote:       z.string().trim().max(2000).optional(),
  rejectionReason: z.string().trim().max(2000).optional(),
  refundAmount:    z.number().positive().optional(),
  refundMethod:    z.string().trim().max(200).optional(),
}).refine(d => {
  if (d.status === "REDDEDILDI" && !d.rejectionReason) return false;
  return true;
}, { message: "Red gerekçesi zorunludur.", path: ["rejectionReason"] });

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const rr = await prisma.returnRequest.findUnique({
      where:  { id },
      select: {
        id:              true,
        status:          true,
        type:            true,
        reason:          true,
        adminNote:       true,
        rejectionReason: true,
        refundAmount:    true,
        refundMethod:    true,
        refundedAt:      true,
        resolvedAt:      true,
        createdAt:       true,
        updatedAt:       true,
        Order: {
          select: {
            id:          true,
            orderNumber: true,
            grandTotal:  true,
            placedAt:    true,
          },
        },
        User: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        ReturnItem: {
          select: {
            id:                   true,
            quantity:             true,
            restockedToInventory: true,
            OrderItem: {
              select: {
                id:          true,
                productName: true,
                variantName: true,
                unitPrice:   true,
                sku:         true,
                productId:   true,
                variantId:   true,
              },
            },
          },
        },
      },
    });

    if (!rr) return notFound("İade talebi bulunamadı.");

    return ok({
      id:              rr.id,
      status:          rr.status,
      type:            rr.type,
      reason:          rr.reason,
      adminNote:       rr.adminNote,
      rejectionReason: rr.rejectionReason,
      refundAmount:    rr.refundAmount !== null ? Number(rr.refundAmount) : null,
      refundMethod:    rr.refundMethod,
      refundedAt:      rr.refundedAt,
      resolvedAt:      rr.resolvedAt,
      createdAt:       rr.createdAt,
      updatedAt:       rr.updatedAt,
      order: {
        id:          rr.Order.id,
        orderNumber: rr.Order.orderNumber,
        grandTotal:  Number(rr.Order.grandTotal),
        placedAt:    rr.Order.placedAt,
      },
      customer: {
        id:       rr.User.id,
        fullName: rr.User.fullName,
        email:    rr.User.email,
        phone:    rr.User.phone,
      },
      items: rr.ReturnItem.map(ri => ({
        id:                   ri.id,
        quantity:             ri.quantity,
        restockedToInventory: ri.restockedToInventory,
        orderItemId:          ri.OrderItem.id,
        productId:            ri.OrderItem.productId,
        variantId:            ri.OrderItem.variantId,
        productName:          ri.OrderItem.productName,
        variantName:          ri.OrderItem.variantName,
        unitPrice:            Number(ri.OrderItem.unitPrice),
        sku:                  ri.OrderItem.sku,
      })),
    });
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const data = parsed.data;

  try {
    const rr = await prisma.returnRequest.findUnique({
      where:  { id },
      select: {
        status: true,
        ReturnItem: {
          select: {
            id:                   true,
            quantity:             true,
            restockedToInventory: true,
            OrderItem: {
              select: { productId: true, variantId: true },
            },
          },
        },
      },
    });
    if (!rr) return notFound("İade talebi bulunamadı.");

    const oldStatus = rr.status;
    const newStatus = data.status;

    const before: Record<string, unknown> = { status: oldStatus };
    const after:  Record<string, unknown> = {};
    if (newStatus) after.status = newStatus;
    if (data.adminNote !== undefined)       after.adminNote       = data.adminNote;
    if (data.rejectionReason !== undefined) after.rejectionReason = data.rejectionReason;
    if (data.refundAmount !== undefined)    after.refundAmount    = data.refundAmount;
    if (data.refundMethod !== undefined)    after.refundMethod    = data.refundMethod;

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (newStatus)                          updateData.status          = newStatus;
      if (data.adminNote !== undefined)       updateData.adminNote       = data.adminNote;
      if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
      if (data.refundAmount !== undefined)    updateData.refundAmount    = data.refundAmount;
      if (data.refundMethod !== undefined)    updateData.refundMethod    = data.refundMethod;

      if (newStatus === "TAMAMLANDI") {
        updateData.refundedAt  = new Date();
        updateData.resolvedAt  = new Date();
      } else if (newStatus === "ONAYLANDI" || newStatus === "REDDEDILDI") {
        updateData.resolvedAt  = new Date();
      }

      await tx.returnRequest.update({ where: { id }, data: updateData });

      // Stok geri ekleme: ONAYLANDI'ya geçince
      if (newStatus === "ONAYLANDI" && oldStatus !== "ONAYLANDI") {
        for (const ri of rr.ReturnItem) {
          if (ri.restockedToInventory) continue;

          const inv = ri.OrderItem.variantId
            ? await tx.inventory.findUnique({ where: { variantId: ri.OrderItem.variantId } })
            : await tx.inventory.findUnique({ where: { productId: ri.OrderItem.productId ?? undefined } });

          if (!inv) continue;

          await tx.inventory.update({
            where: { id: inv.id },
            data:  { quantity: { increment: ri.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              inventoryId:     inv.id,
              type:            "IADE",
              quantityChange:  ri.quantity,
              reason:          `İade #${id}`,
              referenceType:   "ReturnRequest",
              referenceId:     id,
              createdByUserId: auth.userId,
            },
          });
          await tx.returnItem.update({
            where: { id: ri.id },
            data:  { restockedToInventory: true },
          });
        }
      }

      // Stok geri alma: ONAYLANDI'dan REDDEDILDI'ye döndüğünde
      if (oldStatus === "ONAYLANDI" && newStatus === "REDDEDILDI") {
        for (const ri of rr.ReturnItem) {
          if (!ri.restockedToInventory) continue;

          const inv = ri.OrderItem.variantId
            ? await tx.inventory.findUnique({ where: { variantId: ri.OrderItem.variantId } })
            : await tx.inventory.findUnique({ where: { productId: ri.OrderItem.productId ?? undefined } });

          if (!inv) continue;

          await tx.inventory.update({
            where: { id: inv.id },
            data:  { quantity: { decrement: ri.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              inventoryId:     inv.id,
              type:            "DUZELTME",
              quantityChange:  -ri.quantity,
              reason:          `İade iptali #${id}`,
              referenceType:   "ReturnRequest",
              referenceId:     id,
              createdByUserId: auth.userId,
            },
          });
          await tx.returnItem.update({
            where: { id: ri.id },
            data:  { restockedToInventory: false },
          });
        }
      }

      if (Object.keys(after).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "RETURN_REQUEST_UPDATED",
            entityType:  "ReturnRequest",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    return ok({ updated: true });
  } catch {
    return serverError();
  }
}
