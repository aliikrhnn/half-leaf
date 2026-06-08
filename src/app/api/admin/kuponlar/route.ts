import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError, paginationMeta } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const CreateSchema = z.object({
  code:           z.string().trim().min(1).max(50).toUpperCase(),
  description:    z.string().trim().optional(),
  discountType:   z.enum(["YUZDE", "SABIT"]),
  value:          z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxUses:        z.number().int().positive().optional(),
  maxUsesPerUser: z.number().int().positive().optional(),
  startsAt:       z.string().optional(),
  expiresAt:      z.string().optional(),
  isActive:       z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const search   = (searchParams.get("search") ?? "").trim();
    const isActive = searchParams.get("isActive");

    const where = {
      ...(search && {
        OR: [
          { code:        { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isActive === "true"  ? { isActive: true  } : {}),
      ...(isActive === "false" ? { isActive: false } : {}),
    };

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return ok({
      items: coupons.map(c => ({
        ...c,
        value:          Number(c.value),
        minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
      })),
      meta: paginationMeta(total, page, limit),
    });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçersiz alanlar.");

  const d = parsed.data;

  try {
    const existing = await prisma.coupon.findUnique({ where: { code: d.code } });
    if (existing) return badRequest("Bu kupon kodu zaten kullanımda.");

    const coupon = await prisma.coupon.create({
      data: {
        code:           d.code,
        description:    d.description,
        discountType:   d.discountType,
        value:          d.value,
        minOrderAmount: d.minOrderAmount,
        maxUses:        d.maxUses,
        maxUsesPerUser: d.maxUsesPerUser,
        startsAt:       d.startsAt  ? new Date(d.startsAt)  : undefined,
        expiresAt:      d.expiresAt ? new Date(d.expiresAt) : undefined,
        isActive:       d.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.userId,
        action:      "COUPON_CREATED",
        entityType:  "Coupon",
        entityId:    coupon.id,
        changes:     JSON.parse(JSON.stringify({ code: d.code, discountType: d.discountType, value: d.value })),
        ipAddress:   req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return created({ ...coupon, value: Number(coupon.value), minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null });
  } catch {
    return serverError();
  }
}
