"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type {
  AdminState, Category, Customer, DeliveryZone, Order, OrderStatus, PaymentMethod, PaymentTxn,
  Product, Settings, StockMovement, Variant,
} from "../types";
import { createSeed, DEFAULT_SETTINGS } from "../data/seed";
import { uid } from "../lib/format";
import { orderBalance, orderTotal } from "../lib/range";
import { variantLabel } from "../lib/selectors";

/**
 * Demo-only persistence. Only mock store data and UI preferences are written to
 * localStorage — never credentials or anything sensitive. Reset from Settings.
 */
const STORAGE_KEY = "substation-admin-demo-v1";

type Action =
  | { type: "hydrate"; state: AdminState }
  | { type: "reset"; state: AdminState }
  | { type: "patch"; fn: (s: AdminState) => AdminState };

function reducer(state: AdminState, a: Action): AdminState {
  switch (a.type) {
    case "hydrate":
    case "reset":
      return a.state;
    case "patch":
      return a.fn(state);
  }
}

const nowIso = () => new Date().toISOString();

interface Actions {
  // products
  saveProduct: (p: Product) => void;
  deleteProducts: (ids: string[]) => void;
  setProductsActive: (ids: string[], active: boolean) => void;
  duplicateProduct: (id: string) => Product | undefined;
  // categories
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string, moveTo?: string) => void;
  // inventory
  setStock: (productId: string, variantId: string, qty: number, type?: StockMovement["type"], note?: string) => { ok: boolean; error?: string };
  adjustStock: (productId: string, variantId: string, delta: number) => void;
  setAvailability: (productId: string, variantId: string, available: boolean) => { ok: boolean; error?: string };
  bulkStock: (items: { productId: string; variantId: string }[], mode: "add" | "set", value: number) => void;
  // orders
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  verifyOrderPayment: (orderId: string) => { ok: boolean; message: string };
  refundOrder: (orderId: string) => void;
  addOrderNote: (orderId: string, text: string) => void;
  // payments
  verifyTxn: (txnId: string, ok: boolean) => void;
  // zones
  saveZone: (z: DeliveryZone) => void;
  deleteZone: (id: string) => void;
  // customers
  setBotPaused: (id: string, paused: boolean) => void;
  // misc
  saveSettings: (s: Settings) => void;
  markNotificationsRead: (ids: string[]) => void;
  resetDemo: () => void;
}

interface Ctx extends Actions {
  state: AdminState;
  ready: boolean;
}

const AdminCtx = createContext<Ctx | null>(null);

function recordMovement(s: AdminState, p: Product, v: Variant, delta: number, type: StockMovement["type"], note: string): StockMovement[] {
  return [
    { id: uid("mv"), at: nowIso(), productId: p.id, variantId: v.id, productName: p.name, variantLabel: variantLabel(v), type, delta, after: v.stock, note },
    ...s.movements,
  ].slice(0, 300);
}

