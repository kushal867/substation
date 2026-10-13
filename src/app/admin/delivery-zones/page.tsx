import type { Metadata } from "next";
import { Suspense } from "react";
import ZonesView from "@/admin/views/ZonesView";

export const metadata: Metadata = { title: "Delivery Zones" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ZonesView />
    </Suspense>
  );
}
