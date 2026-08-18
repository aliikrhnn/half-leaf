/**
 * PayTR iframe token'ının sipariş başına yeniden kullanımı.
 *
 * SORUN: Ödeme sayfası bir sunucu bileşeni ve her render'ında PayTR'dan token
 * istiyordu. PayTR aynı `merchant_oid` için her istekte YENİ bir token (yeni
 * ödeme oturumu) üretiyor — ölçüldü, doğrulandı. Sayfanın ikinci kez
 * çekilmesi (RSC yeniden getirme, geri/ileri, sekme geri yükleme, çift
 * gezinme) müşterinin o an baktığı iframe'in oturumunun üzerine yazıyor;
 * form "yükleniyor" yazısında asılı kalıyor.
 *
 * Bunun iki yan etkisi daha vardı: her render 350–850 ms'lik bir PayTR
 * isteği ekliyor ve IP başına 10 dakikada 20 token sınırını gereksiz yere
 * tüketiyordu.
 *
 * ÇÖZÜM: Token, sipariş numarasına göre kısa süreli olarak önbelleğe alınır.
 * Aynı sipariş için aynı token tekrar tekrar verilir; ödeme oturumu bozulmaz.
 *
 * Önbellek süresi (TOKEN_CACHE_SECONDS), PayTR'a bildirdiğimiz oturum ömrüne
 * (TOKEN_TIMEOUT_MINUTES) göre BİLİNÇLİ olarak çok kısa tutulur: önbellekten
 * dönen bir token'ın süresi hiçbir zaman dolmuş olamaz.
 */

import { unstable_cache } from "next/cache";
import { requestIframeToken, type IframeTokenParams } from "@/lib/payment/paytr";

/** PayTR ödeme oturumunun geçerlilik süresi (dakika). */
const TOKEN_TIMEOUT_MINUTES = 30;

/** Aynı token'ın tekrar kullanılacağı süre (saniye). Oturum ömrünün çok altında. */
const TOKEN_CACHE_SECONDS = 300;

type TokenParams = Omit<IframeTokenParams, "merchantOid" | "timeoutLimitMin">;

/**
 * Sipariş için PayTR iframe token'ı döndürür; kısa süre içinde tekrar
 * çağrılırsa AYNI token'ı verir.
 *
 * Teşhis kaydı burada tutulur (sayfanın render'ı içinde `Date.now()`
 * çağrılamıyor — React saflık kuralı). Log'da "YENİ" görünen her satır
 * PayTR'da yeni bir ödeme oturumu açıldığı anlamına gelir; aynı sipariş için
 * arka arkaya iki "YENİ" satırı varsa ilk iframe ölmüştür.
 *
 * @param merchantOid Sipariş numarası — önbellek anahtarı budur.
 * @throws {PaytrApiError | PaytrConfigError} İlk üretim başarısız olursa.
 *   Hatalar önbelleğe ALINMAZ; sonraki deneme yeniden ister.
 */
export async function getOrCreateIframeToken(
  merchantOid: string,
  params: TokenParams,
): Promise<string> {
  const cached = unstable_cache(
    async () => {
      const startedAt = Date.now();
      try {
        const token = await requestIframeToken({
          ...params,
          merchantOid,
          timeoutLimitMin: TOKEN_TIMEOUT_MINUTES,
        });
        console.log(
          `[paytr-token] YENİ no=${merchantOid} tutar=${params.amountTRY} ` +
            `kalem=${params.basket.length} sure=${Date.now() - startedAt}ms`,
        );
        return token;
      } catch (err) {
        console.error(
          `[paytr-token] HATA no=${merchantOid} tutar=${params.amountTRY} ` +
            `sure=${Date.now() - startedAt}ms sebep=${err instanceof Error ? err.message : String(err)}`,
        );
        throw err;
      }
    },
    ["paytr-iframe-token", merchantOid],
    { revalidate: TOKEN_CACHE_SECONDS, tags: [`paytr-token:${merchantOid}`] },
  );

  return cached();
}
