"use client";

import { AlertTriangle, Boxes, CheckCircle2, History, Layers, MoreHorizontal, Minus, PackageX, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ImageThumb } from "../components/shared/ImageThumb";
import { StatCard } from "../components/shared/StatCard";
import { Badge, STOCK_TONE } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { DataTable, Pagination, type Column } from "../components/ui/DataTable";
import { FilterSelect, SearchInput, TextField, Toggle, inputCls } from "../components/ui/Fields";
import { useToast } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { BulkBar, EmptyState, PageHeader, Segmented } from "../components/ui/Misc";
import { Menu } from "../components/ui/Popover";
import { Tooltip } from "../components/ui/Popover";
import { usePageLoading } from "../hooks/usePageLoading";
import { usePaged } from "../hooks/usePaged";
import { useTableSort } from "../hooks/useTableSort";
import { fmtDateTime, npr, num, timeAgo } from "../lib/format";
import { effectivePrice, inventoryTotals, sortBy, STATUS_LABEL, variantLabel, variantStatus } from "../lib/selectors";
import { useAdmin } from "../store/AdminStore";
import type { Product, StockStatus, Variant } from "../types";

interface Row { key: string; product: Product; variant: Variant; category: string; status: StockStatus }

function QtyEditor({ row, onCommit }: { row: Row; onCommit: (n: number) => string | void }) {
  const [val, setVal] = useState(String(row.variant.stock));
  const [err, setErr] = useState("");
  useEffect(() => setVal(String(row.variant.stock)), [row.variant.stock]);
  const commit = () => {
    const n = Number(val);
    if (val.trim() === "" || !Number.isInteger(n) || n < 0) { setErr("Whole number ≥ 0"); setVal(String(row.variant.stock)); return; }
    setErr("");
    if (n !== row.variant.stock) { const e = onCommit(n); if (e) setErr(e); }
  };
  return (
    <div>
      <input
        aria-label={`Stock quantity for ${row.product.name} ${variantLabel(row.variant)}`}
        inputMode="numeric"
        value={val}
        onChange={(e) => { setVal(e.target.value.replace(/[^\d]/g, "")); setErr(""); }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setVal(String(row.variant.stock)); (e.target as HTMLInputElement).blur(); } }}
        onClick={(e) => e.stopPropagation()}
        className={inputCls + " h-8 w-16 text-center tabular-nums " + (err ? "border-red-500" : "")}
      />
      {err && <p role="alert" className="mt-0.5 text-[10px] text-red-600">{err}</p>}
    </div>
  );
}

