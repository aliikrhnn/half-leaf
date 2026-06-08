import fs from "fs/promises";
import OpenAI from "openai";

const PROMPT =
  "Professional product photography of this exact item. Clean, soft, neutral light gray (#F5F5F5) seamless studio background with very subtle natural shadow under the product. Centered composition. Sharp focus, high detail, true colors. No reflections, no people, no text, no logos. Preserve the exact shape, material, and proportions of the product.";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY tanımlı değil, görsel dönüştürme çalışmaz."
    );
  }
  return new OpenAI({ apiKey });
}

export async function generateProfessionalImage(
  originalImagePath: string
): Promise<Buffer> {
  const client = getClient();

  const absolutePath = originalImagePath.startsWith("/")
    ? `${process.cwd()}/public${originalImagePath}`
    : originalImagePath;

  const fileBuffer = await fs.readFile(absolutePath);
  const blob = new Blob([fileBuffer], { type: "image/png" });
  const file = new File([blob], "product.png", { type: "image/png" });

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt: PROMPT,
    size: "1024x1024",
    quality: "medium",
  });

  const imageData = response.data?.[0];
  if (!imageData) throw new Error("OpenAI boş yanıt döndürdü.");

  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, "base64");
  }

  if (imageData.url) {
    const imgRes = await fetch(imageData.url);
    if (!imgRes.ok) throw new Error("OpenAI görsel URL indirilemedi.");
    const arrayBuf = await imgRes.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  throw new Error("OpenAI yanıtında görsel verisi bulunamadı.");
}
