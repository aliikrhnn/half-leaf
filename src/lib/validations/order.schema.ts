import { z } from "zod";

export const AddressSchema = z.object({
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(200),
  phone: z
    .string()
    .regex(/^[0-9\s\+\-\(\)]{10,15}$/, "Geçerli bir telefon numarası giriniz."),
  addressLine1: z.string().min(5, "Adres en az 5 karakter olmalıdır.").max(500),
  addressLine2: z.string().max(500).optional(),
  city: z.string().min(2, "Şehir zorunludur.").max(100),
  district: z.string().min(2, "İlçe zorunludur.").max(100),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, "Posta kodu 5 haneli olmalıdır."),
  country: z.string().default("TR"),
});

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        variantId: z.string().cuid().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "Sepet boş olamaz."),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  guestEmail: z.string().email().optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["BEKLEMEDE", "ONAYLANDI", "HAZIRLANIYOR", "KARGODA", "TESLIM_EDILDI", "IPTAL_EDILDI"]),
  note: z.string().max(500).optional(),
});

export const ReturnRequestSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().min(10, "İade nedeninizi açıklayınız.").max(1000),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      variantId: z.string().cuid().optional(),
      quantity: z.number().int().positive(),
      reason: z.string().max(500).optional(),
    })
  ).min(1),
});

export type AddressInput = z.infer<typeof AddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type ReturnRequestInput = z.infer<typeof ReturnRequestSchema>;
