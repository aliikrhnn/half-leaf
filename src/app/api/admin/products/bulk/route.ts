import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

const BulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "En az bir ürün seçilmelidir."),
  action: z.enum([
    "activate",
    "deactivate",
    "markBestseller",
    "unmarkBestseller",
    "markFeatured",
    "unmarkFeatured",
    "changeCategory",
  ]),
  categoryId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  const parsed = BulkActionSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz istek.");
  }

  const { ids, action, categoryId } = parsed.data;

  if (action === "changeCategory") {
    if (!categoryId) return badRequest("Kategori seçilmedi.");
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return badRequest("Geçersiz kategori.");
  }

  try {
    let updateData: Record<string, unknown>;

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
      case "markBestseller":
        updateData = { isBestseller: true };
        break;
      case "unmarkBestseller":
        updateData = { isBestseller: false };
        break;
      case "markFeatured":
        updateData = { isFeatured: true };
        break;
      case "unmarkFeatured":
        updateData = { isFeatured: false };
        break;
      case "changeCategory":
        updateData = { categoryId };
        break;
    }

    const { count } = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: auth.sub ?? null,
        action: `BULK_${action.toUpperCase()}`,
        entityType: "Product",
        entityId: ids.join(","),
        changes: { ids, action, ...(categoryId && { categoryId }) },
      },
    });

    return ok({ updated: count });
  } catch {
    return serverError();
  }
}
