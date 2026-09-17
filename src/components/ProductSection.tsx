"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductGrid from "./ProductGrid";
import Reveal from "./Reveal";

interface ProductSectionProps {
  eyebrow: string;
  title: string;
  viewAllHref: string;
  products: Product[];
  tint?: "cream" | "paper";
}

const FILTERS: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shoes", label: "Shoes" },
  { value: "bags", label: "Bags" },
  { value: "glasses", label: "Glasses" },
];

export default function ProductSection({
  eyebrow,
  title,
  viewAllHref,
  products,
  tint = "cream",
}: ProductSectionProps) {
  const [filter, setFilter] = useState<Category | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.category === filter)),
    [products, filter]
  );

  return (
    <section className={`${tint === "paper" ? "bg-paper" : ""} py-20 sm:py-24`}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
                {eyebrow}
              </p>
              <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
                {title}
              </h2>
            </div>
            <Link
              href={viewAllHref}
              className="group relative text-sm font-semibold uppercase tracking-widest"
            >
              View All
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-100 bg-ink transition-transform duration-300 group-hover:bg-orange" />
            </Link>
          </div>

          <div className="mb-10 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  filter === f.value
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 text-ink/60 hover:border-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>
        <ProductGrid products={filtered} />
      </div>
    </section>
  );
}
