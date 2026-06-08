import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError, paginationMeta } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const QuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
  status: z.enum(["TALEP_OLUSTURULDU", "INCELENIYOR", "ONAYLANDI", "REDDEDILDI", "TAMAMLANDI"]).optional(),
  type:   z.enum(["IADE", "DEGISIM"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const { page, limit, search, status, type } = parsed.data;

  try {
    const where = {
      ...(status && { status }),
      ...(type   && { type }),
      ...(search && {
        OR: [
          { Order: { orderNumber: { contains: search, mode: "insensitive" as const } } },
          { User:  { email:       { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [items, total, pendingCount] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        select: {
          id:        true,
          status:    true,
          type:      true,
          createdAt: true,
          updatedAt: true,
          Order: { select: { id: true, orderNumber: true } },
          User:  { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.count({ where: { status: "TALEP_OLUSTURULDU" } }),
    ]);

    return ok({
      items: items.map(r => ({
        id:          r.id,
        status:      r.status,
        type:        r.type,
        createdAt:   r.createdAt,
        updatedAt:   r.updatedAt,
        orderNumber: r.Order.orderNumber,
        orderId:     r.Order.id,
        customer: {
          id:       r.User.id,
          fullName: r.User.fullName,
          email:    r.User.email,
        },
      })),
      pendingCount,
      meta: paginationMeta(total, page, limit),
    });
  } catch {
    return serverError();
  }
}
