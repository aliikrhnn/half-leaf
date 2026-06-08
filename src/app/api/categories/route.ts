import { NextRequest } from "next/server";
import { listCategories, createCategory } from "@/lib/services/category.service";
import { CreateCategorySchema } from "@/lib/services/category.service";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse, getAuthUser } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const activeOnly = user?.role !== "ADMIN";
    const categories = await listCategories(activeOnly);
    return ok(categories);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const category = await createCategory(parsed.data);
    return created(category);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") return badRequest("Bu kategori slug'ı zaten kullanılıyor.");
    return serverError();
  }
}
