import { NextRequest } from "next/server";
import { registerCustomer } from "@/lib/services/auth.service";
import { RegisterSchema } from "@/lib/validations/auth.schema";
import { created, badRequest, conflict, serverError, tooManyRequests } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

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

    const ipAddress =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      null;
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
