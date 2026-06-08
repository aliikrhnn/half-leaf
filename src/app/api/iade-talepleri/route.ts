import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { created, badRequest, conflict, serverError } from "@/lib/api/response";
import { requireAuth, isResponse } from "@/lib/auth/middleware";

const RETURN_WINDOW_DAYS = 14;

const ItemSchema = z.object({
  orderItemId: z.string().cuid(),
  quantity:    z.number().int().min(1),
});

const BodySchema = z.object({
  orderNumber: z.string().trim().min(1),
  type:        z.enum(["IADE", "DEGISIM"]),
  reason:      z.string().trim().min(10, "Gerekçe en az 10 karakter olmalıdır."),
  items:       z.array(ItemSchema).min(1, "En az bir ürün seçmelisiniz."),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const { orderNumber, type, reason, items } = parsed.data;

  try {
    const order = await prisma.order.findUnique({
      where:  { orderNumber },
      select: {
        id:      true,
        userId:  true,
        status:  true,
        placedAt: true,
        OrderItem: {
          select: { id: true, quantity: true, productName: true },
        },
        Shipment: {
          select:  { deliveredAt: true },
          orderBy: { createdAt: "desc" },
          take:    1,
        },
        ReturnRequest: {
          where:  { status: { in: ["TALEP_OLUSTURULDU", "INCELENIYOR", "ONAYLANDI"] } },
          select: { id: true },
          take:   1,
        },
      },
    });

    if (!order || order.userId !== auth.userId) {
      return badRequest("Sipariş bulunamadı.");
    }

    if (order.status !== "TESLIM_EDILDI") {
      return badRequest("Yalnızca teslim edilmiş siparişler için iade talebi oluşturulabilir.");
    }

    const deliveredAt = order.Shipment[0]?.deliveredAt ?? order.placedAt;
    if (!deliveredAt) return badRequest("Teslimat tarihi belirlenemedi.");

    const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / 86_400_000;
    if (daysSince > RETURN_WINDOW_DAYS) {
      return badRequest(`${RETURN_WINDOW_DAYS} günlük iade süresi dolmuştur.`);
    }

    if (order.ReturnRequest.length > 0) {
      return conflict("Bu sipariş için zaten aktif bir iade talebiniz bulunmaktadır.");
    }

    // Validate item quantities against order
    const orderItemMap = new Map(order.OrderItem.map(oi => [oi.id, oi.quantity]));
    for (const item of items) {
      const maxQty = orderItemMap.get(item.orderItemId);
      if (maxQty === undefined) {
        return badRequest("Geçersiz sipariş kalemi.");
      }
      if (item.quantity > maxQty) {
        return badRequest("İade adedi sipariş adedini aşamaz.");
      }
    }

    const returnReq = await prisma.$transaction(async (tx) => {
      const rr = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          userId:  auth.userId,
          type,
          reason,
          status:  "TALEP_OLUSTURULDU",
        },
      });
      await tx.returnItem.createMany({
        data: items.map(i => ({
          returnRequestId: rr.id,
          orderItemId:     i.orderItemId,
          quantity:        i.quantity,
        })),
      });
      return rr;
    });

    return created({ id: returnReq.id });
  } catch {
    return serverError();
  }
}
