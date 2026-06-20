import type { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = {
  title: "Favorilerim",
  description: "Favori ürünleriniz.",
  robots: { index: false, follow: false },
};

export default function FavorilerimPage() {
  return <FavoritesClient />;
}
