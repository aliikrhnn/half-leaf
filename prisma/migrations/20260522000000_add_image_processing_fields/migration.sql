-- Migration: add_image_processing_fields
-- Adds AI image processing fields to ProductImage and creates ImageProcessingJob table

-- Add new enum
CREATE TYPE "ImageJobStatus" AS ENUM ('BEKLEMEDE', 'CALISIYOR', 'TAMAMLANDI', 'HATALI');

-- Extend ProductImage
ALTER TABLE "ProductImage"
  ADD COLUMN "originalUrl"     TEXT,
  ADD COLUMN "processedUrl"    TEXT,
  ADD COLUMN "isProcessed"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "processedAt"     TIMESTAMP(3),
  ADD COLUMN "processingError" TEXT;

-- Back-fill: set originalUrl = url for all existing images
UPDATE "ProductImage" SET "originalUrl" = "url" WHERE "originalUrl" IS NULL;

-- Create ImageProcessingJob table
CREATE TABLE "ImageProcessingJob" (
  "id"              TEXT NOT NULL,
  "status"          "ImageJobStatus" NOT NULL DEFAULT 'BEKLEMEDE',
  "totalImages"     INTEGER NOT NULL DEFAULT 0,
  "processedImages" INTEGER NOT NULL DEFAULT 0,
  "failedImages"    INTEGER NOT NULL DEFAULT 0,
  "startedAt"       TIMESTAMP(3),
  "finishedAt"      TIMESTAMP(3),
  "triggeredBy"     TEXT NOT NULL,
  "errorLog"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImageProcessingJob_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "ImageProcessingJob_status_idx" ON "ImageProcessingJob"("status");
CREATE INDEX "ImageProcessingJob_triggeredBy_idx" ON "ImageProcessingJob"("triggeredBy");

-- FK
ALTER TABLE "ImageProcessingJob"
  ADD CONSTRAINT "ImageProcessingJob_triggeredBy_fkey"
  FOREIGN KEY ("triggeredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
