/**
 * Resend REST API ile e-posta gönderimi (ek bağımlılık yok — fetch ile).
 * RESEND_API_KEY ve EMAIL_FROM tanımlı değilse sessizce no-op döner.
 * E-posta hataları ASLA çağıran akışı (sipariş vb.) kırmaz.
 */

const RESEND_URL = "https://api.resend.com/emails";

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/** E-posta yapılandırması mevcut mu? */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/**
 * E-posta gönderir. Yapılandırma yoksa veya hata olursa false döner (asla throw etmez).
 */
export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return false;

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Toplu e-posta gönderir (Resend batch — istek başına en fazla 100).
 * Her e-postanın kendi HTML'i olabilir (kişiselleştirilmiş abonelik iptali linki).
 * @returns Gönderilen e-posta sayısı.
 */
export async function sendBatchEmails(
  emails: ReadonlyArray<SendEmailArgs>,
): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from || emails.length === 0) return 0;

  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100).map((e) => ({
      from,
      to: e.to,
      subject: e.subject,
      html: e.html,
    }));
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
        cache: "no-store",
      });
      if (res.ok) sent += chunk.length;
    } catch { /* parça hatasını yoksay */ }
  }
  return sent;
}
