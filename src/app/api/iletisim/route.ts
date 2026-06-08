import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { created, badRequest, serverError, tooManyRequests } from "@/lib/api/response";
import { rateLimiter, getClientIp } from "@/lib/rate-limit/limiter";

const ContactSchema = z.object({
  name:    z.string().trim().min(2, "Ad en az 2 karakter olmalıdır."),
  email:   z.string().trim().email("Geçerli bir e-posta adresi girin."),
  phone:   z.string().trim().optional(),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(10, "Mesaj en az 10 karakter olmalıdır."),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limit = await rateLimiter.checkLimit(`iletisim:${ip}`, {
    maxRequests: 3,
    windowMs:    60_000,
  });

  if (!limit.allowed) {
    const retryAfter = Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000);
    return tooManyRequests(
      "Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.",
      retryAfter,
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek gövdesi."); }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Geçersiz alanlar.";
    return badRequest(firstError);
  }

  const d = parsed.data;

  try {
    await prisma.contactMessage.create({
      data: {
        name:      d.name,
        email:     d.email,
        phone:     d.phone,
        subject:   d.subject,
        message:   d.message,
        ipAddress: ip !== "unknown" ? ip : undefined,
      },
    });

    return created({ message: "Mesajınız alındı. En kısa sürede size dönüş yapılacaktır." });
  } catch {
    return serverError();
  }
}
