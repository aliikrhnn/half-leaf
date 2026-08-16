import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır.").max(100),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalıdır.")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir."),
  phone: z
    .string()
    .regex(/^[0-9\s\+\-\(\)]{10,15}$/, "Geçerli bir telefon numarası giriniz.")
    .optional(),
  kvkkAccepted: z.boolean().refine((v) => v, "KVKK onayı zorunludur."),
  ticariIletiConsent: z.boolean().default(false),
  ageVerified: z
    .boolean()
    .refine((v) => v, "18 yaş ve üzeri olduğunuzu onaylamanız gerekir."),
});

export const LoginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(1, "Şifre boş olamaz."),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "Yeni şifre en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "Yeni şifre en az bir büyük harf içermelidir.")
      .regex(/[0-9]/, "Yeni şifre en az bir rakam içermelidir."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi giriniz."),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(10, "Bağlantı geçersiz.").max(200),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır.")
      .max(200)
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
