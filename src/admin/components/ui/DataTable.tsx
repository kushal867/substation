"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "./Fields";
import { Button } from "./Button";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hidden below the md breakpoint to keep mobile tables readable. */
  hideOnMobile?: boolean;
}

export interface SortState { key: string; dir: "asc" | "desc" }

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (r: T) => string;
  sort?: SortState;
  onSort?: (key: string) => void;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  onRowClick?: (r: T) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  compact?: boolean;
  skeletonRows?: number;
}

export function DataTable<T>({ columns, rows, rowKey, sort, onSort, selected, onSelectedChange, onRowClick, loading, empty, compact, skeletonRows = 6 }: Props<T>) {
  const selectable = !!onSelectedChange;
  const ids = rows.map(rowKey);
  const allSel = ids.length > 0 && ids.every((i) => selected?.includes(i));
  const someSel = ids.some((i) => selected?.includes(i));
  const pad = compact ? "px-3 py-2" : "px-4 py-3";
  const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-a-line bg-a-subtle text-xs uppercase tracking-wide text-a-muted">
            {selectable && (
              <th className="w-10 px-4 py-2.5">
                <Checkbox
                  label="Select all rows"
                  checked={allSel}
                  indeterminate={someSel}
                  onChange={(v) => onSelectedChange!(v ? Array.from(new Set([...(selected ?? []), ...ids])) : (selected ?? []).filter((i) => !ids.includes(i)))}
                />
              </th>
            )}
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={clsx("whitespace-nowrap px-4 py-2.5 font-medium", alignCls(c.align), c.hideOnMobile && "hidden md:table-cell", c.className)}
                >
                  {c.sortable && onSort ? (
                    <button onClick={() => onSort(c.key)} className={clsx("inline-flex items-center gap-1 uppercase tracking-wide hover:text-a-fg", active && "text-a-fg")}>
                      {c.header}
                      {active ? sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-50" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-a-line last:border-0">
                  {selectable && <td className={pad}><div className="a-skeleton h-4 w-4 rounded" /></td>}
                  {columns.map((c) => (
                    <td key={c.key} className={clsx(pad, c.hideOnMobile && "hidden md:table-cell")}><div className="a-skeleton h-4 w-full max-w-[9rem] rounded" /></td>
                  ))}
                </tr>
              ))
            : rows.map((r) => {
                const k = rowKey(r);
                const isSel = selected?.includes(k);
                return (
                  <tr
                    key={k}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    className={clsx(
                      "border-b border-a-line transition-colors last:border-0",
                      onRowClick && "cursor-pointer",
                      isSel ? "bg-a-accent-soft" : "hover:bg-a-subtle/70",
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox label="Select row" checked={!!isSel} onChange={(v) => onSelectedChange!(v ? [...(selected ?? []), k] : (selected ?? []).filter((i) => i !== k))} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={clsx(pad, "align-middle", alignCls(c.align), c.hideOnMobile && "hidden md:table-cell", c.className)}>
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                );
              })}
        </tbody>
      </table>
      {!loading && rows.length === 0 && empty}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage, onPageSize }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-a-line px-4 py-3 text-sm text-a-muted">
      <div className="flex items-center gap-3">
        <span>
          {from}–{to} of {total}
        </span>
        {onPageSize && (
          <select aria-label="Rows per page" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="h-8 rounded-lg border border-a-line bg-a-surface px-2 text-xs text-a-fg">
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={clsx("h-8 min-w-8 rounded-lg px-2 text-xs font-medium", n === page ? "bg-a-accent text-a-accent-fg" : "text-a-muted hover:bg-a-subtle")}
            >
              {n}
            </button>
          ),
        )}
        <Button size="icon" variant="ghost" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
