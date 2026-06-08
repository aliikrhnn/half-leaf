import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const CreateSchema = z.object({
  code:        z.string().trim().min(1).toUpperCase(),
  label:       z.string().trim().min(1),
  description: z.string().trim().min(1),
  price:       z.number().min(0).default(0),
  alwaysFree:  z.boolean().default(false),
  isActive:    z.boolean().default(true),
  sortOrder:   z.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const options = await prisma.shippingOption.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return ok(options);
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
    const option = await prisma.shippingOption.create({ data: parsed.data });
    return created(option);
  } catch {
    return serverError();
  }
}
