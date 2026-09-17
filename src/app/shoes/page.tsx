import type { Metadata } from "next";
import ShopExperience from "@/components/ShopExperience";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shoes — SABSTATION",
};

export default function ShoesPage() {
  return (
    <ShopExperience
      title="Shoes"
      subtitle="Trainers, boots, and slip-ons engineered to move as fast as you do."
      products={getProductsByCategory("shoes")}
      lockCategory="shoes"
    />
  );
}
