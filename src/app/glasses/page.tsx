import type { Metadata } from "next";
import ShopExperience from "@/components/ShopExperience";
import { getProductsByCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Glasses — SABSTATION",
};

export default function GlassesPage() {
  return (
    <ShopExperience
      title="Glasses"
      subtitle="Optical and polarized frames designed to see the city clearly."
      products={getProductsByCategory("glasses")}
      lockCategory="glasses"
    />
  );
}
