"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { reconcileCartStock, type StockNotice } from "@/lib/cart/reconcile";

/**
 * Sepet hidrasyonu (localStorage → store) tamamlandıktan SONRA sepeti güncel
 * stoğa göre bir kez düzeltir. Store `skipHydration: true` kullandığından, doğrudan
 * `reconcileCartStock()` çağrısı boş sepet okuyup sessizce hiçbir şey yapmaz;
 * bu yüzden `onFinishHydration` ile beklemek gerekir.
 *
 * Değişiklik olursa `onNotice` çağrılır (örn. uyarı bandını göstermek için).
 */
export function useCartStockReconcile(onNotice: (notice: StockNotice) => void): void {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      reconcileCartStock().then((notice) => {
        if (!cancelled && notice) onNotice(notice);
      });
    };

    const unsub = useCartStore.persist.onFinishHydration(run);
    if (useCartStore.persist.hasHydrated()) {
      run();
    } else {
      useCartStore.persist.rehydrate();
    }

    // Sayfa uzun süre açık kalabilir (özellikle ödeme formu). Sekme tekrar öne
    // geldiğinde stok değişmiş olabilir → yeniden doğrula.
    const onFocus = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      unsub();
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
    // Yalnızca mount'ta çalışır; onNotice çağıran tarafça stabil bir setter'dır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
