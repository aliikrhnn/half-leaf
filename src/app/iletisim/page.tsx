import { prisma } from "@/lib/db/prisma";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS } from "@/lib/constants";
import IletisimClient from "./IletisimClient";

export const revalidate = 60;

async function getContactInfo() {
  try {
    return await prisma.siteSettings.findUnique({
      where:  { id: "site" },
      select: { contactEmail: true, contactPhone: true, contactAddress: true },
    });
  } catch {
    return null;
  }
}

export default async function IletisimPage() {
  const s = await getContactInfo();

  return (
    <IletisimClient
      contactEmail={s?.contactEmail   ?? CONTACT_EMAIL}
      contactPhone={s?.contactPhone   ?? CONTACT_PHONE}
      contactAddress={s?.contactAddress ?? CONTACT_ADDRESS}
    />
  );
}
