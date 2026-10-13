"use client";

import { Download, Printer, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, ChartTooltip, PALETTE, axisProps } from "../components/shared/charts";
import { DateRangeFilter } from "../components/shared/DateRangeFilter";
import { ImageThumb } from "../components/shared/ImageThumb";
import { usePrint } from "../components/shared/Print";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { useToast } from "../components/ui/Feedback";
import { EmptyState, PageHeader, ProgressBar } from "../components/ui/Misc";
import { useBriefLoading } from "../hooks/useBriefLoading";
import { useDateRange } from "../hooks/useDateRange";
import { usePageLoading } from "../hooks/usePageLoading";
import { downloadCsv } from "../lib/csv";
import { fmtDateTime, npr, nprCompact, num, pct } from "../lib/format";
import { rangeLabel } from "../lib/range";
import { computeStats, type Stats } from "../lib/stats";
import { StatCard } from "../components/shared/StatCard";
import { useAdmin } from "../store/AdminStore";
import { DollarSign, ShoppingCart, TrendingUp, Wallet } from "lucide-react";

type ClickState = { activeTooltipIndex?: number | string | null } | undefined;

function Report({ stats, label, store, catName }: { stats: Stats; label: string; store: string; catName: (id: string) => string }) {
  const th: React.CSSProperties = { textAlign: "left", padding: "6px", borderBottom: "2px solid #111", fontSize: 12 };
  const td: React.CSSProperties = { padding: "6px", borderBottom: "1px solid #ddd", fontSize: 12 };
  const r: React.CSSProperties = { textAlign: "right" };
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111", padding: 32, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>{store} — Sales report</h1>
      <p style={{ color: "#555", fontSize: 13 }}>Period: {label} · Generated {fmtDateTime(new Date().toISOString())}</p>
      <h3>Summary</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
        {[["Revenue", npr(stats.cur.revenue)], ["Valid orders", String(stats.cur.count)], ["Average order value", npr(stats.cur.aov)], ["Collected", npr(stats.cur.collected)], ["Outstanding", npr(stats.cur.pending)]].map(([k, v]) => <tr key={k}><td style={td}>{k}</td><td style={{ ...td, ...r }}><strong>{v}</strong></td></tr>)}
      </tbody></table>
      <h3>Revenue by period</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Period</th><th style={{ ...th, ...r }}>Orders</th><th style={{ ...th, ...r }}>Revenue</th><th style={{ ...th, ...r }}>Collected</th></tr></thead>
        <tbody>{stats.buckets.map((b) => <tr key={b.start}><td style={td}>{b.label}</td><td style={{ ...td, ...r }}>{b.count}</td><td style={{ ...td, ...r }}>{npr(b.revenue)}</td><td style={{ ...td, ...r }}>{npr(b.collected)}</td></tr>)}</tbody></table>
      <h3>Category performance</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Category</th><th style={{ ...th, ...r }}>Revenue</th></tr></thead>
        <tbody>{stats.categorySales.map((c) => <tr key={c.id}><td style={td}>{catName(c.id)}</td><td style={{ ...td, ...r }}>{npr(c.value)}</td></tr>)}</tbody></table>
      <h3>Top products</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={th}>Product</th><th style={{ ...th, ...r }}>Units</th><th style={{ ...th, ...r }}>Revenue</th></tr></thead>
        <tbody>{stats.topProducts.slice(0, 10).map((p) => <tr key={p.id}><td style={td}>{p.name}</td><td style={{ ...td, ...r }}>{p.qty}</td><td style={{ ...td, ...r }}>{npr(p.revenue)}</td></tr>)}</tbody></table>
    </div>
  );
}

