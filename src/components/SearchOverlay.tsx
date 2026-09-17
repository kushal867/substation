"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { searchProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import ProductImage from "./ProductImage";

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const results = searchProducts(query).slice(0, 6);

  function close() {
    setQuery("");
    onClose();
  }

  function goToResults(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    close();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-cream"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pt-24 sm:pt-32">
            <form onSubmit={goToResults} className="flex items-center gap-4 border-b-2 border-ink pb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shoes, bags, glasses..."
                className="flex-1 bg-transparent font-display text-2xl font-semibold tracking-tight outline-none placeholder:text-ink/30 sm:text-3xl"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="rounded-full p-2 hover:bg-ink/10"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </form>

            <div className="mt-8 flex-1 overflow-y-auto pb-16">
              {query.trim() && results.length === 0 && (
                <p className="text-ink/60">
                  No results for &ldquo;{query}&rdquo;. Try “shoes”, “bag”, or “glasses”.
                </p>
              )}
              {results.length > 0 && (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={close}
                      className="group"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-sm bg-cream-dark">
                        <ProductImage
                          src={p.images[0]}
                          alt={p.name}
                          category={p.category}
                          colorHex={p.colors[0].hex}
                          seed={p.id}
                          sizes="33vw"
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-ink/60">{formatPrice(p.price)}</p>
                    </Link>
                  ))}
                </div>
              )}
              {query.trim() && results.length > 0 && (
                <button
                  onClick={goToResults}
                  className="mt-8 text-sm font-semibold uppercase tracking-widest underline underline-offset-4"
                >
                  View all results for &ldquo;{query}&rdquo;
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
