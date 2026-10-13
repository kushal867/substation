import type { Metadata } from "next";
import { Suspense } from "react";
import InventoryView from "@/admin/views/InventoryView";

export const metadata: Metadata = { title: "Inventory" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InventoryView />
    </Suspense>
  );
}
