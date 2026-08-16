/**
 * Şifre sıfırlama akışı.
 *
 * Güvenlik kararları:
 *  - Token istemciye TEK SEFER gösterilir; veritabanında yalnızca SHA-256
 *    özeti saklanır. Veritabanı sızsa bile kimse geçerli bir link üretemez.
 *  - Tek kullanımlık ve 60 dakika ömürlü. Yeni istek eskileri geçersiz kılar.
 *  - Sıfırlama başarılı olunca kullanıcının TÜM oturumları iptal edilir
 *    (tokenVersion artar) — hesabı ele geçiren biri varsa dışarı atılır.
 *  - "Bu e-posta kayıtlı değil" bilgisi ASLA dışarı verilmez; çağıran uç
 *    her durumda aynı yanıtı döner (kullanıcı sayımı önlenir).
 */

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { revokeUserSessions } from "@/lib/auth/session";

/** Bağlantının geçerlilik süresi. */
const TOKEN_TTL_MS = 60 * 60_000;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://halfleafstore.com";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function resetUrl(rawToken: string): string {
  return `${SITE_URL}/sifre-sifirla?token=${encodeURIComponent(rawToken)}`;
}

/**
 * Sıfırlama isteği oluşturur ve e-postayı gönderir.
 *
 * Hesap yoksa veya pasifse SESSİZCE hiçbir şey yapmaz — çağıran uç yine de
 * başarılı yanıt döner. Böylece yanıt, adresin kayıtlı olup olmadığını
 * ele vermez.
 */
export async function requestPasswordReset(
  email: string,
  requestedIp: string | null,
): Promise<void> {
  const normalized = email.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, email: true, fullName: true, isActive: true },
  });
  if (!user || !user.isActive) return;

  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();

  await prisma.$transaction([
    // Süresi dolmuş kayıtları temizle (tablo şişmesin).
    prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: now } },
    }),
    // Kullanılmamış eski bağlantıları geçersiz kıl — yalnızca en yenisi çalışsın.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
        requestedIp,
      },
    }),
  ]);

  const { passwordResetEmail } = await import("@/lib/email/templates");
  const { sendEmail } = await import("@/lib/email/resend");
  const mail = passwordResetEmail({
    name: user.fullName?.trim().split(" ")[0] ?? "",
    resetUrl: resetUrl(rawToken),
    expiresInMinutes: Math.round(TOKEN_TTL_MS / 60_000),
  });
  await sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
}

export type ResetOutcome = "ok" | "invalid" | "expired" | "used";

/** Bağlantı hâlâ geçerli mi? (Sıfırlama formunu göstermeden önce kontrol.) */
export async function checkResetToken(rawToken: string): Promise<ResetOutcome> {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { usedAt: true, expiresAt: true },
  });
  if (!row) return "invalid";
  if (row.usedAt) return "used";
  if (row.expiresAt.getTime() <= Date.now()) return "expired";
  return "ok";
}

/**
 * Şifreyi değiştirir. Token tek kullanımlıktır ve işlem sonunda kullanıcının
 * tüm oturumları iptal edilir.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<ResetOutcome> {
  const tokenHash = hashToken(rawToken);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true, userId: true, usedAt: true, expiresAt: true,
      User: { select: { emailVerifiedAt: true } },
    },
  });
  if (!row) return "invalid";
  if (row.usedAt) return "used";
  if (row.expiresAt.getTime() <= Date.now()) return "expired";

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Token'ı harcamak ve şifreyi yazmak atomik olmalı; ayrıca `usedAt: null`
  // koşulu sayesinde iki eşzamanlı istekten yalnızca biri geçer.
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return "used" as const;

    // Şifre sıfırlama, e-posta kutusuna erişimi kanıtlar: adres henüz
    // doğrulanmamışsa bu noktada doğrulanmış sayılır (kullanıcı ikinci bir
    // adımla uğraşmasın). Zaten doğrulanmışsa özgün tarih korunur.
    await tx.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        ...(row.User.emailVerifiedAt ? {} : { emailVerifiedAt: new Date() }),
      },
    });
    // Aynı kullanıcının diğer bekleyen bağlantılarını da kapat.
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return "ok" as const;
  });

  if (result === "ok") {
    // Şifre değişti → eski oturumlar (varsa saldırganınki dâhil) düşsün.
    try {
      await revokeUserSessions(row.userId);
    } catch {
      /* iptal edilemese bile şifre değişmiş olur */
    }
  }

  return result;
}
