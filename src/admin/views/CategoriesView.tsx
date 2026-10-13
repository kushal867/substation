"use client";

import { AlertTriangle, Pencil, Plus, Tags, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ImageThumb } from "../components/shared/ImageThumb";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FilterSelect, SearchInput, SelectField, TextArea, TextField, Toggle, inputCls, Field } from "../components/ui/Fields";
import { useToast } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader } from "../components/ui/Misc";
import { usePageLoading } from "../hooks/usePageLoading";
import { uid } from "../lib/format";
import { useAdmin } from "../store/AdminStore";
import type { Category } from "../types";

const blank = (): Category => ({
  id: "", name: "", description: "", image: "", active: true, createdAt: "",
  variantSchema: { sizeLabel: "Size", sizeRequired: false, colorLabel: "Color", colorRequired: true },
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * k; c.height = img.height * k;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => rej(new Error("Not a valid image"));
      img.src = String(fr.result);
    };
    fr.onerror = () => rej(new Error("Could not read file"));
    fr.readAsDataURL(file);
  });
}

function CategoryForm({ cat, onClose }: { cat: Category | null; onClose: () => void }) {
  const { state, saveCategory } = useAdmin();
  const toast = useToast();
  const [d, setD] = useState<Category>(cat ?? blank());
  const [err, setErr] = useState<Record<string, string>>({});
  const file = useRef<HTMLInputElement>(null);
  const setS = (patch: Partial<Category["variantSchema"]>) => setD((x) => ({ ...x, variantSchema: { ...x.variantSchema, ...patch } }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Category name is required.";
    else if (state.categories.some((c) => c.id !== d.id && c.name.toLowerCase() === d.name.trim().toLowerCase())) e.name = "A category with this name already exists.";
    if (!d.variantSchema.colorLabel.trim()) e.color = "Label required.";
    if (!d.variantSchema.sizeLabel.trim()) e.size = "Label required.";
    if (d.image && !/^(https?:\/\/|data:image\/|\/)/i.test(d.image)) e.image = "Use an http(s) URL or upload an image.";
    setErr(e);
    if (Object.keys(e).length) return toast.error("Please fix the highlighted fields.");
    saveCategory({ ...d, name: d.name.trim(), description: d.description.trim(), id: d.id || uid("cat"), createdAt: d.createdAt || new Date().toISOString() });
    toast.success(cat ? `Category “${d.name}” updated.` : `Category “${d.name}” created.`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={cat ? "Edit category" : "New category"} description="Variant attributes decide which fields products in this category use." footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>{cat ? "Save changes" : "Create category"}</Button></>}>
      <div className="space-y-4">
        <TextField label="Name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={err.name} maxLength={40} placeholder="e.g. Watches" />
        <TextArea label="Description" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} maxLength={200} />
        <Field label="Image" error={err.image} hint="URL or local file (resized & kept in your browser).">
          {(id) => (
            <div className="flex gap-3">
              <ImageThumb src={d.image} name={d.name || "Category"} category={d.name} className="h-14 w-14" />
              <div className="flex-1 space-y-2">
                <input id={id} className={inputCls} placeholder={d.image.startsWith("data:") ? "Local file selected" : "https://…"} value={d.image.startsWith("data:") ? "" : d.image} onChange={(e) => setD({ ...d, image: e.target.value })} />
                <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) try { setD({ ...d, image: await fileToDataUrl(f) }); } catch (x) { setErr({ ...err, image: (x as Error).message }); } }} />
                <div className="flex gap-2"><Button size="sm" onClick={() => file.current?.click()}><Upload className="h-3.5 w-3.5" />Upload</Button>{d.image && <Button size="sm" variant="ghost" onClick={() => setD({ ...d, image: "" })}>Remove</Button>}</div>
              </div>
            </div>
          )}
        </Field>
        <div className="rounded-lg border border-a-line p-3">
          <p className="mb-3 text-sm font-medium text-a-fg">Variant attributes</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Color attribute label" value={d.variantSchema.colorLabel} onChange={(e) => setS({ colorLabel: e.target.value })} error={err.color} placeholder="Color / Frame color / Strap" />
            <SelectField label="Color attribute" value={d.variantSchema.colorRequired ? "req" : "opt"} onChange={(e) => setS({ colorRequired: e.target.value === "req" })}>
              <option value="req">Required</option><option value="opt">Optional</option>
            </SelectField>
            <TextField label="Size attribute label" value={d.variantSchema.sizeLabel} onChange={(e) => setS({ sizeLabel: e.target.value })} error={err.size} placeholder="Size / Lens size / Material" />
            <SelectField label="Size attribute" value={d.variantSchema.sizeRequired ? "req" : "opt"} onChange={(e) => setS({ sizeRequired: e.target.value === "req" })}>
              <option value="req">Required</option><option value="opt">Optional</option>
            </SelectField>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-a-line bg-a-subtle px-4 py-3">
          <div><p className="text-sm font-medium">Active</p><p className="text-xs text-a-muted">Inactive categories are hidden from the storefront.</p></div>
          <Toggle checked={d.active} onChange={(v) => setD({ ...d, active: v })} label="Category active" />
        </div>
      </div>
    </Modal>
  );
}