/** Recompute payment status from the verified amount. */
function derivePay(o: Order): Order["paymentStatus"] {
  if (o.paymentStatus === "Refunded") return "Refunded";
  const total = orderTotal(o);
  if (o.paid >= total && total > 0) return "Paid";
  if (o.paid > 0) return "Partially Paid";
  return "Unpaid";
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as AdminState, () => createSeed());
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    let next: AdminState | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminState;
        if (parsed?.products && parsed?.orders) next = { ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
      }
    } catch {
      /* ignore corrupt or unavailable storage */
    }
    if (next) dispatch({ type: "hydrate", state: next });
    hydrated.current = true;
    setReady(true);
  }, []);

  // Persist (debounced)
  useEffect(() => {
    if (!hydrated.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* storage full / blocked: demo keeps working in memory */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [state]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback((fn: (s: AdminState) => AdminState) => dispatch({ type: "patch", fn }), []);

  const actions = useMemo<Actions>(() => {
    const updateVariant = (s: AdminState, productId: string, variantId: string, fn: (v: Variant, p: Product) => Variant): AdminState => ({
      ...s,
      products: s.products.map((p) =>
        p.id !== productId ? p : { ...p, variants: p.variants.map((v) => (v.id === variantId ? fn(v, p) : v)) },
      ),
    });

    return {
      saveProduct: (prod) =>
        patch((s) => {
          const exists = s.products.some((p) => p.id === prod.id);
          let movements = s.movements;
          const old = s.products.find((p) => p.id === prod.id);
          // log stock differences made through the product form
          for (const v of prod.variants) {
            const ov = old?.variants.find((x) => x.id === v.id);
            const before = ov?.stock ?? 0;
            if (v.stock !== before) movements = recordMovement({ ...s, movements }, prod, v, v.stock - before, ov ? "Adjustment" : "Restock", ov ? "Edited in product form" : "Initial stock");
          }
          const products = exists ? s.products.map((p) => (p.id === prod.id ? prod : p)) : [prod, ...s.products];
          return { ...s, products, movements };
        }),
      deleteProducts: (ids) => patch((s) => ({ ...s, products: s.products.filter((p) => !ids.includes(p.id)) })),
      setProductsActive: (ids, active) =>
        patch((s) => ({ ...s, products: s.products.map((p) => (ids.includes(p.id) ? { ...p, active } : p)) })),
      duplicateProduct: (id) => {
        const src = stateRef.current.products.find((p) => p.id === id);
        if (!src) return undefined;
        const copy: Product = {
          ...src,
          id: uid("prod"),
          name: `${src.name} (Copy)`,
          active: false,
          createdAt: nowIso(),
          variants: src.variants.map((v) => ({ ...v, id: uid("var"), sku: `${v.sku}-C`, updatedAt: nowIso() })),
        };
        patch((s) => ({ ...s, products: [copy, ...s.products] }));
        return copy;
      },

      saveCategory: (c) =>
        patch((s) => ({
          ...s,
          categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c],
        })),
      deleteCategory: (id, moveTo) =>
        patch((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
          products: s.products.map((p) => (p.categoryId === id ? { ...p, categoryId: moveTo ?? "" } : p)),
        })),

      setStock: (productId, variantId, qty, type = "Adjustment", note = "Manual edit") => {
        if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) return { ok: false, error: "Enter a whole number of 0 or more." };
        patch((s) => {
          const p = s.products.find((x) => x.id === productId);
          const v = p?.variants.find((x) => x.id === variantId);
          if (!p || !v || v.stock === qty) return s;
          const nv = { ...v, stock: qty, available: qty === 0 ? false : v.available, updatedAt: nowIso() };
          const next = updateVariant(s, productId, variantId, () => nv);
          return { ...next, movements: recordMovement(s, p, nv, qty - v.stock, type, note) };
        });
        return { ok: true };
      },
      adjustStock: (productId, variantId, delta) =>
        patch((s) => {
          const p = s.products.find((x) => x.id === productId);
          const v = p?.variants.find((x) => x.id === variantId);
          if (!p || !v) return s;
          const qty = Math.max(0, v.stock + delta);
          if (qty === v.stock) return s;
          const nv = { ...v, stock: qty, available: qty === 0 ? false : v.available, updatedAt: nowIso() };
          return { ...updateVariant(s, productId, variantId, () => nv), movements: recordMovement(s, p, nv, qty - v.stock, delta > 0 ? "Restock" : "Adjustment", delta > 0 ? "Quick increment" : "Quick decrement") };
        }),
      setAvailability: (productId, variantId, available) => {
        const p = stateRef.current.products.find((x) => x.id === productId);
        const v = p?.variants.find((x) => x.id === variantId);
        if (!v) return { ok: false, error: "Variant not found." };
        if (available && v.stock <= 0) return { ok: false, error: "Add stock before making this variant available." };
        patch((s) => updateVariant(s, productId, variantId, (x) => ({ ...x, available, updatedAt: nowIso() })));
        return { ok: true };
      },
      bulkStock: (items, mode, value) =>
        patch((s) => {
          let next = s;
          for (const it of items) {
            const p = next.products.find((x) => x.id === it.productId);
            const v = p?.variants.find((x) => x.id === it.variantId);
            if (!p || !v) continue;
            const qty = Math.max(0, mode === "add" ? v.stock + value : value);
            if (qty === v.stock) continue;
            const nv = { ...v, stock: qty, available: qty === 0 ? false : v.available, updatedAt: nowIso() };
            const mv = recordMovement(next, p, nv, qty - v.stock, "Adjustment", "Bulk update");
            next = { ...updateVariant(next, it.productId, it.variantId, () => nv), movements: mv };
          }
          return next;
        }),

      setOrderStatus: (orderId, status) =>
        patch((s) => ({
          ...s,
          orders: s.orders.map((o) =>
            o.id !== orderId || o.orderStatus === status
              ? o
              : { ...o, orderStatus: status, timeline: [...o.timeline, { at: nowIso(), title: status === "Cancelled" ? "Order cancelled" : `Marked ${status}`, detail: "Updated by admin" }] },
          ),
        })),
      verifyOrderPayment: (orderId) => {
        const s = stateRef.current;
        const o = s.orders.find((x) => x.id === orderId);
        if (!o) return { ok: false, message: "Order not found." };
        if (o.paymentStatus === "Refunded") return { ok: false, message: "Refunded orders cannot be verified." };
        const pending = s.payments.filter((t) => t.orderId === orderId && t.status === "Pending");
        const gain = pending.length ? pending.reduce((a, t) => a + t.amount, 0) : orderBalance(o);
        if (gain <= 0) return { ok: false, message: "Nothing left to verify — this order is fully paid." };
        patch((st) => {
          const order = st.orders.find((x) => x.id === orderId)!;
          let payments = st.payments;
          if (pending.length) payments = payments.map((t) => (t.orderId === orderId && t.status === "Pending" ? { ...t, status: "Verified" as const } : t));
          else payments = [{ id: `TXN-${Math.floor(Math.random() * 90000 + 10000)}`, orderId, amount: gain, method: "Bank Transfer" as PaymentMethod, date: nowIso(), status: "Verified", kind: order.paid > 0 ? "Balance" : "Full", reference: "MANUAL" + Math.floor(Math.random() * 9000 + 1000) }, ...payments];
          const updated: Order = { ...order, paid: Math.min(orderTotal(order), order.paid + gain) };
          updated.paymentStatus = derivePay(updated);
          updated.timeline = [...order.timeline, { at: nowIso(), title: "Payment verified", detail: `NPR ${Math.round(gain).toLocaleString("en-IN")} confirmed by admin` }];
          return { ...st, payments, orders: st.orders.map((x) => (x.id === orderId ? updated : x)) };
        });
        return { ok: true, message: `Payment of NPR ${Math.round(gain).toLocaleString("en-IN")} verified.` };
      },
      refundOrder: (orderId) =>
        patch((s) => {
          const o = s.orders.find((x) => x.id === orderId);
          if (!o) return s;
          const amount = o.paid;
          const refundTxn: PaymentTxn = { id: `TXN-${Math.floor(Math.random() * 90000 + 10000)}`, orderId, amount, method: "Bank Transfer", date: nowIso(), status: "Refunded", kind: "Refund", reference: "REFUND" + Math.floor(Math.random() * 9000 + 1000) };
          return {
            ...s,
            payments: amount > 0 ? [refundTxn, ...s.payments] : s.payments,
            orders: s.orders.map((x) =>
              x.id !== orderId ? x : { ...x, paid: 0, paymentStatus: "Refunded", timeline: [...x.timeline, { at: nowIso(), title: "Payment refunded", detail: `NPR ${Math.round(amount).toLocaleString("en-IN")} returned to customer` }] },
            ),
          };
        }),
      addOrderNote: (orderId, text) =>
        patch((s) => ({
          ...s,
          orders: s.orders.map((o) =>
            o.id !== orderId ? o : { ...o, notes: [{ id: uid("note"), at: nowIso(), author: s.settings.adminName.split(" ")[0] || "Admin", text }, ...o.notes] },
          ),
        })),

      verifyTxn: (txnId, ok) =>
        patch((s) => {
          const t = s.payments.find((x) => x.id === txnId);
          if (!t || t.status !== "Pending") return s;
          const payments = s.payments.map((x) => (x.id === txnId ? { ...x, status: ok ? ("Verified" as const) : ("Failed" as const) } : x));
          if (!ok) return { ...s, payments };
          return {
            ...s,
            payments,
            orders: s.orders.map((o) => {
              if (o.id !== t.orderId) return o;
              const u = { ...o, paid: Math.min(orderTotal(o), o.paid + t.amount) };
              u.paymentStatus = derivePay(u);
              u.timeline = [...o.timeline, { at: nowIso(), title: "Payment verified", detail: `${t.id} · ${t.method}` }];
              return u;
            }),
          };
        }),

      saveZone: (z) =>
        patch((s) => {
          const exists = s.zones.some((x) => x.id === z.id);
          return {
            ...s,
            zones: exists ? s.zones.map((x) => (x.id === z.id ? z : x)) : [...s.zones, z],
            orders: s.orders.map((o) => (o.zoneId === z.id ? { ...o, zoneName: z.name } : o)),
          };
        }),
      deleteZone: (id) => patch((s) => ({ ...s, zones: s.zones.filter((z) => z.id !== id) })),

      setBotPaused: (id, paused) =>
        patch((s) => ({
          ...s,
          customers: s.customers.map((c) =>
            c.id !== id ? c : { ...c, botPaused: paused, activity: [{ at: nowIso(), text: paused ? "Auto-replies paused by admin (demo)" : "Auto-replies resumed by admin (demo)" }, ...c.activity] },
          ),
        })),

      saveSettings: (settings) => patch((s) => ({ ...s, settings })),
      markNotificationsRead: (ids) => patch((s) => ({ ...s, readNotifications: Array.from(new Set([...s.readNotifications, ...ids])) })),
      resetDemo: () => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        dispatch({ type: "reset", state: createSeed() });
      },
    };
  }, [patch]);

  const value = useMemo(() => ({ state, ready, ...actions }), [state, ready, actions]);
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin must be used inside <AdminProvider>");
  return c;
}

export type { Customer };
