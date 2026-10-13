"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type {
  AdminState, Category, DeliveryZone, Order, OrderStatus, Product, Settings, StockMovement, Variant,
} from "../types";
import { DEFAULT_SETTINGS } from "../data/defaults";
import { uid } from "../lib/format";
import { orderBalance, orderTotal } from "../lib/range";
import { variantLabel } from "../lib/selectors";

/**
 * Server-backed store. PostgreSQL (via /api/admin/*) is the source of truth.
 * Every action updates the UI optimistically, sends one command to the server (serialised),
 * and reloads the real state when the queue is idle. A failed command is reported and rolled back by that reload.
 */
const READ_KEY = "substation-admin-read-notifications"; // per-browser UI preference only

const EMPTY: AdminState = {
  products: [], categories: [], orders: [], customers: [], payments: [], zones: [], movements: [],
  settings: DEFAULT_SETTINGS, readNotifications: [],
};

type Action = { type: "load"; state: AdminState } | { type: "patch"; fn: (s: AdminState) => AdminState };

function reducer(state: AdminState, a: Action): AdminState {
  return a.type === "load" ? a.state : a.fn(state);
}

const nowIso = () => new Date().toISOString();

type Command = { type: string; [k: string]: unknown };

interface Actions {
  saveProduct: (p: Product) => void;
  deleteProducts: (ids: string[]) => void;
  setProductsActive: (ids: string[], active: boolean) => void;
  duplicateProduct: (id: string) => Product | undefined;
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string, moveTo?: string) => void;
  setStock: (productId: string, variantId: string, qty: number, type?: StockMovement["type"], note?: string) => { ok: boolean; error?: string };
  adjustStock: (productId: string, variantId: string, delta: number) => void;
  setAvailability: (productId: string, variantId: string, available: boolean) => { ok: boolean; error?: string };
  bulkStock: (items: { productId: string; variantId: string }[], mode: "add" | "set", value: number) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  verifyOrderPayment: (orderId: string) => { ok: boolean; message: string };
  refundOrder: (orderId: string) => void;
  addOrderNote: (orderId: string, text: string) => void;
  verifyTxn: (txnId: string, ok: boolean) => void;
  saveZone: (z: DeliveryZone) => void;
  deleteZone: (id: string) => void;
  setBotPaused: (id: string, paused: boolean) => void;
  saveSettings: (s: Settings) => void;
  markNotificationsRead: (ids: string[]) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface Ctx extends Actions {
  state: AdminState;
  /** true once the first load from the database finished. */
  ready: boolean;
  /** Fatal load error (database not configured, schema missing, server down). */
  loadError: string | null;
  /** Last failed command message; show it once then call clearError. */
  lastError: string | null;
  clearError: () => void;
  syncing: boolean;
}

const AdminCtx = createContext<Ctx | null>(null);

function recordMovement(s: AdminState, p: Product, v: Variant, delta: number, type: StockMovement["type"], note: string): StockMovement[] {
  return [
    { id: uid("mv"), at: nowIso(), productId: p.id, variantId: v.id, productName: p.name, variantLabel: variantLabel(v), type, delta, after: v.stock, note },
    ...s.movements,
  ].slice(0, 300);
}

