"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import ProductImage from "./ProductImage";

interface ProductGalleryProps {
  images: string[];
  name: string;
  category: Category;
  colorHex: string;
  seed: string;
}

export default function ProductGallery({
  images,
  name,
  category,
  colorHex,
  seed,
}: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="flex shrink-0 gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-pressed={active === i}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition-colors sm:h-20 sm:w-20 ${
              active === i ? "border-ink" : "border-transparent hover:border-ink/30"
            }`}
          >
            <ProductImage
              src={src}
              alt=""
              category={category}
              colorHex={colorHex}
              seed={seed}
              variant={i % 2 === 0 ? 0 : 1}
              sizes="80px"
            />
          </button>
        ))}
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-cream-dark sm:flex-1">
        <ProductImage
          src={images[active]}
          alt={name}
          category={category}
          colorHex={colorHex}
          seed={seed}
          variant={active % 2 === 0 ? 0 : 1}
          sizes="(min-width: 1024px) 45vw, 90vw"
          priority
        />
      </div>
    </div>
  );
}
