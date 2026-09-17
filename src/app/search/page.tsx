import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";

export const metadata: Metadata = {
  title: "Search — SABSTATION",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? searchProducts(q) : [];

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">Search</p>
      <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
        {q.trim() ? `Results for "${q}"` : "Search SABSTATION"}
      </h1>

      {q.trim() && (
        <p className="mt-3 text-ink/60">
          {results.length} {results.length === 1 ? "result" : "results"} found
        </p>
      )}

      <div className="mt-12">
        {q.trim() && results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-md border border-dashed border-ink/20 py-24 text-center">
            <p className="font-display text-2xl font-bold">No results found</p>
            <p className="max-w-sm text-sm text-ink/50">
              We couldn&apos;t find anything matching &ldquo;{q}&rdquo;. Try a
              different search term, or browse our full catalogue.
            </p>
            <Link
              href="/shop"
              className="mt-2 rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
            >
              Shop All Products
            </Link>
          </div>
        ) : (
          <ProductGrid products={results} />
        )}

        {!q.trim() && (
          <p className="text-ink/50">Use the search icon in the navigation to find products by name, category, or tag.</p>
        )}
      </div>
    </div>
  );
}
