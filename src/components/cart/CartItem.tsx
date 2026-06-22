"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/lib/types";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-3 py-4 border-b border-border-default last:border-0">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-bg-elevated flex-shrink-0">
        {item.product.images?.[0] && (
          <Image
            src={item.product.images[0].url}
            alt={item.product.images[0].alt}
            fill
            className="object-cover"
            sizes="64px"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink line-clamp-2 mb-0.5">
          {item.product.name}
        </p>
        {item.variantLabel && (
          <p className="text-xs font-semibold text-accent-light mb-0.5">Renk: {item.variantLabel}</p>
        )}
        <p className="text-sm font-semibold text-gold">
          {formatPrice(item.product.price)}
        </p>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                updateQuantity(item.productId, item.quantity - 1, item.variantId)
              }
              className="w-6 h-6 flex items-center justify-center rounded border border-border-default text-ink-muted hover:text-ink hover:border-border-light transition-colors"
              aria-label="Azalt"
            >
              <Minus size={12} />
            </button>
            <span className="w-7 text-center text-sm text-ink">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                updateQuantity(item.productId, item.quantity + 1, item.variantId)
              }
              className="w-6 h-6 flex items-center justify-center rounded border border-border-default text-ink-muted hover:text-ink hover:border-border-light transition-colors"
              aria-label="Artır"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.productId, item.variantId)}
            className="p-1 text-ink-dim hover:text-red-400 transition-colors"
            aria-label="Ürünü sil"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
