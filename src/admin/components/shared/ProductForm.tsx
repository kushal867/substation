"use client";

import clsx from "clsx";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { uid, npr } from "../../lib/format";
import { availableStock, DEFAULT_SCHEMA, effectivePrice, productStatus, schemaOf, STATUS_LABEL } from "../../lib/selectors";
import { useAdmin } from "../../store/AdminStore";
import type { Product, Variant } from "../../types";
import { Badge, STOCK_TONE } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Feedback";
import { Field, SelectField, TextArea, TextField, Toggle, inputCls } from "../ui/Fields";
import { Modal } from "../ui/Modal";
import { ImageThumb } from "./ImageThumb";

interface DraftVariant { id: string; sku: string; size: string; color: string; price: string; stock: string; available: boolean; isNew: boolean }
interface Draft { name: string; categoryId: string; description: string; basePrice: string; image: string; active: boolean; variants: DraftVariant[] }
type Errors = Record<string, string>;

const newSku = () => "SKU-" + Math.random().toString(36).slice(2, 7).toUpperCase();
const blankVariant = (): DraftVariant => ({ id: uid("var"), sku: newSku(), size: "", color: "", price: "", stock: "0", available: false, isNew: true });

function toDraft(p: Product | null, defaultCat: string): Draft {
  if (!p) return { name: "", categoryId: defaultCat, description: "", basePrice: "", image: "", active: true, variants: [blankVariant()] };
  return {
    name: p.name, categoryId: p.categoryId, description: p.description, basePrice: String(p.basePrice), image: p.image, active: p.active,
    variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, size: v.size, color: v.color, price: v.price != null ? String(v.price) : "", stock: String(v.stock), available: v.available, isNew: false })),
  };
}

/** Downscale uploaded images so they stay small in the database. Prefer an image URL for large photos. */
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Could not read file"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a valid image"));
      img.onload = () => {
        const max = 480;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}

export function ProductFormModal({ open, product, onClose }: { open: boolean; product: Product | null; onClose: () => void }) {
  // Key remounts the inner form each time it opens so state is always fresh.
  if (!open) return null;
  return <FormInner key={product?.id ?? "new"} product={product} onClose={onClose} />;
}

