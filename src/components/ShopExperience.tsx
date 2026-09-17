"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductFilters, { type FilterState } from "./ProductFilters";
import ProductGrid from "./ProductGrid";
import Reveal from "./Reveal";

interface ShopExperienceProps {
  title: string;
  subtitle: string;
  products: Product[];
  lockCategory?: Category;
}

export default function ShopExperience({
  title,
  subtitle,
  products,
  lockCategory,
}: ShopExperienceProps) {
  const priceCeiling = useMemo(
    () => Math.max(10, Math.ceil(Math.max(...products.map((p) => p.price)) / 10) * 10),
    [products]
  );

  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    maxPrice: priceCeiling,
    colors: [],
    sizes: [],
    sort: "newest",
  });

  const effectiveCategory = lockCategory ?? filters.category;
  const showSizes = effectiveCategory === "shoes";

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (lockCategory || filters.category === "all" || p.category === filters.category) {
        for (const c of p.colors) map.set(c.name, c.hex);
      }
    }
    return Array.from(map, ([name, hex]) => ({ name, hex }));
  }, [products, filters.category, lockCategory]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category === "shoes") p.sizes?.forEach((s) => set.add(s));
    }
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (!lockCategory && filters.category !== "all" && p.category !== filters.category) {
        return false;
      }
      if (p.price > filters.maxPrice) return false;
      if (filters.colors.length > 0 && !p.colors.some((c) => filters.colors.includes(c.name))) {
        return false;
      }
      if (
        showSizes &&
        filters.sizes.length > 0 &&
        !p.sizes?.some((s) => filters.sizes.includes(s))
      ) {
        return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (filters.sort === "price-asc") return a.price - b.price;
      if (filters.sort === "price-desc") return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, filters, lockCategory, showSizes]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 sm:px-6 lg:px-10">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
          {products.length} Products
        </p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-ink/60">{subtitle}</p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <aside>
          <ProductFilters
            showCategory={!lockCategory}
            priceCeiling={priceCeiling}
            availableColors={availableColors}
            availableSizes={availableSizes}
            showSizes={showSizes}
            state={filters}
            onChange={setFilters}
            resultCount={filtered.length}
          />
        </aside>
        <div>
          {filtered.length > 0 ? (
            <ProductGrid products={filtered} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-ink/20 py-24 text-center">
              <p className="font-display text-xl font-bold">No products match those filters</p>
              <p className="text-sm text-ink/50">Try widening your price range or clearing a filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
