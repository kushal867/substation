"use client";

import clsx from "clsx";
import { AlertTriangle, Bell, ChevronRight, CreditCard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, ShoppingCart, Store, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtDate, timeAgo } from "../../lib/format";
import { orderTotal } from "../../lib/range";
import { productStatus } from "../../lib/selectors";
import { useAdmin } from "../../store/AdminStore";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Feedback";
import { Menu as DropMenu, Popover, Tooltip } from "../ui/Popover";
import { NAV } from "./nav";

interface Props { collapsed: boolean; onToggle: () => void; onOpenMobile: () => void }

function useNotifications() {
  const { state } = useAdmin();
  return useMemo(() => {
    const items: { id: string; icon: "order" | "pay" | "stock"; title: string; body: string; at: string; href: string }[] = [];
    const s = state.settings;
    if (s.notifyNewOrder)
      state.orders.filter((o) => o.orderStatus === "Pending").slice(0, 4).forEach((o) =>
        items.push({ id: `ord-${o.id}`, icon: "order", title: `New order ${o.number}`, body: `NPR ${orderTotal(o).toLocaleString("en-IN")} awaiting confirmation`, at: o.date, href: "/admin/orders" }));
    if (s.notifyPayment)
      state.payments.filter((t) => t.status === "Pending").slice(0, 4).forEach((t) =>
        items.push({ id: `pay-${t.id}`, icon: "pay", title: `Payment to verify`, body: `${t.id} · NPR ${t.amount.toLocaleString("en-IN")} via ${t.method}`, at: t.date, href: "/admin/payments" }));
    if (s.notifyLowStock)
      state.products.filter((p) => p.active && productStatus(p, s.lowStockThreshold) !== "in").slice(0, 5).forEach((p) => {
        const out = productStatus(p, s.lowStockThreshold) === "out";
        items.push({ id: `stk-${p.id}-${out ? "o" : "l"}`, icon: "stock", title: out ? `${p.name} is out of stock` : `${p.name} is running low`, body: "Open inventory to restock", at: p.variants.map((v) => v.updatedAt).sort().at(-1) ?? p.createdAt, href: "/admin/inventory" });
      });
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [state]);
}

function GlobalSearch() {
  const { state } = useAdmin();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.key === "/" && !/input|textarea|select/i.test(t.tagName)) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return [];
    const r: { key: string; label: string; sub: string; href: string; type: string }[] = [];
    state.products.filter((p) => p.name.toLowerCase().includes(term) || p.variants.some((v) => v.sku.toLowerCase().includes(term))).slice(0, 4)
      .forEach((p) => r.push({ key: p.id, label: p.name, sub: "Product", href: `/admin/products?q=${encodeURIComponent(p.name)}`, type: "Products" }));
    state.orders.filter((o) => o.number.toLowerCase().includes(term)).slice(0, 4)
      .forEach((o) => r.push({ key: o.id, label: o.number, sub: `${fmtDate(o.date)} · ${o.orderStatus}`, href: `/admin/orders?q=${encodeURIComponent(o.number)}`, type: "Orders" }));
    state.customers.filter((c) => c.name.toLowerCase().includes(term) || c.phone.replace(/\s/g, "").includes(term.replace(/\s/g, ""))).slice(0, 4)
      .forEach((c) => r.push({ key: c.id, label: c.name, sub: c.phone, href: `/admin/customers?q=${encodeURIComponent(c.name)}`, type: "Customers" }));
    return r;
  }, [term, state]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-a-muted" />
      <input
        ref={input}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) go(results[0].href);
          if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
        }}
        placeholder="Search products, orders, customers…"
        aria-label="Global search"
        className="h-9 w-full rounded-lg border border-a-line bg-a-subtle pl-9 pr-9 text-sm text-a-fg placeholder:text-a-muted/80 focus:border-a-accent focus:bg-a-surface focus:outline-none focus:ring-2 focus:ring-a-accent/20"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-a-line px-1.5 text-[10px] text-a-muted sm:block">/</kbd>
      {open && term && (
        <div className="a-pop-in absolute left-0 right-0 top-11 z-50 max-h-96 overflow-y-auto rounded-xl border border-a-line bg-a-surface p-1.5 shadow-xl">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-a-muted">No results for “{q}”</p>
          ) : (
            ["Products", "Orders", "Customers"].map((g) => {
              const rows = results.filter((r) => r.type === g);
              if (!rows.length) return null;
              return (
                <div key={g} className="mb-1">
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-a-muted">{g}</p>
                  {rows.map((r) => (
                    <button key={r.key} onClick={() => go(r.href)} className="flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left hover:bg-a-subtle">
                      <span className="text-sm font-medium text-a-fg">{r.label}</span>
                      <span className="text-xs text-a-muted">{r.sub}</span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function Header({ collapsed, onToggle, onOpenMobile }: Props) {
  const pathname = usePathname();
  const { state, markNotificationsRead } = useAdmin();
  const toast = useToast();
  const router = useRouter();
  const notifs = useNotifications();
  const unread = notifs.filter((n) => !state.readNotifications.includes(n.id));
  const current = NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)));
  const initials = state.settings.adminName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const icons = { order: ShoppingCart, pay: CreditCard, stock: AlertTriangle };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-a-line bg-a-surface/90 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
      <Tooltip text={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
      </Tooltip>
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm md:flex">
        <Link href="/admin" className="text-a-muted hover:text-a-fg">Admin</Link>
        {current && current.href !== "/admin" && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-a-muted" />
            <span className="font-medium text-a-fg">{current.label}</span>
          </>
        )}
        {(!current || current.href === "/admin") && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-a-muted" />
            <span className="font-medium text-a-fg">Dashboard</span>
          </>
        )}
      </nav>
      <div className="flex flex-1 justify-center md:justify-end lg:justify-center"><GlobalSearch /></div>
      <div className="flex items-center gap-1">
        <Popover
          label="Notifications"
          className="w-[22rem] max-w-[calc(100vw-1rem)]"
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`} className="relative">
              <Bell className="h-[18px] w-[18px]" />
              {unread.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{unread.length > 9 ? "9+" : unread.length}</span>}
            </Button>
          }
        >
          {(close) => (
            <div>
              <div className="flex items-center justify-between border-b border-a-line px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                <button className="text-xs font-medium text-a-accent hover:underline disabled:opacity-40" disabled={!unread.length} onClick={() => { markNotificationsRead(notifs.map((n) => n.id)); toast.success("All notifications marked as read."); }}>
                  Mark all read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-a-muted">You&apos;re all caught up.</p>
                ) : (
                  notifs.map((n) => {
                    const Icon = icons[n.icon];
                    const isUnread = !state.readNotifications.includes(n.id);
                    return (
                      <button key={n.id} onClick={() => { markNotificationsRead([n.id]); close(); router.push(n.href); }} className="flex w-full gap-3 border-b border-a-line px-4 py-3 text-left last:border-0 hover:bg-a-subtle">
                        <span className={clsx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", n.icon === "stock" ? "bg-amber-500/15 text-amber-600" : n.icon === "pay" ? "bg-emerald-500/15 text-emerald-600" : "bg-indigo-500/15 text-indigo-500")}><Icon className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-medium text-a-fg">{n.title}{isUnread && <span className="h-1.5 w-1.5 rounded-full bg-a-accent" />}</span>
                          <span className="block truncate text-xs text-a-muted">{n.body}</span>
                          <span className="text-[11px] text-a-muted/80">{timeAgo(n.at)}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Popover>
        <DropMenu
          label="Account menu"
          trigger={
            <button className="ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-a-subtle" aria-label="Account menu">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{initials}</span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium text-a-fg">{state.settings.adminName}</span>
                <span className="block text-[11px] text-a-muted">{state.settings.adminRole}</span>
              </span>
            </button>
          }
          items={[
            { label: "Admin profile", icon: <User />, onClick: () => router.push("/admin/settings#profile") },
            { label: "Settings", icon: <Settings />, onClick: () => router.push("/admin/settings") },
            { label: "View storefront", icon: <Store />, onClick: () => window.open("/", "_blank") },
            { label: "Sign out (demo)", icon: <LogOut />, danger: true, divider: true, onClick: () => toast.info("This is a frontend demo — there is no authentication to sign out of.") },
          ]}
        />
      </div>
    </header>
  );
}
