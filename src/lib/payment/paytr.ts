/**
 * PayTR iFrame API entegrasyonu — çekirdek yardımcılar (yalnızca sunucu tarafı).
 *
 * Bu modül; token/hash hesaplama, sepet kodlama, iframe token isteği, bildirim
 * (callback) hash doğrulaması, iade ve durum sorgulama mantığını tek bir yerde
 * toplar. Hiçbir gizli anahtar istemciye sızdırılmamalıdır — bu dosya yalnızca
 * route handler / server component / server action içinde import edilmelidir.
 *
 * Resmî dokümanlar: PayTR iFrame API (1. ADIM get-token, 2. ADIM Bildirim URL),
 * PayTR İade API, PayTR Durum Sorgu API.
 */

import crypto from "crypto";

/* ─── Sabitler ─── */

export const PAYTR_GET_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";
export const PAYTR_IFRAME_BASE_URL = "https://www.paytr.com/odeme/guvenli";
export const PAYTR_REFUND_URL = "https://www.paytr.com/odeme/iade";
export const PAYTR_STATUS_URL = "https://www.paytr.com/odeme/durum-sorgu";
export const PAYTR_IFRAME_RESIZER_URL =
  "https://www.paytr.com/js/iframeResizer.min.js";

/** PayTR get-token isteği için varsayılan zaman aşımı (dakika). */
const DEFAULT_TIMEOUT_LIMIT_MIN = 15;

/* ─── Hata tipleri ─── */

/** PayTR kimlik bilgileri eksik/yanlış olduğunda fırlatılır. */
export class PaytrConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaytrConfigError";
  }
}

/** get-token / iade / durum-sorgu isteklerinde PayTR hata döndürünce fırlatılır. */
export class PaytrApiError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(`PayTR isteği başarısız: ${reason}`);
    this.name = "PaytrApiError";
    this.reason = reason;
  }
}

/* ─── Yapılandırma ─── */

export interface PaytrConfig {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  /** "1" = test işlemi (canlı modda dahi tahsilat yapılmaz), "0" = gerçek tahsilat. */
  testMode: "0" | "1";
  /** "1" ise taksit seçenekleri gizlenir (yalnızca tek çekim). */
  noInstallment: "0" | "1";
  /** Gösterilecek en fazla taksit sayısı. "0" = yürürlükteki en yüksek taksit. */
  maxInstallment: string;
}

/**
 * Ortam değişkenlerinden PayTR yapılandırmasını okur ve doğrular.
 * Güvenlik gereği test modu varsayılan olarak AÇIKTIR ("1"); mağaza sahibi
 * canlıya geçişte `PAYTR_TEST_MODE=0` tanımlamalıdır.
 *
 * @throws {PaytrConfigError} Zorunlu kimlik bilgileri eksikse.
 */
export function getPaytrConfig(): PaytrConfig {
  const merchantId = process.env.PAYTR_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYTR_MERCHANT_KEY?.trim();
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT?.trim();

  if (!merchantId || !merchantKey || !merchantSalt) {
    throw new PaytrConfigError(
      "PayTR kimlik bilgileri tanımlı değil. Lütfen PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY ve PAYTR_MERCHANT_SALT ortam değişkenlerini ayarlayın.",
    );
  }

  // Yalnızca açıkça "0" verildiğinde canlı tahsilat; aksi halde test modu.
  const testMode: "0" | "1" = process.env.PAYTR_TEST_MODE?.trim() === "0" ? "0" : "1";
  const noInstallment: "0" | "1" =
    process.env.PAYTR_NO_INSTALLMENT?.trim() === "1" ? "1" : "0";
  const maxInstallment = (process.env.PAYTR_MAX_INSTALLMENT?.trim() || "0");

  return { merchantId, merchantKey, merchantSalt, testMode, noInstallment, maxInstallment };
}

/** PayTR yapılandırmasının mevcut olup olmadığını (hata fırlatmadan) bildirir. */
export function isPaytrConfigured(): boolean {
  return Boolean(
    process.env.PAYTR_MERCHANT_ID?.trim() &&
      process.env.PAYTR_MERCHANT_KEY?.trim() &&
      process.env.PAYTR_MERCHANT_SALT?.trim(),
  );
}

/* ─── Yardımcılar ─── */

/** HMAC-SHA256 hesaplayıp base64 döndürür (PayTR'nin tüm token/hash hesapları bu biçimde). */
function hmacBase64(data: string, key: string): string {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest("base64");
}

/** TL tutarını (ör. 349.90) PayTR'nin beklediği kuruş tamsayısına çevirir (34990). */
export function toKurus(amountTRY: number): number {
  return Math.round(amountTRY * 100);
}

export interface BasketLine {
  name: string;
  /** Birim fiyat (TL, ondalıklı). */
  unitPrice: number;
  quantity: number;
}

