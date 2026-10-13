import { fmtShort, fromInputDate, pct } from "./format";
import type { Order } from "../types";

export type PeriodKey = "1" | "7" | "30" | "90" | "custom" | "all";

export interface DateRange {
  key: PeriodKey;
  from: Date;
  to: Date;
}

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1", label: "Today" },
  { key: "7", label: "7 Days" },
  { key: "30", label: "30 Days" },
  { key: "90", label: "90 Days" },
  { key: "custom", label: "Custom" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export function presetRange(key: PeriodKey, custom?: { from: string; to: string }): DateRange {
  const now = new Date();
  if (key === "all") return { key, from: new Date(2000, 0, 1), to: endOfDay(now) };
  if (key === "custom" && custom?.from && custom?.to) {
    let from = fromInputDate(custom.from);
    let to = fromInputDate(custom.to, true);
    if (from > to) [from, to] = [startOfDay(to), endOfDay(from)];
    return { key, from, to };
  }
  const days = key === "custom" ? 30 : Number(key);
  const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)));
  return { key: key === "custom" ? "30" : key, from, to: endOfDay(now) };
}

export const spanDays = (r: DateRange) =>
  Math.max(1, Math.round((r.to.getTime() - r.from.getTime()) / 86_400_000));

export function previousRange(r: DateRange): DateRange {
  const ms = r.to.getTime() - r.from.getTime() + 1;
  return { key: r.key, from: new Date(r.from.getTime() - ms), to: new Date(r.from.getTime() - 1) };
}

export const inRange = (iso: string, r: DateRange) => {
  const t = new Date(iso).getTime();
  return t >= r.from.getTime() && t <= r.to.getTime();
};

export const rangeLabel = (r: DateRange) =>
  r.key === "all" ? "All time" : r.key === "1" ? "Today" : `${fmtShort(r.from)} – ${fmtShort(r.to)}`;

export interface Bucket {
  label: string;
  start: number;
  end: number;
  orders: Order[];
  revenue: number;
  count: number;
  collected: number;
  aov: number;
}

/** Splits a range into hourly / daily / weekly / monthly buckets depending on span. */
export function buildBuckets(orders: Order[], r: DateRange): Bucket[] {
  const days = spanDays(r);
  const buckets: Bucket[] = [];
  const push = (start: Date, end: Date, label: string) =>
    buckets.push({ label, start: start.getTime(), end: end.getTime(), orders: [], revenue: 0, count: 0, collected: 0, aov: 0 });

  if (days <= 1) {
    for (let h = 0; h < 24; h += 3) {
      const s = new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate(), h);
      const e = new Date(s.getTime() + 3 * 3_600_000 - 1);
      push(s, e, `${String(h).padStart(2, "0")}:00`);
    }
  } else if (days <= 35) {
    for (let t = new Date(r.from); t <= r.to; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)) {
      const e = endOfDay(t);
      push(t, e, fmtShort(t));
    }
  } else if (days <= 140) {
    for (let t = new Date(r.from); t <= r.to; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 7)) {
      const e = new Date(Math.min(endOfDay(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 6)).getTime(), r.to.getTime()));
      push(t, e, fmtShort(t));
    }
  } else {
    for (let t = new Date(r.from.getFullYear(), r.from.getMonth(), 1); t <= r.to; t = new Date(t.getFullYear(), t.getMonth() + 1, 1)) {
      const e = endOfDay(new Date(t.getFullYear(), t.getMonth() + 1, 0));
      push(t, e, t.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }));
    }
  }

  for (const o of orders) {
    const t = new Date(o.date).getTime();
    const b = buckets.find((x) => t >= x.start && t <= x.end);
    if (!b) continue;
    b.orders.push(o);
    if (o.orderStatus !== "Cancelled") {
      b.revenue += orderTotal(o);
      b.count += 1;
    }
    b.collected += o.paid;
  }
  for (const b of buckets) b.aov = b.count ? b.revenue / b.count : 0;
  return buckets;
}

export const orderSubtotal = (o: Order) => o.items.reduce((s, i) => s + i.qty * i.price, 0);
export const orderTotal = (o: Order) => orderSubtotal(o) + o.deliveryFee;
export const orderBalance = (o: Order) =>
  o.orderStatus === "Cancelled" || o.paymentStatus === "Refunded" ? 0 : Math.max(0, orderTotal(o) - o.paid);

export { pct };
