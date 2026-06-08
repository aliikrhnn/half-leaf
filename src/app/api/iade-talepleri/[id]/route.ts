import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAuth, isResponse } from "@/lib/auth/middleware";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    // Sahiplik + veri tek sorguda: ID'si ve userId'si eşleşmeyenler 404 döner.
    // Bu sayede 403 vs 404 farkıyla başkasına ait kaydın var olup olmadığı sızdırılmaz.
    const rr = await prisma.returnRequest.findFirst({
      where:  { id, userId: auth.userId },
      select: {
        id:              true,
        status:          true,
        type:            true,
        reason:          true,
        rejectionReason: true,
        refundAmount:    true,
        refundMethod:    true,
        refundedAt:      true,
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
        ReturnItem: {
          select: {
            id:       true,
            quantity: true,
            OrderItem: {
              select: { productName: true, variantName: true, unitPrice: true, sku: true },
            },
          },
        },
      },
    });

    if (!rr) return notFound("Kayıt bulunamadı.");

    return ok({
      id:              rr.id,
      status:          rr.status,
      type:            rr.type,
      reason:          rr.reason,
      rejectionReason: rr.rejectionReason,
      refundAmount:    rr.refundAmount !== null ? Number(rr.refundAmount) : null,
      refundMethod:    rr.refundMethod,
      refundedAt:      rr.refundedAt,
      createdAt:       rr.createdAt,
      updatedAt:       rr.updatedAt,
      order: {
        id:          rr.Order.id,
        orderNumber: rr.Order.orderNumber,
        grandTotal:  Number(rr.Order.grandTotal),
        placedAt:    rr.Order.placedAt,
      },
      items: rr.ReturnItem.map(ri => ({
        id:          ri.id,
        quantity:    ri.quantity,
        productName: ri.OrderItem.productName,
        variantName: ri.OrderItem.variantName,
        unitPrice:   Number(ri.OrderItem.unitPrice),
        sku:         ri.OrderItem.sku,
      })),
    });
  } catch {
    return serverError();
  }
}

// Müşteri yalnızca TALEP_OLUSTURULDU durumunda iptal edebilir
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const rr = await prisma.returnRequest.findFirst({
      where:  { id, userId: auth.userId },
      select: { id: true, status: true },
    });

    if (!rr) return notFound("İade talebi bulunamadı.");

    if (rr.status !== "TALEP_OLUSTURULDU") {
      return badRequest("Yalnızca henüz incelenmemiş talepler iptal edilebilir.");
    }

    await prisma.returnRequest.update({
      where: { id },
      data:  { status: "REDDEDILDI", rejectionReason: "Müşteri tarafından iptal edildi." },
    });

    return ok({ cancelled: true });
  } catch {
    return serverError();
  }
}
