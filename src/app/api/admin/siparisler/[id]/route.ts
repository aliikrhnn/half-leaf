import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { restoreOrderStock } from "@/lib/payment/fulfillment";

const UpdateSchema = z.object({
  status: z.enum(["BEKLEMEDE", "ONAYLANDI", "HAZIRLANIYOR", "TESLIME_HAZIR", "KARGODA", "TESLIM_EDILDI", "IPTAL_EDILDI"]).optional(),
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
      // Panel kargo bölümünü buna göre gizler.
      shippingMethod: order.shippingMethod,
      storePickup: order.shippingMethod === "DUKKAN_TESLIM",
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
        User:      { select: { email: true } },
        Payment:   { orderBy: { createdAt: "desc" }, take: 1 },
        Shipment:  { orderBy: { createdAt: "desc" }, take: 1 },
        OrderItem: { select: { productId: true, variantId: true, quantity: true } },
      },
    });
    if (!order) return notFound("Sipariş bulunamadı.");

    /* ── Teslim yöntemine göre kurallar ──
       Mağazadan teslim siparişinde kargo diye bir adım YOKTUR: kargo durumu ve
       takip numarası alanları sunucuda da reddedilir (panelde gizli olmaları
       tek başına yeterli değil). Kargolu siparişte de "teslime hazır" durumu
       anlamsızdır — o yalnızca mağaza teslimine ait. */
    const storePickup = order.shippingMethod === "DUKKAN_TESLIM";

    if (storePickup && (shipmentStatus || trackingNumber !== undefined)) {
      return badRequest("Bu sipariş mağazadan teslim; kargo bilgisi girilemez.");
    }
    if (storePickup && status === "KARGODA") {
      return badRequest("Mağazadan teslim siparişi kargoya verilemez.");
    }
    if (!storePickup && status === "TESLIME_HAZIR") {
      return badRequest("\"Teslime hazır\" yalnızca mağazadan teslim siparişlerinde kullanılır.");
    }

    /* Kargo takip numarası ZORUNLU: numarasız "kargoya verildi" müşteriye
       takip edilemeyen bir bildirim gönderiyordu. */
    const mevcutTakip = order.Shipment[0]?.trackingNumber ?? null;
    const sonTakip = trackingNumber !== undefined ? (trackingNumber || null) : mevcutTakip;
    const kargoyaVeriliyor =
      shipmentStatus === "KARGOYA_VERILDI" || (status === "KARGODA" && order.status !== "KARGODA");
    if (kargoyaVeriliyor && !sonTakip) {
      return badRequest("Kargoya verildi olarak işaretlemek için kargo takip numarası zorunludur.");
    }

    const before: Record<string, unknown> = {};
    const after:  Record<string, unknown> = {};

    await prisma.$transaction(async (tx) => {
      if (status && status !== order.status) {
        before.status = order.status;
        after.status  = status;
        await tx.order.update({ where: { id }, data: { status } });

        // Panelden iptal edilen siparişte rezerve stok ve kupon kullanımı da
        // geri alınmalı — ödeme akışındaki iptal (finalizeFailure) bunu yapıyor
        // ama panel yalnızca durumu değiştiriyordu, ürünler stokta görünmüyordu.
        if (status === "IPTAL_EDILDI" && order.status !== "IPTAL_EDILDI") {
          await restoreOrderStock(tx, {
            orderId: order.id,
            couponId: order.couponId,
            orderItems: order.OrderItem,
            reason: "Yönetici tarafından iptal edildi",
          });
        }
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

    /* ── Müşteri bildirimleri (transaction sonrası, env-gated) ──
       Sipariş akışı: ödeme alındı → MAĞAZA ONAYI → hazırlanıyor →
       (mağaza teslimi) teslime hazır / (kargo) kargoya verildi.
       Her adım yalnızca gerçekten O ADIMA GEÇİLDİĞİNDE bildirilir; aynı
       durumun tekrar kaydedilmesi mükerrer e-posta üretmez. */
    const musteriEposta = order.User?.email;
    if (musteriEposta) {
      try {
        const { sendEmail } = await import("@/lib/email/resend");

        if (status === "ONAYLANDI" && order.status !== "ONAYLANDI") {
          const { orderApprovedEmail } = await import("@/lib/email/templates");
          const mail = orderApprovedEmail({ orderNumber: order.orderNumber, storePickup });
          await sendEmail({ to: musteriEposta, subject: mail.subject, html: mail.html });
        }

        if (status === "TESLIME_HAZIR" && order.status !== "TESLIME_HAZIR") {
          const [{ pickupReadyEmail }, settings] = await Promise.all([
            import("@/lib/email/templates"),
            prisma.siteSettings.findUnique({
              where: { id: "site" },
              select: { contactAddress: true, storeHours: true, contactPhone: true },
            }),
          ]);
          const mail = pickupReadyEmail({
            orderNumber: order.orderNumber,
            address: settings?.contactAddress ?? null,
            hours: settings?.storeHours ?? null,
            phone: settings?.contactPhone ?? null,
          });
          await sendEmail({ to: musteriEposta, subject: mail.subject, html: mail.html });
        }

        if (kargoyaVeriliyor) {
          const { shippingNotificationEmail } = await import("@/lib/email/templates");
          const existing = order.Shipment[0];
          const mail = shippingNotificationEmail({
            orderNumber: order.orderNumber,
            provider: existing?.provider ?? "Kargo",
            trackingNumber: sonTakip,
            trackingUrl: existing?.trackingUrl ?? null,
          });
          await sendEmail({ to: musteriEposta, subject: mail.subject, html: mail.html });
        }
      } catch { /* e-posta hatası panel işlemini bozmaz */ }
    }

    return ok({ updated: true });
  } catch {
    return serverError();
  }
}
