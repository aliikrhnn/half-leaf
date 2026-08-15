import { NextRequest } from "next/server";
import { loginUser } from "@/lib/services/auth.service";
import { LoginSchema } from "@/lib/validations/auth.schema";
import { ok, badRequest, serverError, tooManyRequests } from "@/lib/api/response";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limit = await rateLimiter.checkLimit(`login:${ip}`, {
    maxRequests: 5,
    windowMs:    60_000,
  });

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return tooManyRequests(
      "Çok fazla giriş denemesi yapıldı. Lütfen bir dakika sonra tekrar deneyin.",
      retryAfter,
    );
  }

  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    // HESAP bazlı ikinci sınır: IP değiştirerek tek bir hesaba karşı yapılan
    // parola denemelerini (credential stuffing) de yavaşlatır.
    const accountKey = `login-account:${parsed.data.email.trim().toLowerCase()}`;
    const accountLimit = await rateLimiter.checkLimit(accountKey, {
      maxRequests: 10,
      windowMs: 15 * 60_000,
    });
    if (!accountLimit.allowed) {
      const retryAfter = Math.ceil((accountLimit.resetAt.getTime() - Date.now()) / 1000);
      return tooManyRequests(
        "Bu hesap için çok fazla giriş denemesi yapıldı. Lütfen bir süre sonra tekrar deneyin.",
        retryAfter,
      );
    }

    const { user, token } = await loginUser(parsed.data);

    const res = ok({ user });
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
    if (e?.code === "INVALID_CREDENTIALS" || e?.code === "ACCOUNT_DISABLED") {
      return badRequest(e.message ?? "Giriş başarısız.");
    }
    return serverError();
  }
}
