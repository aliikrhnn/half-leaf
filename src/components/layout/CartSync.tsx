"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart";

/**
 * Giriş yapmış kullanıcının istemci sepetini (zustand + localStorage) sunucuya
 * yansıtır; böylece terk-edilen-sepet cron'u sepeti tespit edip hatırlatma
 * e-postası gönderebilir. Misafirlerde uç sessizce no-op döner.
 *
 * - Yalnızca hidrasyon bittikten sonra senkronize eder (boş sepetin sunucudaki
 *   gerçek sepeti yanlışlıkla silmesini önler).
 * - 2.5 sn debounce + imza karşılaştırması ile gereksiz istek göndermez.
 */
export default function CartSync() {
  const items = useCartStore((s) => s.items);
  const [authed, setAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSig = useRef<string | null>(null);

  // Auth durumu — bir kez.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => { if (active && r.ok) setAuthed(true); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Hidrasyon bitince senkronizasyona izin ver.
  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    if (useCartStore.persist.hasHydrated()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
      setHydrated(true);
    } else {
      useCartStore.persist.rehydrate();
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!authed || !hydrated) return;
    const payload = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? null,
      quantity: i.quantity,
    }));
    const sig = JSON.stringify(payload);
    if (sig === lastSig.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // lastSig'i yalnızca BAŞARILI gönderimde işaretle; hata olursa bir sonraki
      // değişiklikte (aynı içerikte bile) tekrar denenebilsin.
      fetch("/api/sepet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: payload }),
        keepalive: true,
      })
        .then((r) => { if (r.ok) lastSig.current = sig; })
        .catch(() => {});
    }, 2500);

    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [items, authed, hydrated]);

  return null;
}
