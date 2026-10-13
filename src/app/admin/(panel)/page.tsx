import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardView from "@/admin/views/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardView />
    </Suspense>
  );
}
