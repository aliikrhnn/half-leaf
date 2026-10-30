import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

function istanbulDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function lastIstanbulDays(now: Date, count: number): string[] {
  const [year, month, day] = istanbulDateKey(now).split("-").map(Number);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1, day - (count - 1 - offset)));
    return date.toISOString().slice(0, 10);
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const requestedDays = Number(req.nextUrl.searchParams.get("days"));
    const periodDays = requestedDays === 7 ? 7 : 30;
    const dayKeys = lastIstanbulDays(new Date(), periodDays);
    const startDate = new Date(`${dayKeys[0]}T00:00:00+03:00`);
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      revenueResult,
      stockRecords,
      recentOrders,
      ordersByStatus,
      topProducts,
      latestOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "MUSTERI" } }),
      prisma.order.count({ where: { status: "BEKLEMEDE" } }),
      prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: { status: "TESLIM_EDILDI" },
      }),
      prisma.inventory.findMany({
        select: {
          quantity: true,
          reservedQuantity: true,
          lowStockThreshold: true,
          Product: { select: { isActive: true } },
          ProductVariant: {
            select: { isActive: true, Product: { select: { isActive: true } } },
          },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, status: true, grandTotal: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate } },
        _count: { _all: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productName"],
        where: {
          Order: {
            status: { not: "IPTAL_EDILDI" },
            createdAt: { gte: startDate },
          },
        },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          grandTotal: true,
          createdAt: true,
          User: { select: { fullName: true } },
          OrderItem: { select: { quantity: true } },
        },
      }),
    ]);

    const lowStockItems = stockRecords.filter((item) => {
      const active = item.Product
        ? item.Product.isActive
        : Boolean(item.ProductVariant?.isActive && item.ProductVariant.Product.isActive);
      return active && item.quantity - item.reservedQuantity <= item.lowStockThreshold;
    }).length;

    const dailyStats = dayKeys.map((date) => {
      const day = new Date(`${date}T12:00:00+03:00`);
      return {
        date,
        label: new Intl.DateTimeFormat("tr-TR", {
          timeZone: "Europe/Istanbul",
          weekday: "short",
        }).format(day),
        orderCount: 0,
        deliveredRevenue: 0,
      };
    });
    const dailyByDate = new Map(dailyStats.map((day) => [day.date, day]));
    for (const order of recentOrders) {
      const day = dailyByDate.get(istanbulDateKey(order.createdAt));
      if (!day) continue;
      day.orderCount += 1;
      if (order.status === "TESLIM_EDILDI") {
        day.deliveredRevenue += Number(order.grandTotal);
      }
    }

    return ok({
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      totalRevenue: Number(revenueResult._sum?.grandTotal ?? 0),
      lowStockItems,
      periodDays,
      dailyStats,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      topProducts: topProducts.map((item) => ({
        name: item.productName,
        quantity: item._sum.quantity ?? 0,
        revenue: Number(item._sum.lineTotal ?? 0),
      })),
      recentOrders: latestOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customer: order.User.fullName,
        total: Number(order.grandTotal),
        createdAt: order.createdAt,
        itemCount: order.OrderItem.reduce((sum, item) => sum + item.quantity, 0),
      })),
    });
  } catch {
    return serverError();
  }
}
