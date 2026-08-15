import { NextRequest } from "next/server";
import { registerCustomer } from "@/lib/services/auth.service";
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

    const { user, token } = await registerCustomer(parsed.data);

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

    const res = created({ user });
    res.cookies.set("hl-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "EMAIL_TAKEN") return conflict(e.message ?? "E-posta zaten kayıtlı.");
    return serverError();
  }
}
