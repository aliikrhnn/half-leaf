import { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ productImageId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { productImageId } = await params;

  const image = await prisma.productImage.findUnique({
    where: { id: productImageId },
  });
  if (!image) return notFound("Görsel bulunamadı.");
  if (!image.isProcessed) return badRequest("Bu görsel zaten orijinal sürümde.");
  if (!image.originalUrl) return badRequest("Orijinal URL bulunamadı.");

  try {
    await prisma.productImage.update({
      where: { id: productImageId },
      data: {
        url: image.originalUrl,
        isProcessed: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.sub,
        action: "IMAGE_REVERTED",
        entityType: "ProductImage",
        entityId: productImageId,
        changes: { revertedTo: image.originalUrl },
        ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return ok({ revertedTo: image.originalUrl });
  } catch {
    return serverError();
  }
}
