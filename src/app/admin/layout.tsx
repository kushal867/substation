import type { Metadata } from "next";
import { AdminShell } from "@/admin/components/layout/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin · SABSTATION", template: "%s · SABSTATION Admin" },
  description: "SABSTATION store administration (frontend demo with mock data).",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
