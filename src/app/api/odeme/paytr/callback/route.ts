/**
 * PayTR Bildirim URL (2. ADIM) — ödeme sonucunun PayTR tarafından server-side
 * POST edildiği uç nokta. Bu sayfa müşterinin ulaşacağı bir sayfa DEĞİLDİR.
 *
 * PayTR Mağaza Paneli > Ayarlar > Bildirim URL alanına şu adres girilmelidir:
 *   https://<site>/api/odeme/paytr/callback
 *
 * Kurallar (resmî dokümandan):
 *  - Yanıt yalnızca düz "OK" olmalı (öncesinde/sonrasında başka içerik olmamalı).
 *  - Hash mutlaka doğrulanmalı; aksi halde maddi kayıp riski vardır.
 *  - Aynı sipariş için birden fazla bildirim gelebilir → idempotent olmalı,
 *    yalnızca ilk bildirim işlenmeli (merchant_oid bazlı).
 *  - Oturum (session) kullanılamaz; her şey merchant_oid üzerinden yürütülür.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  verifyCallbackHash,
  type PaytrCallback,
} from "@/lib/payment/paytr";
import { finalizeSuccess, finalizeFailure, reReserveStock } from "@/lib/payment/fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PayTR'a dönülecek tek geçerli yanıt: düz "OK". */
function ok(): Response {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function fail(message: string, status = 400): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request): Promise<Response> {
  /* ── 1. Gövdeyi (x-www-form-urlencoded) ayrıştır ── */
  let params: URLSearchParams;
  try {
    const raw = await req.text();
    params = new URLSearchParams(raw);
  } catch {
    return fail("PAYTR notification failed: bad body");
  }

  const cb: PaytrCallback = {
    merchant_oid: params.get("merchant_oid") ?? "",
    status: params.get("status") ?? "",
    total_amount: params.get("total_amount") ?? "",
    hash: params.get("hash") ?? "",
    payment_type: params.get("payment_type") ?? undefined,
    payment_amount: params.get("payment_amount") ?? undefined,
    currency: params.get("currency") ?? undefined,
    test_mode: params.get("test_mode") ?? undefined,
    failed_reason_code: params.get("failed_reason_code") ?? undefined,
    failed_reason_msg: params.get("failed_reason_msg") ?? undefined,
  };

  if (!cb.merchant_oid || !cb.status || !cb.hash) {
    return fail("PAYTR notification failed: missing fields");
  }

  /* ── 2. Hash doğrula (kritik güvenlik adımı) ── */
  let hashValid: boolean;
  try {
    hashValid = verifyCallbackHash(cb);
  } catch {
    // Yapılandırma eksikse: PayTR'a OK demiyoruz, sorun giderilince tekrar denesin.
    return fail("PAYTR notification failed: config error", 500);
  }
  if (!hashValid) {
    return fail("PAYTR notification failed: bad hash");
  }

  /* ── 3. Siparişi ve ödeme kaydını bul (merchant_oid = orderNumber) ── */
  const order = await prisma.order.findUnique({
    where: { orderNumber: cb.merchant_oid },
    include: {
      Payment: {
        where: { provider: "paytr" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      OrderItem: { select: { id: true, productId: true, quantity: true } },
    },
  });

  // Sipariş bulunamadıysa (ör. farklı ortam) tekrar denemeyi durdurmak için OK.
  if (!order) return ok();

  const payment = order.Payment[0];
  if (!payment) return ok();

  const isSuccess = cb.status === "success";

  /* ── 4. İdempotency / kurtarma ──
     Zaten ödenmiş: idempotent, sadece OK. */
  if (payment.status === "ODENDI") return ok();

  /* Zaten başarısız (genelde mutabakat cron'unun zaman aşımı iptali):
     - Başarısız bildirim tekrarı → idempotent OK.
     - GEÇ GELEN GERÇEK BAŞARI → siparişi sessizce DÜŞÜRME ("para var, sipariş yok"
       riski). Siparişi kurtar, stoğu yeniden rezerve et ve denetim kaydı bırak. */
  if (payment.status === "BASARISIZ") {
    if (!isSuccess) return ok();
    try {
      await prisma.$transaction(async (tx) => {
        await finalizeSuccess(tx, {
          orderId: order.id,
          paymentId: payment.id,
          merchantOid: cb.merchant_oid,
          paymentType: cb.payment_type ?? null,
        });
        await reReserveStock(
          tx,
          order.OrderItem,
          order.id,
          "PayTR geç başarı bildirimi - rezervasyon yeniden uygulandı",
        );
        await tx.auditLog.create({
          data: {
            action: "PAYMENT_RECOVERED_AFTER_CANCEL",
            entityType: "Payment",
            entityId: payment.id,
            changes: JSON.parse(JSON.stringify({
              orderNumber: cb.merchant_oid,
              note: "İptal edilmiş siparişe geç başarı bildirimi geldi; sipariş onaylandı ve stok yeniden düşüldü. Stok seviyesini manuel doğrulayın.",
            })),
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch {
      return fail("PAYTR notification failed: recovery error", 500);
    }
    return ok();
  }

  /* ── 5. Normal işlem (BEKLIYOR) ── */
  try {
    await prisma.$transaction(async (tx) => {
      if (isSuccess) {
        await finalizeSuccess(tx, {
          orderId: order.id,
          paymentId: payment.id,
          merchantOid: cb.merchant_oid,
          paymentType: cb.payment_type ?? null,
        });
      } else {
        const reason =
          [cb.failed_reason_code, cb.failed_reason_msg].filter(Boolean).join(" - ") ||
          "Ödeme tamamlanmadı";
        await finalizeFailure(tx, {
          orderId: order.id,
          paymentId: payment.id,
          couponId: order.couponId,
          orderItems: order.OrderItem,
          reason: `PayTR: ${reason}`,
        });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch {
    // İşlem yazılamadıysa OK DÖNME → PayTR tekrar denesin, kayıp olmasın.
    return fail("PAYTR notification failed: processing error", 500);
  }

  return ok();
}
