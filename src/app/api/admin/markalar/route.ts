/**
 * Mevcut marka listesi (yalnızca yönetim paneli).
 *
 * Ürün formundaki "Marka" alanı serbest metindi; herkes markayı yeniden
 * yazdığı için veriye "Alpha", "Alpha " ve "ALPHA" gibi varyantlar giriyor ve
 * ürünler sayfasındaki marka filtresinde aynı marka birden fazla kez
 * listeleniyordu. Bu uç, forma otomatik tamamlama listesi besler: mağaza
 * sahibi markayı yazmak yerine mevcutlardan seçer.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ok, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const rows = await prisma.product.groupBy({
      by: ["brand"],
      where: { brand: { not: null } },
      _count: { id: true },
      orderBy: { brand: "asc" },
    });

    const brands = rows
      .map((r) => ({ name: (r.brand ?? "").trim(), count: r._count.id }))
      .filter((b) => b.name.length > 0);

    return ok({ brands });
  } catch {
    return serverError();
  }
}
