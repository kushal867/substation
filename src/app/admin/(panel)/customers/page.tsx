import type { Metadata } from "next";
import { Suspense } from "react";
import CustomersView from "@/admin/views/CustomersView";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CustomersView />
    </Suspense>
  );
}
