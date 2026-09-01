/**
 * Genel (giriş gerektirmeyen) site ayarları — TEK cache'lenmiş kaynak.
 *
 * Bu satır her sayfa render'ında iki kez okunuyordu (app/layout.tsx bir kez,
 * components/layout/Footer.tsx bir kez daha). İkisi de artık buradan geçer:
 * istek başına iki veritabanı sorgusu yerine, 5 dakikada bir tek sorgu.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { SITE_SETTINGS_TAG } from "@/lib/site/tags";

/**
 * layout ve Footer'ın ihtiyaç duyduğu alanların birleşimi.
 *
 * Yalnızca metin/boolean alanlar seçilir — `Decimal` ve `DateTime` değerleri
 * Next veri cache'inde JSON'a serileştirilirken tipini kaybeder; havuza
 * girmemeleri gerekir.
 */
const PUBLIC_FIELDS = {
  announcementMessages: true,
  giftBoxEnabled: true,
  whatsappNumber: true,
  contactEmail: true,
  contactPhone: true,
  contactAddress: true,
  mapsUrl: true,
  mapEmbedUrl: true,
  instagramUrl: true,
  facebookUrl: true,
} as const;

export type PublicSiteSettings = {
  announcementMessages: string[];
  giftBoxEnabled: boolean;
  whatsappNumber: string | null;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  mapsUrl: string | null;
  mapEmbedUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
};

const fetchPublicSiteSettings = unstable_cache(
  () => prisma.siteSettings.findUnique({ where: { id: "site" }, select: PUBLIC_FIELDS }),
  ["public-site-settings"],
  { revalidate: 300, tags: [SITE_SETTINGS_TAG] },
);

/**
 * Ayar satırını döndürür; satır yoksa veya veritabanına ulaşılamazsa `null`.
 *
 * Hata YAKALAMASI cache'in DIŞINDADIR: aksi hâlde geçici bir veritabanı
 * hatasında `null` sonuç 5 dakika boyunca cache'lenir ve site o süre boyunca
 * yedek değerlerle çalışırdı.
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettings | null> {
  try {
    return await fetchPublicSiteSettings();
  } catch {
    return null;
  }
}
