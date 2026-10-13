"use client";

import { AlertTriangle, Boxes, CreditCard, DollarSign, Package, PackageX, Plus, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartTooltip, PALETTE, STATUS_COLORS, axisProps } from "../components/shared/charts";
import { DateRangeFilter } from "../components/shared/DateRangeFilter";
import { ImageThumb } from "../components/shared/ImageThumb";
import { StatCard } from "../components/shared/StatCard";
import { Badge, ORDER_TONE, PAY_TONE } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { EmptyState, PageHeader, ProgressBar } from "../components/ui/Misc";
import { useBriefLoading } from "../hooks/useBriefLoading";
import { useDateRange } from "../hooks/useDateRange";
import { usePageLoading } from "../hooks/usePageLoading";
import { fmtDate, npr, nprCompact, num } from "../lib/format";
import { orderTotal } from "../lib/range";
import { computeStats, ORDER_STATUSES } from "../lib/stats";
import { variantLabel, variantStatus } from "../lib/selectors";
import { useAdmin } from "../store/AdminStore";

export default function DashboardView() {
  const { state } = useAdmin();
  const dr = useDateRange(String(state.settings.defaultPeriod) as "30");
  const initial = usePageLoading();
  const switching = useBriefLoading(dr.range.from.getTime() + dr.range.to.getTime());
  const loading = initial || switching;
  const stats = useMemo(() => computeStats(state, dr.range), [state, dr.range]);
  const { settings } = state;
  const catName = (id: string) => state.categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  const catOf = (id: string) => state.products.find((p) => p.id === id)?.categoryId ?? "";

  const lowVariants = useMemo(() => {
    const rows: { pid: string; pname: string; image: string; cat: string; label: string; stock: number; status: "low" | "out" }[] = [];
    for (const p of state.products) {
      if (!p.active) continue;
      for (const v of p.variants) {
        const s = variantStatus(v, settings.lowStockThreshold);
        if (s !== "in") rows.push({ pid: p.id, pname: p.name, image: p.image, cat: catName(p.categoryId), label: variantLabel(v), stock: v.stock, status: s });
      }
    }
    return rows.sort((a, b) => a.stock - b.stock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.products, state.categories, settings.lowStockThreshold]);

  const series = stats.buckets;
  const spark = (k: "revenue" | "count" | "collected") => series.map((b) => b[k]);
  const hasOrders = stats.orders.length > 0;
  const periodWord = dr.range.key === "1" ? "yesterday" : "previous period";

  const donut = stats.categorySales.map((c, i) => ({ name: catName(c.id), value: c.value, fill: PALETTE[i % PALETTE.length] }));
  const donutTotal = donut.reduce((s, d) => s + d.value, 0);
  const statusData = ORDER_STATUSES.map((s) => ({ name: s, value: stats.statusCounts[s] }));
  const maxStatus = Math.max(1, ...statusData.map((s) => s.value));
  const payData = [
    { label: "Paid", amount: stats.payBreakdown.Paid, color: "#10b981" },
    { label: "Partially paid", amount: stats.payBreakdown["Partially Paid"], color: "#f59e0b" },
    { label: "Unpaid", amount: stats.payBreakdown.Unpaid, color: "#f43f5e" },
    { label: "Refunded", amount: stats.payBreakdown.Refunded, color: "#94a3b8" },
  ];
  const payTotal = payData.reduce((s, p) => s + p.amount, 0);
  const recent = state.orders.slice(0, 6);
  const customerName = (id: string) => state.customers.find((c) => c.id === id)?.name ?? "—";
  const show = settings.showSparklines && hasOrders;
  const storeEmpty = state.products.length === 0 && state.orders.length === 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${settings.adminName.split(" ")[0]}. Here's how ${settings.storeName} is doing.`}
        actions={
          <>
            <Link href="/admin/products?new=1"><Button variant="primary"><Plus className="h-4 w-4" />Add product</Button></Link>
            <Link href="/admin/orders"><Button><ShoppingCart className="h-4 w-4" />View orders</Button></Link>
            <Link href="/admin/inventory"><Button><Boxes className="h-4 w-4" />Manage inventory</Button></Link>
          </>
        }
      />
      {storeEmpty && (
        <Card className="mb-5 border-dashed p-6">
          <h2 className="text-base font-semibold">Your store is empty — let&apos;s set it up</h2>
          <p className="mt-1 text-sm text-a-muted">Add your first product and set delivery fees. Orders and payments from your Messenger/Instagram bot appear here automatically.</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[["1", "Review categories", "Shoes, Glasses and Bags are ready.", "/admin/categories"], ["2", "Add delivery zones", "Set fees per area.", "/admin/delivery-zones"], ["3", "Add a product", "With variants and stock.", "/admin/products?new=1"]].map(([n, t, d, h]) => (
              <li key={n}><Link href={h} className="flex h-full gap-3 rounded-lg border border-a-line p-3 transition-colors hover:bg-a-subtle"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-a-accent-soft text-xs font-semibold text-a-accent">{n}</span><span><span className="block text-sm font-medium">{t}</span><span className="text-xs text-a-muted">{d}</span></span></Link></li>
            ))}
          </ol>
        </Card>
      )}
      <div className="mb-5"><DateRangeFilter state={dr} /></div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard loading={loading} showSpark={show} label="Total Revenue" value={npr(stats.cur.revenue)} change={stats.change.revenue} hint={`vs ${periodWord}`} icon={<DollarSign />} spark={spark("revenue")} tone="#4f46e5" />
        <StatCard loading={loading} showSpark={show} label="Total Orders" value={num(stats.cur.all)} change={stats.change.orders} hint={`vs ${periodWord}`} icon={<ShoppingCart />} spark={spark("count")} tone="#0ea5e9" />
        <StatCard loading={loading} showSpark={show} label="Total Products" value={num(state.products.length)} change={stats.change.products} hint={`${stats.newProducts} added this period`} icon={<Package />} spark={series.map((b) => state.products.filter((p) => { const t = new Date(p.createdAt).getTime(); return t >= b.start && t <= b.end; }).length)} tone="#10b981" />
        <StatCard loading={loading} showSpark={show} label="Low Stock Products" value={num(stats.lowCount)} hint="need restocking soon" icon={<AlertTriangle />} tone="#f59e0b" />
        <StatCard loading={loading} showSpark={show} label="Out of Stock Products" value={num(stats.outCount)} hint="currently unavailable" icon={<PackageX />} tone="#f43f5e" />
        <StatCard loading={loading} showSpark={show} label="Pending Payments" value={npr(stats.cur.pending)} change={stats.change.pending} invert hint={`vs ${periodWord}`} icon={<Wallet />} spark={series.map((b) => b.revenue - b.collected)} tone="#8b5cf6" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" title="Revenue Overview" subtitle={`${npr(stats.cur.revenue)} in selected period`} loading={loading} empty={!hasOrders} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--a-line)" />
              <XAxis dataKey="label" {...axisProps} minTickGap={24} />
              <YAxis {...axisProps} width={52} tickFormatter={(v) => nprCompact(v).replace("NPR ", "")} />
              <Tooltip content={<ChartTooltip format={(v) => npr(v)} />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#rev)" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales by Category" subtitle="Share of revenue" loading={loading} empty={donut.length === 0} height={280}>
          <div className="flex h-full flex-col">
            <div className="relative min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
                    {donut.map((d) => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip format={(v) => `${npr(v)} (${((v / donutTotal) * 100).toFixed(1)}%)`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold text-a-fg">{nprCompact(donutTotal).replace("NPR ", "")}</span>
                <span className="text-[11px] text-a-muted">NPR total</span>
              </div>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {donut.map((d) => (
                <li key={d.name} className="flex items-center gap-1.5 text-a-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto font-medium text-a-fg">{((d.value / donutTotal) * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        <ChartCard className="xl:col-span-2" title="Orders Analytics" subtitle={`${stats.cur.count} valid orders · avg ${npr(stats.cur.aov)}`} loading={loading} empty={!hasOrders} height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--a-line)" />
              <XAxis dataKey="label" {...axisProps} minTickGap={24} />
              <YAxis {...axisProps} width={32} allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--a-subtle)" }} content={<ChartTooltip />} />
              <Bar dataKey="count" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Order Status" subtitle={`${stats.orders.length} orders in period`} />
          <div className="space-y-3 px-5 pb-5 pt-4">
            {loading ? <div className="a-skeleton h-52 rounded-lg" /> : !hasOrders ? <EmptyState title="No orders" description="Nothing placed in this period." className="py-8" /> : (
              <>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-a-line" role="img" aria-label="Order status distribution">
                  {statusData.map((s) => <div key={s.name} style={{ width: `${(s.value / stats.orders.length) * 100}%`, background: STATUS_COLORS[s.name] }} title={`${s.name}: ${s.value}`} />)}
                </div>
                {statusData.map((s) => (
                  <div key={s.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-a-muted"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />{s.name}</span>
                      <span className="font-medium text-a-fg">{s.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-a-line"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.value / maxStatus) * 100}%`, background: STATUS_COLORS[s.name] }} /></div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top-Selling Products" subtitle="By revenue in period" />
          <ol className="px-5 pb-4 pt-3">
            {loading ? <div className="a-skeleton h-56 rounded-lg" /> : stats.topProducts.length === 0 ? <EmptyState title="No sales yet" className="py-8" /> : stats.topProducts.slice(0, 5).map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-a-line py-2.5 last:border-0">
                <span className="w-4 text-xs font-semibold text-a-muted">{i + 1}</span>
                <ImageThumb src={state.products.find((x) => x.id === p.id)?.image} name={p.name} category={catName(catOf(p.id) || p.categoryId)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-a-fg">{p.name}</p>
                  <p className="text-xs text-a-muted">{p.qty} sold</p>
                </div>
                <span className="text-sm font-semibold text-a-fg">{nprCompact(p.revenue).replace("NPR ", "")}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title="Payment Overview" subtitle={`${npr(payTotal)} across all orders`} />
          <div className="space-y-4 px-5 pb-5 pt-4">
            {loading ? <div className="a-skeleton h-52 rounded-lg" /> : payTotal === 0 ? <EmptyState icon={<CreditCard />} title="No payments" className="py-8" /> : payData.map((p) => (
              <div key={p.label}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-a-muted"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label}</span>
                  <span className="font-medium text-a-fg">{npr(p.amount)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-a-line"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.amount / payTotal) * 100}%`, background: p.color }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Low-Stock Alerts" subtitle={`Threshold: ${settings.lowStockThreshold} units`} actions={<Link href="/admin/inventory" className="text-xs font-medium text-a-accent hover:underline">Manage</Link>} />
          <ul className="max-h-[22rem] overflow-y-auto px-5 pb-4 pt-2">
            {lowVariants.length === 0 ? <EmptyState title="All stocked up" description="No variants are running low." className="py-8" /> : lowVariants.slice(0, 8).map((v, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-a-line py-2.5 last:border-0">
                <ImageThumb src={v.image} name={v.pname} category={v.cat} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-a-fg">{v.pname}</p>
                  <p className="truncate text-xs text-a-muted">{v.label}</p>
                </div>
                <Badge tone={v.status === "out" ? "red" : "amber"}>{v.status === "out" ? "Out" : `${v.stock} left`}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="Recent Orders" subtitle="Latest 6 orders" actions={<Link href="/admin/orders" className="text-xs font-medium text-a-accent hover:underline">View all</Link>} />
          <div className="mt-3">
            <DataTable
              loading={initial}
              rows={recent}
              rowKey={(o) => o.id}
              empty={<EmptyState icon={<ShoppingCart />} title="No orders yet" description="New orders will show up here." className="py-8" />}
              columns={[
                { key: "n", header: "Order", render: (o) => <Link href={`/admin/orders?q=${o.number}`} className="font-medium text-a-accent hover:underline">{o.number}</Link> },
                { key: "c", header: "Customer", render: (o) => customerName(o.customerId) },
                { key: "d", header: "Date", hideOnMobile: true, render: (o) => <span className="text-a-muted">{fmtDate(o.date)}</span> },
                { key: "t", header: "Total", align: "right", render: (o) => <span className="font-medium">{npr(orderTotal(o))}</span> },
                { key: "p", header: "Payment", hideOnMobile: true, render: (o) => <Badge tone={PAY_TONE[o.paymentStatus]} dot>{o.paymentStatus}</Badge> },
                { key: "s", header: "Status", render: (o) => <Badge tone={ORDER_TONE[o.orderStatus]} dot>{o.orderStatus}</Badge> },
              ]}
            />
          </div>
        </Card>
      </div>
      <p className="mt-6 text-center text-xs text-a-muted">Data is stored in this browser only.</p>
    </>
  );
}
