import type { Metadata } from "next";
import KayitClient from "./KayitClient";

export const metadata: Metadata = { title: "Hesap Oluştur", robots: { index: false, follow: false } };

export default function KayitPage() {
  return <KayitClient />;
}
