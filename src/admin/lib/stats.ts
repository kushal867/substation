import type { AdminState, Order, OrderStatus, PaymentStatus } from "../types";
import { pct } from "./format";
import { buildBuckets, inRange, orderBalance, orderTotal, previousRange, type DateRange } from "./range";
import { productStatus } from "./selectors";

export const ORDER_STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Partially Paid", "Paid", "Refunded"];

const live = (o: Order) => o.orderStatus !== "Cancelled";

export function periodTotals(orders: Order[]) {
  const valid = orders.filter(live);
  const revenue = valid.reduce((s, o) => s + orderTotal(o), 0);
  return {
    revenue,
    count: valid.length,
    all: orders.length,
    aov: valid.length ? revenue / valid.length : 0,
    pending: orders.reduce((s, o) => s + orderBalance(o), 0),
    collected: orders.reduce((s, o) => s + o.paid, 0),
  };
}

export function computeStats(state: AdminState, range: DateRange) {
  const orders = state.orders.filter((o) => inRange(o.date, range));
  const prevRange = previousRange(range);
  const prevOrders = state.orders.filter((o) => inRange(o.date, prevRange));
  const cur = periodTotals(orders);
  const prev = periodTotals(prevOrders);
  const t = state.settings.lowStockThreshold;

  const buckets = buildBuckets(orders, range);

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  orders.forEach((o) => statusCounts[o.orderStatus]++);

  const byCategory = new Map<string, number>();
  const byProduct = new Map<string, { id: string; name: string; image: string; categoryId: string; qty: number; revenue: number }>();
  const byVariant = new Map<string, { key: string; product: string; variant: string; qty: number; revenue: number }>();
  for (const o of orders.filter(live)) {
    for (const i of o.items) {
      byCategory.set(i.categoryId, (byCategory.get(i.categoryId) ?? 0) + i.qty * i.price);
      const p = byProduct.get(i.productId) ?? { id: i.productId, name: i.name, image: i.image, categoryId: i.categoryId, qty: 0, revenue: 0 };
      p.qty += i.qty;
      p.revenue += i.qty * i.price;
      byProduct.set(i.productId, p);
      const vk = `${i.productId}:${i.variantId}`;
      const v = byVariant.get(vk) ?? { key: vk, product: i.name, variant: i.variantLabel, qty: 0, revenue: 0 };
      v.qty += i.qty;
      v.revenue += i.qty * i.price;
      byVariant.set(vk, v);
    }
  }

  const payBreakdown: Record<PaymentStatus, number> = { Paid: 0, "Partially Paid": 0, Unpaid: 0, Refunded: 0 };
  for (const o of orders) {
    if (o.paymentStatus === "Unpaid" && !live(o)) continue;
    payBreakdown[o.paymentStatus] += orderTotal(o);
  }

  const activeProducts = state.products;
  const lowCount = activeProducts.filter((p) => productStatus(p, t) === "low").length;
  const outCount = activeProducts.filter((p) => productStatus(p, t) === "out").length;
  const newProducts = state.products.filter((p) => inRange(p.createdAt, range)).length;
  const prevNewProducts = state.products.filter((p) => inRange(p.createdAt, prevRange)).length;

  return {
    orders, prevOrders, cur, prev, buckets, statusCounts, payBreakdown, lowCount, outCount, newProducts, prevNewProducts,
    categorySales: [...byCategory.entries()].map(([id, value]) => ({ id, value })).sort((a, b) => b.value - a.value),
    topProducts: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue),
    topVariants: [...byVariant.values()].sort((a, b) => b.qty - a.qty),
    change: {
      revenue: pct(cur.revenue, prev.revenue),
      orders: pct(cur.count, prev.count),
      pending: pct(cur.pending, prev.pending),
      products: pct(newProducts, prevNewProducts),
    },
  };
}
export type Stats = ReturnType<typeof computeStats>;

