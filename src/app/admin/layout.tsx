import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin · SABSTATION", template: "%s · SABSTATION Admin" },
  description: "SABSTATION store administration.",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
