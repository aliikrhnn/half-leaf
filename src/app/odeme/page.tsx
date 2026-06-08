import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = { title: "Güvenli Ödeme", robots: { index: false, follow: false } };

export default async function OdemePage() {
  const [settingsRaw, shippingRaw, bankaRaw] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "site" } }).catch(() => null),
    prisma.shippingOption.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }] }).catch(() => []),
    prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }] }).catch(() => []),
  ]);

  const freeShippingThreshold = Number(settingsRaw?.freeShippingThreshold ?? 2500);
  const shippingCost          = Number(settingsRaw?.shippingCost ?? 150);
  const bankTransferEnabled   = settingsRaw?.bankTransferEnabled ?? true;

  const shippingOptions = shippingRaw.map(o => ({
    id:          o.code as "AYNI_GUN" | "YURT_ICI" | "DUKKAN_TESLIM",
    label:       o.label,
    desc:        o.description,
    alwaysFree:  o.alwaysFree,
    price:       Number(o.price),
  }));

  const bankAccounts = bankaRaw.map(b => ({
    id:          b.id,
    bankName:    b.bankName,
    iban:        b.iban,
    accountName: b.accountName,
  }));

  return (
    <CheckoutClient
      freeShippingThreshold={freeShippingThreshold}
      shippingCost={shippingCost}
      bankTransferEnabled={bankTransferEnabled}
      shippingOptions={shippingOptions.length > 0 ? shippingOptions : undefined}
      bankAccounts={bankAccounts}
    />
  );
}
