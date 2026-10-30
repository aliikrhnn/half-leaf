import { NextRequest, NextResponse } from "next/server";
import { runExchangeRateUpdate } from "@/lib/exchange-rate";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  return runExchangeRateUpdate();
}
