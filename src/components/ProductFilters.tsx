"use client";

import { useState } from "react";
import type { Category, ColorOption } from "@/lib/types";

export type SortOption = "newest" | "price-asc" | "price-desc";

export interface FilterState {
  category: Category | "all";
  maxPrice: number;
  colors: string[];
  sizes: string[];
  sort: SortOption;
}

interface ProductFiltersProps {
  showCategory: boolean;
  priceCeiling: number;
  availableColors: ColorOption[];
  availableSizes: string[];
  showSizes: boolean;
  state: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
}

const CATEGORY_OPTIONS: { value: FilterState["category"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shoes", label: "Shoes" },
  { value: "bags", label: "Bags" },
  { value: "glasses", label: "Glasses" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function ProductFilters({
  showCategory,
  priceCeiling,
  availableColors,
  availableSizes,
  showSizes,
  state,
  onChange,
  resultCount,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleColor(name: string) {
    onChange({
      ...state,
      colors: state.colors.includes(name)
        ? state.colors.filter((c) => c !== name)
        : [...state.colors, name],
    });
  }

  function toggleSize(size: string) {
    onChange({
      ...state,
      sizes: state.sizes.includes(size)
        ? state.sizes.filter((s) => s !== size)
        : [...state.sizes, size],
    });
  }

  function resetFilters() {
    onChange({
      category: state.category,
      maxPrice: priceCeiling,
      colors: [],
      sizes: [],
      sort: state.sort,
    });
  }

  const activeCount =
    state.colors.length + state.sizes.length + (state.maxPrice < priceCeiling ? 1 : 0);

  const body = (
    <div className="flex flex-col gap-8">
      {showCategory && (
        <FilterGroup title="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...state, category: opt.value })}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  state.category === opt.value
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 text-ink/70 hover:border-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title={`Max Price: $${state.maxPrice}`}>
        <input
          type="range"
          min={0}
          max={priceCeiling}
          step={5}
          value={state.maxPrice}
          onChange={(e) => onChange({ ...state, maxPrice: Number(e.target.value) })}
          className="w-full accent-ink"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-ink/40">
          <span>$0</span>
          <span>${priceCeiling}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2">
          {availableColors.map((color) => {
            const active = state.colors.includes(color.name);
            return (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleColor(color.name)}
                aria-pressed={active}
                title={color.name}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  active ? "border-ink" : "border-transparent"
                }`}
              >
                <span
                  className="h-7 w-7 rounded-full border border-ink/15"
                  style={{ backgroundColor: color.hex }}
                />
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {showSizes && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                aria-pressed={state.sizes.includes(size)}
                className={`h-9 min-w-9 rounded-sm border px-2 text-xs font-semibold transition-colors ${
                  state.sizes.includes(size)
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 hover:border-ink"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Sort By">
        <select
          value={state.sort}
          onChange={(e) => onChange({ ...state, sort: e.target.value as SortOption })}
          className="w-full border border-ink/20 bg-paper px-3 py-2 text-sm outline-none focus-visible:border-ink"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          className="self-start text-xs font-semibold uppercase tracking-widest underline underline-offset-4"
        >
          Clear Filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
        >
          Filters {activeCount > 0 && `(${activeCount})`}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${mobileOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-xs text-ink/50">{resultCount} results</p>
      </div>
      {mobileOpen && <div className="mb-8 lg:hidden">{body}</div>}

      <div className="hidden lg:block">
        <p className="mb-6 text-xs text-ink/50">{resultCount} results</p>
        {body}
      </div>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/70">
        {title}
      </h3>
      {children}
    </div>
  );
}
