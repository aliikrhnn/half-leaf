import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, noContent, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  bankName:    z.string().trim().min(1).optional(),
  iban:        z.string().trim().min(16).optional(),
  accountName: z.string().trim().min(1).optional(),
  isActive:    z.boolean().optional(),
  sortOrder:   z.number().int().min(0).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;
  const { id } = await ctx.params;

  try {
    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account) return notFound("Banka hesabı bulunamadı.");
    return ok(account);
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;
  const { id } = await ctx.params;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  try {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) return notFound("Banka hesabı bulunamadı.");
    const updated = await prisma.bankAccount.update({ where: { id }, data: parsed.data });
    return ok(updated);
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;
  const { id } = await ctx.params;

  try {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) return notFound("Banka hesabı bulunamadı.");
    await prisma.bankAccount.delete({ where: { id } });
    return noContent();
  } catch {
    return serverError();
  }
}
