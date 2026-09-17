"use client";

import { useState } from "react";
import type { ColorOption, Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import ProductGallery from "./ProductGallery";
import ProductDetails from "./ProductDetails";
import ProductGrid from "./ProductGrid";
import Reveal from "./Reveal";

export default function ProductView({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<ColorOption>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  function handleAddToCart(quantity: number) {
    addItem({ product, color: selectedColor, size: selectedSize, quantity });
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-28 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={product.images}
          name={product.name}
          category={product.category}
          colorHex={selectedColor.hex}
          seed={product.id}
        />
        <ProductDetails
          product={product}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          onAddToCart={handleAddToCart}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
              You Might Also Like
            </h2>
          </Reveal>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
