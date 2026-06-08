import { NextRequest } from "next/server";
import { listProducts, createProduct } from "@/lib/services/product.service";
import { ProductQuerySchema, CreateProductSchema } from "@/lib/validations/product.schema";
import { ok, created, badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = ProductQuerySchema.safeParse(params);
    if (!query.success) return badRequest("Geçersiz filtre parametreleri.");

    // Public endpoint: only active products unless admin
    const adminUser = await requireAdmin(req);
    if (!isResponse(adminUser)) {
      // Admin can see all
      const result = await listProducts(query.data);
      return ok(result.items, result.meta);
    }

    // Public: active only
    const result = await listProducts({ ...query.data, isActive: true });
    return ok(result.items, result.meta);
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const product = await createProduct(parsed.data);
    return created(product);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") return badRequest("Bu slug veya SKU zaten kullanılıyor.");
    return serverError();
  }
}
