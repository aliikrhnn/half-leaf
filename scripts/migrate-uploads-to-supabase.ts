/**
 * Göç scripti: public/uploads/ → Supabase Storage (halfleaf-uploads bucket)
 *
 * Çalıştır:
 *   npx tsx --env-file=.env.local scripts/migrate-uploads-to-supabase.ts
 *
 * İdempotent: Tekrar çalıştırılırsa mevcut dosyaların üzerine yazar (upsert),
 * hata vermez. DB'de zaten Supabase URL'i olan kayıtlar atlanır.
 *
 * NOT: /images/nargilestore/... URL'lerine kesinlikle dokunulmaz.
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "fs/promises";
import { join, extname, relative } from "path";

// ── Ortam değişkeni doğrulama ──────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "\n[HATA] Eksik çevre değişkeni.\n" +
    "Şu komutla çalıştırın:\n" +
    "  npx tsx --env-file=.env.local scripts/migrate-uploads-to-supabase.ts\n"
  );
  process.exit(1);
}

// ── Sabitler ──────────────────────────────────────────────────────────────
const BUCKET     = "halfleaf-uploads";
const UPLOADS_DIR = join(process.cwd(), "public", "uploads");

// ── İstemciler ────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
const prisma = new PrismaClient();

// ── Yardımcılar ───────────────────────────────────────────────────────────
function publicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

function contentTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png",  ".webp": "image/webp",
    ".avif": "image/avif",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

// ── Adım 1: Bucket oluştur (idempotent) ───────────────────────────────────
async function ensureBucket(): Promise<void> {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(`Bucket listesi alınamadı: ${listErr.message}`);

  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`  ✓ Bucket '${BUCKET}' zaten mevcut.`);
    return;
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "20MB",
  });
  if (createErr) throw new Error(`Bucket oluşturulamadı: ${createErr.message}`);
  console.log(`  ✓ Bucket '${BUCKET}' oluşturuldu.`);
}

// ── Adım 2: Dosyaları yükle ───────────────────────────────────────────────
interface UploadResult {
  localUrl: string;   // /uploads/hero/foo.webp
  storageUrl: string; // https://...supabase.co/storage/v1/object/public/...
}

async function collectFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (e.name.startsWith(".")) continue; // .gitkeep vb.
    const ext = extname(e.name).toLowerCase();
    if (![".webp", ".png", ".jpeg", ".jpg", ".avif"].includes(ext)) continue;
    result.push(fullPath);
  }
  return result;
}

async function uploadFiles(): Promise<UploadResult[]> {
  const files = await collectFiles(UPLOADS_DIR);
  const results: UploadResult[] = [];

  for (const fullPath of files) {
    const relPath    = relative(UPLOADS_DIR, fullPath).replace(/\\/g, "/");
    const storagePath = relPath; // hero/foo.webp | products/originals/bar.png
    const localUrl   = `/uploads/${relPath}`;
    const ext        = extname(fullPath).toLowerCase();

    const fileBuffer = await readFile(fullPath);
    const { error }  = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: contentTypeFromExt(ext),
        upsert: true,
      });

    if (error) {
      console.error(`  ✗ Yüklenemedi: ${localUrl} — ${error.message}`);
      continue;
    }

    const storageUrl = publicUrl(storagePath);
    results.push({ localUrl, storageUrl });
    console.log(`  ✓ ${localUrl}`);
    console.log(`    → ${storageUrl}`);
  }

  return results;
}

// ── Adım 3: DB kayıtlarını güncelle ───────────────────────────────────────
async function updateDatabase(results: UploadResult[]): Promise<void> {
  const urlMap = new Map<string, string>(
    results.map((r) => [r.localUrl, r.storageUrl])
  );

  // HeroSlide.image
  const heroSlides = await prisma.heroSlide.findMany({
    where: { image: { startsWith: "/uploads/" } },
  });
  for (const slide of heroSlides) {
    if (!slide.image) continue;
    const newUrl = urlMap.get(slide.image);
    if (!newUrl) {
      console.log(`  ⚠ HeroSlide ${slide.id}: eşleşme yok → ${slide.image}`);
      continue;
    }
    await prisma.heroSlide.update({ where: { id: slide.id }, data: { image: newUrl } });
    console.log(`  HeroSlide ${slide.id}: ${slide.image}\n    → ${newUrl}`);
  }

  // ProductImage.url / originalUrl / processedUrl
  const productImages = await prisma.productImage.findMany({
    where: {
      OR: [
        { url: { startsWith: "/uploads/" } },
        { originalUrl: { startsWith: "/uploads/" } },
        { processedUrl: { startsWith: "/uploads/" } },
      ],
    },
  });

  for (const img of productImages) {
    const patch: {
      url?: string;
      originalUrl?: string;
      processedUrl?: string | null;
    } = {};

    if (img.url?.startsWith("/uploads/")) {
      const n = urlMap.get(img.url);
      if (n) { patch.url = n; console.log(`  ProductImage ${img.id} url: ${img.url}\n    → ${n}`); }
      else     console.log(`  ⚠ ProductImage ${img.id} url: eşleşme yok → ${img.url}`);
    }
    if (img.originalUrl?.startsWith("/uploads/")) {
      const n = urlMap.get(img.originalUrl);
      if (n) { patch.originalUrl = n; console.log(`  ProductImage ${img.id} originalUrl: ${img.originalUrl}\n    → ${n}`); }
      else     console.log(`  ⚠ ProductImage ${img.id} originalUrl: eşleşme yok → ${img.originalUrl}`);
    }
    if (img.processedUrl?.startsWith("/uploads/")) {
      const n = urlMap.get(img.processedUrl);
      if (n) { patch.processedUrl = n; console.log(`  ProductImage ${img.id} processedUrl: ${img.processedUrl}\n    → ${n}`); }
      else     console.log(`  ⚠ ProductImage ${img.id} processedUrl: eşleşme yok → ${img.processedUrl}`);
    }

    if (Object.keys(patch).length > 0) {
      await prisma.productImage.update({ where: { id: img.id }, data: patch });
    }
  }
}

// ── Ana akış ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("=== Supabase Storage Göçü ===\n");

  try {
    console.log("Adım 1: Bucket kontrol/oluşturma...");
    await ensureBucket();

    console.log("\nAdım 2: Dosyalar Supabase Storage'a yükleniyor...");
    const results = await uploadFiles();
    console.log(`\n  ${results.length} dosya yüklendi.`);

    if (results.length > 0) {
      console.log("\nAdım 3: Veritabanı kayıtları güncelleniyor...");
      await updateDatabase(results);
    } else {
      console.log("\n  Yüklenecek dosya bulunamadı; DB güncelleme atlandı.");
    }

    console.log("\n✓ Göç tamamlandı.");
  } catch (err) {
    console.error("\n[HATA] Göç başarısız:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
