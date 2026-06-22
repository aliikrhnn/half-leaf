"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/constants";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import Button from "@/components/ui/Button";
import CartItem from "./CartItem";

export default function CartDrawer() {
  const { items, closeCart, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const panelRef = useFocusTrap<HTMLElement>(true, closeCart);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-bg-surface border-l border-border-default flex flex-col animate-slide-in-right"
        aria-label="Alışveriş sepeti"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="font-semibold text-ink">Sepetim</h2>
          <button
            onClick={closeCart}
            className="p-1.5 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-bg-elevated"
            aria-label="Sepeti kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <ShoppingBag size={48} className="text-ink-dim" />
              <div className="text-center">
                <p className="text-ink font-medium mb-1">Sepetiniz boş</p>
                <p className="text-sm text-ink-muted">
                  Ürünleri keşfetmek için alışverişe başlayın.
                </p>
              </div>
              <Link href="/urunler" onClick={closeCart}>
                <Button variant="primary">Ürünleri Gör</Button>
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem key={item.productId + (item.variantId ?? "")} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border-default space-y-3">
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <div className="text-xs text-ink-muted bg-bg-elevated rounded-lg px-3 py-2">
                <span className="text-gold font-medium">
                  {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}
                </span>{" "}
                daha ekleyin, kargo ücretsiz olsun!
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Ara Toplam</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Kargo</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-accent-light">Ücretsiz</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-ink pt-1 border-t border-border-default">
                <span>Toplam</span>
                <span className="text-gold">{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/sepet" onClick={closeCart}>
              <Button variant="gold" size="lg" fullWidth>
                Sepete Git
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
