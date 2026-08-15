import { NextRequest } from "next/server";
import { verifyToken, extractBearerToken, type TokenPayload } from "./jwt";
import { assertFreshSession } from "./session";

/**
 * İmzayı doğrular VE oturumun hâlâ geçerli olduğunu veritabanından teyit eder
 * (kullanıcı pasifleştirilmiş mi, rolü değişmiş mi, token iptal edilmiş mi).
 * Sonuç kısa süre önbelleklendiği için ek gecikme ihmal edilebilir.
 */
export async function getAuthUser(
  req: NextRequest
): Promise<TokenPayload | null> {
  const token =
    extractBearerToken(req.headers.get("authorization")) ??
    req.cookies.get("hl-token")?.value ??
    null;

  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    return await assertFreshSession(payload);
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: NextRequest
): Promise<TokenPayload | Response> {
  const user = await getAuthUser(req);
  if (!user) {
    return Response.json(
      { success: false, error: "Lütfen giriş yapın." },
      { status: 401 }
    );
  }
  return user;
}

export async function requireAdmin(
  req: NextRequest
): Promise<TokenPayload | Response> {
  const user = await getAuthUser(req);
  if (!user) {
    return Response.json(
      { success: false, error: "Lütfen giriş yapın." },
      { status: 401 }
    );
  }
  if (user.role !== "ADMIN") {
    return Response.json(
      { success: false, error: "Bu işlem için yetkiniz yok." },
      { status: 403 }
    );
  }
  return user;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
