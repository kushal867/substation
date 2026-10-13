"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import CartItemRow from "@/components/CartItemRow";
import Reveal from "@/components/Reveal";

export default function CartPage() {
  const { items, subtotal } = useCart();
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 12;
  const total = subtotal + shipping;

  function applyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promo.trim()) return;
    setPromoMessage("That code isn't valid right now. Check back for future drops.");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
      <Reveal>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Your Bag
        </h1>
      </Reveal>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-ink/60">Your bag is empty. Let&apos;s fix that.</p>
          <Link
            href="/shop"
            className="rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          <div className="divide-y divide-ink/10 border-t border-ink/10">
            {items.map((item) => (
              <CartItemRow key={item.key} item={item} />
            ))}
          </div>

          <div className="h-fit rounded-md border border-ink/10 bg-paper p-6">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Order Summary
            </h2>
            <div className="mt-5 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <form onSubmit={applyPromo} className="mt-6 flex gap-2">
              <label htmlFor="promo" className="sr-only">
                Promo code
              </label>
              <input
                id="promo"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Promo code"
                className="flex-1 border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
              />
              <button
                type="submit"
                className="shrink-0 border border-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-ink hover:text-cream"
              >
                Apply
              </button>
            </form>
            {promoMessage && <p className="mt-2 text-xs text-ink/50">{promoMessage}</p>}

            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
