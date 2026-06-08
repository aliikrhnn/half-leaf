import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const RATE_API =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  return runUpdate();
}

export async function runUpdate(): Promise<NextResponse> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: { usdTryRateLocked: true },
    });
    if (settings?.usdTryRateLocked) {
      return NextResponse.json({ message: "Kur kilitli, güncelleme atlandı." });
    }
  } catch {
    return NextResponse.json({ error: "DB hatası." }, { status: 500 });
  }

  try {
    const res = await fetch(RATE_API, { cache: "no-store" });
    if (!res.ok) throw new Error(`API hatası: ${res.status}`);
    const data = (await res.json()) as { usd?: Record<string, number> };
    const tryRate = data.usd?.try;
    if (!tryRate || typeof tryRate !== "number") throw new Error("Geçersiz kur verisi.");

    const rounded = Math.round(tryRate * 10000) / 10000;
    await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: {
        id: "site",
        usdTryRate: rounded,
        usdTryRateUpdatedAt: new Date(),
      },
      update: {
        usdTryRate: rounded,
        usdTryRateUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, rate: rounded });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
