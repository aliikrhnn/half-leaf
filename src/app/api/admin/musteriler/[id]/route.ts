import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { id } = await params;

    const [user, spendAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id, role: "MUSTERI" },
        select: {
          id:             true,
          fullName:       true,
          email:          true,
          phone:          true,
          createdAt:      true,
          updatedAt:      true,
          role:           true,
          isActive:       true,
          // passwordHash KASITLI OLARAK SEÇİLMEDİ — KVKK / güvenlik
          Address: {
            orderBy: [{ isDefault: "desc" as const }, { createdAt: "desc" as const }],
            select: {
              id:           true,
              title:        true,
              fullName:     true,
              phone:        true,
              city:         true,
              district:     true,
              neighborhood: true,
              fullAddress:  true,
              postalCode:   true,
              isDefault:    true,
            },
          },
          Order: {
            orderBy: { placedAt: "desc" as const },
            take:    20,
            select: {
              id:          true,
              orderNumber: true,
              status:      true,
              grandTotal:  true,
              placedAt:    true,
              createdAt:   true,
              Payment: {
                select:  { status: true },
                orderBy: { createdAt: "desc" as const },
                take:    1,
              },
            },
          },
          ConsentLog: {
            orderBy: { grantedAt: "desc" as const },
            select: {
              id:          true,
              consentType: true,
              granted:     true,
              textVersion: true,
              grantedAt:   true,
              // ipAddress dahil edilmiyor — KVKK kapsamında kişisel veri
            },
          },
          _count: { select: { Order: true } },
        },
      }),
      prisma.order.aggregate({
        where: { userId: id, status: { not: "IPTAL_EDILDI" as const } },
        _sum:  { grandTotal: true },
      }),
    ]);

    if (!user) return notFound("Müşteri bulunamadı.");

    const totalSpend  = Number(spendAgg._sum.grandTotal ?? 0);
    const lastOrderAt = user.Order[0]?.placedAt ?? null;

    return ok({
      id:        user.id,
      fullName:  user.fullName,
      email:     user.email,
      phone:     user.phone ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role:      user.role,
      isActive:  user.isActive,
      addresses: user.Address,
      orders: user.Order.map(o => ({
        id:            o.id,
        orderNumber:   o.orderNumber,
        status:        o.status,
        grandTotal:    Number(o.grandTotal),
        placedAt:      o.placedAt,
        paymentStatus: o.Payment[0]?.status ?? null,
      })),
      consentLogs: user.ConsentLog.map(c => ({
        id:          c.id,
        consentType: c.consentType,
        granted:     c.granted,
        textVersion: c.textVersion,
        grantedAt:   c.grantedAt,
      })),
      stats: {
        orderCount:  user._count.Order,
        totalSpend,
        lastOrderAt,
      },
    });
  } catch {
    return serverError();
  }
}
