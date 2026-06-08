import { prisma } from "@/lib/db/prisma";

export type PriceCurrency = "USD" | "TRY";

export const DEFAULT_USD_TRY_RATE = 34.0;

/** Converts an amount to TRY using the given rate. */
export function toTRY(
  amount: number,
  currency: PriceCurrency,
  rate: number,
): number {
  if (currency !== "USD") return amount;
  return Math.round(amount * rate * 100) / 100;
}

/** Server-only: reads current USD/TRY rate from SiteSettings. */
export async function getUsdTryRate(): Promise<number> {
  try {
    const s = await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: { usdTryRate: true },
    });
    if (s?.usdTryRate != null) return Number(s.usdTryRate);
  } catch { /* ignore */ }
  return DEFAULT_USD_TRY_RATE;
}
