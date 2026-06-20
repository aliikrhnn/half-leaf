"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Favori listesinde tutulan hafif ürün anlık görüntüsü. */
export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (item) =>
        set((s) =>
          s.items.some((i) => i.id === item.id)
            ? { items: s.items.filter((i) => i.id !== item.id) }
            : { items: [...s.items, item] },
        ),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "half-leaf-wishlist", partialize: (s) => ({ items: s.items }) },
  ),
);
