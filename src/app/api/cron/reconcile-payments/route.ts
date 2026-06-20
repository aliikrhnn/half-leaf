/**
 * PayTR ödeme mutabakat cron'u.
 *
 * Bildirim (callback) kaybolduğu / gecikmediği durumlar için güvenlik ağı:
 * belirli bir süredir hâlâ "BEKLIYOR" olan PayTR ödemelerini Durum Sorgu API'si
 * ile sorgular ve:
 *   - PayTR'da başarılı ödeme varsa → siparişi ONAYLA (kayıp başarı bildirimini kurtar),
 *   - başarılı ödeme yoksa → siparişi İPTAL et + rezerve stoğu/kuponu geri yükle,
 *   - belirsiz/geçici hata → dokunma, bir sonraki turda tekrar dene.
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  isPaytrConfigured,
  queryPaymentStatus,
  interpretStatus,
} from "@/lib/payment/paytr";
import { finalizeSuccess, finalizeFailure } from "@/lib/payment/fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PayTR timeout_limit (15 dk) sonrası bir ödeme PayTR tarafında kesinleşmiş olur;
// güvenli olması için 30 dk bekleyip mutabakat yapıyoruz.
const RECONCILE_AFTER_MIN = 30;
const BATCH = 50;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  if (!isPaytrConfigured()) {
    return NextResponse.json({ skipped: "PayTR yapılandırılmamış." });
  }

  const cutoff = new Date(Date.now() - RECONCILE_AFTER_MIN * 60_000);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { lt: cutoff },
      status: { notIn: ["IPTAL_EDILDI", "TESLIM_EDILDI"] },
      Payment: { some: { provider: "paytr", status: "BEKLIYOR" } },
    },
    include: {
      Payment: { where: { provider: "paytr" }, orderBy: { createdAt: "desc" }, take: 1 },
      OrderItem: { select: { productId: true, quantity: true } },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH,
  });

  let paid = 0;
  let cancelled = 0;
  let skipped = 0;

  for (const order of orders) {
    const payment = order.Payment[0];
    if (!payment || payment.status !== "BEKLIYOR") {
      skipped++;
      continue;
    }

    let verdict: "paid" | "no_payment" | "unknown";
    try {
      const res = await queryPaymentStatus(order.orderNumber);
      verdict = interpretStatus(res);
    } catch {
      skipped++;
      continue;
    }

    try {
      if (verdict === "paid") {
        await prisma.$transaction(
          (tx) =>
            finalizeSuccess(tx, {
              orderId: order.id,
              paymentId: payment.id,
              merchantOid: order.orderNumber,
            }),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        paid++;
      } else if (verdict === "no_payment") {
        await prisma.$transaction(
          (tx) =>
            finalizeFailure(tx, {
              orderId: order.id,
              paymentId: payment.id,
              couponId: order.couponId,
              orderItems: order.OrderItem,
              reason: "Zaman aşımı — PayTR mutabakat (başarılı ödeme bulunamadı)",
            }),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        cancelled++;
      } else {
        skipped++; // belirsiz — sonraki turda tekrar denenecek
      }
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ checked: orders.length, paid, cancelled, skipped });
}
