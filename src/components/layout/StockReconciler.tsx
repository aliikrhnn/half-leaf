"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { reconcileCartStock, stockNoticeMessage } from "@/lib/cart/reconcile";
import { toast } from "@/store/toast";

/**
 * Sepeti, gezinme sırasında güncel stoğa göre arka planda düzeltir: stoğu biten
 * ürünleri otomatik çıkarır, adetleri kalan stoğa indirir ve kullanıcıyı bir
 * toast ile bilgilendirir. Böylece sepet rozeti (header) ve sepet içeriği,
 * kullanıcı sepete/ödemeye gitmeden önce de gerçek stoğu yansıtır.
 *
 * Sepet sayfası (/sepet) kendi kalıcı bildirim bandını gösterdiği için burada
 * atlanır (çift bildirimi önle). Ödeme sayfası AppShell tarafından zaten hariç
 * tutulur ve kendi düzeltmesini yapar.
 *
 * Düzeltme: ilk yüklemede ve sekme tekrar öne geldiğinde (stok bu sırada
 * değişmiş olabilir) çalışır.
 */
export default function StockReconciler() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.items.length);

  useEffect(() => {
    if (pathname === "/sepet") return;
    if (itemCount === 0) return;

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      const notice = await reconcileCartStock(controller.signal);
      if (cancelled || !notice) return;
      const message = stockNoticeMessage(notice);
      if (message) toast(message, { label: "Sepete git", href: "/sepet" });
    };

    void run();

    const onFocus = () => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      controller.abort();
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
    // pathname değişiminde yeniden çalıştır (yeni sayfada güncel stoğu doğrula).
  }, [pathname, itemCount]);

  return null;
}
