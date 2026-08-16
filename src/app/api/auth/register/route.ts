import { NextRequest } from "next/server";
import { registerCustomerPendingVerification } from "@/lib/services/auth.service";
import { RegisterSchema } from "@/lib/validations/auth.schema";
import { created, badRequest, conflict, serverError, tooManyRequests } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

/*
 * Kullanıcı sayımı (enumeration) hakkında bilinçli karar:
 * "Bu e-posta adresi zaten kayıtlı." yanıtı bir adresin sistemde olup
 * olmadığını açık eder. Bunu tamamen gizlemenin standart yolu her durumda
 * aynı "doğrulama e-postası gönderildi" yanıtını dönmektir; ancak bu, kayıt
 * sonrası otomatik girişi ve mevcut akışı kırar (projede e-posta doğrulama
 * adımı yok). Bunun yerine sayım, IP başına saatte 5 denemeyle sınırlandı;
 * toplu tarama pratikte uygulanamaz hâle gelir.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limit = await rateLimiter.checkLimit(`register:${ip}`, {
    maxRequests: 5,
    windowMs:    60 * 60_000, // 1 saat
  });

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return tooManyRequests(
      "Bu IP adresinden çok fazla kayıt denemesi yapıldı. Lütfen bir saat sonra tekrar deneyin.",
      retryAfter,
    );
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    // Hesap açılır ama OTURUM AÇILMAZ: önce e-posta doğrulanmalı.
    const user = await registerCustomerPendingVerification(parsed.data);

    // Onay kaydı hukuki bir belgedir: IP, istemcinin yazabildiği ham
    // x-forwarded-for'dan değil doğrulanmış kaynaktan alınır.
    const ipAddress = ip === "unknown" ? null : ip;
    const userAgent = req.headers.get("user-agent") ?? null;
    const now = new Date();

    await prisma.consentLog.createMany({
      data: [
        {
          userId: user.id,
          email: user.email,
          consentType: "KVKK_AYDINLATMA",
          textVersion: "v1.0",
          granted: true,
          ipAddress,
          userAgent,
          grantedAt: now,
        },
        ...(parsed.data.ticariIletiConsent
          ? [
              {
                userId: user.id,
                email: user.email,
                consentType: "TICARI_ILETI" as const,
                textVersion: "v1.0",
                granted: true,
                ipAddress,
                userAgent,
                grantedAt: now,
              },
            ]
          : []),
      ],
    });

    // Doğrulama bağlantısını gönder. Gönderilemese bile kayıt tamamlanmış
    // sayılır; kullanıcı giriş ekranından "tekrar gönder" diyebilir.
    try {
      const { sendVerificationEmail } = await import("@/lib/services/email-verification.service");
      await sendVerificationEmail(user.id, ipAddress);
    } catch (err) {
      console.error("[register] doğrulama e-postası gönderilemedi:", err);
    }

    // Ticari ileti onayı verildiyse: pazarlama izni + hoş geldin e-postası (env-gated).
    if (parsed.data.ticariIletiConsent) {
      try {
        const { optInUserToMarketing, unsubscribeUrl } = await import("@/lib/email/marketing");
        const { welcomeEmail } = await import("@/lib/email/marketing-templates");
        const { sendEmail } = await import("@/lib/email/resend");
        const unsubToken = await optInUserToMarketing(user.id);
        const firstName = user.fullName?.trim().split(" ")[0] ?? "";
        const mail = welcomeEmail({
          name: firstName,
          discountCode: process.env.WELCOME_DISCOUNT_CODE?.trim() || null,
          unsubscribeUrl: unsubscribeUrl(unsubToken),
        });
        await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
      } catch { /* e-posta/izin hatası kaydı kırmaz */ }
    }

    // Çerez YOK — doğrulama tamamlanana kadar oturum açılmaz.
    return created({
      user,
      verificationRequired: true,
      message:
        "Hesabınız oluşturuldu. E-posta adresinize gönderdiğimiz doğrulama bağlantısına tıklayın.",
    });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "EMAIL_TAKEN") return conflict(e.message ?? "E-posta zaten kayıtlı.");
    return serverError();
  }
}
