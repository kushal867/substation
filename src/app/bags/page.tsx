import type { Metadata } from "next";
import ShopExperience from "@/components/ShopExperience";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Bags — SABSTATION",
};

export default function BagsPage() {
  return (
    <ShopExperience
      title="Bags"
      subtitle="Totes, slings, and duffels built for whatever the day throws at you."
      products={getProductsByCategory("bags")}
      lockCategory="bags"
    />
  );
}
