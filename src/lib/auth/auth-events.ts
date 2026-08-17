/**
 * İstemci tarafı oturum değişikliği bildirimi.
 *
 * Giriş/çıkış işlemleri `fetch` ile yapılıyor ve ardından `router.push`
 * çağrılıyor; bu, yerleşimde (layout) monte edilmiş bileşenleri yeniden monte
 * ETMEZ. Sepet sahipliği denetimi (CartSync) tam olarak o anda çalışmalı —
 * misafir sepetinin hesaba birleştirilmesi giriş anında olmalı, bir sonraki
 * tam sayfa yenilemesinde değil.
 */
export const AUTH_CHANGED_EVENT = "hl-auth-changed";

/** Oturum durumu değişti: dinleyen bileşenler kendini yenilesin. */
export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
