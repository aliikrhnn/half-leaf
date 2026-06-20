import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  status: z.enum(["BEKLEMEDE", "ONAYLANDI", "HAZIRLANIYOR", "KARGODA", "TESLIM_EDILDI", "IPTAL_EDILDI"]).optional(),
  paymentStatus: z.enum(["BEKLIYOR", "ODENDI", "BASARISIZ", "IADE_EDILDI", "KISMI_IADE"]).optional(),
  shipmentStatus: z.enum(["HAZIRLANIYOR", "KARGOYA_VERILDI", "YOLDA", "TESLIM_EDILDI", "IADE_EDILDI"]).optional(),
  trackingNumber: z.string().trim().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        User: { select: { email: true, fullName: true, phone: true } },
        OrderItem: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            sku: true,
            unitPrice: true,
            quantity: true,
            lineTotal: true,
          },
          orderBy: { createdAt: "asc" },
        },
        Payment: {
          select: { id: true, provider: true, status: true, amount: true, currency: true, paidAt: true },
          orderBy: { createdAt: "desc" },
        },
        Shipment: {
          select: { id: true, provider: true, status: true, trackingNumber: true, shippedAt: true, deliveredAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) return notFound("Sipariş bulunamadı.");

    return ok({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      shippingTotal: Number(order.shippingTotal),
      grandTotal: Number(order.grandTotal),
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      customerNote: order.customerNote,
      placedAt: order.placedAt,
      createdAt: order.createdAt,
      user: order.User,
      items: order.OrderItem.map(i => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
      payments: order.Payment.map(p => ({ ...p, amount: Number(p.amount) })),
      shipments: order.Shipment,
    });
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

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const { status, paymentStatus, shipmentStatus, trackingNumber } = parsed.data;
  if (!status && !paymentStatus && !shipmentStatus && trackingNumber === undefined) {
    return badRequest("En az bir alan gerekli.");
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        User:     { select: { email: true } },
        Payment:  { orderBy: { createdAt: "desc" }, take: 1 },
        Shipment: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) return notFound("Sipariş bulunamadı.");

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};

    await prisma.$transaction(async (tx) => {
      if (status && status !== order.status) {
        before.status = order.status;
        after.status  = status;
        await tx.order.update({ where: { id }, data: { status } });
      }

      const payment = order.Payment[0];
      if (paymentStatus && payment && paymentStatus !== payment.status) {
        before.paymentStatus = payment.status;
        after.paymentStatus  = paymentStatus;
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: paymentStatus,
            ...(paymentStatus === "ODENDI" && !payment.paidAt && { paidAt: new Date() }),
          },
        });
      }

      if (shipmentStatus || trackingNumber !== undefined) {
        const now      = new Date();
        const shipment = order.Shipment[0];

        type ShipmentUpdate = {
          status?: "HAZIRLANIYOR" | "KARGOYA_VERILDI" | "YOLDA" | "TESLIM_EDILDI" | "IADE_EDILDI";
          trackingNumber?: string | null;
          shippedAt?: Date;
          deliveredAt?: Date;
        };
        const shipData: ShipmentUpdate = {};

        if (shipmentStatus) {
          shipData.status = shipmentStatus;
          if (shipmentStatus === "KARGOYA_VERILDI") shipData.shippedAt  = now;
          if (shipmentStatus === "TESLIM_EDILDI")   shipData.deliveredAt = now;
          before.shipmentStatus = shipment?.status;
          after.shipmentStatus  = shipmentStatus;
        }
        if (trackingNumber !== undefined) {
          shipData.trackingNumber = trackingNumber || null;
          before.trackingNumber   = shipment?.trackingNumber ?? null;
          after.trackingNumber    = trackingNumber || null;
        }

        if (shipment) {
          await tx.shipment.update({ where: { id: shipment.id }, data: shipData });
        } else {
          await tx.shipment.create({
            data: {
              orderId:  id,
              provider: "Manuel",
              status:   shipmentStatus ?? "HAZIRLANIYOR",
              ...(trackingNumber && { trackingNumber }),
            },
          });
        }
      }

      if (Object.keys(before).length > 0) {
        await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action:      "ORDER_UPDATED",
            entityType:  "Order",
            entityId:    id,
            changes:     JSON.parse(JSON.stringify({ before, after })),
            ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
          },
        });
      }
    });

    // Kargo bildirimi e-postası: durum "kargoya verildi"ye geçtiyse (env-gated).
    if (shipmentStatus === "KARGOYA_VERILDI" && order.User?.email) {
      try {
        const { shippingNotificationEmail } = await import("@/lib/email/templates");
        const { sendEmail } = await import("@/lib/email/resend");
        const existing = order.Shipment[0];
        const mail = shippingNotificationEmail({
          orderNumber: order.orderNumber,
          provider: existing?.provider ?? "Kargo",
          trackingNumber: trackingNumber || existing?.trackingNumber || null,
          trackingUrl: existing?.trackingUrl ?? null,
        });
        await sendEmail({ to: order.User.email, subject: mail.subject, html: mail.html });
      } catch { /* e-posta hatası yoksay */ }
    }

    return ok({ updated: true });
  } catch {
    return serverError();
  }
}
