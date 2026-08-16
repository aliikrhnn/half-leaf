import type { Metadata } from "next";
import AuthShell from "@/components/layout/AuthShell";
import { checkResetToken } from "@/lib/services/password-reset.service";
import SifreSifirlaClient from "./SifreSifirlaClient";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

const MESSAGES = {
  missing: "Bağlantı eksik görünüyor. Lütfen e-postanızdaki bağlantıyı yeniden açın veya yeni bir tane isteyin.",
  invalid: "Bu şifre sıfırlama bağlantısı geçersiz. Lütfen yeni bir bağlantı isteyin.",
  expired: "Bu bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.",
  used: "Bu bağlantı daha önce kullanılmış. Lütfen yeni bir bağlantı isteyin.",
} as const;

export default async function SifreSifirlaPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const raw = token?.trim() ?? "";

  // Bağlantı sunucuda önden doğrulanır: kullanıcı geçersiz bir linkte formu
  // doldurup en sonda hata almasın.
  let initialError: string | null = null;
  if (!raw) {
    initialError = MESSAGES.missing;
  } else {
    const outcome = await checkResetToken(raw);
    if (outcome !== "ok") initialError = MESSAGES[outcome];
  }

  return (
    <AuthShell>
      <SifreSifirlaClient token={raw} initialError={initialError} />
    </AuthShell>
  );
}
