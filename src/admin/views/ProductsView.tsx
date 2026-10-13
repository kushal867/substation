"use client";

import { Copy, Eye, EyeOff, LayoutGrid, List, MoreHorizontal, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ImageThumb } from "../components/shared/ImageThumb";
import { ProductFormModal } from "../components/shared/ProductForm";
import { Badge, STOCK_TONE } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, Pagination, type Column } from "../components/ui/DataTable";
import { Checkbox, FilterSelect, SearchInput } from "../components/ui/Fields";
import { useConfirm, useToast } from "../components/ui/Feedback";
import { BulkBar, EmptyState, PageHeader, Segmented } from "../components/ui/Misc";
import { Menu } from "../components/ui/Popover";
import { usePageLoading } from "../hooks/usePageLoading";
import { usePaged } from "../hooks/usePaged";
import { useTableSort } from "../hooks/useTableSort";
import { fmtDate, npr } from "../lib/format";
import { availableStock, effectivePrice, productStatus, sortBy, STATUS_LABEL } from "../lib/selectors";
import { useAdmin } from "../store/AdminStore";
import type { Product, StockStatus } from "../types";

export default function ProductsView() {
  const { state, deleteProducts, setProductsActive, duplicateProduct } = useAdmin();
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const params = useSearchParams();
  const loading = usePageLoading();
  const threshold = state.settings.lowStockThreshold;

  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState("all");
  const [avail, setAvail] = useState<"all" | StockStatus>("all");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { sort, toggle } = useTableSort({ key: "date", dir: "desc" });

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      router.replace("/admin/products");
    }
  }, [params, router]);

  const catName = (id: string) => state.categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = state.products.filter((p) =>
      (!term || p.name.toLowerCase().includes(term)) &&
      (cat === "all" || p.categoryId === cat) &&
      (avail === "all" || productStatus(p, threshold) === avail) &&
      (active === "all" || (active === "active") === p.active),
    );
    const get: Record<string, (p: Product) => string | number> = {
      name: (p) => p.name, price: (p) => p.basePrice, stock: (p) => availableStock(p), date: (p) => new Date(p.createdAt).getTime(),
      category: (p) => catName(p.categoryId), variants: (p) => p.variants.length,
    };
    return sortBy(rows, get[sort.key] ?? get.date, sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.products, state.categories, q, cat, avail, active, sort, threshold]);

  const paged = usePaged(filtered, state.settings.pageSize);
  useEffect(() => { paged.setPage(1); setSelected([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, cat, avail, active, sort]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); };

  const remove = async (ids: string[]) => {
    const names = state.products.filter((p) => ids.includes(p.id)).map((p) => p.name);
    const ok = await confirm({
      title: ids.length === 1 ? `Delete “${names[0]}”?` : `Delete ${ids.length} products?`,
      description: "This removes the product and all of its variants from the catalogue and inventory. Past orders keep their line items. This can’t be undone (except by resetting demo data).",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    deleteProducts(ids);
    setSelected((s) => s.filter((i) => !ids.includes(i)));
    toast.success(ids.length === 1 ? `“${names[0]}” deleted.` : `${ids.length} products deleted.`);
  };

  const bulkActive = (a: boolean) => {
    setProductsActive(selected, a);
    toast.success(`${selected.length} product${selected.length === 1 ? "" : "s"} ${a ? "activated" : "deactivated"}.`);
    setSelected([]);
  };

  const duplicate = (p: Product) => {
    const c = duplicateProduct(p.id);
    if (c) toast.success(`Duplicated as “${c.name}” (inactive draft).`);
  };

  const actionsFor = (p: Product) => (
    <Menu
      label={`Actions for ${p.name}`}
      trigger={<button type="button" aria-label={`Actions for ${p.name}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-a-muted hover:bg-a-subtle hover:text-a-fg"><MoreHorizontal className="h-4 w-4" /></button>}
      items={[
        { label: "Edit", icon: <Pencil />, onClick: () => openEdit(p) },
        { label: "Duplicate", icon: <Copy />, onClick: () => duplicate(p) },
        { label: p.active ? "Deactivate" : "Activate", icon: p.active ? <EyeOff /> : <Eye />, onClick: () => { setProductsActive([p.id], !p.active); toast.success(`“${p.name}” ${p.active ? "deactivated" : "activated"}.`); } },
        { label: "Delete", icon: <Trash2 />, danger: true, divider: true, onClick: () => remove([p.id]) },
      ]}
    />
  );

  const columns: Column<Product>[] = [
    { key: "name", header: "Product", sortable: true, render: (p) => (
      <div className="flex min-w-[12rem] items-center gap-3">
        <ImageThumb src={p.image} name={p.name} category={catName(p.categoryId)} />
        <div className="min-w-0"><p className="truncate font-medium text-a-fg">{p.name}</p><p className="truncate text-xs text-a-muted">{p.variants[0]?.sku}{p.variants.length > 1 && ` +${p.variants.length - 1}`}</p></div>
      </div>) },
    { key: "category", header: "Category", sortable: true, hideOnMobile: true, render: (p) => <span className="text-a-muted">{catName(p.categoryId)}</span> },
    { key: "price", header: "Base price", sortable: true, align: "right", render: (p) => <span className="font-medium">{npr(p.basePrice)}</span> },
    { key: "variants", header: "Variants", sortable: true, align: "center", hideOnMobile: true, render: (p) => p.variants.length },
    { key: "stock", header: "Stock", sortable: true, render: (p) => { const s = productStatus(p, threshold); return <div className="flex items-center gap-2"><span className="w-8 tabular-nums">{availableStock(p)}</span><Badge tone={STOCK_TONE[s]}>{STATUS_LABEL[s]}</Badge></div>; } },
    { key: "status", header: "Status", hideOnMobile: true, render: (p) => <Badge tone={p.active ? "green" : "gray"} dot>{p.active ? "Active" : "Inactive"}</Badge> },
    { key: "date", header: "Created", sortable: true, hideOnMobile: true, render: (p) => <span className="whitespace-nowrap text-a-muted">{fmtDate(p.createdAt)}</span> },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", render: (p) => actionsFor(p) },
  ];

  const filtersActive = q || cat !== "all" || avail !== "all" || active !== "all";
  const clear = () => { setQ(""); setCat("all"); setAvail("all"); setActive("all"); };
  const empty = (
    <EmptyState
      icon={<Package />}
      title={filtersActive ? "No products match your filters" : "No products yet"}
      description={filtersActive ? "Try a different search term or clear the filters." : "Add your first product to start selling."}
      action={filtersActive ? <Button onClick={clear}>Clear filters</Button> : <Button variant="primary" onClick={openNew}><Plus className="h-4 w-4" />Add product</Button>}
    />
  );

  return (
    <>
      <PageHeader
        title="Products"
        description={`${state.products.length} products · ${state.products.filter((p) => p.active).length} active`}
        actions={<Button variant="primary" onClick={openNew}><Plus className="h-4 w-4" />Add product</Button>}
      />
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-a-line p-3 sm:p-4">
          <SearchInput className="w-full sm:w-64" value={q} onChange={setQ} placeholder="Search products…" />
          <FilterSelect aria-label="Filter by category" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect aria-label="Filter by availability" value={avail} onChange={(e) => setAvail(e.target.value as typeof avail)}>
            <option value="all">Any availability</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </FilterSelect>
          <FilterSelect aria-label="Filter by status" value={active} onChange={(e) => setActive(e.target.value as typeof active)}>
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
          {view === "grid" && (
            <FilterSelect aria-label="Sort products" value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(":"); toggle(key); if (sort.key === key && sort.dir !== dir) toggle(key); }}>
              <option value="date:desc">Newest</option><option value="date:asc">Oldest</option>
              <option value="name:asc">Name A–Z</option><option value="name:desc">Name Z–A</option>
              <option value="price:asc">Price low–high</option><option value="price:desc">Price high–low</option>
              <option value="stock:asc">Stock low–high</option><option value="stock:desc">Stock high–low</option>
            </FilterSelect>
          )}
          <div className="ml-auto">
            <Segmented label="View" value={view} onChange={setView} options={[{ value: "table", label: <><List className="h-3.5 w-3.5" />Table</> }, { value: "grid", label: <><LayoutGrid className="h-3.5 w-3.5" />Grid</> }]} />
          </div>
        </div>
        <BulkBar count={selected.length} onClear={() => setSelected([])}>
          <Button size="sm" onClick={() => bulkActive(true)}><Eye className="h-3.5 w-3.5" />Activate</Button>
          <Button size="sm" onClick={() => bulkActive(false)}><EyeOff className="h-3.5 w-3.5" />Deactivate</Button>
          <Button size="sm" variant="danger" onClick={() => remove(selected)}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
        </BulkBar>

        {view === "table" ? (
          <DataTable columns={columns} rows={paged.pageItems} rowKey={(p) => p.id} loading={loading} sort={sort} onSort={toggle} selected={selected} onSelectedChange={setSelected} onRowClick={openEdit} empty={empty} compact={state.settings.compactTables} />
        ) : loading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="a-skeleton h-64 rounded-xl" />)}</div>
        ) : paged.pageItems.length === 0 ? empty : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.pageItems.map((p) => {
              const s = productStatus(p, threshold);
              const isSel = selected.includes(p.id);
              return (
                <div key={p.id} className={clsx("group relative overflow-hidden rounded-xl border bg-a-surface transition-shadow hover:shadow-md", isSel ? "border-a-accent ring-1 ring-a-accent" : "border-a-line")}>
                  <button onClick={() => openEdit(p)} className="block w-full text-left" aria-label={`Edit ${p.name}`}>
                    <div className="aspect-[4/3] bg-a-subtle"><ImageThumb src={p.image} name={p.name} category={catName(p.categoryId)} className="h-full w-full rounded-none" /></div>
                  </button>
                  <div className="absolute left-2 top-2 rounded-md bg-a-surface/90 p-1"><Checkbox label={`Select ${p.name}`} checked={isSel} onChange={(v) => setSelected((x) => (v ? [...x, p.id] : x.filter((i) => i !== p.id)))} /></div>
                  <div className="absolute right-2 top-2 rounded-lg bg-a-surface/90">{actionsFor(p)}</div>
                  <div className="space-y-1.5 p-3.5">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs text-a-muted">{catName(p.categoryId)}</span><Badge tone={p.active ? "green" : "gray"} dot>{p.active ? "Active" : "Inactive"}</Badge></div>
                    <p className="truncate font-medium text-a-fg">{p.name}</p>
                    <div className="flex items-center justify-between"><span className="text-sm font-semibold">{npr(p.basePrice)}</span><Badge tone={STOCK_TONE[s]}>{availableStock(p)} · {STATUS_LABEL[s]}</Badge></div>
                    <p className="text-xs text-a-muted">{p.variants.length} variants · added {fmtDate(p.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && filtered.length > 0 && <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPage={paged.setPage} onPageSize={paged.setPageSize} />}
      </Card>
      <ProductFormModal open={formOpen} product={editing} onClose={() => setFormOpen(false)} />
    </>
  );
}
