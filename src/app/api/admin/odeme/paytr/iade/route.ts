/**
 * Admin — PayTR İade (Refund) API.
 * Yalnızca PayTR ile ödenmiş (provider=paytr, status=ODENDI) siparişler için
 * tam veya kısmi iade yapar. İade tutarı gönderilmezse tam iade uygulanır.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { refundPayment, isPaytrConfigured, PaytrConfigError } from "@/lib/payment/paytr";

export const runtime = "nodejs";

const BodySchema = z.object({
  orderId: z.string().min(1),
  // İade tutarı (TL). Gönderilmezse tam iade.
  amount: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  if (!isPaytrConfigured()) {
    return badRequest("PayTR yapılandırması eksik. İade yapılamıyor.");
  }

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const { orderId, amount } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      Payment: { where: { provider: "paytr" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) return notFound("Sipariş bulunamadı.");

  const payment = order.Payment[0];
  if (!payment) return badRequest("Bu sipariş için PayTR ödemesi bulunmuyor.");
  if (payment.status !== "ODENDI" && payment.status !== "KISMI_IADE") {
    return badRequest("Yalnızca ödenmiş (veya kısmi iade edilmiş) işlemler iade edilebilir.");
  }

  const paidAmount = Number(payment.amount);

  // Kümülatif iade takibi: daha önce yapılan iadeleri denetim kaydından topla
  // (şema değişikliği gerektirmeden aşırı/çift iadeyi engellemek için).
  const priorRefunds = await prisma.auditLog.findMany({
    where: { entityType: "Payment", entityId: payment.id, action: "PAYMENT_REFUNDED" },
    select: { changes: true },
  });
  const alreadyRefunded = priorRefunds.reduce((sum, log) => {
    const ch = log.changes as { returnAmount?: number } | null;
    return sum + Number(ch?.returnAmount ?? 0);
  }, 0);
  const remaining = Math.max(0, paidAmount - alreadyRefunded);

  // Tutar verilmezse KALAN tutar kadar (tam) iade yapılır.
  const returnAmount = amount ?? remaining;
  if (returnAmount <= 0) {
    return badRequest("Bu sipariş için iade edilebilecek tutar kalmadı.");
  }
  if (returnAmount > remaining + 0.001) {
    return badRequest(
      `İade tutarı, kalan iade edilebilir tutardan (${remaining.toFixed(2)} TL) fazla olamaz.`,
    );
  }

  try {
    const result = await refundPayment(order.orderNumber, returnAmount);

    if (result.status !== "success") {
      return badRequest(
        `PayTR iade reddetti: ${[result.err_no, result.err_msg].filter(Boolean).join(" - ") || "bilinmeyen hata"}`,
      );
    }

    // Tam iade mi kısmi mi? Kümülatif iade tahsil edilen tutara ulaştıysa tam iade.
    const isFull = Math.round((alreadyRefunded + returnAmount) * 100) >= Math.round(paidAmount * 100);
    const newStatus = isFull ? "IADE_EDILDI" : "KISMI_IADE";

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus },
      });
      if (isFull) {
        await tx.order.update({ where: { id: order.id }, data: { status: "IPTAL_EDILDI" } });
      }
      await tx.auditLog.create({
        data: {
          actorUserId: auth.userId,
          action: "PAYMENT_REFUNDED",
          entityType: "Payment",
          entityId: payment.id,
          changes: JSON.parse(JSON.stringify({
            orderNumber: order.orderNumber,
            returnAmount,
            isFull,
            paytr: { is_test: result.is_test ?? null },
          })),
          ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
        },
      });
    });

    return ok({ refunded: true, isFull, returnAmount, status: newStatus });
  } catch (err) {
    if (err instanceof PaytrConfigError) return badRequest(err.message);
    return serverError();
  }
}
