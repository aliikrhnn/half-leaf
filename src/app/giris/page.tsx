import type { Metadata } from "next";
import GirisClient from "./GirisClient";

export const metadata: Metadata = { title: "Giriş Yap", robots: { index: false, follow: false } };

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function GirisPage({ searchParams }: Props) {
  const { redirect } = await searchParams;
  return <GirisClient redirectTo={redirect ?? "/hesabim"} />;
}
