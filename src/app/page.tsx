import type { Metadata } from "next";
import Hero from "@/components/Hero";
import CategoryShowcase from "@/components/CategoryShowcase";
import ProductSection from "@/components/ProductSection";
import PromoBanner from "@/components/PromoBanner";
import MarqueeWordmark from "@/components/MarqueeWordmark";
import BrandStory from "@/components/BrandStory";
import WhySabstation from "@/components/WhySabstation";
import SocialProof from "@/components/SocialProof";
import Newsletter from "@/components/Newsletter";
import { getAllProducts, getFeaturedProducts, getNewArrivals } from "@/lib/products";

export const metadata: Metadata = {
  title: "SABSTATION — Move Different. Carry Confidence. See Clear.",
};

export default function HomePage() {
  const newArrivals = getNewArrivals(8);
  const bestSellers = getFeaturedProducts(8);
  const allProducts = getAllProducts();

  return (
    <>
      <Hero />
      <CategoryShowcase />
      <ProductSection
        eyebrow="Just Landed"
        title="New Arrivals"
        viewAllHref="/shop"
        products={newArrivals}
      />
      <PromoBanner />
      <ProductSection
        eyebrow="Fan Favorites"
        title="Best Sellers"
        viewAllHref="/shop"
        products={bestSellers}
        tint="paper"
      />
      <MarqueeWordmark />
      <BrandStory />
      <WhySabstation />
      <SocialProof products={allProducts} />
      <Newsletter />
    </>
  );
}
