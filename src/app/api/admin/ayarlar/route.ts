import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

const UpdateSchema = z.object({
  maintenanceMode:       z.boolean().optional(),
  ecommerceEnabled:      z.boolean().optional(),
  giftBoxEnabled:        z.boolean().optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  shippingCost:          z.number().min(0).optional(),
  bankTransferEnabled:   z.boolean().optional(),
  contactEmail:          z.string().email("Geçerli bir e-posta girin.").optional(),
  contactPhone:          z.string().min(1).optional(),
  contactAddress:        z.string().optional(),
  // Mağaza konumu — boş bırakılırsa adres metninden otomatik üretilir.
  mapsUrl:               z.union([z.string().url(), z.literal("")]).nullable().optional(),
  mapEmbedUrl:           z.union([z.string().url(), z.literal("")]).nullable().optional(),
  instagramUrl:          z.string().url().nullable().optional(),
  facebookUrl:           z.string().url().nullable().optional(),
  twitterUrl:            z.string().url().nullable().optional(),
  whatsappNumber:        z.string().nullable().optional(),
  announcementMessages:  z.array(z.string().max(200)).max(20).optional(),
});

async function getOrCreate() {
  return prisma.siteSettings.upsert({
    where:  { id: "site" },
    create: { id: "site" },
    update: {},
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    return ok(await getOrCreate());
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("Geçersiz istek."); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const data = parsed.data;

  try {
    const settings = await prisma.siteSettings.upsert({
      where:  { id: "site" },
      create: { id: "site", ...data },
      update: data,
    });
    return ok(settings);
  } catch {
    return serverError();
  }
}
