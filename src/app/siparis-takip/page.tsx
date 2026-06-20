import type { Metadata } from "next";
import { Suspense } from "react";
import SiparisTakipClient from "./SiparisTakipClient";

export const metadata: Metadata = {
  title: "Sipariş Takibi",
  description:
    "Sipariş numaranız ve e-posta adresinizle siparişinizin durumunu takip edin. Üyelik gerekmez.",
  robots: { index: true, follow: true },
};

export default function SiparisTakipPage() {
  return (
    <Suspense fallback={null}>
      <SiparisTakipClient />
    </Suspense>
  );
}
