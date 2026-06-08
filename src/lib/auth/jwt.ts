import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error(
      "AUTH_SECRET ortam değişkeni tanımlı değil. .env dosyasına güçlü bir değer ekleyin."
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
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as TokenPayload;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