/**
 * Sepet içeriğini PayTR'nin beklediği base64(JSON) biçimine kodlar.
 * Biçim: [["Ürün adı", "18.00", 1], ...]  (fiyat string, adet integer)
 * Ürün adları 60 karaktere kısaltılır.
 */
export function encodeBasket(lines: ReadonlyArray<BasketLine>): string {
  const rows = lines.map((l) => [
    l.name.slice(0, 60),
    l.unitPrice.toFixed(2),
    l.quantity,
  ]);
  return Buffer.from(JSON.stringify(rows), "utf8").toString("base64");
}

/** İstemci IP'sini PayTR kısıtlarına uygun hale getirir (en fazla 39 karakter, boşsa fallback). */
export function normalizeUserIp(ip: string | null | undefined): string {
  const first = (ip ?? "").split(",")[0]?.trim() ?? "";
  // IPv6 loopback / boş değerlerde PayTR doğrulaması başarısız olmasın diye nötr bir fallback.
  if (!first || first === "::1") return "127.0.0.1";
  return first.slice(0, 39);
}

/* ─── 1. ADIM: iframe token ─── */

export interface IframeTokenParams {
  merchantOid: string; // benzersiz sipariş no (alfa-numerik, en fazla 64)
  amountTRY: number; // toplam tahsil edilecek tutar (TL)
  email: string;
  userIp: string;
  userName: string;
  userAddress: string;
  userPhone: string;
  basket: ReadonlyArray<BasketLine>;
  okUrl: string;
  failUrl: string;
  currency?: string; // varsayılan "TL"
  lang?: "tr" | "en";
  timeoutLimitMin?: number;
}

/**
 * PayTR'dan iframe token alır (server-side POST).
 * @throws {PaytrApiError} PayTR `status: failed` döndürürse (reason ile).
 * @throws {PaytrConfigError} Yapılandırma eksikse.
 */
export async function requestIframeToken(
  params: IframeTokenParams,
): Promise<string> {
  const cfg = getPaytrConfig();

  const paymentAmount = toKurus(params.amountTRY);
  const userBasket = encodeBasket(params.basket);
  const currency = params.currency ?? "TL";
  const noInstallment = cfg.noInstallment;
  const maxInstallment = cfg.maxInstallment;
  const userIp = normalizeUserIp(params.userIp);

  // Hash dizgesi: merchant_id + user_ip + merchant_oid + email + payment_amount
  //   + user_basket + no_installment + max_installment + currency + test_mode
  const hashStr =
    cfg.merchantId +
    userIp +
    params.merchantOid +
    params.email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    cfg.testMode;

  const paytrToken = hmacBase64(hashStr + cfg.merchantSalt, cfg.merchantKey);

  const form = new URLSearchParams({
    merchant_id: cfg.merchantId,
    user_ip: userIp,
    merchant_oid: params.merchantOid,
    email: params.email,
    payment_amount: String(paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasket,
    // Hata ayıklama yalnızca test modunda açık; canlıda PayTR'ın ayrıntılı iç
    // hata mesajlarının kullanıcıya/loga sızmaması için kapalı.
    debug_on: cfg.testMode === "1" ? "1" : "0",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: params.userName.slice(0, 60),
    user_address: params.userAddress.slice(0, 400),
    user_phone: params.userPhone.slice(0, 20),
    merchant_ok_url: params.okUrl,
    merchant_fail_url: params.failUrl,
    timeout_limit: String(params.timeoutLimitMin ?? DEFAULT_TIMEOUT_LIMIT_MIN),
    currency,
    test_mode: cfg.testMode,
    lang: params.lang ?? "tr",
  });

  /* Zaman aşımı ŞART: bu istek ödeme sayfasının sunucu render'ını bloklar.
     PayTR yanıt vermezse (ya da çok yavaşsa) müşteri, tarayıcıda hiçbir şey
     görmeden dakikalarca boş sayfada bekliyordu. 12 sn sonra hata ekranına
     düşmek — "Tekrar Dene" düğmesiyle — sonsuz beklemekten iyidir. */
  const res = await fetch(PAYTR_GET_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  }).catch((err: unknown) => {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new PaytrApiError(
      timedOut ? "PayTR yanıt vermedi (zaman aşımı)" : "PayTR'a bağlanılamadı",
    );
  });

  const data = (await res.json()) as
    | { status: "success"; token: string }
    | { status: "failed"; reason?: string };

  if (data.status !== "success") {
    throw new PaytrApiError(data.reason ?? "Bilinmeyen hata");
  }
  return data.token;
}

/** Verilen iframe token için ödeme formu URL'sini döndürür. */
export function iframeUrl(token: string): string {
  return `${PAYTR_IFRAME_BASE_URL}/${token}`;
}

/* ─── 2. ADIM: Bildirim URL (callback) hash doğrulaması ─── */

