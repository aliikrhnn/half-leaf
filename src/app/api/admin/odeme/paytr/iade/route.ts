/**
 * Admin — PayTR İade (Refund) API.
 * Yalnızca PayTR ile ödenmiş (provider=paytr, status=ODENDI) siparişler için
 * tam veya kısmi iade yapar. İade tutarı gönderilmezse tam iade uygulanır.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { refundPayment, isPaytrConfigured, PaytrConfigError } from "@/lib/payment/paytr";

export const runtime = "nodejs";

/** Operatöre gösterilmesi güvenli iade doğrulama hatası. */
class RefundError extends Error {}

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

  /*
   * Çift iade koruması.
   *
   * Önceden akış "oku → PayTR'a iade gönder → denetim kaydı yaz" şeklindeydi ve
   * hiçbir kilit yoktu: panelde çift tıklama ya da iki sekme, iki isteğin de
   * `alreadyRefunded = 0` okumasına ve PayTR'a İKİ ayrı tam iade gitmesine yol
   * açabiliyordu. Artık PayTR çağrısından ÖNCE, Serializable bir transaction
   * içinde "beklemede" (PAYMENT_REFUND_PENDING) kaydı yazılır; bu kayıt
   * kümülatif toplama dâhil olduğu için ikinci istek anında reddedilir.
   */
  const sumRefunds = (
    logs: Array<{ changes: unknown }>,
  ): number =>
    logs.reduce((sum, log) => {
      const ch = log.changes as { returnAmount?: number } | null;
      return sum + Number(ch?.returnAmount ?? 0);
    }, 0);

  let pendingLogId: string;
  let returnAmount: number;
  let alreadyRefunded: number;

  try {
    const reserved = await prisma.$transaction(
      async (tx) => {
        const priorRefunds = await tx.auditLog.findMany({
          where: {
            entityType: "Payment",
            entityId: payment.id,
            action: { in: ["PAYMENT_REFUNDED", "PAYMENT_REFUND_PENDING"] },
          },
          select: { changes: true },
        });
        const already = sumRefunds(priorRefunds);
        const remaining = Math.max(0, paidAmount - already);

        // Tutar verilmezse KALAN tutar kadar (tam) iade yapılır.
        const wanted = amount ?? remaining;
        if (wanted <= 0) {
          throw new RefundError("Bu sipariş için iade edilebilecek tutar kalmadı.");
        }
        if (wanted > remaining + 0.001) {
          throw new RefundError(
            `İade tutarı, kalan iade edilebilir tutardan (${remaining.toFixed(2)} TL) fazla olamaz.`,
          );
        }

        const log = await tx.auditLog.create({
          data: {
            actorUserId: auth.userId,
            action: "PAYMENT_REFUND_PENDING",
            entityType: "Payment",
            entityId: payment.id,
            changes: JSON.parse(JSON.stringify({ orderNumber: order.orderNumber, returnAmount: wanted })),
            ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
          },
          select: { id: true },
        });

        return { logId: log.id, wanted, already };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    pendingLogId = reserved.logId;
    returnAmount = reserved.wanted;
    alreadyRefunded = reserved.already;
  } catch (err) {
    if (err instanceof RefundError) return badRequest(err.message);
    return badRequest("İade şu anda başlatılamadı, lütfen birkaç saniye sonra tekrar deneyin.");
  }

  try {
    const result = await refundPayment(order.orderNumber, returnAmount);

    if (result.status !== "success") {
      // Rezervasyonu geri al ki tutar yeniden iade edilebilsin.
      await prisma.auditLog.delete({ where: { id: pendingLogId } }).catch(() => {});
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
      // "Beklemede" kaydı kesinleşmiş iadeye dönüştürülür (yeni kayıt açılmaz,
      // aksi hâlde tutar iki kez sayılırdı).
      await tx.auditLog.update({
        where: { id: pendingLogId },
        data: {
          action: "PAYMENT_REFUNDED",
          changes: JSON.parse(JSON.stringify({
            orderNumber: order.orderNumber,
            returnAmount,
            isFull,
            paytr: { is_test: result.is_test ?? null },
          })),
        },
      });
    });

    return ok({ refunded: true, isFull, returnAmount, status: newStatus });
  } catch (err) {
    // PayTR'a iade GİTMİŞ olabilir → rezervasyonu SİLMİYORUZ; aksi hâlde
    // ikinci bir tam iade mümkün olurdu. Kayıt "beklemede" kalır ve operatör
    // denetim kaydından durumu görebilir.
    if (err instanceof PaytrConfigError) return badRequest(err.message);
    return serverError();
  }
}