function FormInner({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { state, saveProduct } = useAdmin();
  const toast = useToast();
  const cats = state.categories;
  const [d, setD] = useState<Draft>(() => toDraft(product, cats.find((c) => c.active)?.id ?? cats[0]?.id ?? ""));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const schema = schemaOf(cats, d.categoryId) ?? DEFAULT_SCHEMA;
  const category = cats.find((c) => c.id === d.categoryId);
  const threshold = state.settings.lowStockThreshold;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setVar = (id: string, patch: Partial<DraftVariant>) => setD((x) => ({ ...x, variants: x.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));

  const draftProduct = useMemo<Product>(() => {
    const base = Number(d.basePrice) || 0;
    return {
      id: product?.id ?? "preview", name: d.name || "Product name", categoryId: d.categoryId, description: d.description, basePrice: base, image: d.image, active: d.active, createdAt: product?.createdAt ?? new Date().toISOString(),
      variants: d.variants.map<Variant>((v) => ({ id: v.id, sku: v.sku, size: v.size.trim(), color: v.color.trim(), price: v.price.trim() && Number(v.price) > 0 ? Number(v.price) : undefined, stock: Math.max(0, Math.floor(Number(v.stock) || 0)), available: v.available && Number(v.stock) > 0, updatedAt: new Date().toISOString() })),
    };
  }, [d, product]);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!d.name.trim()) e.name = "Product name is required.";
    else if (d.name.trim().length < 3) e.name = "Use at least 3 characters.";
    else if (state.products.some((p) => p.id !== product?.id && p.name.trim().toLowerCase() === d.name.trim().toLowerCase())) e.name = "A product with this name already exists.";
    if (!d.categoryId) e.categoryId = "Choose a category.";
    if (d.basePrice.trim() === "") e.basePrice = "Base price is required.";
    else if (!Number.isFinite(Number(d.basePrice)) || Number(d.basePrice) <= 0) e.basePrice = "Enter a price greater than 0.";
    else if (Number(d.basePrice) > 10_000_000) e.basePrice = "Price looks too high for this store.";
    if (d.image.trim() && !/^(https?:\/\/|data:image\/|\/)/i.test(d.image.trim())) e.image = "Use an http(s) URL, a /path or upload a file.";
    if (d.variants.length === 0) e.variants = "Add at least one variant.";
    const seen = new Set<string>();
    d.variants.forEach((v) => {
      if (schema.colorRequired && !v.color.trim()) e[`${v.id}.color`] = `${schema.colorLabel} is required.`;
      if (schema.sizeRequired && !v.size.trim()) e[`${v.id}.size`] = `${schema.sizeLabel} is required.`;
      if (v.price.trim() && (!Number.isFinite(Number(v.price)) || Number(v.price) <= 0)) e[`${v.id}.price`] = "Must be above 0.";
      if (v.stock.trim() === "" || !Number.isInteger(Number(v.stock)) || Number(v.stock) < 0) e[`${v.id}.stock`] = "Whole number ≥ 0.";
      const key = `${v.color.trim().toLowerCase()}|${v.size.trim().toLowerCase()}`;
      if (seen.has(key)) e[`${v.id}.color`] = "Duplicate variant.";
      seen.add(key);
    });
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    const out: Product = {
      ...draftProduct,
      id: product?.id ?? uid("prod"),
      name: d.name.trim(),
      description: d.description.trim(),
      image: d.image.trim(),
      basePrice: Number(d.basePrice),
      variants: draftProduct.variants.map((v) => ({ ...v, updatedAt: product?.variants.find((x) => x.id === v.id)?.stock === v.stock ? product?.variants.find((x) => x.id === v.id)?.updatedAt ?? v.updatedAt : new Date().toISOString() })),
    };
    saveProduct(out);
    setSaving(false);
    toast.success(product ? `“${out.name}” updated.` : `“${out.name}” added to the catalogue.`);
    onClose();
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErrors((e) => ({ ...e, image: "Please choose an image file." }));
    setImgBusy(true);
    try {
      set("image", await readImage(f));
      setErrors((e) => { const { image: _i, ...r } = e; return r; });
    } catch (err) {
      setErrors((e) => ({ ...e, image: (err as Error).message }));
    } finally {
      setImgBusy(false);
    }
  };

  const status = productStatus(draftProduct, threshold);
  const prices = draftProduct.variants.map((v) => effectivePrice(draftProduct, v));
  const minP = prices.length ? Math.min(...prices) : draftProduct.basePrice;
  const maxP = prices.length ? Math.max(...prices) : draftProduct.basePrice;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={product ? `Edit ${product.name}` : "Add product"}
      description="Variants and stock are saved with the product and update inventory immediately."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={submit}>{product ? "Save changes" : "Create product"}</Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField wrapperClassName="sm:col-span-2" label="Product name" required value={d.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="e.g. Nike Air Max" maxLength={80} />
            <SelectField label="Category" required value={d.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
              <option value="">Select category…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inactive)"}</option>)}
            </SelectField>
            <TextField label="Base price (NPR)" required inputMode="decimal" value={d.basePrice} onChange={(e) => set("basePrice", e.target.value)} error={errors.basePrice} placeholder="0" />
            <TextArea wrapperClassName="sm:col-span-2" label="Description" value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Materials, fit, key features…" maxLength={600} />
          </div>

          <div>
            <Field label="Product image" error={errors.image} hint="Paste an image URL or upload a local file (previewed only, resized and stored in your browser).">
              {(id) => (
                <div className="flex gap-3">
                  <ImageThumb src={d.image} name={d.name || "Preview"} category={category?.name} className="h-16 w-16" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input id={id} className={inputCls} value={d.image.startsWith("data:") ? "" : d.image} placeholder={d.image.startsWith("data:") ? "Local file selected" : "https://…/image.jpg"} onChange={(e) => set("image", e.target.value)} />
                    <div className="flex gap-2">
                      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
                      <Button size="sm" loading={imgBusy} onClick={() => file.current?.click()}><Upload className="h-3.5 w-3.5" />Upload</Button>
                      {d.image && <Button size="sm" variant="ghost" onClick={() => set("image", "")}>Remove</Button>}
                    </div>
                  </div>
                </div>
              )}
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-a-line bg-a-subtle px-4 py-3">
            <div>
              <p className="text-sm font-medium text-a-fg">Active</p>
              <p className="text-xs text-a-muted">Inactive products are hidden from the storefront.</p>
            </div>
            <Toggle checked={d.active} onChange={(v) => set("active", v)} label="Product active" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-a-fg">Variants</h3>
                <p className="text-xs text-a-muted">
                  {schema.colorLabel}{schema.colorRequired ? " *" : ""} · {schema.sizeLabel}{schema.sizeRequired ? " *" : " (optional)"}. Leave price empty to use the base price.
                </p>
              </div>
              <Button size="sm" onClick={() => set("variants", [...d.variants, blankVariant()])}><Plus className="h-3.5 w-3.5" />Add variant</Button>
            </div>
            {errors.variants && <p role="alert" className="mb-2 text-xs text-red-600">{errors.variants}</p>}
            <div className="space-y-2">
              {d.variants.map((v, idx) => (
                <div key={v.id} className="rounded-lg border border-a-line p-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
                    <TextField wrapperClassName="sm:col-span-3" label={schema.colorLabel} required={schema.colorRequired} value={v.color} onChange={(e) => setVar(v.id, { color: e.target.value })} error={errors[`${v.id}.color`]} placeholder="e.g. Black" />
                    <TextField wrapperClassName="sm:col-span-3" label={schema.sizeLabel} required={schema.sizeRequired} value={v.size} onChange={(e) => setVar(v.id, { size: e.target.value })} error={errors[`${v.id}.size`]} placeholder={/size/i.test(schema.sizeLabel) ? "e.g. 42" : ""} />
                    <TextField wrapperClassName="sm:col-span-3" label="Price (NPR)" inputMode="decimal" value={v.price} onChange={(e) => setVar(v.id, { price: e.target.value })} error={errors[`${v.id}.price`]} placeholder={d.basePrice ? `Base ${d.basePrice}` : "Base price"} />
                    <TextField wrapperClassName="sm:col-span-3" label="Stock" inputMode="numeric" value={v.stock} onChange={(e) => { const n = e.target.value; setVar(v.id, { stock: n, available: Number(n) > 0 ? (v.isNew && !v.available && Number(v.stock) === 0 ? true : v.available) : false }); }} error={errors[`${v.id}.stock`]} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-a-muted">
                      <Toggle size="sm" checked={v.available && Number(v.stock) > 0} disabled={!(Number(v.stock) > 0)} onChange={(a) => setVar(v.id, { available: a })} label={`Variant ${idx + 1} available`} />
                      {v.available && Number(v.stock) > 0 ? "Available" : Number(v.stock) > 0 ? "Unavailable" : "Unavailable (no stock)"}
                      <span className="hidden text-a-muted/70 sm:inline">· {v.sku}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" aria-label={`Remove variant ${idx + 1}`} onClick={() => set("variants", d.variants.filter((x) => x.id !== v.id))}>
                      <Trash2 className="h-3.5 w-3.5" />Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside aria-label="Live preview" className="lg:sticky lg:top-0 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-a-muted">Live preview</p>
          <div className="overflow-hidden rounded-xl border border-a-line">
            <div className="flex aspect-[4/3] items-center justify-center bg-a-subtle">
              <ImageThumb src={d.image} name={d.name || "Preview"} category={category?.name} className="h-full w-full rounded-none" />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="indigo">{category?.name ?? "No category"}</Badge>
                <Badge tone={d.active ? "green" : "gray"} dot>{d.active ? "Active" : "Inactive"}</Badge>
                <Badge tone={STOCK_TONE[status]}>{STATUS_LABEL[status]}</Badge>
              </div>
              <h4 className={clsx("text-base font-semibold", !d.name && "text-a-muted")}>{d.name || "Product name"}</h4>
              <p className="text-sm font-semibold text-a-accent">{minP === maxP ? npr(minP) : `${npr(minP)} – ${npr(maxP)}`}</p>
              {d.description && <p className="line-clamp-3 text-xs text-a-muted">{d.description}</p>}
              <p className="text-xs text-a-muted">{draftProduct.variants.length} variant{draftProduct.variants.length === 1 ? "" : "s"} · {availableStock(draftProduct)} units available</p>
              <ul className="divide-y divide-a-line rounded-lg border border-a-line text-xs">
                {draftProduct.variants.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                    <span className="min-w-0 truncate font-medium text-a-fg">{[v.color, v.size].filter(Boolean).join(" / ") || "—"}</span>
                    <span className="flex shrink-0 items-center gap-2 text-a-muted">
                      <span>{npr(effectivePrice(draftProduct, v))}{v.price == null && <span className="ml-1 text-[10px]">(base)</span>}</span>
                      <span className={clsx("rounded px-1.5 py-0.5", v.available ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10")}>{v.stock}</span>
                    </span>
                  </li>
                ))}
                {draftProduct.variants.length === 0 && <li className="flex items-center gap-2 px-2.5 py-3 text-a-muted"><ImagePlus className="h-3.5 w-3.5" />No variants yet</li>}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