export default function InventoryView() {
  const { state, adjustStock, setStock, setAvailability, bulkStock, saveSettings } = useAdmin();
  const toast = useToast();
  const loading = usePageLoading();
  const t = state.settings.lowStockThreshold;
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [st, setSt] = useState<"all" | StockStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState(false);
  const [bulkMode, setBulkMode] = useState<"add" | "set">("add");
  const [bulkVal, setBulkVal] = useState("10");
  const [thr, setThr] = useState(String(t));
  const { sort, toggle } = useTableSort({ key: "updated", dir: "desc" });
  const [mvType, setMvType] = useState("all");
  useEffect(() => setThr(String(t)), [t]);

  const totals = useMemo(() => inventoryTotals(state), [state]);
  const catName = (id: string) => state.categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const rows = useMemo<Row[]>(() => {
    const term = q.trim().toLowerCase();
    const all: Row[] = [];
    for (const p of state.products) for (const v of p.variants) all.push({ key: `${p.id}:${v.id}`, product: p, variant: v, category: catName(p.categoryId), status: variantStatus(v, t) });
    const f = all.filter((r) => (!term || r.product.name.toLowerCase().includes(term) || r.variant.sku.toLowerCase().includes(term)) && (cat === "all" || r.product.categoryId === cat) && (st === "all" || r.status === st));
    const get: Record<string, (r: Row) => string | number> = {
      product: (r) => r.product.name, stock: (r) => r.variant.stock, sku: (r) => r.variant.sku, updated: (r) => new Date(r.variant.updatedAt).getTime(),
      status: (r) => r.variant.stock, availability: (r) => (r.variant.available ? 1 : 0),
    };
    return sortBy(f, get[sort.key] ?? get.updated, sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.products, state.categories, q, cat, st, sort, t]);

  const paged = usePaged(rows, Math.max(10, state.settings.pageSize));
  useEffect(() => { paged.setPage(1); setSelected([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, cat, st, sort]);

  const applyThreshold = () => {
    const n = Number(thr);
    if (!Number.isInteger(n) || n < 0 || n > 1000) return toast.error("Threshold must be a whole number between 0 and 1000.");
    saveSettings({ ...state.settings, lowStockThreshold: n });
    toast.success(`Low-stock threshold set to ${n} units.`);
  };

  const toggleAvail = (r: Row, v: boolean) => {
    const res = setAvailability(r.product.id, r.variant.id, v);
    if (!res.ok) toast.error(res.error!);
    else toast.success(`${r.product.name} (${variantLabel(r.variant)}) ${v ? "is now available" : "marked unavailable"}.`);
  };

  const doBulk = () => {
    const n = Number(bulkVal);
    if (bulkVal.trim() === "" || !Number.isInteger(n) || (bulkMode === "set" && n < 0)) return toast.error(bulkMode === "set" ? "Enter a whole number of 0 or more." : "Enter a whole number.");
    const items = selected.map((k) => { const [productId, variantId] = k.split(":"); return { productId, variantId }; });
    bulkStock(items, bulkMode, n);
    toast.success(`${bulkMode === "add" ? `${n >= 0 ? "Added" : "Removed"} ${Math.abs(n)} units on` : `Stock set to ${n} for`} ${items.length} variant${items.length === 1 ? "" : "s"}.`);
    setBulk(false);
    setSelected([]);
  };

  const columns: Column<Row>[] = [
    { key: "product", header: "Product", sortable: true, render: (r) => (
      <div className="flex min-w-[11rem] items-center gap-3"><ImageThumb src={r.product.image} name={r.product.name} category={r.category} className="h-9 w-9" />
        <div className="min-w-0"><p className="truncate font-medium text-a-fg">{r.product.name}</p><p className="truncate text-xs text-a-muted">{r.category}</p></div></div>) },
    { key: "variant", header: "Variant", render: (r) => <span className="whitespace-nowrap">{variantLabel(r.variant)}</span> },
    { key: "sku", header: "SKU", sortable: true, hideOnMobile: true, render: (r) => <code className="rounded bg-a-subtle px-1.5 py-0.5 text-xs">{r.variant.sku}</code> },
    { key: "stock", header: "Stock", sortable: true, render: (r) => (
      <div className="flex items-center gap-1">
        <Tooltip text="Remove 1"><Button size="icon" variant="secondary" aria-label="Decrease stock" disabled={r.variant.stock <= 0} onClick={() => adjustStock(r.product.id, r.variant.id, -1)}><Minus className="h-3.5 w-3.5" /></Button></Tooltip>
        <QtyEditor row={r} onCommit={(n) => { const res = setStock(r.product.id, r.variant.id, n); if (!res.ok) return res.error; toast.success(`Stock for ${r.product.name} (${variantLabel(r.variant)}) set to ${n}.${n === 0 ? " Marked unavailable." : ""}`); }} />
        <Tooltip text="Add 1"><Button size="icon" variant="secondary" aria-label="Increase stock" onClick={() => adjustStock(r.product.id, r.variant.id, 1)}><Plus className="h-3.5 w-3.5" /></Button></Tooltip>
      </div>) },
    { key: "availability", header: "Available", sortable: true, align: "center", render: (r) => <Toggle size="sm" checked={r.variant.available} label={`${r.product.name} ${variantLabel(r.variant)} available`} onChange={(v) => toggleAvail(r, v)} /> },
    { key: "status", header: "Status", sortable: true, render: (r) => (
      <div className="flex flex-col items-start gap-1">
        <Badge tone={STOCK_TONE[r.status]} dot>{r.status === "low" ? <><AlertTriangle className="h-3 w-3" />{STATUS_LABEL[r.status]}</> : STATUS_LABEL[r.status]}</Badge>
        {r.variant.stock > 0 && !r.variant.available && <span className="text-[10px] text-amber-600">Restocked — enable to sell</span>}
      </div>) },
    { key: "updated", header: "Updated", sortable: true, hideOnMobile: true, render: (r) => <span className="whitespace-nowrap text-xs text-a-muted">{timeAgo(r.variant.updatedAt)}</span> },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", render: (r) => (
      <Menu label="Row actions" trigger={<button type="button" aria-label={"Row actions"} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-a-muted hover:bg-a-subtle"><MoreHorizontal className="h-4 w-4" /></button>} items={[
        { label: "Add 10 units", icon: <Plus />, onClick: () => { adjustStock(r.product.id, r.variant.id, 10); toast.success("Added 10 units."); } },
        { label: "Set to zero", icon: <PackageX />, onClick: () => { setStock(r.product.id, r.variant.id, 0); toast.success("Stock set to 0 and variant marked unavailable."); }, disabled: r.variant.stock === 0 },
      ]} />) },
  ];

  const movements = state.movements.filter((m) => mvType === "all" || m.type === mvType).filter((m) => !q.trim() || m.productName.toLowerCase().includes(q.trim().toLowerCase()));
  const mvPaged = usePaged(movements, 10);

  return (
    <>
      <PageHeader title="Inventory" description="Adjust stock quickly. Changes appear instantly in products and the dashboard." actions={
        <Segmented label="Inventory view" value={tab} onChange={(v) => { setTab(v); setQ(""); }} options={[{ value: "stock", label: <><Layers className="h-3.5 w-3.5" />Stock</> }, { value: "history", label: <><History className="h-3.5 w-3.5" />Movement history</> }]} />} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard showSpark={false} hint="across available variants" label="Total stock units" value={num(totals.units)} icon={<Boxes />} />
        <StatCard showSpark={false} hint="healthy variants" label="In-stock variants" value={num(totals.inStock)} icon={<CheckCircle2 />} tone="#10b981" />
        <StatCard showSpark={false} hint={`≤ ${t} units`} label="Low-stock variants" value={num(totals.low)} icon={<AlertTriangle />} tone="#f59e0b" />
        <StatCard showSpark={false} hint="need restocking" label="Out-of-stock variants" value={num(totals.out)} icon={<PackageX />} tone="#f43f5e" />
        <div className="col-span-2 lg:col-span-1"><StatCard showSpark={false} hint="at selling price" label="Inventory value" value={npr(totals.value)} icon={<Wallet />} tone="#8b5cf6" /></div>
      </div>

      <Card className="mt-4">
        {tab === "stock" ? (
          <>
            <div className="flex flex-wrap items-end gap-2 border-b border-a-line p-3 sm:p-4">
              <SearchInput className="w-full sm:w-64" value={q} onChange={setQ} placeholder="Search product or SKU…" />
              <FilterSelect aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All categories</option>{state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</FilterSelect>
              <FilterSelect aria-label="Filter by stock status" value={st} onChange={(e) => setSt(e.target.value as typeof st)}><option value="all">Any stock status</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></FilterSelect>
              <form className="ml-auto flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); applyThreshold(); }}>
                <TextField label="Low-stock threshold" inputMode="numeric" value={thr} onChange={(e) => setThr(e.target.value.replace(/[^\d]/g, ""))} className="w-24" />
                <Button type="submit" disabled={thr === String(t)}>Apply</Button>
              </form>
            </div>
            <BulkBar count={selected.length} onClear={() => setSelected([])}>
              <Button size="sm" onClick={() => setBulk(true)}>Update stock…</Button>
            </BulkBar>
            <DataTable columns={columns} rows={paged.pageItems} rowKey={(r) => r.key} loading={loading} sort={sort} onSort={toggle} selected={selected} onSelectedChange={setSelected} compact={state.settings.compactTables}
              empty={<EmptyState icon={<Boxes />} title="No variants match" description="Change the filters or search term." action={<Button onClick={() => { setQ(""); setCat("all"); setSt("all"); }}>Clear filters</Button>} />} />
            {!loading && rows.length > 0 && <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPage={paged.setPage} onPageSize={paged.setPageSize} />}
          </>
        ) : (
          <>
            <CardHeader title="Inventory movement history" subtitle="Restocks, sales, returns and manual adjustments (live changes are logged here too)" className="pb-3" />
            <div className="flex flex-wrap gap-2 border-y border-a-line px-4 py-3">
              <SearchInput className="w-full sm:w-64" value={q} onChange={setQ} placeholder="Search by product…" />
              <FilterSelect aria-label="Movement type" value={mvType} onChange={(e) => setMvType(e.target.value)}><option value="all">All types</option>{["Restock", "Sale", "Adjustment", "Return", "Damaged"].map((m) => <option key={m}>{m}</option>)}</FilterSelect>
            </div>
            <DataTable loading={loading} rows={mvPaged.pageItems} rowKey={(m) => m.id}
              columns={[
                { key: "at", header: "When", render: (m) => <span className="whitespace-nowrap text-a-muted">{fmtDateTime(m.at)}</span> },
                { key: "p", header: "Product", render: (m) => <div><p className="font-medium">{m.productName}</p><p className="text-xs text-a-muted">{m.variantLabel}</p></div> },
                { key: "t", header: "Type", render: (m) => <Badge tone={m.type === "Restock" || m.type === "Return" ? "green" : m.type === "Sale" ? "blue" : m.type === "Damaged" ? "red" : "gray"}>{m.type}</Badge> },
                { key: "d", header: "Change", align: "right", render: (m) => <span className={m.delta >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>{m.delta > 0 ? "+" : ""}{m.delta}</span> },
                { key: "a", header: "Stock after", align: "right", hideOnMobile: true, render: (m) => m.after },
                { key: "n", header: "Note", hideOnMobile: true, render: (m) => <span className="text-a-muted">{m.note}</span> },
              ] as Column<(typeof movements)[number]>[]}
              empty={<EmptyState icon={<History />} title="No movements" description="Nothing matches this filter." />} />
            {!loading && movements.length > 0 && <Pagination page={mvPaged.page} pageSize={mvPaged.pageSize} total={mvPaged.total} onPage={mvPaged.setPage} />}
          </>
        )}
      </Card>
      <p className="mt-3 text-xs text-a-muted">Tip: type a quantity and press Enter to save. Stock of 0 automatically marks a variant unavailable; after restocking, switch it back on. <Link href="/admin/products" className="text-a-accent hover:underline">Manage products</Link></p>

      <Modal open={bulk} onClose={() => setBulk(false)} size="sm" title="Bulk stock update" description={`${selected.length} variant${selected.length === 1 ? "" : "s"} selected`}
        footer={<><Button onClick={() => setBulk(false)}>Cancel</Button><Button variant="primary" onClick={doBulk}>Apply update</Button></>}>
        <div className="space-y-4">
          <Segmented label="Mode" value={bulkMode} onChange={setBulkMode} options={[{ value: "add", label: "Add / remove" }, { value: "set", label: "Set exact quantity" }]} />
          <TextField label={bulkMode === "add" ? "Units to add (use a negative number to remove)" : "New quantity"} inputMode="numeric" value={bulkVal} onChange={(e) => setBulkVal(e.target.value.replace(bulkMode === "add" ? /[^\d-]/g : /[^\d]/g, ""))} data-autofocus />
          <p className="text-xs text-a-muted">Variants that reach 0 are marked unavailable automatically. Restocked variants stay unavailable until you switch them on.</p>
        </div>
      </Modal>
    </>
  );
}
