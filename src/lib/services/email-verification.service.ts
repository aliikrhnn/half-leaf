/**
 * Kayıt sonrası e-posta doğrulama.
 *
 * Amaç: rastgele/sahte adreslerle hesap açılmasını engellemek. Kullanıcı,
 * adresine gelen bağlantıya tıklamadan giriş yapamaz.
 *
 * Güvenlik kararları (şifre sıfırlamayla aynı desen):
 *  - Token istemciye TEK SEFER gösterilir; veritabanında SHA-256 özeti durur.
 *  - Tek kullanımlık, 24 saat ömürlü. Yeni talep eskileri geçersiz kılar.
 *  - "Bu adres kayıtlı değil / zaten doğrulanmış" bilgisi dışarı verilmez.
 */

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60_000;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function verificationUrl(rawToken: string): string {
  return `${SITE_URL}/eposta-dogrula?token=${encodeURIComponent(rawToken)}`;
}

/**
 * Doğrulama bağlantısı üretir ve e-postayı gönderir.
 * Kullanıcı yoksa veya zaten doğrulanmışsa sessizce hiçbir şey yapmaz.
 */
export async function sendVerificationEmail(
  userId: string,
  requestedIp: string | null = null,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, emailVerifiedAt: true, isActive: true },
  });
  if (!user || !user.isActive || user.emailVerifiedAt) return;

  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: now } },
    }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
        requestedIp,
      },
    }),
  ]);

  const { emailVerificationEmail } = await import("@/lib/email/templates");
  const { sendEmail } = await import("@/lib/email/resend");
  const mail = emailVerificationEmail({
    name: user.fullName?.trim().split(" ")[0] ?? "",
    verifyUrl: verificationUrl(rawToken),
    expiresInHours: Math.round(TOKEN_TTL_MS / 3_600_000),
  });
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
}

/** E-posta adresiyle yeniden gönderim (giriş ekranındaki "tekrar gönder"). */
export async function resendVerification(email: string, requestedIp: string | null): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) return; // adres kayıtlı değil — dışarı sızdırılmaz
  await sendVerificationEmail(user.id, requestedIp);
}

export type VerifyOutcome = "ok" | "already" | "invalid" | "expired" | "used";

/** Bağlantının durumunu değiştirmeden kontrol eder. */
export async function checkVerificationToken(rawToken: string): Promise<VerifyOutcome> {
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { usedAt: true, expiresAt: true, User: { select: { emailVerifiedAt: true } } },
  });
  if (!row) return "invalid";
  if (row.User.emailVerifiedAt) return "already";
  if (row.usedAt) return "used";
  if (row.expiresAt.getTime() <= Date.now()) return "expired";
  return "ok";
}

/** Token'ı harcar ve kullanıcının e-postasını doğrulanmış işaretler. */
export async function verifyEmail(rawToken: string): Promise<VerifyOutcome> {
  const tokenHash = hashToken(rawToken);

  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true, User: { select: { emailVerifiedAt: true } } },
  });
  if (!row) return "invalid";
  if (row.User.emailVerifiedAt) return "already";
  if (row.usedAt) return "used";
  if (row.expiresAt.getTime() <= Date.now()) return "expired";

  // Koşullu güncelleme: eşzamanlı iki istekten yalnızca biri token'ı harcar.
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return "used" as const;

    await tx.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await tx.emailVerificationToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return "ok" as const;
  });
}
