import { NextRequest } from "next/server";
import { getCategoryById, updateCategory, deleteCategory } from "@/lib/services/category.service";
import { CreateCategorySchema } from "@/lib/services/category.service";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const category = await getCategoryById(id);
    if (!category) return notFound("Kategori bulunamadı.");
    return ok(category);
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = CreateCategorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const existing = await getCategoryById(id);
    if (!existing) return notFound("Kategori bulunamadı.");

    const category = await updateCategory(id, parsed.data);
    return ok(category);
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    await deleteCategory(id);
    return ok({ deleted: true });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message.includes("ürün bulunmaktadır")) return badRequest(e.message);
    return serverError();
  }
}
