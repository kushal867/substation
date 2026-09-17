import type { Metadata } from "next";
import ShopExperience from "@/components/ShopExperience";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop All — SABSTATION",
};

export default function ShopPage() {
  return (
    <ShopExperience
      title="Shop All"
      subtitle="Every silhouette, every colourway. Shoes, bags, and glasses in one place."
      products={getAllProducts()}
    />
  );
}
