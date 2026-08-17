/**
 * Hesaba bağlı sepetin okunması.
 *
 * GET  /api/sepet            → giriş yapmış kullanıcının sunucudaki sepeti
 * POST /api/sepet            → misafir sepetini hesaba birleştirir
 *
 * Misafirlerde her ikisi de "sahipsiz" yanıt döner; misafir sepeti tarayıcıda
 * (localStorage) yaşamaya devam eder ve giriş anında buraya taşınır.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError, tooManyRequests } from "@/lib/api/response";
import { getAuthUser } from "@/lib/auth/middleware";
import { rateLimiter } from "@/lib/rate-limit/limiter";
import { loadUserCart, mergeGuestCartIntoUser } from "@/lib/cart/server-cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MergeSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(40),
        variantId: z.string().min(1).max(40).nullable().optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .max(100),
});

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  // Misafir: sunucuda sepeti yok. `ownerId: null` istemciye "bu sepet hâlâ
  // misafir sepeti" bilgisini verir.
  if (!authUser) return ok({ ownerId: null, items: [] });

  try {
    const items = await loadUserCart(authUser.userId);
    return ok({ ownerId: authUser.userId, items });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return ok({ ownerId: null, items: [] });

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = MergeSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz istek.");

  /* Birleştirme normalde oturum başına BİR kez çalışır (girişten hemen sonra).
     Her çağrı 100 satıra kadar doğrulama + silme/yazma yaptığından kötüye
     kullanıma karşı hesap bazlı sınır konur. */
  const limit = await rateLimiter.checkLimit(`sepet-birlestir:${authUser.userId}`, {
    maxRequests: 20,
    windowMs: 10 * 60_000,
  });
  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return tooManyRequests("Çok fazla istek. Lütfen biraz bekleyin.", retryAfter);
  }

  try {
    const items = await mergeGuestCartIntoUser(authUser.userId, parsed.data.items);
    return ok({ ownerId: authUser.userId, items });
  } catch {
    return serverError();
  }
}
