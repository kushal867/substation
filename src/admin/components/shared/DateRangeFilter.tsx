"use client";

import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { PERIODS, rangeLabel, type PeriodKey } from "../../lib/range";
import type { DateRangeState } from "../../hooks/useDateRange";

export function DateRangeFilter({ state, allowAll }: { state: DateRangeState; allowAll?: boolean }) {
  const opts = allowAll ? [{ key: "all" as PeriodKey, label: "All" }, ...PERIODS] : PERIODS;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-a-line bg-a-surface p-0.5">
        {opts.map((p) => (
          <button
            key={p.key}
            aria-pressed={state.key === p.key}
            onClick={() => state.setKey(p.key)}
            className={clsx("h-8 rounded-md px-2.5 text-xs font-medium transition-colors", state.key === p.key ? "bg-a-accent text-a-accent-fg shadow-sm" : "text-a-muted hover:bg-a-subtle hover:text-a-fg")}
          >
            {p.label}
          </button>
        ))}
      </div>
      {state.key === "custom" && (
        <div className="a-fade-in flex items-center gap-1.5 text-xs text-a-muted">
          <input aria-label="Start date" type="date" value={state.custom.from} max={state.custom.to} onChange={(e) => state.setCustom({ ...state.custom, from: e.target.value })} className="h-8 rounded-lg border border-a-line bg-a-surface px-2 text-xs text-a-fg" />
          <span>to</span>
          <input aria-label="End date" type="date" value={state.custom.to} min={state.custom.from} onChange={(e) => state.setCustom({ ...state.custom, to: e.target.value })} className="h-8 rounded-lg border border-a-line bg-a-surface px-2 text-xs text-a-fg" />
        </div>
      )}
      <span className="hidden items-center gap-1 text-xs text-a-muted lg:inline-flex">
        <CalendarDays className="h-3.5 w-3.5" />
        {rangeLabel(state.range)}
      </span>
    </div>
  );
}
