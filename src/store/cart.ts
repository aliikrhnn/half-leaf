"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

/** Sunucudan dönen güncel stok bilgisi (bir sepet satırı için). */
export interface StockLine {
  productId: string;
  variantId?: string | null;
  available: number;
  active: boolean;
}

/** reconcileStock sonucu — kullanıcıya gösterilecek değişiklik özeti. */
export interface StockReconcileResult {
  removed: string[];
  adjusted: { name: string; from: number; to: number }[];
}

function lineName(item: CartItem): string {
  return item.variantLabel ? `${item.product.name} (${item.variantLabel})` : item.product.name;
}

function stockKey(productId: string, variantId?: string | null): string {
  return `${productId}__${variantId ?? ""}`;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  note: string;
  /**
   * Bu sepetin sahibi olan kullanıcı id'si; misafir sepetinde `null`.
   *
   * localStorage cihaza aittir, hesaba değil: bu alan olmadan aynı tarayıcıda
   * çıkış yapan kullanıcının sepeti, sonradan giriş yapan başka bir kullanıcıya
   * görünüyordu. `CartOwnerGuard` her açılışta bu değeri oturumla karşılaştırır.
   */
  ownerId: string | null;
  addItem: (product: Product, quantity?: number, variant?: { id: string; label: string; stock: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
  /** Sepeti sunucudan gelen içerikle tamamen değiştirir ve sahibini işaretler. */
  adoptServerCart: (items: CartItem[], ownerId: string | null) => void;
  /** Sepeti boşaltıp sahipsiz hâle getirir (çıkış / sahip değişimi). */
  resetForOwner: (ownerId: string | null) => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  /** Güncel sunucu stoğuna göre sepeti düzeltir: stoğu biten satırları çıkarır,
   *  adetleri kalan stoğa indirir. Değişiklik özetini döner. */
  reconcileStock: (stocks: StockLine[]) => StockReconcileResult;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      note: "",
      ownerId: null,

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

      adoptServerCart: (items, ownerId) => set({ items, ownerId }),

      resetForOwner: (ownerId) => set({ items: [], note: "", ownerId }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),

      reconcileStock: (stocks) => {
        const map = new Map(stocks.map((s) => [stockKey(s.productId, s.variantId), s]));
        const removed: string[] = [];
        const adjusted: { name: string; from: number; to: number }[] = [];
        const nextItems: CartItem[] = [];
        let changed = false;

        for (const item of get().items) {
          const info = map.get(stockKey(item.productId, item.variantId));
          // Bilgi yok (silinmiş) / pasif / stok yok → satırı çıkar.
          if (!info || !info.active || info.available <= 0) {
            removed.push(lineName(item));
            changed = true;
            continue;
          }
          // Kalan stok adetten azsa → adedi kalan stoğa indir.
          if (info.available < item.quantity) {
            adjusted.push({ name: lineName(item), from: item.quantity, to: info.available });
            nextItems.push({
              ...item,
              quantity: info.available,
              maxStock: info.available,
              product: { ...item.product, stock: info.available },
            });
            changed = true;
            continue;
          }
          // Geçerli — güncel stok değerini taze tut (stok arttıysa da maxStock
          // güncellensin ki adet seçici tekrar yükselebilsin). Bu sessiz bir
          // tazeleme; kullanıcıya bildirim üretmez (removed/adjusted'a girmez).
          if (item.maxStock !== info.available || item.product.stock !== info.available) {
            changed = true;
          }
          nextItems.push({
            ...item,
            maxStock: info.available,
            product: { ...item.product, stock: info.available },
          });
        }

        // Yalnızca gerçek bir değişiklik olduysa store'u güncelle (gereksiz
        // re-render / localStorage yazımını önle).
        if (changed) {
          set({ items: nextItems });
        }

        return { removed, adjusted };
      },
    }),
    {
      name: "half-leaf-cart",
      skipHydration: true,
      partialize: (state) => ({ items: state.items, note: state.note, ownerId: state.ownerId }),
      merge: (persisted, current) => ({
        ...current,
        items: (persisted as { items?: CartItem[] }).items ?? current.items,
        note: (persisted as { note?: string }).note ?? current.note,
        // Eski sürümden gelen kayıtta ownerId yoktur → misafir sepeti sayılır.
        ownerId: (persisted as { ownerId?: string | null }).ownerId ?? null,
        // isOpen is never restored — cart always starts closed
      }),
    }
  )
);
