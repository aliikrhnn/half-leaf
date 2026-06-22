"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  note: string;
  addItem: (product: Product, quantity?: number, variant?: { id: string; label: string; stock: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      note: "",

      addItem: (product, quantity = 1, variant) => {
        const vId = variant?.id;
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id && item.variantId === vId
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id && item.variantId === vId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                product,
                quantity,
                variantId: vId,
                variantLabel: variant?.label,
                maxStock: variant?.stock ?? product.stock,
              },
            ],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      setNote: (note) => set({ note }),

      clearCart: () => set({ items: [], note: "" }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),
    }),
    {
      name: "half-leaf-cart",
      skipHydration: true,
      partialize: (state) => ({ items: state.items, note: state.note }),
      merge: (persisted, current) => ({
        ...current,
        items: (persisted as { items?: CartItem[] }).items ?? current.items,
        note: (persisted as { note?: string }).note ?? current.note,
        // isOpen is never restored — cart always starts closed
      }),
    }
  )
);
