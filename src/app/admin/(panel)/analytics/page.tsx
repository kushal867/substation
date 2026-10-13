import type { Metadata } from "next";
import { Suspense } from "react";
import AnalyticsView from "@/admin/views/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsView />
    </Suspense>
  );
}
