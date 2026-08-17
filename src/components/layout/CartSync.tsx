"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/auth-events";
import type { CartItem } from "@/lib/types";

/**
 * Sepet sahipliği denetimi + sunucu senkronizasyonu.
 *
 * Sepet tarayıcının localStorage'ında yaşıyor; localStorage ise CİHAZA aittir,
 * hesaba değil. Bu bileşen her açılışta sepetin sahibini oturumla karşılaştırır:
 *
 *  - Misafir oturumu + sepetin sahibi bir kullanıcı  → sepet TEMİZLENİR
 *    (çıkış yapan kullanıcının sepeti, aynı cihazı kullanan bir sonraki kişiye
 *    görünmemeli).
 *  - Giriş var + sepet misafir sepeti               → sepet hesaba BİRLEŞTİRİLİR
 *    (misafirken doldurulan sepet üyelikte kaybolmaz).
 *  - Giriş var + sepet BAŞKA kullanıcıya ait        → yerel sepet atılır,
 *    hesabın kendi sepeti sunucudan yüklenir.
 *  - Giriş var + sepet aynı kullanıcıya ait         → yerel sepet doğrudur;
 *    boşsa sunucudaki sepet yüklenir (başka cihazda dolan sepet gelir).
 *
 * Denetim bitmeden senkronizasyon BAŞLAMAZ: aksi hâlde yanlış sahibe ait yerel
 * sepet sunucudaki gerçek sepetin üzerine yazabilirdi.
 */

interface CartApiResponse {
  success?: boolean;
  data?: { ownerId: string | null; items: CartItem[] };
}

export default function CartSync() {
  const items = useCartStore((s) => s.items);
  const [ready, setReady] = useState(false);
  const [authedUserId, setAuthedUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  /** Giriş/çıkış sonrası denetimi yeniden çalıştırmak için sayaç. */
  const [authNonce, setAuthNonce] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSig = useRef<string | null>(null);

  // Bu bileşen yerleşimde kalıcıdır; giriş/çıkış onu yeniden monte etmez.
  useEffect(() => {
    const onAuthChanged = () => setAuthNonce((n) => n + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, []);

  // Hidrasyon bitince denetime izin ver.
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

  const toLines = useCallback(
    (list: CartItem[]) =>
      list.map((i) => ({
        productId: i.productId,
        variantId: i.variantId ?? null,
        quantity: i.quantity,
      })),
    [],
  );

  /* ── Sahiplik denetimi (bir kez, hidrasyondan sonra) ── */
  useEffect(() => {
    if (!hydrated) return;
    let active = true;

    (async () => {
      const store = useCartStore.getState();
      const localOwner = store.ownerId;
      const localItems = store.items;

      let userId: string | null = null;
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const json = (await res.json()) as { data?: { id?: string } };
          userId = json?.data?.id ?? null;
        } else if (res.status !== 401) {
          // 401 = gerçekten misafir. Diğer hatalar (500, 503…) geçicidir;
          // "misafir" sanıp sepeti silmek gerçek veri kaybı olurdu.
          return;
        }
      } catch {
        // Ağ hatası: sahiplik bilinmiyor. Sepete DOKUNMA — yanlışlıkla
        // silmektense senkronizasyonu atlamak daha güvenli.
        return;
      }

      if (!active) return;

      // ── Misafir oturumu ──
      if (!userId) {
        if (localOwner !== null) {
          // Oturum kapanmış/süresi dolmuş: bu cihazda sepet artık kimseye ait değil.
          useCartStore.getState().resetForOwner(null);
        }
        setAuthedUserId(null);
        setReady(true);
        return;
      }

      // ── Giriş yapılmış ──
      /* Sunucudan sepet devraldığımız durumlarda yerel ve sunucu içeriği
         aynıdır; gereksiz bir POST atılmaması için imza işaretlenir. Yerel
         sepetin doğru kabul edildiği durumda ise imza BOŞ bırakılır ki
         aşağıdaki senkronizasyon yereli sunucuya yazsın. */
      let adoptedFromServer = false;
      try {
        if (localOwner === null && localItems.length > 0) {
          // Misafir sepeti → hesaba birleştir.
          const res = await fetch("/api/sepet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ items: toLines(localItems) }),
          });
          const json = (await res.json()) as CartApiResponse;
          if (active && json?.data) {
            useCartStore.getState().adoptServerCart(json.data.items, userId);
            adoptedFromServer = true;
          }
        } else if (localOwner !== null && localOwner !== userId) {
          // Cihazda başka bir hesabın sepeti duruyordu → at, kendi sepetini yükle.
          const res = await fetch("/api/sepet", { credentials: "include" });
          const json = (await res.json()) as CartApiResponse;
          if (active) {
            useCartStore.getState().adoptServerCart(json?.data?.items ?? [], userId);
            adoptedFromServer = true;
          }
        } else if (localItems.length === 0) {
          // Aynı kullanıcı ama yerel sepet boş → başka cihazda kalan sepeti getir.
          const res = await fetch("/api/sepet", { credentials: "include" });
          const json = (await res.json()) as CartApiResponse;
          if (active) {
            useCartStore.getState().adoptServerCart(json?.data?.items ?? [], userId);
            adoptedFromServer = true;
          }
        } else {
          // Aynı kullanıcı, yerel sepet dolu → yerel doğru kabul edilir ve
          // aşağıdaki senkronizasyon onu sunucuya yazar.
          useCartStore.setState({ ownerId: userId });
        }
      } catch {
        // Sepet uçları erişilemedi: sahibi yine de işaretle ki bir sonraki
        // açılışta "başka kullanıcının sepeti" sanılmasın.
        useCartStore.setState({ ownerId: userId });
      }

      if (!active) return;
      // Sunucudan devralındıysa iki taraf zaten aynı → gereksiz POST atma.
      // Yerel sepet doğru kabul edildiyse imza sıfırlanır ki sunucuya yazılsın.
      lastSig.current = adoptedFromServer
        ? JSON.stringify(toLines(useCartStore.getState().items))
        : null;
      setAuthedUserId(userId);
      setReady(true);
    })();

    return () => { active = false; };
  }, [hydrated, toLines, authNonce]);

  /* ── Değişiklikleri sunucuya yansıt (debounce) ── */
  useEffect(() => {
    if (!ready || !authedUserId) return;
    const payload = toLines(items);
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
  }, [items, ready, authedUserId, toLines]);

  return null;
}
