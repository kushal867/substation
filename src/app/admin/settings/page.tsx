import type { Metadata } from "next";
import { Suspense } from "react";
import SettingsView from "@/admin/views/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsView />
    </Suspense>
  );
}
