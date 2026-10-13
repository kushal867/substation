"use client";

import clsx from "clsx";
import { ExternalLink, Store, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "../../store/AdminStore";
import { Tooltip } from "../ui/Popover";
import { isActive, NAV } from "./nav";

interface Props { collapsed: boolean; mobileOpen: boolean; onCloseMobile: () => void }

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: Props) {
  const pathname = usePathname();
  const { state } = useAdmin();
  const { storeName, logo } = state.settings;

  const content = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className={clsx("flex h-16 shrink-0 items-center border-b border-white/10", compact ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5" onClick={onCloseMobile}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white"><Store className="h-4 w-4" /></span>
          )}
          {!compact && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-wide text-white">{storeName}</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400">Admin</span>
            </span>
          )}
        </Link>
        {!compact && (
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={onCloseMobile} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                compact ? "justify-center px-0" : "px-3",
                active ? "bg-a-side-hover text-white" : "text-slate-400 hover:bg-a-side-hover/70 hover:text-white",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-indigo-400" />}
              <item.icon className={clsx("h-[18px] w-[18px] shrink-0", active && "text-indigo-300")} />
              {!compact && <span className="truncate">{item.label}</span>}
            </Link>
          );
          return compact ? (
            <Tooltip key={item.href} text={item.label} side="right">
              <span className="block w-full">{link}</span>
            </Tooltip>
          ) : (
            link
          );
        })}
      </nav>
      <div className={clsx("shrink-0 border-t border-white/10 p-2")}>
        <Link href="/" target="_blank" className={clsx("flex items-center gap-3 rounded-lg py-2 text-sm text-slate-400 hover:bg-a-side-hover/70 hover:text-white", compact ? "justify-center" : "px-3")}>
          <ExternalLink className="h-[18px] w-[18px] shrink-0" />
          {!compact && <span>View storefront</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className={clsx("fixed inset-y-0 left-0 z-40 hidden bg-a-side transition-[width] duration-200 lg:block", collapsed ? "w-[72px]" : "w-64")}>{content(collapsed)}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="a-fade-in absolute inset-0 bg-slate-900/60" onClick={onCloseMobile} aria-hidden />
          <aside className="a-slide-in-left absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-a-side shadow-2xl">{content(false)}</aside>
        </div>
      )}
    </>
  );
}
