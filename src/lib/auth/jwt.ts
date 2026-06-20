import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error(
      "AUTH_SECRET ortam değişkeni tanımlı değil. .env dosyasına güçlü bir değer ekleyin."
    );
  }
  if (value.length < 32) {
    throw new Error(
      "AUTH_SECRET çok kısa (en az 32 karakter olmalı). Güçlü bir değer üretin: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  return new TextEncoder().encode(value);
}

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: "MUSTERI" | "ADMIN";
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId) // auth.sub = userId (denetim kaydı aktörü için)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  // algorithms allowlist: algoritma karıştırma (alg confusion) saldırılarını önler.
  const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
  return payload as TokenPayload;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
