import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const [total, processed] = await Promise.all([
      prisma.productImage.count(),
      prisma.productImage.count({ where: { isProcessed: true } }),
    ]);

    return ok({
      total,
      processed,
      pending: total - processed,
    });
  } catch {
    return serverError();
  }
}
