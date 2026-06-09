import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Multi-word brands to check first (longest match wins)
const KNOWN_BRANDS = ["Half Leaf", "El Badia"];

function extractBrand(name: string): string | null {
  const lower = name.toLowerCase();
  for (const b of KNOWN_BRANDS) {
    if (lower.startsWith(b.toLowerCase() + " ") || lower === b.toLowerCase()) {
      return b;
    }
  }
  const firstWord = name.split(/\s+/)[0] ?? "";
  return firstWord.length > 1 ? firstWord : null;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, brand: true },
    orderBy: { name: "asc" },
  });

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    if (p.brand) { skipped++; continue; }
    const brand = extractBrand(p.name);
    if (!brand) { console.log(`  SKIP (no match): ${p.name}`); continue; }
    await prisma.product.update({ where: { id: p.id }, data: { brand } });
    console.log(`  ${p.name}  →  ${brand}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already had brand.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