export interface PaytrCallback {
  merchant_oid: string;
  status: string; // "success" | "failed"
  total_amount: string;
  hash: string;
  payment_type?: string;
  payment_amount?: string;
  currency?: string;
  test_mode?: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
}

/**
 * PayTR bildirim (callback) içeriğinin gerçekliğini doğrular.
 * Hash dizgesi: merchant_oid + merchant_salt + status + total_amount
 * Zamanlama-güvenli karşılaştırma kullanır (timing attack koruması).
 *
 * @returns true → bildirim gerçek ve değiştirilmemiş.
 */
export function verifyCallbackHash(cb: PaytrCallback): boolean {
  const cfg = getPaytrConfig();
  const hashStr = cb.merchant_oid + cfg.merchantSalt + cb.status + cb.total_amount;
  const expected = hmacBase64(hashStr, cfg.merchantKey);

  const a = Buffer.from(expected);
  const b = Buffer.from(cb.hash ?? "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ─── İade (Refund) API ─── */

export interface RefundResult {
  status: string; // "success" | "error"
  is_test?: number;
  merchant_oid?: string;
  return_amount?: string;
  err_no?: string;
  err_msg?: string;
}

/**
 * PayTR İade API'si ile tam veya kısmi iade yapar.
 * Hash: base64(HMAC(merchant_id + merchant_oid + return_amount + merchant_salt))
 *
 * @param merchantOid İadesi yapılacak siparişin merchant_oid'i (orderNumber).
 * @param returnAmountTRY İade tutarı (TL). Tam tutar gönderilirse tam iade.
 */
export async function refundPayment(
  merchantOid: string,
  returnAmountTRY: number,
): Promise<RefundResult> {
  const cfg = getPaytrConfig();
  const returnAmount = returnAmountTRY.toFixed(2);

  const paytrToken = hmacBase64(
    cfg.merchantId + merchantOid + returnAmount + cfg.merchantSalt,
    cfg.merchantKey,
  );

  const form = new URLSearchParams({
    merchant_id: cfg.merchantId,
    merchant_oid: merchantOid,
    return_amount: returnAmount,
    paytr_token: paytrToken,
  });

  const res = await fetch(PAYTR_REFUND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  return (await res.json()) as RefundResult;
}

/* ─── Durum Sorgu API ─── */

export interface StatusResult {
  /** "success" = bu merchant_oid için BAŞARILI ödeme var; "error" = yok/hata. */
  status: string;
  payment_amount?: string;
  payment_total?: string;
  returns?: string;
  currency?: string;
  err_no?: string; // ör. "004"
  err_msg?: string; // ör. "merchant_oid ile basarili odeme bulunamadi"
  [key: string]: unknown;
}

/**
 * Durum sorgu sonucunu yorumlar:
 *  - "paid": PayTR'da başarılı ödeme bulundu (status === "success").
 *  - "no_payment": başarılı ödeme yok (err_no 004 / "...bulunamadi").
 *  - "unknown": geçici/belirsiz sorgu hatası — karar verme, tekrar dene.
 */
export function interpretStatus(res: StatusResult): "paid" | "no_payment" | "unknown" {
  if (res.status === "success") return "paid";
  const errNo = (res.err_no ?? "").toString();
  const errMsg = (res.err_msg ?? "").toLowerCase();
  if (errNo === "004" || errMsg.includes("bulunamadi") || errMsg.includes("bulunamadı")) {
    return "no_payment";
  }
  return "unknown";
}

/**
 * PayTR Durum Sorgu API'si ile bir siparişin ödeme durumunu sorgular.
 * Hash: base64(HMAC(merchant_id + merchant_oid + merchant_salt))
 * Bildirim alınamadığı (kaybolduğu) durumlarda mutabakat için kullanılır.
 */
export async function queryPaymentStatus(
  merchantOid: string,
): Promise<StatusResult> {
  const cfg = getPaytrConfig();

  const paytrToken = hmacBase64(
    cfg.merchantId + merchantOid + cfg.merchantSalt,
    cfg.merchantKey,
  );

  const form = new URLSearchParams({
    merchant_id: cfg.merchantId,
    merchant_oid: merchantOid,
    paytr_token: paytrToken,
  });

  const res = await fetch(PAYTR_STATUS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  return (await res.json()) as StatusResult;
}

/* ─── Site taban URL'si ─── */

/**
 * Bildirim/yönlendirme URL'leri için mutlak site adresini döndürür.
 * GÜVENLİK: Yalnızca NEXT_PUBLIC_SITE_URL kullanılır. İstemciden gelen `Origin`
 * header'ı (saldırgan kontrolünde) ASLA kullanılmaz — aksi halde ödeme sonrası
 * yönlendirme (merchant_ok_url) kötü amaçlı bir adrese çekilebilirdi.
 */
export function getSiteBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  return "http://localhost:3000";
}
