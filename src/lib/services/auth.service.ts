import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signToken } from "@/lib/auth/jwt";
import type { RegisterInput, LoginInput } from "@/lib/validations/auth.schema";

export async function registerCustomer(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error("Bu e-posta adresi zaten kayıtlı."), { code: "EMAIL_TAKEN" });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.name,
      phone: data.phone,
      passwordHash,
      role: "MUSTERI",
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, fullName: true, role: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.passwordHash) {
    throw Object.assign(new Error("E-posta veya şifre hatalı."), { code: "INVALID_CREDENTIALS" });
  }

  if (!user.isActive) {
    throw Object.assign(new Error("Hesabınız devre dışı bırakıldı."), { code: "ACCOUNT_DISABLED" });
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("E-posta veya şifre hatalı."), { code: "INVALID_CREDENTIALS" });
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional: excludes passwordHash from safeUser spread
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, token };
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
