import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsView from "@/admin/views/ProductsView";

export const metadata: Metadata = { title: "Products" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProductsView />
    </Suspense>
  );
}
