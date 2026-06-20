"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";

/**
 * Onay sayfası istemci yardımcısı:
 *  - `clear` true ise sepeti bir kez temizler (kart ödemesinde sepet bu noktaya
 *    kadar korunur; başarılı ödemeden sonra burada temizlenir).
 *  - `watch` true ise (PayTR ödemesi henüz "BEKLIYOR") bildirim gelene kadar
 *    sayfayı kısa aralıklarla tazeler; durum onaylanınca kendiliğinden durur.
 */
interface SuccessClientProps {
  clear: boolean;
  watch: boolean;
}

export default function SuccessClient({ clear, watch }: SuccessClientProps) {
  const router = useRouter();
  const cleared = useRef(false);
  const polls = useRef(0);

  useEffect(() => {
    if (clear && !cleared.current) {
      cleared.current = true;
      useCartStore.persist.rehydrate();
      useCartStore.getState().clearCart();
    }
  }, [clear]);

  useEffect(() => {
    if (!watch) return;
    const id = setInterval(() => {
      polls.current += 1;
      if (polls.current > 6) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [watch, router]);

  return null;
}
