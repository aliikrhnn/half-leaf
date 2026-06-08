import { prisma } from "@/lib/db/prisma";
import { paginationMeta } from "@/lib/api/response";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/constants";
import type { CreateOrderInput } from "@/lib/validations/order.schema";

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `HL-${date}-${rand}`;
}

export async function createOrder(data: CreateOrderInput, userId: string) {
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { ProductImage: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  if (products.length !== productIds.length) {
    throw new Error("Bir veya daha fazla ürün bulunamadı veya aktif değil.");
  }

  let subtotal = 0;
  const orderItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const unitPrice = Number(product.basePrice);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return {
      productId: product.id,
      variantId: item.variantId,
      productName: product.name,
      sku: product.sku,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const shippingTotal = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const discountTotal = 0;
  const grandTotal = subtotal + shippingTotal - discountTotal;

  return prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress ?? data.shippingAddress,
      subtotal,
      shippingTotal,
      discountTotal,
      grandTotal,
      customerNote: data.notes,
      OrderItem: { create: orderItems },
    },
    include: {
      OrderItem: true,
    },
  });
}

export async function getOrdersByUser(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      include: {
        OrderItem: {
          include: {
            Product: { select: { id: true, slug: true, name: true, ProductImage: { take: 1 } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      OrderItem: {
        include: {
          Product: { select: { id: true, slug: true, name: true, ProductImage: { take: 1 } } },
          ProductVariant: true,
        },
      },
      Shipment: { orderBy: { createdAt: "desc" }, take: 1 },
      ReturnRequest: true,
    },
  });
}

export async function listOrdersAdmin(page = 1, limit = 20, status?: string) {
  const skip = (page - 1) * limit;
  const where = status ? { status: status as never } : undefined;

  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        User: { select: { id: true, email: true, fullName: true } },
        OrderItem: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({
    where: { id },
    data: { status: status as never },
  });
}
