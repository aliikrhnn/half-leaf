import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError, paginationMeta } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const QuerySchema = z.object({
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(50).default(20),
  search:      z.string().trim().max(100).optional(),
  ticariIleti: z.enum(["acik", "kapali"]).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { page, limit, search, ticariIleti } = parsed.data;

    // En güncel TICARI_ILETI onayı granted=true olan kullanıcı ID'leri (DISTINCT ON ile doğru sıra)
    const acikRows = await prisma.$queryRaw<{ userId: string }[]>`
      SELECT "userId"
      FROM (
        SELECT DISTINCT ON ("userId") "userId", granted
        FROM "ConsentLog"
        WHERE "consentType" = 'TICARI_ILETI' AND "userId" IS NOT NULL
        ORDER BY "userId", "grantedAt" DESC
      ) subq
      WHERE granted = true
    `;
    const acikUserIds = acikRows.map(r => r.userId);

    const where = {
      role: "MUSTERI" as const,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email:    { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(ticariIleti === "acik"   && { id: { in:    acikUserIds } }),
      ...(ticariIleti === "kapali" && { id: { notIn: acikUserIds } }),
    };

    const [users, total, totalAll] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id:        true,
          fullName:  true,
          email:     true,
          phone:     true,
          createdAt: true,
          _count: { select: { Order: true } },
          Order: {
            where:  { status: { not: "IPTAL_EDILDI" as const } },
            select: { grandTotal: true },
          },
          ConsentLog: {
            where:   { consentType: "TICARI_ILETI" as const },
            orderBy: { grantedAt: "desc" },
            take:    1,
            select:  { granted: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: "MUSTERI" } }),
    ]);

    // passwordHash hiçbir zaman select edilmedi — KVKK güvenliği sağlandı
    const items = users.map(u => ({
      id:         u.id,
      fullName:   u.fullName,
      email:      u.email,
      phone:      u.phone ?? null,
      createdAt:  u.createdAt,
      orderCount: u._count.Order,
      totalSpend: u.Order.reduce((sum, o) => sum + Number(o.grandTotal), 0),
      ticariIleti: u.ConsentLog[0]?.granted ?? false,
    }));

    return ok({
      items,
      stats: { totalCustomers: totalAll, ticariAcik: acikUserIds.length },
      meta:  paginationMeta(total, page, limit),
    });
  } catch {
    return serverError();
  }
}
