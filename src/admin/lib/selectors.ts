import type { AdminState, Category, Customer, Order, Product, StockStatus, Variant, VariantSchema } from "../types";
import { orderTotal } from "./range";

export const DEFAULT_SCHEMA: VariantSchema = {
  sizeLabel: "Size",
  sizeRequired: false,
  colorLabel: "Color",
  colorRequired: true,
};

export const effectivePrice = (p: Product, v: Variant) => (v.price != null && v.price > 0 ? v.price : p.basePrice);

export const variantLabel = (v: Pick<Variant, "size" | "color">) =>
  [v.color, v.size].filter(Boolean).join(" / ") || "Default";

export function variantStatus(v: Variant, threshold: number): StockStatus {
  if (v.stock <= 0) return "out";
  if (v.stock <= threshold) return "low";
  return "in";
}

/** Units that can actually be sold (available variants only). */
export const availableStock = (p: Product) =>
  p.variants.reduce((s, v) => s + (v.available ? v.stock : 0), 0);

export function productStatus(p: Product, threshold: number): StockStatus {
  if (availableStock(p) <= 0) return "out";
  if (p.variants.some((v) => v.available && v.stock > 0 && v.stock <= threshold)) return "low";
  return "in";
}

export const categoryOf = (cats: Category[], id: string) => cats.find((c) => c.id === id);
export const schemaOf = (cats: Category[], id: string) => categoryOf(cats, id)?.variantSchema ?? DEFAULT_SCHEMA;

export interface CustomerStats {
  orders: number;
  spent: number;
  lastOrder?: string;
}

export function customerStats(c: Customer, orders: Order[]): CustomerStats {
  const mine = orders.filter((o) => o.customerId === c.id && o.orderStatus !== "Cancelled");
  const last = orders
    .filter((o) => o.customerId === c.id)
    .reduce<string | undefined>((m, o) => (!m || o.date > m ? o.date : m), undefined);
  return { orders: mine.length, spent: mine.reduce((s, o) => s + orderTotal(o), 0), lastOrder: last };
}

export function inventoryTotals(state: AdminState) {
  const t = state.settings.lowStockThreshold;
  let units = 0, inStock = 0, low = 0, out = 0, value = 0;
  for (const p of state.products) {
    for (const v of p.variants) {
      const s = variantStatus(v, t);
      if (s === "out") out++;
      else if (s === "low") low++;
      else inStock++;
      if (v.available) {
        units += v.stock;
        value += v.stock * effectivePrice(p, v);
      }
    }
  }
  return { units, inStock, low, out, value };
}

export const STATUS_LABEL: Record<StockStatus, string> = { in: "In stock", low: "Low stock", out: "Out of stock" };

export function sortBy<T>(arr: T[], get: (t: T) => string | number, dir: "asc" | "desc") {
  const m = dir === "asc" ? 1 : -1;
  return [...arr].sort((a, b) => {
    const x = get(a), y = get(b);
    if (typeof x === "string" && typeof y === "string") return x.localeCompare(y) * m;
    return ((x as number) - (y as number)) * m;
  });
}
