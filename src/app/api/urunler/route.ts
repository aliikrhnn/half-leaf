/**
 * Hafif ürün listeleme API'si — istemci tarafı filtreleme/sıralama/sayfalama için.
 * Yalnızca aktif ürünler. /urunler sayfasının kullandığı aynı sorgu mantığını
 * (fetchProductsPage) kullanır; sonuçlar sunucu render'ı ile birebir aynıdır.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchProductsPage } from "@/lib/products/list-query";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`urunler:${ip}`, { maxRequests: 90, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json({ products: [], total: 0, error: "rate_limited" }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const params = {
    kategori: sp.get("kategori") ?? undefined,
    materyal: sp.get("materyal") ?? undefined,
    boy: sp.get("boy") ?? undefined,
    renk: sp.get("renk") ?? undefined,
    fiyat: sp.get("fiyat") ?? undefined,
    siralama: sp.get("siralama") ?? undefined,
    sayfa: sp.get("sayfa") ?? undefined,
    indirim: sp.get("indirim") ?? undefined,
    arama: sp.get("arama") ?? undefined,
    cokSatanlar: sp.get("cokSatanlar") ?? undefined,
    oneCikan: sp.get("oneCikan") ?? undefined,
    marka: sp.get("marka") ?? undefined,
  };

  try {
    const result = await fetchProductsPage(params, Date.now());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
