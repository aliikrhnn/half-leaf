import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { runUpdate } from "@/app/api/cron/update-exchange-rate/route";

const PatchSchema = z.object({
  usdTryRate:       z.number().positive().optional(),
  usdTryRateLocked: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const s = await prisma.siteSettings.findUnique({
      where: { id: "site" },
      select: { usdTryRate: true, usdTryRateUpdatedAt: true, usdTryRateLocked: true },
    });
    return ok({
      usdTryRate:          s?.usdTryRate != null ? Number(s.usdTryRate) : null,
      usdTryRateUpdatedAt: s?.usdTryRateUpdatedAt ?? null,
      usdTryRateLocked:    s?.usdTryRateLocked ?? false,
    });
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const data: Record<string, unknown> = {};
  if (parsed.data.usdTryRate !== undefined) {
    data.usdTryRate          = parsed.data.usdTryRate;
    data.usdTryRateUpdatedAt = new Date();
  }
  if (parsed.data.usdTryRateLocked !== undefined) {
    data.usdTryRateLocked = parsed.data.usdTryRateLocked;
  }

  try {
    await prisma.siteSettings.upsert({
      where:  { id: "site" },
      create: { id: "site", ...data },
      update: data,
    });
    return ok({ success: true });
  } catch {
    return serverError();
  }
}

/** Admin trigger: fetch fresh rate from external API right now. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  return runUpdate();
}
