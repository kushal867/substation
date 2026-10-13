"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { EmptyState } from "../ui/Misc";

/** Categorical palette used by every chart so colors stay consistent. */
export const PALETTE = ["#4f46e5", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#8b5cf6", "#14b8a6", "#ec4899"];

export const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Processing: "#8b5cf6",
  Shipped: "#0ea5e9",
  Delivered: "#10b981",
  Cancelled: "#f43f5e",
};

export const axisProps = {
  tick: { fontSize: 11, fill: "var(--a-muted)" },
  tickLine: false,
  axisLine: false,
} as const;

export function ChartCard({ title, subtitle, actions, loading, empty, height = 260, children, className }: { title: string; subtitle?: string; actions?: React.ReactNode; loading?: boolean; empty?: boolean; height?: number; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      <div className="px-3 pb-4 pt-3 sm:px-5" style={{ minHeight: height }}>
        {loading ? (
          <div className="a-skeleton w-full rounded-lg" style={{ height }} />
        ) : empty ? (
          <EmptyState icon={<BarChart3 />} title="Nothing to show yet" description="Data for this period will appear here as orders come in." className="py-10" />
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </div>
    </Card>
  );
}

interface TipRow { name?: string; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }

export function ChartTooltip({ active, payload, label, format }: { active?: boolean; payload?: TipRow[]; label?: string | number; format?: (v: number, name: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-a-line bg-a-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-a-fg">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-a-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-medium text-a-fg">{format ? format(Number(p.value), String(p.name)) : String(p.value)}</span>
        </p>
      ))}
    </div>
  );
}
