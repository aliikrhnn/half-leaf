import { z } from "zod";

export const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Kupon kodu en az 3 karakter olmalıdır.")
    .max(50)
    .toUpperCase(),
  description: z.string().max(500).optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.number().positive("Değer 0'dan büyük olmalıdır."),
  minOrderAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().positive(),
});

export const UpdateCouponSchema = CreateCouponSchema.partial();

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
