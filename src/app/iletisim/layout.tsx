import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Half Leaf ile iletişime geçin. Ürün sorularınız, siparişleriniz veya önerileriniz için bize ulaşın.",
  openGraph: {
    title: "İletişim | Half Leaf",
    description: "Ürün sorularınız, siparişleriniz veya önerileriniz için bize ulaşın.",
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
