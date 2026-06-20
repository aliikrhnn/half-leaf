import { create } from "zustand";

export interface ToastAction {
  label: string;
  href: string;
}

export interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, action?: ToastAction) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, action) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message, action }] }));
    // Otomatik kapanma
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3400);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Kısa yol: bileşen dışından toast tetikleme. */
export function toast(message: string, action?: ToastAction): void {
  useToastStore.getState().push(message, action);
}
