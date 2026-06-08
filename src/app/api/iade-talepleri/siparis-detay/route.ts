import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAuth, isResponse } from "@/lib/auth/middleware";

const RETURN_WINDOW_DAYS = 14;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const orderNumber = req.nextUrl.searchParams.get("siparis")?.trim();
  if (!orderNumber) return badRequest("Sipariş numarası gerekli.");

  try {
    const order = await prisma.order.findUnique({
      where:  { orderNumber },
      select: {
        id:      true,
        userId:  true,
        status:  true,
        placedAt: true,
        grandTotal: true,
        OrderItem: {
          select: {
            id:          true,
            productName: true,
            variantName: true,
            sku:         true,
            unitPrice:   true,
            quantity:    true,
          },
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
      return badRequest("Bu sipariş için zaten aktif bir iade talebiniz bulunmaktadır.");
    }

    return ok({
      id:          order.id,
      orderNumber,
      grandTotal:  Number(order.grandTotal),
      items:       order.OrderItem.map(i => ({
        id:          i.id,
        productName: i.productName,
        variantName: i.variantName,
        sku:         i.sku,
        unitPrice:   Number(i.unitPrice),
        quantity:    i.quantity,
      })),
    });
  } catch {
    return serverError();
  }
}
