import type { Metadata } from "next";
import CartPage from "./CartPage";

export const metadata: Metadata = { title: "Sepet", robots: { index: false, follow: false } };

export default function CartRoute() {
  return <CartPage />;
}
