import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signToken } from "@/lib/auth/jwt";
import type { RegisterInput, LoginInput } from "@/lib/validations/auth.schema";

/**
 * E-posta normalizasyonu.
 *
 * Postgres'te `email @unique` büyük/küçük harfe DUYARLIDIR; misafir sipariş
 * akışı ise `mode: "insensitive"` ile arama yapıyor. Normalize edilmezse
 * "Ali@x.com" ve "ali@x.com" iki ayrı hesap olur, sipariş yanlış hesaba bağlanır.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerCustomer(data: RegisterInput) {
  const email = normalizeEmail(data.email);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw Object.assign(new Error("Bu e-posta adresi zaten kayıtlı."), { code: "EMAIL_TAKEN" });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      fullName: data.name,
      phone: data.phone,
      passwordHash,
      role: "MUSTERI",
    },
    select: { id: true, email: true, fullName: true, role: true, tokenVersion: true },
  });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tv: user.tokenVersion,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- tokenVersion istemciye dönmez
  const { tokenVersion: _tv, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Kullanıcı bulunamadığında da bcrypt.compare çalıştırmak için sabit hash.
 * Böylece "hesap var mı" sorusu yanıt süresinden anlaşılamaz (timing oracle).
 * Geçerli bir bcrypt hash'idir (12 round); karşılık geldiği parola hiçbir
 * hesapta kullanılmaz, yalnızca eşit süre harcamak için vardır.
 */
const DUMMY_HASH = "$2b$12$R9xGY0Qv5L2EIglGLJFQfuYxR8CSPbH3AxABMzTzVehmo/bDQTXXW";

export async function loginUser(data: LoginInput) {
  const email = normalizeEmail(data.email);

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true, email: true, fullName: true, role: true,
      passwordHash: true, isActive: true, tokenVersion: true, emailVerifiedAt: true,
    },
  });

  // Şifre doğrulaması HER ZAMAN çalışır; kullanıcı yoksa sahte hash'e karşı.
  const valid = await bcrypt.compare(data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.passwordHash || !valid) {
    throw Object.assign(new Error("E-posta veya şifre hatalı."), { code: "INVALID_CREDENTIALS" });
  }

  // Hesap durumu YALNIZCA şifre doğruysa açıklanır — aksi hâlde şifreyi
  // bilmeyen biri "hesap devre dışı" yanıtından hesabın varlığını öğrenirdi.
  if (!user.isActive) {
    throw Object.assign(new Error("Hesabınız devre dışı bırakıldı."), { code: "ACCOUNT_DISABLED" });
  }

  // E-posta doğrulanmadan giriş yok — rastgele/sahte adreslerle açılan
  // hesapların kullanılmasını engeller. (Bu kural devreye alınırken mevcut
  // tüm kullanıcılar doğrulanmış işaretlendi, kimse dışarıda kalmadı.)
  if (!user.emailVerifiedAt) {
    throw Object.assign(
      new Error("E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki doğrulama bağlantısına tıklayın."),
      { code: "EMAIL_NOT_VERIFIED" },
    );
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tv: user.tokenVersion,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional: passwordHash/tokenVersion istemciye dönmez
  const { passwordHash: _passwordHash, tokenVersion: _tv, ...safeUser } = user;
  return { user: safeUser, token };
}

/** Kayıt akışı: hesabı açar ama OTURUM AÇMAZ — önce e-posta doğrulanmalı. */
export async function registerCustomerPendingVerification(data: RegisterInput) {
  const email = normalizeEmail(data.email);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw Object.assign(new Error("Bu e-posta adresi zaten kayıtlı."), { code: "EMAIL_TAKEN" });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email,
      fullName: data.name,
      phone: data.phone,
      passwordHash,
      role: "MUSTERI",
      // emailVerifiedAt bilinçli olarak null — doğrulama bağlantısı bekleniyor.
    },
    select: { id: true, email: true, fullName: true, role: true },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      Address: true,
    },
  });
}
