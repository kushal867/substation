"use client";

import { Bot, BotOff, Mail, MapPin, Phone, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, ORDER_TONE, PAY_TONE, type Tone } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { DataTable, Pagination, type Column } from "../components/ui/DataTable";
import { FilterSelect, SearchInput, Toggle } from "../components/ui/Fields";
import { useToast } from "../components/ui/Feedback";
import { Drawer } from "../components/ui/Modal";
import { EmptyState, PageHeader } from "../components/ui/Misc";
import { usePageLoading } from "../hooks/usePageLoading";
import { usePaged } from "../hooks/usePaged";
import { useTableSort } from "../hooks/useTableSort";
import { fmtDate, fmtDateTime, npr } from "../lib/format";
import { orderTotal } from "../lib/range";
import { customerStats, sortBy, type CustomerStats } from "../lib/selectors";
import { useAdmin } from "../store/AdminStore";
import type { Customer } from "../types";

const STATUS_TONE: Record<Customer["status"], Tone> = { Active: "green", VIP: "violet", Inactive: "gray" };
const PLATFORM_TONE: Record<Customer["platform"], Tone> = { Facebook: "blue", Instagram: "violet", WhatsApp: "green", TikTok: "gray", Website: "indigo" };
type Row = Customer & { stats: CustomerStats };

