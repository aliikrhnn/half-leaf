import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const pages = await prisma.legalPage.findMany({
      select: {
        id:          true,
        slug:        true,
        title:       true,
        version:     true,
        isPublished: true,
        updatedAt:   true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return ok(pages);
  } catch {
    return serverError();
  }
}
