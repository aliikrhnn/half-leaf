import { prisma } from "@/lib/db/prisma";
import { generateProfessionalImage } from "./openai";
import { addWatermark } from "./watermark";
import { saveProcessedImage, deleteProcessedImage } from "./storage";

const BATCH_UPDATE_INTERVAL = 5000; // 5s

export async function processJob(jobId: string, productIds?: string[]): Promise<void> {
  // Fetch and mark as running
  const job = await prisma.imageProcessingJob.findUnique({
    where: { id: jobId },
  });
  if (!job) return;

  await prisma.imageProcessingJob.update({
    where: { id: jobId },
    data: { status: "CALISIYOR", startedAt: new Date() },
  });

  // Fetch pending images: originalUrl set, not yet processed; optionally filtered by productIds
  const images = await prisma.productImage.findMany({
    where: {
      originalUrl: { not: null },
      isProcessed: false,
      ...(productIds?.length && { productId: { in: productIds } }),
    },
  });

  await prisma.imageProcessingJob.update({
    where: { id: jobId },
    data: { totalImages: images.length },
  });

  let processed = 0;
  let failed = 0;
  const errorLog: Array<{ id: string; error: string }> = [];

  let lastFlush = Date.now();

  const flush = async () => {
    await prisma.imageProcessingJob.update({
      where: { id: jobId },
      data: { processedImages: processed, failedImages: failed, errorLog },
    });
    lastFlush = Date.now();
  };

  for (const image of images) {
    const originalPath = image.originalUrl!;
    let savedUrl: string | null = null;

    try {
      const aiBuffer = await generateProfessionalImage(originalPath);
      const watermarked = await addWatermark(aiBuffer);
      savedUrl = await saveProcessedImage(watermarked, image.id);

      await prisma.productImage.update({
        where: { id: image.id },
        data: {
          processedUrl: savedUrl,
          isProcessed: true,
          url: savedUrl,
          processedAt: new Date(),
          processingError: null,
        },
      });

      processed++;
    } catch (err: unknown) {
      // If disk write succeeded but DB update failed, clean up
      if (savedUrl) {
        await deleteProcessedImage(savedUrl).catch(() => {});
      }

      const errMsg = err instanceof Error ? err.message : String(err);
      failed++;
      errorLog.push({ id: image.id, error: errMsg });

      await prisma.productImage.update({
        where: { id: image.id },
        data: { processingError: errMsg },
      });
    }

    // Flush counters every 5s
    if (Date.now() - lastFlush >= BATCH_UPDATE_INTERVAL) {
      await flush();
    }
  }

  await prisma.imageProcessingJob.update({
    where: { id: jobId },
    data: {
      status: "TAMAMLANDI",
      finishedAt: new Date(),
      processedImages: processed,
      failedImages: failed,
      errorLog,
    },
  });
}
