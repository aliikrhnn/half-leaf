import { useCartStore, type StockLine, type StockReconcileResult } from "@/store/cart";

export type StockNotice = StockReconcileResult;

/**
 * Sepet satırlarını sunucudaki güncel stoğa göre doğrular ve düzeltir.
 *
 * - Stoğu biten / pasif / silinmiş ürünleri sepetten çıkarır.
 * - Adetleri kalan stoğa indirir.
 *
 * Bir değişiklik olduysa özetini, yoksa `null` döner. Ağ hatasında sessizce
 * `null` döner (sepeti bozma; sunucu zaten sipariş anında stoğu tekrar doğrular).
 */
export async function reconcileCartStock(signal?: AbortSignal): Promise<StockNotice | null> {
  const items = useCartStore.getState().items;
  if (items.length === 0) return null;

  const payload = items.map((i) => ({ productId: i.productId, variantId: i.variantId ?? null }));

  try {
    const res = await fetch("/api/sepet/dogrula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
      signal,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: { stocks?: StockLine[] } };
    const stocks = json.data?.stocks;
    if (!stocks) return null;

    const result = useCartStore.getState().reconcileStock(stocks);
    if (result.removed.length === 0 && result.adjusted.length === 0) return null;
    return result;
  } catch {
    return null;
  }
}

/** Değişiklik özetini kullanıcıya gösterilecek kısa bir mesaja çevirir. */
export function stockNoticeMessage(notice: StockNotice): string {
  const parts: string[] = [];
  if (notice.removed.length > 0) {
    parts.push(
      notice.removed.length === 1
        ? `${notice.removed[0]} stokta kalmadığı için sepetten çıkarıldı.`
        : `${notice.removed.length} ürün stokta kalmadığı için sepetten çıkarıldı.`,
    );
  }
  if (notice.adjusted.length > 0) {
    parts.push(
      notice.adjusted.length === 1
        ? `${notice.adjusted[0].name} adedi kalan stoğa (${notice.adjusted[0].to}) göre güncellendi.`
        : `${notice.adjusted.length} ürünün adedi kalan stoğa göre güncellendi.`,
    );
  }
  return parts.join(" ");
}
