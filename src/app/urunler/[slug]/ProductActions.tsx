"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart";
import Button from "@/components/ui/Button";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
}

export default function ProductActions({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
  };

  return (
    <>
      {/* Stock indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            product.stock > 5
              ? "bg-accent-light"
              : product.stock > 0
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        <span className="text-sm text-ink-muted">
          {product.stock > 5
            ? "Stokta mevcut"
            : product.stock > 0
            ? `Son ${product.stock} ürün`
            : "Stokta yok"}
        </span>
      </div>

      {/* Quantity + Add to cart */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-border-default rounded-lg p-1">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="p-1.5 text-ink-muted hover:text-ink transition-colors"
            aria-label="Azalt"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-sm font-medium text-ink">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(Math.max(product.stock, 1), quantity + 1))}
            className="p-1.5 text-ink-muted hover:text-ink transition-colors"
            aria-label="Artır"
          >
            <Plus size={16} />
          </button>
        </div>

        <Button
          variant="gold"
          size="lg"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1"
        >
          <ShoppingCart size={18} />
          Sepete Ekle
        </Button>
      </div>
    </>
  );
}
