/**
 * Ödeme sonucu uygulama yardımcıları (yalnızca sunucu / transaction içi).
 *
 * Hem PayTR Bildirim URL (callback) hem de mutabakat cron'u tarafından
 * paylaşılan tek doğruluk kaynağı: başarılı ödemede siparişi onayla, başarısız/
 * iptal durumunda siparişi iptal et + rezerve stoğu ve kuponu geri yükle.
 */

import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface OrderItemRef {
  productId: string | null;
  quantity: number;
}

/** Başarılı ödeme: Payment=ODENDI, Order=ONAYLANDI. */
export async function finalizeSuccess(
  tx: Tx,
  args: {
    orderId: string;
    paymentId: string;
    merchantOid: string;
    paymentType?: string | null;
  },
): Promise<void> {
  await tx.payment.update({
    where: { id: args.paymentId },
    data: {
      status: "ODENDI",
      paidAt: new Date(),
      providerReference: args.merchantOid,
      maskedInfo: args.paymentType ?? null,
    },
  });
  await tx.order.update({
    where: { id: args.orderId },
    data: { status: "ONAYLANDI" },
  });
}

/**
 * Başarısız/iptal ödeme: Payment=BASARISIZ, Order=IPTAL_EDILDI,
 * rezerve stok geri yüklenir (StockMovement IADE) ve kupon kullanımı geri alınır.
 */
export async function finalizeFailure(
  tx: Tx,
  args: {
    orderId: string;
    paymentId: string;
    couponId: string | null;
    orderItems: ReadonlyArray<OrderItemRef>;
    reason: string;
  },
): Promise<void> {
  const reason = args.reason.slice(0, 500);

  await tx.payment.update({
    where: { id: args.paymentId },
    data: { status: "BASARISIZ", failureReason: reason },
  });
  await tx.order.update({
    where: { id: args.orderId },
    data: { status: "IPTAL_EDILDI" },
  });

  // Stok iadesi: sipariş kalemlerinin envanterini geri artır.
  const productIds = args.orderItems
    .map((i) => i.productId)
    .filter((id): id is string => Boolean(id));

  if (productIds.length > 0) {
    const inventories = await tx.inventory.findMany({
      where: { productId: { in: productIds } },
      select: { id: true, productId: true },
    });
    const invByProduct = new Map(inventories.map((inv) => [inv.productId, inv.id]));

    for (const item of args.orderItems) {
      if (!item.productId) continue;
      const inventoryId = invByProduct.get(item.productId);
      if (!inventoryId) continue;
      await tx.inventory.update({
        where: { id: inventoryId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          inventoryId,
          type: "IADE",
          quantityChange: item.quantity,
          reason: reason.slice(0, 200),
          referenceType: "Order",
          referenceId: args.orderId,
        },
      });
    }
  }

  // Kupon kullanım sayacını geri al.
  if (args.couponId) {
    await tx.coupon.updateMany({
      where: { id: args.couponId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  }
}

/**
 * İptal sırasında geri yüklenen stoğu yeniden rezerve eder (envanteri tekrar düşürür).
 * Yalnızca "geç gelen başarı bildirimi kurtarması" gibi nadir senaryolarda kullanılır:
 * sipariş zaman aşımıyla iptal edilip stok iade edildikten sonra gerçek bir başarı
 * bildirimi gelirse, rezervasyon yeniden uygulanır.
 */
export async function reReserveStock(
  tx: Tx,
  orderItems: ReadonlyArray<OrderItemRef>,
  orderId: string,
  reason: string,
): Promise<void> {
  const productIds = orderItems
    .map((i) => i.productId)
    .filter((id): id is string => Boolean(id));
  if (productIds.length === 0) return;

  const inventories = await tx.inventory.findMany({
    where: { productId: { in: productIds } },
    select: { id: true, productId: true },
  });
  const invByProduct = new Map(inventories.map((inv) => [inv.productId, inv.id]));

  for (const item of orderItems) {
    if (!item.productId) continue;
    const inventoryId = invByProduct.get(item.productId);
    if (!inventoryId) continue;
    await tx.inventory.update({
      where: { id: inventoryId },
      data: { quantity: { decrement: item.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        inventoryId,
        type: "SATIS",
        quantityChange: -item.quantity,
        reason: reason.slice(0, 200),
        referenceType: "Order",
        referenceId: orderId,
      },
    });
  }
}
