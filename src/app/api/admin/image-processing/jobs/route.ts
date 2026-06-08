import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, conflict, badRequest } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { processJob } from "@/lib/image-processing/worker";

const BodySchema = z.object({
  productIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let productIds: string[] | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return badRequest("Geçersiz istek gövdesi.");
    productIds = parsed.data.productIds;
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  // Check for existing active job
  const activeJob = await prisma.imageProcessingJob.findFirst({
    where: { status: { in: ["BEKLEMEDE", "CALISIYOR"] } },
    orderBy: { createdAt: "desc" },
  });

  if (activeJob) {
    return conflict(
      "Zaten çalışan bir görsel dönüştürme işi var. Lütfen tamamlanmasını bekleyin."
    );
  }

  // Count pending images (optionally scoped to given products)
  const totalImages = await prisma.productImage.count({
    where: {
      originalUrl: { not: null },
      isProcessed: false,
      ...(productIds?.length && { productId: { in: productIds } }),
    },
  });

  const job = await prisma.imageProcessingJob.create({
    data: {
      status: "BEKLEMEDE",
      totalImages,
      triggeredBy: auth.sub ?? "",
    },
  });

  // Start async without blocking the response
  setImmediate(() => {
    processJob(job.id, productIds).catch((err) => {
      console.error("[image-processing] Job failed:", err);
      prisma.imageProcessingJob
        .update({
          where: { id: job.id },
          data: {
            status: "HATALI",
            finishedAt: new Date(),
          },
        })
        .catch(() => {});
    });
  });

  return ok({ jobId: job.id, totalImages });
}
