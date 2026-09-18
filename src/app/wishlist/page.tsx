"use client";

import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { getAllProducts } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const products = getAllProducts().filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
          Saved
        </p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Your Wishlist
        </h1>
        <p className="mt-3 max-w-xl text-ink/60">
          Pieces you&apos;ve saved for later. Kept on this device.
        </p>
      </Reveal>

      <div className="mt-12">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-ink/20 py-24 text-center">
            <p className="font-display text-xl font-bold">Nothing saved yet</p>
            <p className="max-w-sm text-sm text-ink/50">
              Tap the heart on any product to save it here.
            </p>
            <Link
              href="/shop"
              className="mt-2 rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink"
            >
              Shop All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
