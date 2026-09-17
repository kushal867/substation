"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import CartItemRow from "./CartItemRow";

export default function CartDrawer() {
  const { items, subtotal, isDrawerOpen, closeDrawer } = useCart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                Your Bag ({items.reduce((n, i) => n + i.quantity, 0)})
              </h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeDrawer}
                className="rounded-full p-2 hover:bg-ink/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-ink/60">Your bag is empty.</p>
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.key}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      >
                        <CartItemRow item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="border-t border-ink/10 px-6 py-5">
                  <div className="mb-4 flex items-center justify-between text-sm font-semibold">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-xs text-ink/50">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="flex w-full items-center justify-center rounded-full bg-ink py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="mt-3 flex w-full items-center justify-center py-2 text-xs font-semibold uppercase tracking-widest underline underline-offset-4"
                  >
                    View Bag
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
