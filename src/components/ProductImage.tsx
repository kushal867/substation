"use client";

import { useState } from "react";
import Image from "next/image";
import type { Category } from "@/lib/types";
import ProductVisual from "./ProductVisual";

interface ProductImageProps {
  src: string;
  alt: string;
  category: Category;
  colorHex: string;
  seed: string;
  variant?: 0 | 1;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Renders a real product photo from /public/images/... and falls back to the
 * generated placeholder art if that file hasn't been supplied yet (404) or
 * fails to load, so the catalog can be filled in with real photos gradually.
 * Shows a shimmering skeleton until the photo finishes loading.
 */
export default function ProductImage({
  src,
  alt,
  category,
  colorHex,
  seed,
  variant = 0,
  className = "",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(priority);

  if (failed) {
    return (
      <ProductVisual
        category={category}
        colorHex={colorHex}
        seed={seed}
        variant={variant}
        className={`h-full w-full ${className}`}
      />
    );
  }

  return (
    <>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-cream-dark via-paper to-cream-dark"
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
