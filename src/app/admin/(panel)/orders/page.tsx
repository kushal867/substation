import type { Metadata } from "next";
import { Suspense } from "react";
import OrdersView from "@/admin/views/OrdersView";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrdersView />
    </Suspense>
  );
}
