"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import ProductImage from "./ProductImage";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { CATEGORY_MOTION } from "@/lib/categoryMotion";

const TAG_LABEL: Record<string, string> = {
  new: "New",
  bestseller: "Bestseller",
  sale: "Sale",
  limited: "Limited",
};

const TAG_CLASS: Record<string, string> = {
  new: "bg-lime text-ink",
  bestseller: "bg-ink text-cream",
  sale: "bg-orange text-white",
  limited: "bg-charcoal text-cream",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);
  const primaryColor = product.colors[0];
  const soldOut = product.stock === "out-of-stock";
  const wishlisted = isWishlisted(product.id);
  const accent = CATEGORY_MOTION[product.category].accent;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    addItem({
      product,
      color: primaryColor,
      size: product.sizes?.[0],
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  }

  function handleSpotlight(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col focus:outline-none"
    >
      <div
        onMouseMove={handleSpotlight}
        className="spotlight-card relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cream-dark"
      >
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.06]">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            category={product.category}
            colorHex={primaryColor.hex}
            seed={product.id}
            variant={0}
            sizes="(min-width: 1024px) 25vw, 50vw"
          />
        </div>
        {product.images[1] && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
            <ProductImage
              src={product.images[1]}
              alt=""
              category={product.category}
              colorHex={product.colors[1]?.hex ?? primaryColor.hex}
              seed={product.id}
              variant={1}
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
          </div>
        )}

        <div className="absolute left-3 top-3 z-30 flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${TAG_CLASS[tag] ?? "bg-ink text-cream"}`}
            >
              {TAG_LABEL[tag] ?? tag}
            </span>
          ))}
          {soldOut && (
            <span className="bg-paper px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
              Sold Out
            </span>
          )}
        </div>

        <motion.button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          whileTap={{ scale: 0.8 }}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-paper"
        >
          <motion.svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            animate={wishlisted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className={wishlisted ? "text-orange" : "text-ink"}
          >
            <path
              d="M12 20s-7-4.35-9.5-8.5C.7 8.1 2.2 4.5 5.7 4A5 5 0 0 1 12 7a5 5 0 0 1 6.3-3c3.5.5 5 4.1 3.2 7.5C19 15.65 12 20 12 20Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.button>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 z-20 h-px overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        >
          <motion.div
            className="h-full w-1/2"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 translate-y-full transition-transform duration-400 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="flex w-full items-center justify-center gap-2 bg-ink py-3 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink disabled:cursor-not-allowed disabled:bg-ink/40"
          >
            {soldOut ? "Sold Out" : justAdded ? "Added ✓" : "Quick Add"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink">{product.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-ink/50">
            {product.colors.length} colour{product.colors.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end transition-transform duration-300 group-hover:-translate-y-0.5">
          <span className="text-sm font-semibold text-ink">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-ink/40 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
