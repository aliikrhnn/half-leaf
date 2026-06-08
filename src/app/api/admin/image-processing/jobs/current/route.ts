import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    // Prefer active job, fall back to most recent finished job
    const job = await prisma.imageProcessingJob.findFirst({
      orderBy: [
        { status: "asc" }, // BEKLEMEDE/CALISIYOR sort before TAMAMLANDI/HATALI
        { createdAt: "desc" },
      ],
    });

    if (!job) return ok(null);

    return ok({
      id: job.id,
      status: job.status,
      totalImages: job.totalImages,
      processedImages: job.processedImages,
      failedImages: job.failedImages,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      errorLog: job.errorLog,
      createdAt: job.createdAt,
    });
  } catch {
    return serverError();
  }
}
