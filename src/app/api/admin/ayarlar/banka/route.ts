import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const CreateSchema = z.object({
  bankName:    z.string().trim().min(1),
  iban:        z.string().trim().min(16),
  accountName: z.string().trim().min(1),
  isActive:    z.boolean().default(true),
  sortOrder:   z.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return ok(accounts);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  try {
    const account = await prisma.bankAccount.create({ data: parsed.data });
    return created(account);
  } catch {
    return serverError();
  }
}
