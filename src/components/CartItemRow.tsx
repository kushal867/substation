"use client";

import Link from "next/link";
import type { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";
import ProductImage from "./ProductImage";

export default function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-5">
      <Link
        href={`/product/${item.slug}`}
        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-cream-dark"
      >
        <ProductImage
          src={item.image}
          alt={item.name}
          category={item.category}
          colorHex={item.colorHex}
          seed={item.productId}
          sizes="80px"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/product/${item.slug}`} className="text-sm font-semibold hover:underline">
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-ink/60">
              {item.color}
              {item.size ? ` · Size ${item.size}` : ""}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-ink/20">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => updateQuantity(item.key, item.quantity - 1)}
              className="px-2.5 py-1 text-sm hover:bg-ink/5"
            >
              −
            </button>
            <span className="min-w-6 px-1 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => updateQuantity(item.key, item.quantity + 1)}
              className="px-2.5 py-1 text-sm hover:bg-ink/5"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.key)}
            className="text-xs font-medium uppercase tracking-wide text-ink/50 underline-offset-2 hover:text-ink hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
