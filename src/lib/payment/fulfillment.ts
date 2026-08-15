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
  /**
   * Varyantlı satışta sipariş HEM varyant envanterinden HEM de ürün-düzeyi
   * envanterden düşüyor (bkz. api/siparis/route.ts adım 13). İptal/başarısızlık
   * durumunda ikisinin de geri yüklenmesi gerekir; yoksa varyant stoğu kalıcı
   * olarak sızar.
   */
  variantId?: string | null;
  quantity: number;
}

/**
 * Sipariş kalemleri için ilgili envanter kayıtlarını (ürün + varyant) toplar.
 * Dönen dizi, aynı envanterin birden çok kalemde geçmesi durumunda tekrar eder;
 * bu kasıtlıdır — her kalem kendi adedince geri yüklenir.
 */
async function resolveInventoryTargets(
  tx: Tx,
  orderItems: ReadonlyArray<OrderItemRef>,
): Promise<Array<{ inventoryId: string; quantity: number }>> {
  const productIds = [...new Set(
    orderItems.map((i) => i.productId).filter((id): id is string => Boolean(id)),
  )];
  const variantIds = [...new Set(
    orderItems.map((i) => i.variantId).filter((id): id is string => Boolean(id)),
  )];

  const [productInvs, variantInvs] = await Promise.all([
    productIds.length
      ? tx.inventory.findMany({ where: { productId: { in: productIds } }, select: { id: true, productId: true } })
      : Promise.resolve([]),
    variantIds.length
      ? tx.inventory.findMany({ where: { variantId: { in: variantIds } }, select: { id: true, variantId: true } })
      : Promise.resolve([]),
  ]);

  const invByProduct = new Map(productInvs.map((inv) => [inv.productId!, inv.id]));
  const invByVariant = new Map(variantInvs.map((inv) => [inv.variantId!, inv.id]));

  const targets: Array<{ inventoryId: string; quantity: number }> = [];
  for (const item of orderItems) {
    if (item.variantId) {
      const vid = invByVariant.get(item.variantId);
      if (vid) targets.push({ inventoryId: vid, quantity: item.quantity });
    }
    if (item.productId) {
      const pid = invByProduct.get(item.productId);
      if (pid) targets.push({ inventoryId: pid, quantity: item.quantity });
    }
  }
  return targets;
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

  await restoreOrderStock(tx, {
    orderId: args.orderId,
    couponId: args.couponId,
    orderItems: args.orderItems,
    reason,
  });
}

/**
 * Rezerve stoğu (ürün + varyant) geri yükler ve kupon kullanım sayacını düşer.
 * Hem ödeme başarısızlığında hem de yönetici siparişi iptal ettiğinde kullanılır —
 * iki yolun da aynı davranması için tek doğruluk kaynağı.
 */
export async function restoreOrderStock(
  tx: Tx,
  args: {
    orderId: string;
    couponId: string | null;
    orderItems: ReadonlyArray<OrderItemRef>;
    reason: string;
  },
): Promise<void> {
  const reason = args.reason.slice(0, 200);

  const targets = await resolveInventoryTargets(tx, args.orderItems);
  for (const t of targets) {
    await tx.inventory.update({
      where: { id: t.inventoryId },
      data: { quantity: { increment: t.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        inventoryId: t.inventoryId,
        type: "IADE",
        quantityChange: t.quantity,
        reason,
        referenceType: "Order",
        referenceId: args.orderId,
      },
    });
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
  const targets = await resolveInventoryTargets(tx, orderItems);
  for (const t of targets) {
    await tx.inventory.update({
      where: { id: t.inventoryId },
      data: { quantity: { decrement: t.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        inventoryId: t.inventoryId,
        type: "SATIS",
        quantityChange: -t.quantity,
        reason: reason.slice(0, 200),
        referenceType: "Order",
        referenceId: orderId,
      },
    });
  }
}
