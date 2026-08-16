/**
 * Şifre sıfırlama talebi.
 *
 * Yanıt HER ZAMAN aynıdır — adres kayıtlı olsa da olmasa da. Aksi hâlde bu uç,
 * hangi e-postaların sistemde olduğunu tarayan bir araca dönüşürdü.
 */

import { NextRequest } from "next/server";
import { ForgotPasswordSchema } from "@/lib/validations/auth.schema";
import { requestPasswordReset } from "@/lib/services/password-reset.service";
import { ok, badRequest, tooManyRequests } from "@/lib/api/response";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";
import { isEmailConfigured } from "@/lib/email/resend";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "Bu adres kayıtlıysa şifre sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const ipLimit = await rateLimiter.checkLimit(`sifre-sifirla-ip:${ip}`, {
    maxRequests: 5,
    windowMs: 60 * 60_000,
  });
  if (!ipLimit.allowed) {
    const retryAfter = Math.ceil((ipLimit.resetAt.getTime() - Date.now()) / 1000);
    return tooManyRequests(
      "Çok fazla sıfırlama talebi gönderildi. Lütfen bir saat sonra tekrar deneyin.",
      retryAfter,
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Geçerli bir e-posta adresi giriniz.");
  }

  // Adres bazlı ikinci sınır: IP değiştirerek tek bir kutuyu e-postaya boğmayı engeller.
  const emailLimit = await rateLimiter.checkLimit(
    `sifre-sifirla-mail:${parsed.data.email}`,
    { maxRequests: 3, windowMs: 60 * 60_000 },
  );
  // Sınır aşıldıysa bile GENEL yanıt döner — aksi hâlde "bu adrese çok istek
  // geldi" mesajı adresin kayıtlı olduğunu ele verirdi.
  // E-posta altyapısı kapalıysa bağlantı üretilir ama kimseye ulaşmaz —
  // sessizce başarısız olmasın diye sunucu log'una açık uyarı düşer.
  if (!isEmailConfigured()) {
    console.error(
      "[sifremi-unuttum] RESEND_API_KEY veya EMAIL_FROM tanımlı değil: " +
        "şifre sıfırlama bağlantısı OLUŞTURULDU ama e-posta GÖNDERİLEMEDİ.",
    );
  }

  if (emailLimit.allowed) {
    try {
      await requestPasswordReset(parsed.data.email, ip === "unknown" ? null : ip);
    } catch (err) {
      // Hata da sızdırılmaz; kullanıcı yine genel mesajı görür.
      console.error("[sifremi-unuttum] talep işlenemedi:", err);
    }
  }

  // Yanıt her durumda aynı — e-posta yapılandırmasının durumu da dışarı verilmez.
  return ok({ message: GENERIC_MESSAGE });
}
