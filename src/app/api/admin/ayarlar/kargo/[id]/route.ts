import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, noContent, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  code:        z.string().trim().min(1).toUpperCase().optional(),
  label:       z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  price:       z.number().min(0).optional(),
  alwaysFree:  z.boolean().optional(),
  isActive:    z.boolean().optional(),
  sortOrder:   z.number().int().min(0).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;
  const { id } = await ctx.params;

  try {
    const option = await prisma.shippingOption.findUnique({ where: { id } });
    if (!option) return notFound("Kargo seçeneği bulunamadı.");
    return ok(option);
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
    const existing = await prisma.shippingOption.findUnique({ where: { id } });
    if (!existing) return notFound("Kargo seçeneği bulunamadı.");
    const updated = await prisma.shippingOption.update({ where: { id }, data: parsed.data });
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
    const existing = await prisma.shippingOption.findUnique({ where: { id } });
    if (!existing) return notFound("Kargo seçeneği bulunamadı.");
    await prisma.shippingOption.delete({ where: { id } });
    return noContent();
  } catch {
    return serverError();
  }
}
