/**
 * Hafif arama önerisi (autocomplete) uç noktası.
 * Header arama panelindeki canlı öneriler için kullanılır — yalnızca aktif ürünler,
 * az alan, hızlı yanıt. Rate-limitlidir (enumeration/yük koruması).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getUsdTryRate, toTRY, type PriceCurrency } from "@/lib/pricing";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export const runtime = "nodejs";

const MIN_LEN = 2;
const LIMIT = 6;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`search:${ip}`, { maxRequests: 40, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ items: [], total: 0 }, { status: 429 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < MIN_LEN) {
    return NextResponse.json({ items: [], total: 0 });
  }

  try {
    const where = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { shortDescription: { contains: q, mode: "insensitive" as const } },
        { brand: { contains: q, mode: "insensitive" as const } },
        { sku: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const [rows, total, usdTryRate] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          slug: true,
          name: true,
          basePrice: true,
          priceCurrency: true,
          Category: { select: { name: true } },
          ProductImage: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { isBestseller: "desc" }],
        take: LIMIT,
      }),
      prisma.product.count({ where }),
      getUsdTryRate(),
    ]);

    const items = rows.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.Category?.name ?? "",
      price: toTRY(Number(p.basePrice), (p.priceCurrency ?? "TRY") as PriceCurrency, usdTryRate),
      image: p.ProductImage[0]?.url ?? null,
    }));

    return NextResponse.json({ items, total });
  } catch {
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
