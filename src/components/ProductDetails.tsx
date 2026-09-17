"use client";

import { useState } from "react";
import type { ColorOption, Product } from "@/lib/types";
import { CATEGORY_LABEL, formatPrice } from "@/lib/format";
import Accordion from "./Accordion";

interface ProductDetailsProps {
  product: Product;
  selectedColor: ColorOption;
  onSelectColor: (color: ColorOption) => void;
  selectedSize?: string;
  onSelectSize: (size: string) => void;
  onAddToCart: (quantity: number) => void;
}

export default function ProductDetails({
  product,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  onAddToCart,
}: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = product.stock === "out-of-stock";
  const needsSize = Boolean(product.sizes?.length);
  const canAdd = !soldOut && (!needsSize || Boolean(selectedSize));

  function handleAdd() {
    if (!canAdd) return;
    onAddToCart(quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
        {CATEGORY_LABEL[product.category]}
      </p>
      <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
        {product.name}
      </h1>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-xl font-semibold">{formatPrice(product.price)}</span>
        {product.oldPrice && (
          <span className="text-base text-ink/40 line-through">
            {formatPrice(product.oldPrice)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-ink/60">
        <span aria-hidden="true" className="text-orange">★</span>
        <span>
          {product.rating.toFixed(1)} ({product.reviewCount} reviews)
        </span>
      </div>

      <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/70">
        {product.description}
      </p>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/70">
          Colour — {selectedColor.name}
        </p>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelectColor(color)}
              aria-pressed={selectedColor.name === color.name}
              title={color.name}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                selectedColor.name === color.name ? "border-ink" : "border-transparent"
              }`}
            >
              <span
                className="h-8 w-8 rounded-full border border-ink/15"
                style={{ backgroundColor: color.hex }}
              />
            </button>
          ))}
        </div>
      </div>

      {needsSize && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/70">
            Size {selectedSize ? `— ${selectedSize}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes!.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                aria-pressed={selectedSize === size}
                className={`h-11 min-w-11 rounded-sm border px-3 text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 hover:border-ink"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center gap-4">
        <div className="flex items-center border border-ink/20">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3.5 py-3 text-sm hover:bg-ink/5"
          >
            −
          </button>
          <span className="min-w-8 px-1 text-center text-sm">{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3.5 py-3 text-sm hover:bg-ink/5"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex-1 rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          {soldOut
            ? "Sold Out"
            : justAdded
              ? "Added to Bag ✓"
              : needsSize && !selectedSize
                ? "Select a Size"
                : "Add to Bag"}
        </button>
      </div>

      {product.stock === "low-stock" && !soldOut && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-orange">
          Only a few left in stock
        </p>
      )}

      <div className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
        <Accordion title="Product Details">
          <ul className="flex flex-col gap-1.5 text-sm text-ink/70">
            {product.details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="text-orange">—</span>
                {detail}
              </li>
            ))}
          </ul>
        </Accordion>
        <Accordion title="Shipping & Returns">
          <div className="flex flex-col gap-2 text-sm text-ink/70">
            <p>Free standard shipping on orders over $150. Orders ship within 1–2 business days.</p>
            <p>30-day returns on unworn items in original packaging.</p>
          </div>
        </Accordion>
      </div>
    </div>
  );
}
