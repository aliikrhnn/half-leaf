/**
 * Müşterinin kendi siparişini iptal etmesi.
 *
 * Yalnızca HAZIRLANMAYA BAŞLANMAMIŞ siparişler iptal edilebilir: sipariş
 * hazırlanmaya başladıysa, kargoya verildiyse ya da teslim edildiyse iptal
 * mağazayla iletişime geçmeyi gerektirir (iade akışı ayrıdır).
 *
 * İptalde rezerve stok ve kupon kullanımı geri yüklenir — panelden iptalle
 * (api/admin/siparisler/[id]) aynı yardımcı kullanılır ki iki yol da aynı
 * davransın.
 *
 * ÖDEME İADESİ OTOMATİK YAPILMAZ: tahsilat alınmış bir siparişin parası
 * PayTR İade API'siyle yönetici tarafından iade edilir. Bu uç yalnızca
 * siparişi iptal eder ve mağazayı bilgilendirir.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, unauthorized, serverError } from "@/lib/api/response";
import { getAuthUser } from "@/lib/auth/middleware";
import { restoreOrderStock } from "@/lib/payment/fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Müşterinin kendi başına iptal edebileceği durumlar. */
const IPTAL_EDILEBILIR = ["BEKLEMEDE", "ONAYLANDI"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { orderNumber } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        userId: true,
        status: true,
        couponId: true,
        OrderItem: { select: { productId: true, variantId: true, quantity: true } },
        Payment: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    });

    if (!order) return notFound("Sipariş bulunamadı.");
    // Başkasının siparişi: "bulunamadı" denir, varlığı sızdırılmaz.
    if (order.userId !== authUser.userId) return notFound("Sipariş bulunamadı.");

    if (order.status === "IPTAL_EDILDI") return ok({ cancelled: true, alreadyCancelled: true });

    if (!IPTAL_EDILEBILIR.includes(order.status as (typeof IPTAL_EDILEBILIR)[number])) {
      return badRequest(
        "Bu sipariş hazırlanmaya başlandığı için iptal edilemiyor. Lütfen bizimle iletişime geçin.",
      );
    }

    const odendi = order.Payment[0]?.status === "ODENDI";

    await prisma.$transaction(async (tx) => {
      // Yarışa dayanıklı: durum arada değiştiyse (ör. mağaza hazırlamaya
      // başladıysa) hiçbir şey yapılmaz.
      const res = await tx.order.updateMany({
        where: { id: order.id, status: { in: [...IPTAL_EDILEBILIR] } },
        data: { status: "IPTAL_EDILDI" },
      });
      if (res.count === 0) return;

      await restoreOrderStock(tx, {
        orderId: order.id,
        couponId: order.couponId,
        orderItems: order.OrderItem,
        reason: "Müşteri tarafından iptal edildi",
      });

      await tx.auditLog.create({
        data: {
          actorUserId: authUser.userId,
          action: "ORDER_CANCELLED_BY_CUSTOMER",
          entityType: "Order",
          entityId: order.id,
          changes: JSON.parse(JSON.stringify({
            orderNumber,
            oncekiDurum: order.status,
            odemeAlinmisMi: odendi,
            not: odendi
              ? "Tahsilat yapılmıştı — para iadesi panelden elle yapılmalı."
              : "Tahsilat yoktu.",
          })),
        },
      });
    });

    return ok({ cancelled: true, refundRequired: odendi });
  } catch {
    return serverError();
  }
}
