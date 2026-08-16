/**
 * E-posta doğrulama — bağlantıyı kullan (POST) ve yeniden gönder (PUT).
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import {
  verifyEmail,
  resendVerification,
  type VerifyOutcome,
} from "@/lib/services/email-verification.service";
import { ok, badRequest, tooManyRequests } from "@/lib/api/response";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";
import { isEmailConfigured } from "@/lib/email/resend";

export const runtime = "nodejs";

const MESSAGES: Record<Exclude<VerifyOutcome, "ok">, string> = {
  already: "Bu e-posta adresi zaten doğrulanmış. Giriş yapabilirsiniz.",
  invalid: "Doğrulama bağlantısı geçersiz. Lütfen yeni bir bağlantı isteyin.",
  expired: "Doğrulama bağlantısının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.",
  used: "Bu bağlantı daha önce kullanılmış. Giriş yapmayı deneyin.",
};

const TokenSchema = z.object({ token: z.string().min(10).max(200) });
const ResendSchema = z.object({ email: z.string().trim().toLowerCase().email() });

/** Bağlantıyı kullanır. */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimiter.checkLimit(`eposta-dogrula:${ip}`, {
    maxRequests: 20,
    windowMs: 60 * 60_000,
  });
  if (!limit.allowed) return tooManyRequests("Çok fazla deneme yapıldı.", 3600);

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest(MESSAGES.invalid); }

  const parsed = TokenSchema.safeParse(body);
  if (!parsed.success) return badRequest(MESSAGES.invalid);

  let outcome: VerifyOutcome;
  try {
    outcome = await verifyEmail(parsed.data.token);
  } catch (err) {
    console.error("[eposta-dogrula] doğrulama başarısız:", err);
    return badRequest("Doğrulama tamamlanamadı. Lütfen tekrar deneyin.");
  }

  if (outcome === "ok") {
    return ok({ verified: true, message: "E-posta adresiniz doğrulandı. Artık giriş yapabilirsiniz." });
  }
  if (outcome === "already") {
    return ok({ verified: true, message: MESSAGES.already });
  }
  return badRequest(MESSAGES[outcome]);
}

/** Doğrulama bağlantısını yeniden gönderir. */
export async function PUT(req: NextRequest) {
  const ip = getClientIp(req);

  const ipLimit = await rateLimiter.checkLimit(`eposta-dogrula-tekrar-ip:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 60_000,
  });
  if (!ipLimit.allowed) {
    return tooManyRequests("Çok fazla istek gönderildi. Lütfen bir saat sonra tekrar deneyin.", 3600);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = ResendSchema.safeParse(body);
  if (!parsed.success) return badRequest("Geçerli bir e-posta adresi giriniz.");

  if (!isEmailConfigured()) {
    console.error(
      "[eposta-dogrula] RESEND_API_KEY veya EMAIL_FROM tanımlı değil: " +
        "doğrulama bağlantısı OLUŞTURULDU ama e-posta GÖNDERİLEMEDİ.",
    );
  }

  const mailLimit = await rateLimiter.checkLimit(
    `eposta-dogrula-tekrar-mail:${parsed.data.email}`,
    { maxRequests: 3, windowMs: 60 * 60_000 },
  );
  // Sınır aşılsa bile genel yanıt döner — adresin kayıtlı olduğu sızmasın.
  if (mailLimit.allowed) {
    try {
      await resendVerification(parsed.data.email, ip === "unknown" ? null : ip);
    } catch (err) {
      console.error("[eposta-dogrula] yeniden gönderim başarısız:", err);
    }
  }

  return ok({
    message:
      "Bu adres kayıtlı ve doğrulanmamışsa yeni bir doğrulama bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.",
  });
}
