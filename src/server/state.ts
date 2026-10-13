import type {
  AdminState, Category, Customer, CustomerStatus, DeliveryZone, MovementType, Order, OrderItem, OrderNote,
  OrderStatus, PaymentKind, PaymentMethod, PaymentStatus, PaymentTxn, PaymentTxnStatus, Platform, Product,
  Settings, StockMovement, TimelineEntry, Variant,
} from "@/admin/types";
import { DEFAULT_SETTINGS } from "@/admin/data/defaults";
import { query } from "./db";

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d ? new Date(String(d)).toISOString() : new Date().toISOString());
const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => Number(v ?? 0);

const PLATFORM: Record<string, Platform> = { messenger: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp", tiktok: "TikTok", website: "Website", other: "Website" };

/** Loads everything the admin UI needs in the shape of the client store. */
export async function loadState(): Promise<AdminState> {
  const q = (sql: string, params: unknown[] = []) => query(sql, params).then((r) => r.rows);

  const [cats, prods, vars, orders, customers, payments, zones, moves, settingsRow, events] = await Promise.all([
    q("SELECT * FROM categories ORDER BY id"),
    q("SELECT * FROM products ORDER BY created_at DESC, id DESC"),
    q("SELECT * FROM product_variants ORDER BY id"),
    q("SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 2000"),
    q(`SELECT c.*, COALESCE(s.spent, 0) AS spent, s.last_order
       FROM customers c
       LEFT JOIN (SELECT customer_id, sum(total) FILTER (WHERE status <> 'Cancelled') AS spent, max(created_at) AS last_order
                  FROM orders GROUP BY customer_id) s ON s.customer_id = c.id
       ORDER BY c.id`),
    q("SELECT * FROM payments ORDER BY created_at DESC, id DESC LIMIT 3000"),
    q("SELECT * FROM delivery_zones ORDER BY id"),
    q("SELECT * FROM stock_movements ORDER BY at DESC, id DESC LIMIT 300"),
    q("SELECT data FROM app_settings WHERE id = 1"),
    q("SELECT * FROM customer_events ORDER BY at DESC LIMIT 2000"),
  ]);

  const orderIds = orders.map((o) => o.id);
  const [items, tl, notes] = orderIds.length
    ? await Promise.all([
        q(`SELECT oi.*, p.category_id, p.image_url
           FROM order_items oi
           LEFT JOIN product_variants v ON v.id = oi.variant_id
           LEFT JOIN products p ON p.id = v.product_id
           WHERE oi.order_id = ANY($1::bigint[]) ORDER BY oi.id`, [orderIds]),
        q("SELECT * FROM order_events WHERE order_id = ANY($1::bigint[]) ORDER BY at, id", [orderIds]),
        q("SELECT * FROM order_notes WHERE order_id = ANY($1::bigint[]) ORDER BY at DESC, id DESC", [orderIds]),
      ])
    : [[], [], []];

  const categories: Category[] = cats.map((c) => ({
    id: str(c.id), name: c.name, description: str(c.description), image: str(c.image), active: !!c.active, createdAt: iso(c.created_at),
    variantSchema: { sizeLabel: c.size_label, sizeRequired: !!c.size_required, colorLabel: c.color_label, colorRequired: !!c.color_required },
  }));

  const varsByProduct = new Map<string, Variant[]>();
  for (const v of vars) {
    const list = varsByProduct.get(str(v.product_id)) ?? [];
    list.push({
      id: str(v.id), sku: str(v.sku), size: str(v.size), color: str(v.color),
      price: v.price_npr == null ? undefined : num(v.price_npr), stock: num(v.stock_qty), available: !!v.available, updatedAt: iso(v.updated_at),
    });
    varsByProduct.set(str(v.product_id), list);
  }
  const products: Product[] = prods.map((p) => ({
    id: str(p.id), name: p.name, categoryId: p.category_id == null ? "" : str(p.category_id), description: str(p.description),
    basePrice: num(p.base_price_npr), image: str(p.image_url), active: !!p.active, createdAt: iso(p.created_at),
    variants: varsByProduct.get(str(p.id)) ?? [],
  }));

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const i of items) {
    const list = itemsByOrder.get(str(i.order_id)) ?? [];
    list.push({
      productId: "", variantId: str(i.variant_id), categoryId: i.category_id == null ? "" : str(i.category_id),
      name: i.product_name, variantLabel: str(i.variant_label), qty: num(i.qty), price: num(i.unit_price), image: str(i.image_url),
    });
    itemsByOrder.set(str(i.order_id), list);
  }
  const tlByOrder = new Map<string, TimelineEntry[]>();
  for (const e of tl) {
    const list = tlByOrder.get(str(e.order_id)) ?? [];
    list.push({ at: iso(e.at), title: e.title, detail: e.detail ?? undefined });
    tlByOrder.set(str(e.order_id), list);
  }
  const notesByOrder = new Map<string, OrderNote[]>();
  for (const n of notes) {
    const list = notesByOrder.get(str(n.order_id)) ?? [];
    list.push({ id: str(n.id), at: iso(n.at), text: n.text, author: n.author });
    notesByOrder.set(str(n.order_id), list);
  }
  const variantToProduct = new Map<string, string>();
  for (const v of vars) variantToProduct.set(str(v.id), str(v.product_id));

  const mappedOrders: Order[] = orders.map((o) => ({
    id: str(o.id), number: o.order_number, customerId: str(o.customer_id), date: iso(o.created_at),
    items: (itemsByOrder.get(str(o.id)) ?? []).map((i) => ({ ...i, productId: variantToProduct.get(i.variantId) ?? "" })),
    zoneId: o.zone_id == null ? "" : str(o.zone_id), zoneName: str(o.zone_name), deliveryFee: num(o.delivery_fee), address: str(o.address),
    orderStatus: o.status as OrderStatus, paymentStatus: o.payment_status as PaymentStatus, paid: num(o.paid_amount),
    notes: notesByOrder.get(str(o.id)) ?? [], timeline: tlByOrder.get(str(o.id)) ?? [],
  }));

  const eventsByCustomer = new Map<string, { at: string; text: string }[]>();
  for (const e of events) {
    const list = eventsByCustomer.get(str(e.customer_id)) ?? [];
    list.push({ at: iso(e.at), text: e.text });
    eventsByCustomer.set(str(e.customer_id), list);
  }
  const ordersByCustomer = new Map<string, Order[]>();
  for (const o of mappedOrders) {
    const list = ordersByCustomer.get(o.customerId) ?? [];
    list.push(o);
    ordersByCustomer.set(o.customerId, list);
  }
  const now = Date.now();
  const mappedCustomers: Customer[] = customers.map((c) => {
    const id = str(c.id);
    const spent = num(c.spent);
    const last = c.last_order ? new Date(c.last_order).getTime() : 0;
    const status: CustomerStatus = spent > 60000 ? "VIP" : !last || now - last > 75 * 86_400_000 ? "Inactive" : "Active";
    const platformLabel = PLATFORM[c.platform] ?? "Website";
    const activity = [
      ...(ordersByCustomer.get(id) ?? []).slice(0, 4).map((o) => ({ at: o.date, text: `Placed order ${o.number}` })),
      ...(eventsByCustomer.get(id) ?? []).slice(0, 4),
      { at: iso(c.created_at), text: `Joined via ${platformLabel}` },
    ].sort((a, b) => b.at.localeCompare(a.at));
    return {
      id, name: c.name || c.phone_number || `${platformLabel} user …${str(c.platform_id).slice(-4)}`, phone: str(c.phone_number), email: str(c.email),
      platform: platformLabel, status, address: str(c.address), joinedAt: iso(c.created_at),
      botPaused: !!c.bot_paused || (!!c.bot_paused_until && new Date(c.bot_paused_until).getTime() > now), activity,
    };
  });

  const mappedPayments: PaymentTxn[] = payments.map((p) => ({
    id: `TXN-${p.id}`, orderId: str(p.order_id), amount: num(p.amount), method: p.method as PaymentMethod, date: iso(p.created_at),
    status: p.status as PaymentTxnStatus, kind: p.kind as PaymentKind, reference: str(p.reference),
  }));

  const mappedZones: DeliveryZone[] = zones.map((z) => ({ id: str(z.id), name: z.name, fee: num(z.fee_npr), active: !!z.active, description: str(z.description) }));

  const movements: StockMovement[] = moves.map((m) => ({
    id: str(m.id), at: iso(m.at), productId: str(m.product_id), variantId: str(m.variant_id), productName: m.product_name,
    variantLabel: str(m.variant_label), type: m.type as MovementType, delta: num(m.delta), after: num(m.after_qty), note: str(m.note),
  }));

  const settings: Settings = { ...DEFAULT_SETTINGS, ...((settingsRow[0]?.data as Partial<Settings>) ?? {}) };

  return { products, categories, orders: mappedOrders, customers: mappedCustomers, payments: mappedPayments, zones: mappedZones, movements, settings, readNotifications: [] };
}