function DeleteCategory({ cat, count, onClose }: { cat: Category; count: number; onClose: () => void }) {
  const { state, deleteCategory } = useAdmin();
  const toast = useToast();
  const others = state.categories.filter((c) => c.id !== cat.id);
  const [target, setTarget] = useState(others[0]?.id ?? "");
  const needsTarget = count > 0 && others.length > 0;
  return (
    <Modal open size="sm" onClose={onClose} title={`Delete “${cat.name}”?`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="danger" data-autofocus onClick={() => { deleteCategory(cat.id, needsTarget ? target : undefined); toast.success(count ? `“${cat.name}” deleted; ${count} product${count === 1 ? "" : "s"} moved.` : `“${cat.name}” deleted.`); onClose(); }}>Delete category</Button></>}>
      {count > 0 ? (
        <div className="space-y-3">
          <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>This category contains <strong>{count} product{count === 1 ? "" : "s"}</strong>. They will not be deleted — choose where to move them.</p>
          </div>
          {needsTarget ? (
            <SelectField label="Move products to" value={target} onChange={(e) => setTarget(e.target.value)}>
              {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
          ) : <p className="text-sm text-a-muted">There is no other category, so the products will become “Uncategorized”.</p>}
        </div>
      ) : <p className="text-sm text-a-muted">This category is empty. This action can’t be undone (except by resetting demo data).</p>}
    </Modal>
  );
}

export default function CategoriesView() {
  const { state, saveCategory } = useAdmin();
  const toast = useToast();
  const loading = usePageLoading();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState<{ cat: Category | null } | null>(null);
  const [del, setDel] = useState<Category | null>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    state.products.forEach((p) => m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1));
    return m;
  }, [state.products]);

  const rows = state.categories.filter((c) => (!q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.description.toLowerCase().includes(q.trim().toLowerCase())) && (status === "all" || (status === "active") === c.active));

  return (
    <>
      <PageHeader title="Categories" description={`${state.categories.length} categories · ${state.categories.filter((c) => c.active).length} active`} actions={<Button variant="primary" onClick={() => setForm({ cat: null })}><Plus className="h-4 w-4" />New category</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput className="w-full sm:w-72" value={q} onChange={setQ} placeholder="Search categories…" />
        <FilterSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </FilterSelect>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="a-skeleton h-60 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card><EmptyState icon={<Tags />} title="No categories found" description="Adjust your search or create a new category." action={<Button variant="primary" onClick={() => setForm({ cat: null })}>New category</Button>} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative h-32 bg-a-subtle">
                <ImageThumb src={c.image} name={c.name} category={c.name} className="h-full w-full rounded-none" />
                <div className="absolute right-2 top-2"><Badge tone={c.active ? "green" : "gray"} dot className="bg-a-surface/90">{c.active ? "Active" : "Inactive"}</Badge></div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <div className="flex items-center justify-between gap-2"><h3 className="truncate font-semibold text-a-fg">{c.name}</h3><span className="shrink-0 text-xs font-medium text-a-accent">{counts.get(c.id) ?? 0} products</span></div>
                  <p className="mt-1 line-clamp-2 min-h-8 text-xs text-a-muted">{c.description || "No description."}</p>
                  <p className="mt-1 text-[11px] text-a-muted/80">Variants: {c.variantSchema.colorLabel}{c.variantSchema.colorRequired ? "*" : ""} · {c.variantSchema.sizeLabel}{c.variantSchema.sizeRequired ? "*" : ""}</p>
                </div>
                <div className="flex items-center justify-between border-t border-a-line pt-3">
                  <div className="flex items-center gap-2 text-xs text-a-muted"><Toggle size="sm" checked={c.active} label={`${c.name} active`} onChange={(v) => { saveCategory({ ...c, active: v }); toast.success(`“${c.name}” ${v ? "activated" : "deactivated"}.`); }} />{c.active ? "Active" : "Inactive"}</div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setForm({ cat: c })}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDel(c)}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {form && <CategoryForm key={form.cat?.id ?? "new"} cat={form.cat} onClose={() => setForm(null)} />}
      {del && <DeleteCategory cat={del} count={counts.get(del.id) ?? 0} onClose={() => setDel(null)} />}
    </>
  );
}
