import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      revenueResult,
      lowStockCount,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "MUSTERI" } }),
      prisma.order.count({ where: { status: "BEKLEMEDE" } }),
      prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { status: "TESLIM_EDILDI" },
      }),
      prisma.inventory.count({ where: { quantity: { lte: 5 } } }),
    ]);

    return ok({
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      totalRevenue: Number(revenueResult._sum?.grandTotal ?? 0),
      lowStockProducts: lowStockCount,
    });
  } catch {
    return serverError();
  }
}
