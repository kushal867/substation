"use client";

import clsx from "clsx";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-a-subtle text-a-muted [&>svg]:h-6 [&>svg]:w-6">{icon ?? <Inbox />}</div>
      <p className="text-sm font-semibold text-a-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-a-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("a-skeleton rounded-md", className)} />;
}

export function ProgressBar({ value, max = 100, tone = "indigo", className }: { value: number; max?: number; tone?: "indigo" | "green" | "amber" | "red"; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const bg = { indigo: "bg-indigo-500", green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" }[tone];
  return (
    <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-a-line", className)}>
      <div className={clsx("h-full rounded-full transition-all duration-500", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-a-line bg-a-subtle p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={clsx("inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors", value === o.value ? "bg-a-surface text-a-fg shadow-sm" : "text-a-muted hover:text-a-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-a-fg">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-a-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function BulkBar({ count, children, onClear }: { count: number; children: React.ReactNode; onClear: () => void }) {
  if (!count) return null;
  return (
    <div className="a-fade-in flex flex-wrap items-center gap-2 border-b border-a-line bg-a-accent-soft px-4 py-2 text-sm">
      <span className="font-medium text-a-accent">{count} selected</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <Button size="sm" variant="ghost" className="ml-auto" onClick={onClear}>Clear</Button>
    </div>
  );
}

export function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-a-line border-t-a-accent" />;
}
