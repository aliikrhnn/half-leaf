/**
 * CSP ihlal raporları.
 *
 * Politika zorlayıcı moda alındı; bir şeyin yanlışlıkla engellenip
 * engellenmediğini görebilmek için tarayıcı raporları buraya düşer ve sunucu
 * log'una yazılır. Gövde saldırgan kontrolünde olduğundan boyut sınırlanır ve
 * yalnızca beklenen alanlar loglanır.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export const runtime = "nodejs";

const MAX_BYTES = 8_000;

interface CspReportBody {
  "csp-report"?: {
    "document-uri"?: unknown;
    "violated-directive"?: unknown;
    "blocked-uri"?: unknown;
    "effective-directive"?: unknown;
  };
}

function str(v: unknown, max = 300): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`csp:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (!limit.allowed) return new NextResponse(null, { status: 429 });

  try {
    const raw = await req.text();
    if (raw.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

    const parsed = JSON.parse(raw) as CspReportBody;
    const r = parsed["csp-report"];
    if (r) {
      console.warn("[CSP] ihlal", {
        documentUri: str(r["document-uri"]),
        directive: str(r["effective-directive"] ?? r["violated-directive"], 100),
        blockedUri: str(r["blocked-uri"]),
      });
    }
  } catch {
    /* bozuk rapor gövdesi — yoksay */
  }

  // Tarayıcı yanıt gövdesini kullanmaz.
  return new NextResponse(null, { status: 204 });
}
