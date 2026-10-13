"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Misc";
import { FeedbackProvider, useToast } from "../ui/Feedback";
import { PrintProvider } from "../shared/Print";
import { AdminProvider, useAdmin } from "../../store/AdminStore";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

const COLLAPSE_KEY = "substation-admin-sidebar";

function Frame({ children }: { children: React.ReactNode }) {
  const { ready, state, loadError, lastError, clearError, refresh } = useAdmin();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const theme = state.settings.theme;

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* ignore */ }
  }, []);

  // Theme: applied on <html> so portals (modals/menus) pick it up too.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("admin-dark", theme === "dark" || (theme === "system" && mq.matches));
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.classList.remove("admin-dark");
    };
  }, [theme]);

  useEffect(() => {
    if (lastError) {
      toast.error(lastError);
      clearError();
    }
  }, [lastError, clearError, toast]);

  const toggle = () =>
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* ignore */ }
      return !c;
    });

  return (
    <div className="admin-root min-h-screen">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-a-accent focus:px-3 focus:py-2 focus:text-a-accent-fg">Skip to content</a>
      <Sidebar collapsed={collapsed} mobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
      <div className={clsx("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <Header collapsed={collapsed} onToggle={toggle} onOpenMobile={() => setMobile(true)} />
        <main id="admin-main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
          {loadError && !ready ? (
            <div role="alert" className="mx-auto mt-16 max-w-md rounded-2xl border border-a-line bg-a-surface p-6 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
              <h1 className="mt-3 text-base font-semibold text-a-fg">Can&apos;t load your store data</h1>
              <p className="mt-1 text-sm text-a-muted">{loadError}</p>
              <Button className="mt-4" variant="primary" onClick={() => void refresh()}><RefreshCw className="h-4 w-4" />Try again</Button>
            </div>
          ) : ready ? (
            children
          ) : (
            <div className="space-y-4" aria-busy="true" aria-label="Loading">
              <Skeleton className="h-8 w-56" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
              </div>
              <Skeleton className="h-72" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <FeedbackProvider>
        <PrintProvider>
          <Frame>{children}</Frame>
        </PrintProvider>
      </FeedbackProvider>
    </AdminProvider>
  );
}
