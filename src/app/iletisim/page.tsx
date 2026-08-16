import { prisma } from "@/lib/db/prisma";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS, SITE_NAME } from "@/lib/constants";
import { buildStoreLocation } from "@/lib/store-location";
import StoreLocation from "@/components/layout/StoreLocation";
import IletisimClient from "./IletisimClient";

export const revalidate = 60;

async function getContactInfo() {
  try {
    return await prisma.siteSettings.findUnique({
      where:  { id: "site" },
      select: {
        contactEmail: true,
        contactPhone: true,
        contactAddress: true,
        mapsUrl: true,
        mapEmbedUrl: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function IletisimPage() {
  const s = await getContactInfo();

  const contactAddress = s?.contactAddress || CONTACT_ADDRESS;
  const contactPhone   = s?.contactPhone ?? CONTACT_PHONE;
  const loc = buildStoreLocation(contactAddress, s?.mapsUrl, s?.mapEmbedUrl, SITE_NAME);

  return (
    <IletisimClient
      contactEmail={s?.contactEmail ?? CONTACT_EMAIL}
      contactPhone={contactPhone}
      contactAddress={loc.singleLine}
      mapsUrl={loc.mapsUrl}
      storeMap={
        <StoreLocation
          variant="full"
          address={contactAddress}
          phone={contactPhone}
          mapsUrl={s?.mapsUrl}
          mapEmbedUrl={s?.mapEmbedUrl}
        />
      }
    />
  );
}
