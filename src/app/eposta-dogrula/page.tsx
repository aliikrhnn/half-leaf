import type { Metadata } from "next";
import AuthShell from "@/components/layout/AuthShell";
import { checkVerificationToken } from "@/lib/services/email-verification.service";
import EpostaDogrulaClient from "./EpostaDogrulaClient";

export const metadata: Metadata = {
  title: "E-posta Doğrulama",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

const MESSAGES = {
  missing: "Bağlantı eksik görünüyor. E-postanızdaki bağlantıyı yeniden açın veya aşağıdan yeni bir tane isteyin.",
  invalid: "Doğrulama bağlantısı geçersiz. Aşağıdan yeni bir bağlantı isteyebilirsiniz.",
  expired: "Doğrulama bağlantısının süresi dolmuş. Aşağıdan yeni bir bağlantı isteyin.",
  used: "Bu bağlantı daha önce kullanılmış. Giriş yapmayı deneyin.",
  already: "Bu e-posta adresi zaten doğrulanmış. Giriş yapabilirsiniz.",
  working: "Bağlantınız kontrol ediliyor, birkaç saniye sürebilir.",
} as const;

export default async function EpostaDogrulaPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const raw = token?.trim() ?? "";

  // Durum önce sunucuda okunur; asıl doğrulama (token'ı harcayan işlem)
  // istemciden POST ile yapılır — böylece link ön-taraması hesabı
  // kullanıcı görmeden doğrulamış olmaz.
  let state: "ok" | "already" | "error" = "error";
  let message: string = MESSAGES.missing;

  if (raw) {
    const outcome = await checkVerificationToken(raw);
    if (outcome === "ok") {
      state = "ok";
      message = MESSAGES.working;
    } else if (outcome === "already") {
      state = "already";
      message = MESSAGES.already;
    } else {
      state = "error";
      message = MESSAGES[outcome];
    }
  }

  return (
    <AuthShell>
      <EpostaDogrulaClient token={raw} initialState={state} initialMessage={message} />
    </AuthShell>
  );
}
