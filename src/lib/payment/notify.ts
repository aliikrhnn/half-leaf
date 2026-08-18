/**
 * Ödeme sonucu bildirimleri (müşteri + mağaza sahibi).
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
import { STORE_OWNER_EMAIL } from "@/lib/constants";

/** Teslim yöntemi kodundan okunur etiket (sipariş bildiriminde kullanılır). */
const SHIPPING_LABEL: Record<string, string> = {
  DUKKAN_TESLIM: "Mağazadan Teslim",
  AYNI_GUN: "Aynı Gün Kargo",
  YURT_ICI: "Yurt İçi Kargo",
};

interface AddressShape {
  fullName?: string;
  phone?: string;
  adres?: string;
  ilce?: string;
  sehir?: string;
}

/** Adres JSON'unu tek satırlık okunur metne çevirir. */
function formatAddress(raw: unknown): string {
  const a = (raw ?? {}) as AddressShape;
  return [a.adres, a.ilce, a.sehir].filter(Boolean).join(" ").trim();
}

/**
 * Ödeme başarıya geçtikten SONRA yapılacak işler:
 *  1. Müşteriye "ödemeniz alındı" e-postası,
 *  2. MAĞAZA SAHİBİNE yeni sipariş bildirimi (onay bekliyor),
 *  3. Kullanıcının AKTIF sepetini "siparişe dönüştü" olarak işaretleme.
 *
 * (3) daha önce sipariş oluşturulurken yapılıyordu; kart ödemesi yarıda kalsa
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
        id: true,
        orderNumber: true,
        grandTotal: true,
        userId: true,
        shippingMethod: true,
        shippingAddress: true,
        customerNote: true,
        User: { select: { email: true, fullName: true, phone: true } },
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

    const storePickup = order.shippingMethod === "DUKKAN_TESLIM";
    const kalemler = order.OrderItem.map((i) => ({
      name: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    }));
    const kartOdemesi = order.Payment[0]?.provider === "paytr";

    const { orderConfirmationEmail } = await import("@/lib/email/templates");
    const { sendEmail } = await import("@/lib/email/resend");

    /* 1. Müşteri */
    const to = order.User?.email;
    if (to) {
      const mail = orderConfirmationEmail({
        orderNumber: order.orderNumber,
        grandTotal: Number(order.grandTotal),
        paymentMethod: kartOdemesi ? "KREDI_KARTI" : "HAVALE_EFT",
        variant: "odendi",
        storePickup,
        items: kalemler,
      });
      await sendEmail({ to, subject: mail.subject, html: mail.html });
    }

    /* 2. Mağaza sahibi */
    await notifyOwnerNewOrder(order.id);
  } catch (err) {
    console.error("[odeme] onay e-postası gönderilemedi:", err);
  }
}

/**
 * Mağaza sahibine yeni sipariş bildirimi gönderir.
 *
 * Adres önceliği: yönetim panelindeki `SiteSettings.ownerNotificationEmail`,
 * yoksa `STORE_OWNER_EMAIL` sabiti (ortam değişkeniyle geçersiz kılınabilir).
 * Böylece mağaza sahibi adresi kod değiştirmeden panelden güncelleyebilir.
 *
 * Hata fırlatmaz.
 */
export async function notifyOwnerNewOrder(orderId: string): Promise<void> {
  try {
    const [order, settings] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          grandTotal: true,
          shippingMethod: true,
          shippingAddress: true,
          customerNote: true,
          User: { select: { email: true, fullName: true, phone: true } },
          OrderItem: {
            select: { productName: true, variantName: true, quantity: true, lineTotal: true },
          },
          Payment: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { provider: true, status: true },
          },
        },
      }),
      prisma.siteSettings.findUnique({
        where: { id: "site" },
        select: { ownerNotificationEmail: true },
      }),
    ]);

    if (!order) return;

    const to = settings?.ownerNotificationEmail?.trim() || STORE_OWNER_EMAIL;
    if (!to) return;

    const payment = order.Payment[0];
    const paymentLabel = payment
      ? `${payment.provider === "paytr" ? "Kart (PayTR)" : "Havale/EFT"} — ${payment.status}`
      : null;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";

    const { newOrderOwnerEmail } = await import("@/lib/email/templates");
    const { sendEmail } = await import("@/lib/email/resend");

    const mail = newOrderOwnerEmail({
      orderNumber: order.orderNumber,
      grandTotal: Number(order.grandTotal),
      items: order.OrderItem.map((i) => ({
        name: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
      customerName: order.User?.fullName ?? null,
      customerEmail: order.User?.email ?? null,
      customerPhone: order.User?.phone ?? null,
      shippingLabel: order.shippingMethod ? (SHIPPING_LABEL[order.shippingMethod] ?? order.shippingMethod) : null,
      address: order.shippingMethod === "DUKKAN_TESLIM" ? null : formatAddress(order.shippingAddress),
      customerNote: order.customerNote,
      paymentLabel,
      adminUrl: `${siteUrl.replace(/\/+$/, "")}/admin/siparisler`,
    });

    await sendEmail({ to, subject: mail.subject, html: mail.html });
  } catch (err) {
    console.error("[siparis] mağaza sahibi bildirimi gönderilemedi:", err);
  }
}
