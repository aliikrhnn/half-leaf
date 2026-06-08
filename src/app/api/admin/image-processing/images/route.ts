import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return badRequest("productId gerekli.");

  try {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        url: true,
        altText: true,
        sortOrder: true,
        isPrimary: true,
        originalUrl: true,
        processedUrl: true,
        isProcessed: true,
        processedAt: true,
        processingError: true,
      },
    });

    // Summary stats
    const total = await prisma.productImage.count({ where: { isProcessed: false, originalUrl: { not: null } } });

    return ok({ images, pendingTotal: total });
  } catch {
    return serverError();
  }
}
