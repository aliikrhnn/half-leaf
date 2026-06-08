import { NextRequest } from "next/server";
import { ok, notFound, serverError, badRequest } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { generateProfessionalImage } from "@/lib/image-processing/openai";
import { addWatermark } from "@/lib/image-processing/watermark";
import { saveProcessedImage, deleteProcessedImage } from "@/lib/image-processing/storage";

type Params = { params: Promise<{ productImageId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { productImageId } = await params;

  const image = await prisma.productImage.findUnique({
    where: { id: productImageId },
  });
  if (!image) return notFound("Görsel bulunamadı.");

  if (!image.originalUrl) {
    return badRequest(
      "Bu görsel için orijinal URL kaydı yok. Önce görsel yükleyin."
    );
  }

  let savedUrl: string | null = null;
  try {
    const aiBuffer = await generateProfessionalImage(image.originalUrl);
    const watermarked = await addWatermark(aiBuffer);
    savedUrl = await saveProcessedImage(watermarked, image.id);

    await prisma.productImage.update({
      where: { id: productImageId },
      data: {
        processedUrl: savedUrl,
        isProcessed: true,
        url: savedUrl,
        processedAt: new Date(),
        processingError: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.sub,
        action: "IMAGE_PROCESSED",
        entityType: "ProductImage",
        entityId: productImageId,
        changes: { processedUrl: savedUrl },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return ok({ processedUrl: savedUrl });
  } catch (err: unknown) {
    if (savedUrl) await deleteProcessedImage(savedUrl).catch(() => {});
    const errMsg = err instanceof Error ? err.message : "Görsel işleme hatası.";
    await prisma.productImage.update({
      where: { id: productImageId },
      data: { processingError: errMsg },
    });
    return serverError(errMsg);
  }
}