function derivePay(o: Order): Order["paymentStatus"] {
  if (o.paymentStatus === "Refunded") return "Refunded";
  const total = orderTotal(o);
  if (o.paid >= total && total > 0) return "Paid";
  if (o.paid > 0) return "Partially Paid";
  return "Unpaid";
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const pending = useRef(0);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const readIds = useRef<string[]>([]);

  const goLogin = useCallback(() => {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/state", { cache: "no-store" });
      if (res.status === 401) return goLogin();
      const j = (await res.json()) as { ok: boolean; state?: AdminState; error?: string };
      if (!j.ok || !j.state) throw new Error(j.error ?? "Could not load data");
      dispatch({ type: "load", state: { ...j.state, readNotifications: readIds.current } });
      setLoadError(null);
      setReady(true);
    } catch (e) {
      if (!ready) setLoadError((e as Error).message);
      else setLastError("Could not refresh data. Showing the last loaded version.");
    }
  }, [goLogin, ready]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // initial load + read-notification preference
  useEffect(() => {
    try {
      readIds.current = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
    } catch {
      readIds.current = [];
    }
    void refreshRef.current();
  }, []);

  // keep fresh: bot / n8n create orders while the admin is open
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible" && pending.current === 0) void refreshRef.current();
    };
    const id = setInterval(tick, 30_000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const send = useCallback(
    (cmd: Command) => {
      pending.current++;
      setSyncing(true);
      chain.current = chain.current.then(async () => {
        try {
          const res = await fetch("/api/admin/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
          if (res.status === 401) return goLogin();
          const j = (await res.json().catch(() => ({ ok: false, error: "Unexpected server response." }))) as { ok: boolean; error?: string };
          if (!j.ok) setLastError(j.error ?? "The server rejected that change.");
        } catch {
          setLastError("Network error — your change was not saved.");
        } finally {
          pending.current--;
          if (pending.current === 0) {
            setSyncing(false);
            await refreshRef.current();
          }
        }
      });
    },
    [goLogin],
  );

  const patch = useCallback((fn: (s: AdminState) => AdminState) => dispatch({ type: "patch", fn }), []);

  const actions = useMemo<Actions>(() => {
    const updateVariant = (s: AdminState, productId: string, variantId: string, fn: (v: Variant, p: Product) => Variant): AdminState => ({
      ...s,
      products: s.products.map((p) => (p.id !== productId ? p : { ...p, variants: p.variants.map((v) => (v.id === variantId ? fn(v, p) : v)) })),
    });

    return {
      saveProduct: (prod) => {
        patch((s) => {
          const exists = s.products.some((p) => p.id === prod.id);
          return { ...s, products: exists ? s.products.map((p) => (p.id === prod.id ? prod : p)) : [prod, ...s.products] };
        });
        send({ type: "saveProduct", product: prod });
      },
      deleteProducts: (ids) => {
        patch((s) => ({ ...s, products: s.products.filter((p) => !ids.includes(p.id)) }));
        send({ type: "deleteProducts", ids });
      },
      setProductsActive: (ids, active) => {
        patch((s) => ({ ...s, products: s.products.map((p) => (ids.includes(p.id) ? { ...p, active } : p)) }));
        send({ type: "setProductsActive", ids, active });
      },
      duplicateProduct: (id) => {
        const src = stateRef.current.products.find((p) => p.id === id);
        if (!src) return undefined;
        const copy: Product = {
          ...src, id: uid("prod"), name: `${src.name} (Copy)`, active: false, createdAt: nowIso(),
          variants: src.variants.map((v) => ({ ...v, id: uid("var"), sku: `${v.sku}-C`, updatedAt: nowIso() })),
        };
        patch((s) => ({ ...s, products: [copy, ...s.products] }));
        send({ type: "duplicateProduct", id });
        return copy;
      },

      saveCategory: (c) => {
        patch((s) => ({ ...s, categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] }));
        send({ type: "saveCategory", category: c });
      },
      deleteCategory: (id, moveTo) => {
        patch((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
          products: s.products.map((p) => (p.categoryId === id ? { ...p, categoryId: moveTo ?? "" } : p)),
        }));
        send({ type: "deleteCategory", id, moveTo });
      },

      setStock: (productId, variantId, qty, type = "Adjustment", note = "Manual edit") => {
        if (!Number.isFinite(qty) || qty < 0 || !Number.isInteger(qty)) return { ok: false, error: "Enter a whole number of 0 or more." };
        patch((s) => {
          const p = s.products.find((x) => x.id === productId);
          const v = p?.variants.find((x) => x.id === variantId);
          if (!p || !v || v.stock === qty) return s;
          const nv = { ...v, stock: qty, available: qty === 0 ? false : v.available, updatedAt: nowIso() };
          return { ...updateVariant(s, productId, variantId, () => nv), movements: recordMovement(s, p, nv, qty - v.stock, type, note) };
        });
        send({ type: "setStock", productId, variantId, qty, movementType: type, note });
        return { ok: true };
      },
      adjustStock: (productId, variantId, delta) => {
        patch((s) => {
          const p = s.products.find((x) => x.id === productId);
          const v = p?.variants.find((x) => x.id === variantId);
          if (!p || !v) return s;
          const q = Math.max(0, v.stock + delta);
          if (q === v.stock) return s;
          const nv = { ...v, stock: q, available: q === 0 ? false : v.available, updatedAt: nowIso() };
          return { ...updateVariant(s, productId, variantId, () => nv), movements: recordMovement(s, p, nv, q - v.stock, delta > 0 ? "Restock" : "Adjustment", delta > 0 ? "Quick increment" : "Quick decrement") };
        });
        send({ type: "adjustStock", productId, variantId, delta });
      },
      setAvailability: (productId, variantId, available) => {
        const p = stateRef.current.products.find((x) => x.id === productId);
        const v = p?.variants.find((x) => x.id === variantId);
        if (!v) return { ok: false, error: "Variant not found." };
        if (available && v.stock <= 0) return { ok: false, error: "Add stock before making this variant available." };
        patch((s) => updateVariant(s, productId, variantId, (x) => ({ ...x, available, updatedAt: nowIso() })));
        send({ type: "setAvailability", productId, variantId, available });
        return { ok: true };
      },
      bulkStock: (items, mode, value) => {
        patch((s) => {
          let next = s;
          for (const it of items) {
            const p = next.products.find((x) => x.id === it.productId);
            const v = p?.variants.find((x) => x.id === it.variantId);
            if (!p || !v) continue;
            const q = Math.max(0, mode === "add" ? v.stock + value : value);
            if (q === v.stock) continue;
            const nv = { ...v, stock: q, available: q === 0 ? false : v.available, updatedAt: nowIso() };
            next = { ...updateVariant(next, it.productId, it.variantId, () => nv), movements: recordMovement(next, p, nv, q - v.stock, "Adjustment", "Bulk update") };
          }
          return next;
        });
        send({ type: "bulkStock", items, mode, value });
      },

      setOrderStatus: (orderId, status) => {
        patch((s) => ({
          ...s,
          orders: s.orders.map((o) =>
            o.id !== orderId || o.orderStatus === status
              ? o
              : { ...o, orderStatus: status, timeline: [...o.timeline, { at: nowIso(), title: status === "Cancelled" ? "Order cancelled" : `Marked ${status}` }] },
          ),
        }));
        send({ type: "setOrderStatus", orderId, status });
      },
      verifyOrderPayment: (orderId) => {
        const s = stateRef.current;
        const o = s.orders.find((x) => x.id === orderId);
        if (!o) return { ok: false, message: "Order not found." };
        if (o.paymentStatus === "Refunded") return { ok: false, message: "Refunded orders cannot be verified." };
        const pending = s.payments.filter((t) => t.orderId === orderId && t.status === "Pending");
        const gain = pending.length ? pending.reduce((a, t) => a + t.amount, 0) : orderBalance(o);
        if (gain <= 0) return { ok: false, message: "Nothing left to verify — this order is fully paid." };
        patch((st) => ({
          ...st,
          payments: st.payments.map((t) => (t.orderId === orderId && t.status === "Pending" ? { ...t, status: "Verified" as const } : t)),
          orders: st.orders.map((x) => {
            if (x.id !== orderId) return x;
            const u: Order = { ...x, paid: Math.min(orderTotal(x), x.paid + gain) };
            u.paymentStatus = derivePay(u);
            return { ...u, timeline: [...x.timeline, { at: nowIso(), title: "Payment verified" }] };
          }),
        }));
        send({ type: "verifyOrderPayment", orderId });
        return { ok: true, message: `Payment of NPR ${Math.round(gain).toLocaleString("en-IN")} verified.` };
      },
      refundOrder: (orderId) => {
        patch((s) => ({
          ...s,
          orders: s.orders.map((x) => (x.id !== orderId ? x : { ...x, paid: 0, paymentStatus: "Refunded", timeline: [...x.timeline, { at: nowIso(), title: "Payment refunded" }] })),
        }));
        send({ type: "refundOrder", orderId });
      },
      addOrderNote: (orderId, text) => {
        const author = stateRef.current.settings.adminName.split(" ")[0] || "Admin";
        patch((s) => ({ ...s, orders: s.orders.map((o) => (o.id !== orderId ? o : { ...o, notes: [{ id: uid("note"), at: nowIso(), author, text }, ...o.notes] })) }));
        send({ type: "addOrderNote", orderId, text, author });
      },

      verifyTxn: (txnId, ok) => {
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
              return u;
            }),
          };
        });
        send({ type: "verifyTxn", txnId, ok });
      },

      saveZone: (z) => {
        patch((s) => ({
          ...s,
          zones: s.zones.some((x) => x.id === z.id) ? s.zones.map((x) => (x.id === z.id ? z : x)) : [...s.zones, z],
          orders: s.orders.map((o) => (o.zoneId === z.id ? { ...o, zoneName: z.name } : o)),
        }));
        send({ type: "saveZone", zone: z });
      },
      deleteZone: (id) => {
        patch((s) => ({ ...s, zones: s.zones.filter((z) => z.id !== id) }));
        send({ type: "deleteZone", id });
      },

      setBotPaused: (id, paused) => {
        patch((s) => ({
          ...s,
          customers: s.customers.map((c) =>
            c.id !== id ? c : { ...c, botPaused: paused, activity: [{ at: nowIso(), text: paused ? "Auto-replies paused by admin" : "Auto-replies resumed by admin" }, ...c.activity] },
          ),
        }));
        send({ type: "setBotPaused", id, paused });
      },

      saveSettings: (settings) => {
        patch((s) => ({ ...s, settings }));
        send({ type: "saveSettings", settings });
      },
      markNotificationsRead: (ids) => {
        readIds.current = Array.from(new Set([...readIds.current, ...ids])).slice(-500);
        try {
          localStorage.setItem(READ_KEY, JSON.stringify(readIds.current));
        } catch {
          /* ignore */
        }
        patch((s) => ({ ...s, readNotifications: readIds.current }));
      },
      refresh: () => refreshRef.current(),
      signOut: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        window.location.href = "/admin/login";
      },
    };
  }, [patch, send]);

  const value = useMemo<Ctx>(
    () => ({ state, ready, loadError, lastError, clearError: () => setLastError(null), syncing, ...actions }),
    [state, ready, loadError, lastError, syncing, actions],
  );
  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("useAdmin must be used inside <AdminProvider>");
  return c;
}