export default function CustomersView() {
  const { state, setBotPaused } = useAdmin();
  const params = useSearchParams();
  const toast = useToast();
  const loading = usePageLoading();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [activity, setActivity] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const { sort, toggle } = useTableSort({ key: "spent", dir: "desc" });

  const all = useMemo<Row[]>(() => state.customers.map((c) => ({ ...c, stats: customerStats(c, state.orders) })), [state.customers, state.orders]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const cutoff = Date.now() - 30 * 86_400_000;
    const f = all.filter((c) =>
      (!term || c.name.toLowerCase().includes(term) || c.phone.replace(/\s/g, "").includes(term.replace(/\s/g, "")) || c.email.includes(term)) &&
      (platform === "all" || c.platform === platform) && (status === "all" || c.status === status) &&
      (activity === "all" || (activity === "none" ? c.stats.orders === 0 : activity === "repeat" ? c.stats.orders >= 3 : !!c.stats.lastOrder && new Date(c.stats.lastOrder).getTime() >= cutoff)));
    const get: Record<string, (r: Row) => string | number> = { name: (r) => r.name, platform: (r) => r.platform, orders: (r) => r.stats.orders, spent: (r) => r.stats.spent, last: (r) => (r.stats.lastOrder ? new Date(r.stats.lastOrder).getTime() : 0), status: (r) => r.status };
    return sortBy(f, get[sort.key] ?? get.spent, sort.dir);
  }, [all, q, platform, status, activity, sort]);

  const paged = usePaged(rows, state.settings.pageSize);
  useEffect(() => { paged.setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, platform, status, activity, sort]);

  const flip = (c: Customer, paused: boolean) => {
    setBotPaused(c.id, paused);
    toast.success(paused ? `Bot paused for ${c.name} — the assistant will not reply to them until you resume it.` : `Bot resumed for ${c.name}.`);
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Customer", sortable: true, render: (c) => <div className="flex min-w-[10rem] items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-a-accent-soft text-xs font-semibold text-a-accent">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span><div className="min-w-0"><p className="truncate font-medium">{c.name}</p><p className="truncate text-xs text-a-muted">{c.email}</p></div></div> },
    { key: "phone", header: "Phone", hideOnMobile: true, render: (c) => <span className="whitespace-nowrap">{c.phone}</span> },
    { key: "platform", header: "Platform", sortable: true, hideOnMobile: true, render: (c) => <Badge tone={PLATFORM_TONE[c.platform]}>{c.platform}</Badge> },
    { key: "orders", header: "Orders", sortable: true, align: "center", render: (c) => c.stats.orders },
    { key: "spent", header: "Total spent", sortable: true, align: "right", render: (c) => <span className="whitespace-nowrap font-semibold">{npr(c.stats.spent)}</span> },
    { key: "last", header: "Last order", sortable: true, hideOnMobile: true, render: (c) => <span className="whitespace-nowrap text-a-muted">{c.stats.lastOrder ? fmtDate(c.stats.lastOrder) : "—"}</span> },
    { key: "status", header: "Status", sortable: true, render: (c) => <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge> },
    { key: "bot", header: "Bot", align: "center", hideOnMobile: true, render: (c) => <Toggle size="sm" checked={!c.botPaused} label={`Bot ${c.botPaused ? "paused" : "active"} for ${c.name}`} onChange={(on) => flip(c, !on)} /> },
  ];

  const sel = all.find((c) => c.id === open);
  const orders = sel ? state.orders.filter((o) => o.customerId === sel.id) : [];

  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} of ${state.customers.length} customers`} />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-a-line p-3 sm:p-4">
          <SearchInput className="w-full sm:w-72" value={q} onChange={setQ} placeholder="Search name, phone or email…" />
          <FilterSelect aria-label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="all">All platforms</option>{["Facebook", "Instagram", "WhatsApp", "TikTok", "Website"].map((p) => <option key={p}>{p}</option>)}</FilterSelect>
          <FilterSelect aria-label="Customer status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["Active", "VIP", "Inactive"].map((p) => <option key={p}>{p}</option>)}</FilterSelect>
          <FilterSelect aria-label="Order activity" value={activity} onChange={(e) => setActivity(e.target.value)}><option value="all">Any activity</option><option value="recent">Ordered in last 30 days</option><option value="repeat">Repeat (3+ orders)</option><option value="none">Never ordered</option></FilterSelect>
        </div>
        <DataTable columns={columns} rows={paged.pageItems} rowKey={(c) => c.id} loading={loading} sort={sort} onSort={toggle} onRowClick={(c) => setOpen(c.id)} compact={state.settings.compactTables}
          empty={<EmptyState icon={<Users />} title="No customers match" description="Try a different search or filter." />} />
        {!loading && rows.length > 0 && <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPage={paged.setPage} onPageSize={paged.setPageSize} />}
      </Card>

      <Drawer open={!!sel} onClose={() => setOpen(null)} title={sel?.name ?? ""} subtitle={sel && <span className="flex flex-wrap items-center gap-2"><Badge tone={STATUS_TONE[sel.status]} dot>{sel.status}</Badge><Badge tone={PLATFORM_TONE[sel.platform]}>{sel.platform}</Badge> Customer since {fmtDate(sel.joinedAt)}</span>}>
        {sel && (
          <div className="divide-y divide-a-line">
            <section className="space-y-2 px-5 py-4 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-a-muted" />{sel.phone}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-a-muted" />{sel.email}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-a-muted" />{sel.address}</p>
            </section>
            <section className="px-5 py-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[["Orders", String(sel.stats.orders)], ["Total spent", npr(sel.stats.spent)], ["Avg. order", npr(sel.stats.orders ? sel.stats.spent / sel.stats.orders : 0)]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-a-subtle p-3"><p className="text-xs text-a-muted">{k}</p><p className="mt-1 text-sm font-semibold">{v}</p></div>
                ))}
              </div>
            </section>
            <section className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-a-line p-3">
                <div className="flex items-start gap-3">{sel.botPaused ? <BotOff className="mt-0.5 h-5 w-5 text-amber-500" /> : <Bot className="mt-0.5 h-5 w-5 text-emerald-500" />}
                  <div><p className="text-sm font-medium">{sel.botPaused ? "Bot paused" : "Bot replying"}</p><p className="text-xs text-a-muted">Pausing stops the Messenger/Instagram assistant from replying to this customer.</p></div></div>
                <Toggle checked={!sel.botPaused} label="Bot active" onChange={(on) => flip(sel, !on)} />
              </div>
            </section>
            <section className="px-5 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-a-muted">Order history</h3>
              {orders.length === 0 ? <p className="text-sm text-a-muted">No orders yet.</p> : (
                <ul className="divide-y divide-a-line rounded-lg border border-a-line">
                  {orders.slice(0, 8).map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div><p className="font-medium">{o.number}</p><p className="text-xs text-a-muted">{fmtDate(o.date)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p></div>
                      <div className="text-right"><p className="font-semibold">{npr(orderTotal(o))}</p><div className="mt-1 flex justify-end gap-1"><Badge tone={ORDER_TONE[o.orderStatus]}>{o.orderStatus}</Badge><Badge tone={PAY_TONE[o.paymentStatus]}>{o.paymentStatus}</Badge></div></div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="px-5 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-a-muted">Recent activity</h3>
              <ol className="relative ml-2 space-y-3 border-l border-a-line pl-5">
                {sel.activity.slice(0, 6).map((a, i) => <li key={i} className="relative"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-a-accent ring-4 ring-a-surface" /><p className="text-sm">{a.text}</p><p className="text-xs text-a-muted">{fmtDateTime(a.at)}</p></li>)}
              </ol>
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}
