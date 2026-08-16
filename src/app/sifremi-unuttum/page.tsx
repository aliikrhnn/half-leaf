import type { Metadata } from "next";
import AuthShell from "@/components/layout/AuthShell";
import SifremiUnuttumClient from "./SifremiUnuttumClient";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: true },
};

export default function SifremiUnuttumPage() {
  return (
    <AuthShell>
      <SifremiUnuttumClient />
    </AuthShell>
  );
}