export default function AnalyticsView() {
  const { state } = useAdmin();
  const toast = useToast();
  const print = usePrint();
  const dr = useDateRange("30");
  const initial = usePageLoading(450);
  const switching = useBriefLoading(dr.range.from.getTime() + dr.range.to.getTime());
  const loading = initial || switching;
  const [sel, setSel] = useState<number | null>(null);
  const stats = useMemo(() => computeStats(state, dr.range), [state, dr.range]);
  const catName = (id: string) => state.categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  const series = stats.buckets;
  const has = stats.orders.length > 0;
  const picked = sel !== null && series[sel] ? series[sel] : null;
  const pick = (s: ClickState) => { const i = s?.activeTooltipIndex; if (i === undefined || i === null) return; const n = Number(i); setSel((c) => (c === n ? null : n)); };

  const catData = stats.categorySales.map((c, i) => ({ name: catName(c.id), revenue: c.value, units: stats.topProducts.filter((p) => p.categoryId === c.id).reduce((s, p) => s + p.qty, 0), fill: PALETTE[i % PALETTE.length] }));
  const fulfil = useMemo(() => {
    const o = stats.orders;
    const n = o.length || 1;
    const delivered = o.filter((x) => x.orderStatus === "Delivered");
    const times = delivered.map((x) => {
      const d = x.timeline.find((t) => t.title === "Marked Delivered");
      return d ? (new Date(d.at).getTime() - new Date(x.date).getTime()) / 86_400_000 : NaN;
    }).filter((x) => Number.isFinite(x));
    return {
      deliveredRate: (delivered.length / n) * 100,
      cancelRate: (o.filter((x) => x.orderStatus === "Cancelled").length / n) * 100,
      inProgress: o.filter((x) => ["Confirmed", "Processing", "Shipped"].includes(x.orderStatus)).length,
      pending: o.filter((x) => x.orderStatus === "Pending").length,
      avgDays: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      collectedRate: stats.cur.revenue ? Math.min(100, (stats.cur.collected / stats.cur.revenue) * 100) : 0,
    };
  }, [stats]);

  const exportCsv = () => {
    if (!has) return toast.error("Nothing to export — no orders in this period.");
    downloadCsv(`analytics-${new Date().toISOString().slice(0, 10)}`, [
      ["Report", `${state.settings.storeName} analytics`], ["Period", rangeLabel(dr.range)], [],
      ["Period", "Orders", "Revenue (NPR)", "Collected (NPR)", "Avg order value (NPR)"],
      ...series.map((b) => [b.label, b.count, Math.round(b.revenue), Math.round(b.collected), Math.round(b.aov)]), [],
      ["Category", "Revenue (NPR)"], ...catData.map((c) => [c.name, Math.round(c.revenue)]), [],
      ["Product", "Units", "Revenue (NPR)"], ...stats.topProducts.map((p) => [p.name, p.qty, Math.round(p.revenue)]), [],
      ["Variant", "Units", "Revenue (NPR)"], ...stats.topVariants.map((v) => [`${v.product} — ${v.variant}`, v.qty, Math.round(v.revenue)]),
    ]);
    toast.success("Analytics CSV downloaded.");
  };

  const sharedChart = { margin: { top: 8, right: 8, bottom: 0, left: 0 } };
  const xAxis = <XAxis dataKey="label" {...axisProps} minTickGap={24} />;
  const selLine = picked && <ReferenceLine x={picked.label} stroke="#4f46e5" strokeDasharray="4 3" />;

  return (
    <>
      <PageHeader title="Analytics & Reports" description="Click any point or bar to inspect that period." actions={<><Button onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button><Button variant="primary" onClick={() => has ? print(<Report stats={stats} label={rangeLabel(dr.range)} store={state.settings.storeName} catName={catName} />) : toast.error("Nothing to print — no orders in this period.")}><Printer className="h-4 w-4" />Print report</Button></>} />
      <div className="mb-5"><DateRangeFilter state={dr} /></div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard loading={loading} showSpark={false} label="Revenue" value={npr(stats.cur.revenue)} change={pct(stats.cur.revenue, stats.prev.revenue)} icon={<DollarSign />} />
        <StatCard loading={loading} showSpark={false} label="Orders" value={num(stats.cur.count)} change={pct(stats.cur.count, stats.prev.count)} icon={<ShoppingCart />} tone="#0ea5e9" />
        <StatCard loading={loading} showSpark={false} label="Avg. order value" value={npr(stats.cur.aov)} change={pct(stats.cur.aov, stats.prev.aov)} icon={<TrendingUp />} tone="#10b981" />
        <StatCard loading={loading} showSpark={false} label="Collected" value={npr(stats.cur.collected)} change={pct(stats.cur.collected, stats.prev.collected)} icon={<Wallet />} tone="#8b5cf6" />
      </div>

      {picked && (
        <Card className="a-fade-in mt-4 border-a-accent/40 bg-a-accent-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-medium uppercase tracking-wide text-a-accent">Selected period</p><p className="text-lg font-semibold">{picked.label}</p></div>
            <div className="flex flex-wrap gap-6 text-sm">
              <span><span className="text-a-muted">Orders</span> <strong>{picked.count}</strong></span>
              <span><span className="text-a-muted">Revenue</span> <strong>{npr(picked.revenue)}</strong></span>
              <span><span className="text-a-muted">AOV</span> <strong>{npr(picked.aov)}</strong></span>
              <span><span className="text-a-muted">Collected</span> <strong>{npr(picked.collected)}</strong></span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSel(null)}><X className="h-3.5 w-3.5" />Clear</Button>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue trends" subtitle="Click a point to select" loading={loading} empty={!has}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} {...sharedChart} onClick={pick}>
              <defs><linearGradient id="an-rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--a-line)" />{xAxis}
              <YAxis {...axisProps} width={48} tickFormatter={(v) => nprCompact(v).replace("NPR ", "")} />
              <Tooltip content={<ChartTooltip format={(v) => npr(v)} />} />
              {selLine}
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#an-rev)" activeDot={{ r: 5, style: { cursor: "pointer" } }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders over time" subtitle="Click a bar to select" loading={loading} empty={!has}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} {...sharedChart} onClick={pick}>
              <CartesianGrid vertical={false} stroke="var(--a-line)" />{xAxis}
              <YAxis {...axisProps} width={30} allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--a-subtle)" }} content={<ChartTooltip />} />
              <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]} maxBarSize={28} style={{ cursor: "pointer" }}>
                {series.map((_, i) => <Cell key={i} fill={sel === null || sel === i ? "#0ea5e9" : "#0ea5e955"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Average order value" subtitle="NPR per valid order" loading={loading} empty={!has}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} {...sharedChart} onClick={pick}>
              <CartesianGrid vertical={false} stroke="var(--a-line)" />{xAxis}
              <YAxis {...axisProps} width={48} tickFormatter={(v) => nprCompact(v).replace("NPR ", "")} />
              <Tooltip content={<ChartTooltip format={(v) => npr(v)} />} />
              {selLine}
              <Line type="monotone" dataKey="aov" name="AOV" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment collection trends" subtitle="Revenue billed vs. cash collected" loading={loading} empty={!has}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} {...sharedChart} onClick={pick}>
              <CartesianGrid vertical={false} stroke="var(--a-line)" />{xAxis}
              <YAxis {...axisProps} width={48} tickFormatter={(v) => nprCompact(v).replace("NPR ", "")} />
              <Tooltip cursor={{ fill: "var(--a-subtle)" }} content={<ChartTooltip format={(v) => npr(v)} />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Billed" fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Line type="monotone" dataKey="collected" name="Collected" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category performance" subtitle="Revenue by category" loading={loading} empty={catData.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--a-line)" />
              <XAxis type="number" {...axisProps} tickFormatter={(v) => nprCompact(v).replace("NPR ", "")} />
              <YAxis type="category" dataKey="name" {...axisProps} width={84} />
              <Tooltip cursor={{ fill: "var(--a-subtle)" }} content={<ChartTooltip format={(v, n) => (n === "Units" ? `${v}` : npr(v))} />} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={26}>{catData.map((c) => <Cell key={c.name} fill={c.fill} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader title="Order fulfilment" subtitle={`${stats.orders.length} orders in period`} />
          <div className="space-y-5 p-5">
            {loading ? <div className="a-skeleton h-52 rounded-lg" /> : !has ? <EmptyState title="No orders in this period" className="py-8" /> : (
              <>
                {[["Delivered rate", fulfil.deliveredRate, "green"], ["Cancellation rate", fulfil.cancelRate, "red"], ["Payment collected", fulfil.collectedRate, "indigo"]].map(([k, v, tone]) => (
                  <div key={k as string}><div className="mb-1.5 flex justify-between text-sm"><span className="text-a-muted">{k as string}</span><span className="font-semibold">{(v as number).toFixed(1)}%</span></div><ProgressBar value={v as number} tone={tone as "green"} /></div>
                ))}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[["Pending", fulfil.pending], ["In progress", fulfil.inProgress], ["Avg. days to deliver", fulfil.avgDays ? fulfil.avgDays.toFixed(1) : "—"]].map(([k, v]) => <div key={k as string} className="rounded-lg bg-a-subtle p-3"><p className="text-xs text-a-muted">{k}</p><p className="mt-1 text-lg font-semibold">{v}</p></div>)}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Top-selling products" subtitle="Ranked by revenue" />
          <div className="p-5 pt-3">
            {loading ? <div className="a-skeleton h-56 rounded-lg" /> : stats.topProducts.length === 0 ? <EmptyState title="No sales in this period" className="py-8" /> : (
              <ol>{stats.topProducts.slice(0, 6).map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 border-b border-a-line py-2.5 last:border-0">
                  <span className="w-4 text-xs font-semibold text-a-muted">{i + 1}</span>
                  <ImageThumb src={state.products.find((x) => x.id === p.id)?.image} name={p.name} category={catName(p.categoryId)} className="h-9 w-9" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><ProgressBar value={p.revenue} max={stats.topProducts[0].revenue} className="mt-1.5" /></div>
                  <div className="text-right"><p className="text-sm font-semibold">{nprCompact(p.revenue)}</p><p className="text-xs text-a-muted">{p.qty} sold</p></div>
                </li>))}</ol>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Best-performing variants" subtitle="Ranked by units sold" />
          <div className="p-5 pt-3">
            {loading ? <div className="a-skeleton h-56 rounded-lg" /> : stats.topVariants.length === 0 ? <EmptyState title="No sales in this period" className="py-8" /> : (
              <ol>{stats.topVariants.slice(0, 6).map((v, i) => (
                <li key={v.key} className="flex items-center gap-3 border-b border-a-line py-2.5 last:border-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-a-accent-soft text-xs font-semibold text-a-accent">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{v.product}</p><p className="truncate text-xs text-a-muted">{v.variant || "Default"}</p></div>
                  <div className="text-right"><p className="text-sm font-semibold">{v.qty} units</p><p className="text-xs text-a-muted">{nprCompact(v.revenue)}</p></div>
                </li>))}</ol>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
