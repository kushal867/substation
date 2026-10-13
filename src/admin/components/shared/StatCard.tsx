"use client";

import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "../ui/Card";

interface Props {
  label: string;
  value: string;
  change?: number;
  /** When true a rising value is bad (low stock, pending payments). */
  invert?: boolean;
  icon: React.ReactNode;
  spark?: number[];
  tone?: string;
  hint?: string;
  loading?: boolean;
  showSpark?: boolean;
}

export function StatCard({ label, value, change, invert, icon, spark, tone = "#4f46e5", hint, loading, showSpark = true }: Props) {
  const up = (change ?? 0) >= 0;
  const good = change === undefined || change === 0 ? undefined : invert ? !up : up;
  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-a-muted">{label}</p>
          {loading ? <div className="a-skeleton mt-2 h-7 w-24 rounded" /> : <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-a-fg">{value}</p>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&>svg]:h-[18px] [&>svg]:w-[18px]" style={{ background: `${tone}18`, color: tone }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-xs">
          {change !== undefined ? (
            <span className={clsx("inline-flex items-center gap-0.5 font-medium", good === undefined ? "text-a-muted" : good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          ) : null}
          <span className="ml-1 text-a-muted">{hint ?? "vs previous period"}</span>
        </div>
        {showSpark && spark && spark.length > 1 && (
          <div className="h-8 w-20 shrink-0" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <Area type="monotone" dataKey="v" stroke={tone} strokeWidth={1.5} fill={tone} fillOpacity={0.15} isAnimationActive={false} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
