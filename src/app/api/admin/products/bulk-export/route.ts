import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import ExcelJS from "exceljs";
import { badRequest, serverError } from "@/lib/api/response";
import { requireAdmin, isResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

const BodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "En az bir ürün seçilmelidir."),
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz istek.");
  }

  const { ids } = parsed.data;

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        Category: { select: { slug: true } },
        Material: { select: { slug: true } },
        Inventory: { select: { quantity: true } },
        ProductImage: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Half Leaf Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Ürünler");

    sheet.columns = [
      { header: "slug", key: "slug", width: 30 },
      { header: "name", key: "name", width: 40 },
      { header: "description", key: "description", width: 60 },
      { header: "categorySlug", key: "categorySlug", width: 20 },
      { header: "materialSlug", key: "materialSlug", width: 20 },
      { header: "basePrice", key: "basePrice", width: 14 },
      { header: "priceCurrency", key: "priceCurrency", width: 14 },
      { header: "discountPrice", key: "discountPrice", width: 14 },
      { header: "stock", key: "stock", width: 10 },
      { header: "isActive", key: "isActive", width: 10 },
      { header: "isFeatured", key: "isFeatured", width: 12 },
      { header: "isBestseller", key: "isBestseller", width: 14 },
      { header: "sortOrder", key: "sortOrder", width: 12 },
      { header: "imageUrls", key: "imageUrls", width: 80 },
    ];

    // Bold header row
    sheet.getRow(1).font = { bold: true };

    for (const p of products) {
      sheet.addRow({
        slug: p.slug,
        name: p.name,
        description: p.shortDescription,
        categorySlug: p.Category?.slug ?? "",
        materialSlug: p.Material?.slug ?? "",
        basePrice: Number(p.basePrice),
        priceCurrency: p.priceCurrency ?? "TRY",
        discountPrice: p.compareAtPrice ? Number(p.compareAtPrice) : "",
        stock: p.Inventory?.quantity ?? 0,
        isActive: p.isActive ? "TRUE" : "FALSE",
        isFeatured: p.isFeatured ? "TRUE" : "FALSE",
        isBestseller: p.isBestseller ? "TRUE" : "FALSE",
        sortOrder: "",
        imageUrls: p.ProductImage.map((img) => img.url).join(","),
      });
    }

    const rawBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(rawBuffer);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    const filename = `half-leaf-urunler-${dateStr}-${timeStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return serverError();
  }
}
