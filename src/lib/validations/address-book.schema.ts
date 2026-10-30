import { z } from "zod";

export const AddressBookSchema = z.object({
  title: z.string().trim().min(1, "Başlık girin.").max(40),
  fullName: z.string().trim().min(2, "Ad soyad girin."),
  phone: z.string().trim().min(10, "Telefon girin."),
  city: z.string().trim().min(1, "İl seçin."),
  district: z.string().trim().min(1, "İlçe seçin."),
  neighborhood: z.string().trim().max(120).optional().default(""),
  fullAddress: z.string().trim().min(5, "Açık adres girin."),
  postalCode: z.string().trim().max(10).optional(),
  isDefault: z.boolean().optional().default(false),
});
