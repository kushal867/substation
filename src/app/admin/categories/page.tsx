import type { Metadata } from "next";
import { Suspense } from "react";
import CategoriesView from "@/admin/views/CategoriesView";

export const metadata: Metadata = { title: "Categories" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoriesView />
    </Suspense>
  );
}
