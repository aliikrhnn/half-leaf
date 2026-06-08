import { NextRequest } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/services/product.service";
import { UpdateProductSchema } from "@/lib/validations/product.schema";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { mapProduct } from "@/lib/db/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) return notFound("Ürün bulunamadı.");
    return ok(mapProduct(product));
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
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e) => e.message).join(", "));
    }

    const existing = await getProductById(id);
    if (!existing) return notFound("Ürün bulunamadı.");

    const product = await updateProduct(id, parsed.data);
    return ok(product);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") return badRequest("Bu slug veya SKU zaten kullanılıyor.");
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if (isResponse(auth)) return auth;

  const { id } = await params;
  try {
    const existing = await getProductById(id);
    if (!existing) return notFound("Ürün bulunamadı.");

    await deleteProduct(id);
    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}
