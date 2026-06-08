"use client";

import { usePathname } from "next/navigation";
import { useAgeGate } from "@/hooks/useAgeGate";
import Button from "@/components/ui/Button";

export default function AgeGate() {
  const pathname = usePathname();
  const { isVerified, verify, reject } = useAgeGate();

  if (pathname.startsWith("/admin")) return null;
  if (isVerified !== false) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/95 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="max-w-sm w-full mx-4 bg-bg-card border border-border-default rounded-2xl p-8 text-center shadow-2xl">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-muted border border-gold/20 mb-4">
            <span className="text-2xl font-bold text-gold">+18</span>
          </div>
          <h1
            id="age-gate-title"
            className="text-xl font-semibold text-ink mb-2"
          >
            Yaş Doğrulama
          </h1>
          <p className="text-ink-muted text-sm leading-relaxed">
            Bu site yalnızca <strong className="text-ink">18 yaş ve üzeri</strong> bireylere yöneliktir. Lütfen yaşınızı doğrulayın.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="gold"
            size="lg"
            fullWidth
            onClick={verify}
            aria-label="18 yaşında veya üzerindeyim, siteye gir"
          >
            18 Yaşında veya Üzerindeyim
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={reject}
            aria-label="18 yaşından küçüğüm, siteyi terk et"
          >
            18 Yaşından Küçüğüm
          </Button>
        </div>

        <p className="mt-5 text-xs text-ink-dim">
          Siteye girerek{" "}
          <a href="/yasal/kvkk" className="underline hover:text-ink-muted">
            KVKK
          </a>{" "}
          ve{" "}
          <a
            href="/yasal/gizlilik-politikasi"
            className="underline hover:text-ink-muted"
          >
            Gizlilik Politikası
          </a>
          &apos;nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
