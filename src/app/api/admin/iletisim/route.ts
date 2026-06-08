import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError, paginationMeta } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const { searchParams } = req.nextUrl;
    const page    = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
    const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const search  = (searchParams.get("search") ?? "").trim();
    const isRead  = searchParams.get("isRead");

    const where = {
      ...(search && {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isRead === "true"  ? { isRead: true  } : {}),
      ...(isRead === "false" ? { isRead: false } : {}),
    };

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * limit,
        take:    limit,
        select: {
          id: true, name: true, email: true, phone: true,
          subject: true, isRead: true, createdAt: true,
        },
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return ok({ items: messages, meta: paginationMeta(total, page, limit) });
  } catch {
    return serverError();
  }
}
