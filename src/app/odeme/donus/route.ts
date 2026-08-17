/**
 * PayTR ödeme dönüş köprüsü.
 *
 * PayTR iFrame API'sinde ödeme tamamlanınca `merchant_ok_url` / `merchant_fail_url`
 * adresi IFRAME'İN İÇİNDE açılır. Sitenin geri kalanı `X-Frame-Options: DENY` +
 * `frame-ancestors 'none'` ile korunduğu için sonuç sayfası iframe içinde
 * çizilemiyor ve müşteri kart bilgisini girdikten sonra BEYAZ EKRANDA kalıyordu.
 *
 * Bu uç, çerçevelenmesine izin verilen tek adrestir (bkz. next.config.ts) ve tek
 * iş yapar: üst pencereyi gerçek sonuç sayfasına taşır. İçeride hiçbir müşteri
 * verisi göstermez.
 *
 * GÜVENLİK: Hedef adres istemciden ALINMAZ. Yalnızca `d` (ok/fail), `no`
 * (sipariş numarası) ve `t` (erişim anahtarı) alınır, hedef URL sunucuda
 * kurulur — aksi hâlde bu uç açık yönlendirme (open redirect) olurdu.
 */

import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** HTML gövdesine gömülecek metni kaçırır. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(req: NextRequest): Promise<Response> {
  const sp = req.nextUrl.searchParams;

  const durum = sp.get("d") === "fail" ? "fail" : "ok";
  // Sipariş numarası alfa-numeriktir (HL<timestamp><rastgele>); dışarıdan gelen
  // her şey biçim kontrolünden geçer.
  const orderNumber = (sp.get("no") ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 64);
  const accessToken = (sp.get("t") ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);

  const query = new URLSearchParams();
  if (orderNumber) query.set("no", orderNumber);
  if (accessToken) query.set("t", accessToken);
  const qs = query.toString();

  // Göreli hedef: mutlak URL kurulmadığı için host manipülasyonu da imkânsız.
  const target = `${durum === "ok" ? "/siparis-tamamlandi" : "/odeme/hata"}${qs ? `?${qs}` : ""}`;
  const safeTarget = escapeHtml(target);
  // JSON.stringify: script bağlamına güvenli gömme (tırnak/kaçış sorunları yok).
  const jsTarget = JSON.stringify(target).replace(/</g, "\\u003c");

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Yönlendiriliyorsunuz…</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#141414;color:#e8e4dc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
<div style="text-align:center;padding:32px;">
  <div style="width:34px;height:34px;margin:0 auto 16px;border:3px solid rgba(201,169,110,0.25);border-top-color:#c9a96e;border-radius:50%;animation:hlspin 0.8s linear infinite;"></div>
  <p style="font-size:14px;margin:0;">Ödeme sonucu alınıyor, yönlendiriliyorsunuz…</p>
  <noscript>
    <p style="font-size:13px;margin:14px 0 0;">
      <a href="${safeTarget}" style="color:#c9a96e;">Devam etmek için tıklayın</a>
    </p>
  </noscript>
</div>
<style>@keyframes hlspin{to{transform:rotate(360deg)}}</style>
<script>
(function () {
  var target = ${jsTarget};
  try {
    // iframe içindeysek üst pencereyi taşı. Bu sayfa da site ile aynı köken
    // olduğundan üst pencereyi yönlendirmesine tarayıcı izin verir.
    if (window.top && window.top !== window.self) {
      window.top.location.replace(target);
      return;
    }
  } catch (e) { /* erişilemezse aşağıdaki normal yönlendirme çalışır */ }
  window.location.replace(target);
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
