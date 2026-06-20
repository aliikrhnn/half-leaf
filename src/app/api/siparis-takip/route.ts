/**
 * Misafir sipariş takibi.
 * Sipariş numarası + e-posta eşleşmesiyle (her ikisi de gerekir → enumeration koruması)
 * siparişin durumunu döndürür. Adres/telefon gibi PII döndürülmez.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export const runtime = "nodejs";

const BodySchema = z.object({
  orderNumber: z.string().trim().min(3).max(64),
  email: z.string().trim().email(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`siparis-takip:${ip}`, { maxRequests: 15, windowMs: 10 * 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Çok fazla sorgulama yapıldı. Lütfen biraz sonra tekrar deneyin." },
      { status: 429 },
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 }); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Sipariş numarası ve geçerli bir e-posta girin." }, { status: 400 });
  }

  const { orderNumber, email } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      User: { select: { email: true } },
      OrderItem: { select: { productName: true, variantName: true, quantity: true, lineTotal: true }, orderBy: { createdAt: "asc" } },
      Shipment: { orderBy: { createdAt: "desc" }, take: 1 },
      Payment: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Aynı genel hata: sipariş yok VEYA e-posta uyuşmuyor → bilgi sızdırma.
  if (!order || order.User.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { error: "Bu bilgilerle eşleşen bir sipariş bulunamadı. Sipariş numarası ve e-postanızı kontrol edin." },
      { status: 404 },
    );
  }

  const shipment = order.Shipment[0];
  const payment = order.Payment[0];

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt ?? order.createdAt,
      totals: {
        subtotal: Number(order.subtotal),
        discountTotal: Number(order.discountTotal),
        shippingTotal: Number(order.shippingTotal),
        grandTotal: Number(order.grandTotal),
      },
      items: order.OrderItem.map((i) => ({
        name: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
      payment: payment ? { provider: payment.provider, status: payment.status } : null,
      shipment: shipment
        ? {
            provider: shipment.provider,
            status: shipment.status,
            trackingNumber: shipment.trackingNumber,
            trackingUrl: shipment.trackingUrl,
            shippedAt: shipment.shippedAt,
            deliveredAt: shipment.deliveredAt,
            estimatedDeliveryAt: shipment.estimatedDeliveryAt,
          }
        : null,
    },
  });
}
