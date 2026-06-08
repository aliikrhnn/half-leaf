import path from "path";
import sharp from "sharp";
import fs from "fs/promises";

const LOGO_PATH = path.join(
  process.cwd(),
  "public",
  "brand",
  "half_leaf_logo.svg"
);

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  let logoSvg: Buffer;
  try {
    logoSvg = await fs.readFile(LOGO_PATH);
  } catch {
    throw new Error(
      `Logo dosyası bulunamadı: ${LOGO_PATH}. Filigran eklenemez.`
    );
  }

  const mainMeta = await sharp(imageBuffer).metadata();
  const imgWidth = mainMeta.width ?? 1024;
  const imgHeight = mainMeta.height ?? 1024;

  const logoWidth = Math.round(imgWidth * 0.15);
  const margin = Math.round(imgWidth * 0.03);

  // Render SVG → PNG at target width
  const logoRaw = await sharp(logoSvg)
    .resize(logoWidth, null, { withoutEnlargement: false })
    .png()
    .toBuffer();

  // Apply 85% opacity (multiply alpha channel by 0.85)
  const logoWithAlpha = await sharp(logoRaw)
    .ensureAlpha()
    .linear(0.85, 0)
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoWithAlpha).metadata();
  const logoHeight = logoMeta.height ?? logoWidth;

  const left = imgWidth - logoWidth - margin;
  const top = imgHeight - logoHeight - margin;

  return sharp(imageBuffer)
    .composite([{ input: logoWithAlpha, left, top, blend: "over" }])
    .png()
    .toBuffer();
}
