import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError, paginationMeta } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const VALID_STATUSES = ["BEKLEMEDE", "ONAYLANDI", "HAZIRLANIYOR", "TESLIME_HAZIR", "KARGODA", "TESLIM_EDILDI", "IPTAL_EDILDI"] as const;
type OrderStatus = typeof VALID_STATUSES[number];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status") ?? "";
    const search = (searchParams.get("search") ?? "").trim();

    const where = {
      ...(status && VALID_STATUSES.includes(status as OrderStatus) && {
        status: status as OrderStatus,
      }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" as const } },
          { User: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          grandTotal: true,
          placedAt: true,
          createdAt: true,
          User: { select: { email: true, fullName: true } },
          Payment: {
            select: { status: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { placedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({
      items: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        grandTotal: Number(o.grandTotal),
        placedAt: o.placedAt,
        createdAt: o.createdAt,
        user: o.User,
        paymentStatus: o.Payment[0]?.status ?? null,
      })),
      meta: paginationMeta(total, page, limit),
    });
  } catch {
    return serverError();
  }
}
