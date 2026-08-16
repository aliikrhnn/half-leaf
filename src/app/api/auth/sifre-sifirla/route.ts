/**
 * Şifre sıfırlama — bağlantı doğrulama (GET) ve yeni şifre belirleme (POST).
 */

import { NextRequest } from "next/server";
import { ResetPasswordSchema } from "@/lib/validations/auth.schema";
import { checkResetToken, resetPassword, type ResetOutcome } from "@/lib/services/password-reset.service";
import { ok, badRequest, tooManyRequests } from "@/lib/api/response";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export const runtime = "nodejs";

const MESSAGES: Record<Exclude<ResetOutcome, "ok">, string> = {
  invalid: "Bu şifre sıfırlama bağlantısı geçersiz. Lütfen yeni bir bağlantı isteyin.",
  expired: "Bu bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.",
  used: "Bu bağlantı daha önce kullanılmış. Lütfen yeni bir bağlantı isteyin.",
};

/** Formu göstermeden önce bağlantının hâlâ geçerli olduğunu doğrular. */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`sifre-kontrol:${ip}`, {
    maxRequests: 30,
    windowMs: 60 * 60_000,
  });
  if (!limit.allowed) return tooManyRequests("Çok fazla deneme yapıldı.", 3600);

  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) return badRequest(MESSAGES.invalid);

  const outcome = await checkResetToken(token);
  if (outcome !== "ok") return badRequest(MESSAGES[outcome]);
  return ok({ valid: true });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Token tahmini denemelerini sınırla (32 baytlık token zaten tahmin edilemez,
  // ama deneme trafiğini de boşuna taşımayalım).
  const limit = await rateLimiter.checkLimit(`sifre-belirle:${ip}`, {
    maxRequests: 10,
    windowMs: 60 * 60_000,
  });
  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return tooManyRequests("Çok fazla deneme yapıldı. Lütfen bir saat sonra tekrar deneyin.", retryAfter);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Şifre gereksinimleri karşılanmıyor.");
  }

  let outcome: ResetOutcome;
  try {
    outcome = await resetPassword(parsed.data.token, parsed.data.password);
  } catch (err) {
    console.error("[sifre-sifirla] şifre güncellenemedi:", err);
    return badRequest("Şifre güncellenemedi. Lütfen tekrar deneyin.");
  }

  if (outcome !== "ok") return badRequest(MESSAGES[outcome]);

  return ok({
    message: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
  });
}
