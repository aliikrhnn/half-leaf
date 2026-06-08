import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { deleteProcessedImage } from "@/lib/image-processing/storage";

type Params = { params: Promise<{ productImageId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { productImageId } = await params;

  const image = await prisma.productImage.findUnique({
    where: { id: productImageId },
  });
  if (!image) return notFound("Görsel bulunamadı.");
  if (!image.processedUrl) return badRequest("İşlenmiş sürüm bulunamadı.");

  try {
    await deleteProcessedImage(image.processedUrl);

    await prisma.productImage.update({
      where: { id: productImageId },
      data: {
        processedUrl: null,
        isProcessed: false,
        processedAt: null,
        processingError: null,
        url: image.originalUrl ?? image.url,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.sub,
        action: "IMAGE_PROCESSED_DELETED",
        entityType: "ProductImage",
        entityId: productImageId,
        changes: { deletedUrl: image.processedUrl },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
