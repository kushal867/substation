import type { Metadata } from "next";
import { Suspense } from "react";
import PaymentsView from "@/admin/views/PaymentsView";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentsView />
    </Suspense>
  );
}
