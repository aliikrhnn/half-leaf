/**
 * Ödeme sonucu müşteri bildirimleri.
 *
 * Sipariş onay e-postası ARTIK sipariş oluşturulurken değil, tahsilat
 * BAŞARIYLA tamamlandığında gönderilir. Tek doğruluk kaynağı burasıdır;
 * hem PayTR Bildirim URL'i hem de mutabakat cron'u bu yardımcıyı çağırır.
 *
 * Bu fonksiyon transaction DIŞINDA, commit'ten SONRA çağrılmalıdır:
 * e-posta gönderimi (ağ isteği) transaction'ı gereksizce uzatır ve rollback
 * olsa bile geri alınamaz.
 */

import { prisma } from "@/lib/db/prisma";

/**
 * Ödeme başarıya geçtikten SONRA yapılacak işler:
 *  1. Müşteriye sipariş/ödeme onay e-postası,
 *  2. Kullanıcının AKTIF sepetini "siparişe dönüştü" olarak işaretleme.
 *
 * (2) daha önce sipariş oluşturulurken yapılıyordu; kart ödemesi yarıda kalsa
 * bile sepet kapanmış sayılıyor ve terk-edilen-sepet hatırlatması gönderilmiyordu.
 *
 * Hata fırlatmaz — bildirim sorunları ödeme akışını bozmamalıdır.
 *
 * @param orderId Ödemesi ODENDI'ye geçen siparişin id'si.
 */
export async function sendOrderPaidEmail(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        grandTotal: true,
        userId: true,
        User: { select: { email: true } },
        OrderItem: {
          select: { productName: true, variantName: true, quantity: true, lineTotal: true },
        },
        Payment: {
          where: { status: "ODENDI" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { provider: true },
        },
      },
    });

    if (!order) return;

    // Sepeti kapat: sipariş gerçekten ödendiğinde artık "terk edilmiş" değildir.
    if (order.userId) {
      await prisma.cart
        .updateMany({
          where: { userId: order.userId, status: "AKTIF" },
          data: { status: "SIPARISE_DONUSTU" },
        })
        .catch(() => { /* sepet işaretleme hatası ödemeyi etkilemez */ });
    }

    const to = order.User?.email;
    if (!to) return;

    const { orderConfirmationEmail } = await import("@/lib/email/templates");
    const { sendEmail } = await import("@/lib/email/resend");

    const mail = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      grandTotal: Number(order.grandTotal),
      paymentMethod: order.Payment[0]?.provider === "paytr" ? "KREDI_KARTI" : "HAVALE_EFT",
      variant: "odendi",
      items: order.OrderItem.map((i) => ({
        name: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
    });

    await sendEmail({ to, subject: mail.subject, html: mail.html });
  } catch (err) {
    console.error("[odeme] onay e-postası gönderilemedi:", err);
  }
}
