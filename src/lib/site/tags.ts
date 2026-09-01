/**
 * Next veri cache'i etiketleri ve geçersiz kılma yardımcısı.
 *
 * Ayrı ve hafif bir dosyada tutulur: yönetim paneli yazma yolları bunu,
 * veritabanına dokunan cache modüllerini içeri almadan kullanabilsin.
 */

import { revalidateTag } from "next/cache";

/** Menü + ürün listesi kategori cache'leri. */
export const NAV_CATEGORIES_TAG = "nav-categories";

/** Genel site ayarları satırı (layout duyuruları, footer iletişim bilgileri). */
export const SITE_SETTINGS_TAG = "site-settings";

/**
 * Katalog gezinme cache'lerini geçersiz kılar.
 *
 * Menü (lib/site/nav.ts) ve ürün listesi filtreleri (lib/products/list-query.ts)
 * kategorileri dakikalarca cache'ler. Bu çağrı olmadan panelden yapılan bir
 * değişiklik yayına geçene kadar mağaza sahibi "kaydettim ama değişmedi" görür.
 *
 * Menü içeriği yalnızca kategorilere değil ÜRÜNLERE de bağlıdır: alt ağacında
 * aktif ürünü kalmayan kategori menüden gizlenir ve her kök kategorinin vitrin
 * ürünü ürün tablosundan seçilir. Bu yüzden ürün yazma yolları da bunu çağırır.
 *
 * Yalnızca istek bağlamından (route handler / server action) çağrılmalıdır.
 */
export function revalidateNavCache(): void {
  // Next 16: ikinci argüman zorunlu; "max" tüm cache profillerini kapsar.
  // (updateTag yalnızca Server Action içinde çalışır, route handler'da hata verir.)
  revalidateTag(NAV_CATEGORIES_TAG, "max");
}
