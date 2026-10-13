import type { PoolClient } from "pg";
import type { Category, DeliveryZone, OrderStatus, Product, Settings } from "@/admin/types";
import { tx } from "./db";

export class UserError extends Error {}

type Id = string;
const ORDER_STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

/* ---------- validation helpers ---------- */
const isId = (v: unknown): v is Id => typeof v === "string" && /^\d{1,18}$/.test(v);
const toId = (v: unknown): Id | null => (isId(v) ? v : null);
function needId(v: unknown, what: string): Id {
  if (!isId(v)) throw new UserError(`${what} is not saved yet. Refresh and try again.`);
  return v;
}
function text(v: unknown, what: string, max = 500, required = false): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new UserError(`${what} is required.`);
  if (s.length > max) throw new UserError(`${what} is too long (max ${max} characters).`);
  return s;
}
function money(v: unknown, what: string, { allowEmpty = false } = {}): number | null {
  if ((v === undefined || v === null || v === "") && allowEmpty) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) throw new UserError(`${what} must be a valid amount.`);
  return n;
}
function qty(v: unknown, what = "Stock"): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw new UserError(`${what} must be a whole number of 0 or more.`);
  return n;
}
function image(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  if (s.length > 600_000) throw new UserError("Image is too large. Use a smaller image or an image URL.");
  if (!/^(https?:\/\/|data:image\/|\/)/i.test(s)) throw new UserError("Image must be an http(s) URL, a /path or an uploaded image.");
  return s;
}

async function movement(c: PoolClient, type: string, note: string) {
  await c.query("SELECT set_config('app.movement_type', $1, true), set_config('app.movement_note', $2, true)", [type, note]);
}

function payStatus(total: number, paid: number): "Paid" | "Partially Paid" | "Unpaid" {
  return total > 0 && paid >= total ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid";
}
const fmt = (n: number) => `NPR ${Math.round(n).toLocaleString("en-IN")}`;

/* ---------- products ---------- */
async function saveProduct(c: PoolClient, p: Product) {
  const name = text(p.name, "Product name", 200, true);
  const price = money(p.basePrice, "Base price")!;
  if (!Array.isArray(p.variants) || p.variants.length === 0) throw new UserError("Add at least one variant.");
  if (p.variants.length > 200) throw new UserError("Too many variants (max 200).");
  const catId = toId(p.categoryId);
  let catName = "";
  if (catId) {
    const r = await c.query("SELECT name FROM categories WHERE id = $1", [catId]);
    if (!r.rowCount) throw new UserError("That category no longer exists.");
    catName = r.rows[0].name;
  }
  const desc = text(p.description, "Description", 2000);
  const img = image(p.image);

  let pid = toId(p.id);
  if (pid) {
    const r = await c.query(
      "UPDATE products SET name=$2, category=$3, category_id=$4, description=$5, base_price_npr=$6, image_url=$7, active=$8 WHERE id=$1 RETURNING id",
      [pid, name, catName, catId, desc, price, img || null, !!p.active],
    );
    if (!r.rowCount) pid = null;
  }
  if (!pid) {
    const r = await c.query(
      "INSERT INTO products (name, category, category_id, description, base_price_npr, image_url, active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [name, catName, catId, desc, price, img || null, !!p.active],
    );
    pid = String(r.rows[0].id);
  }

  const existing = new Set((await c.query("SELECT id FROM product_variants WHERE product_id = $1", [pid])).rows.map((r) => String(r.id)));
  const keep: Id[] = [];
  for (const v of p.variants) {
    const stock = qty(v.stock, "Stock");
    const vp = money(v.price, "Variant price", { allowEmpty: true });
    const available = stock > 0 && !!v.available;
    const size = text(v.size, "Size", 60);
    const color = text(v.color, "Color", 60);
    const sku = text(v.sku, "SKU", 60) || null;
    const vid = toId(v.id);
    await movement(c, existing.has(vid ?? "") ? "Adjustment" : "Restock", existing.has(vid ?? "") ? "Edited in product form" : "Initial stock");
    if (vid && existing.has(vid)) {
      await c.query(
        `UPDATE product_variants SET sku=$2, size=$3, color=$4, price_npr=$5, stock_qty=$6, available=$7,
           updated_at = CASE WHEN stock_qty IS DISTINCT FROM $6 OR available IS DISTINCT FROM $7 THEN now() ELSE updated_at END
         WHERE id=$1`,
        [vid, sku, size, color, vp, stock, available],
      );
      keep.push(vid);
    } else {
      const r = await c.query(
        `INSERT INTO product_variants (product_id, sku, size, color, price_npr, stock_qty, available)
         VALUES ($1,$2,$3,$4,$5,0,false) RETURNING id`,
        [pid, sku, size, color, vp],
      );
      const nid = String(r.rows[0].id);
      keep.push(nid);
      if (stock > 0) await c.query("UPDATE product_variants SET stock_qty=$2, available=$3, updated_at=now() WHERE id=$1", [nid, stock, available]);
    }
  }
  await c.query("DELETE FROM product_variants WHERE product_id = $1 AND id <> ALL($2::bigint[])", [pid, keep]);
}

async function duplicateProduct(c: PoolClient, id: Id) {
  const r = await c.query(
    `INSERT INTO products (name, category, category_id, description, base_price_npr, image_url, active)
     SELECT name || ' (Copy)', category, category_id, description, base_price_npr, image_url, false FROM products WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!r.rowCount) throw new UserError("Product not found.");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  await movement(c, "Restock", "Duplicated product");
  const nid = String(r.rows[0].id);
  await c.query(
    `INSERT INTO product_variants (product_id, sku, size, color, price_npr, stock_qty, available)
     SELECT $2, CASE WHEN sku IS NULL THEN NULL ELSE sku || '-C' || $3 || id END, size, color, price_npr, 0, false FROM product_variants WHERE product_id = $1`,
    [id, nid, suffix],
  );
  await c.query(
    `UPDATE product_variants nv SET stock_qty = ov.stock_qty, available = ov.available
     FROM product_variants ov
     WHERE nv.product_id = $2 AND ov.product_id = $1 AND ov.size IS NOT DISTINCT FROM nv.size AND ov.color IS NOT DISTINCT FROM nv.color`,
    [id, nid],
  );
}

/* ---------- categories ---------- */
async function saveCategory(c: PoolClient, cat: Category) {
  const name = text(cat.name, "Category name", 60, true);
  const s = cat.variantSchema ?? ({} as Category["variantSchema"]);
  const vals = [
    name, text(cat.description, "Description", 400), image(cat.image), !!cat.active,
    text(s.sizeLabel, "Size label", 40, true), !!s.sizeRequired, text(s.colorLabel, "Color label", 40, true), !!s.colorRequired,
  ];
  const id = toId(cat.id);
  try {
    if (id) {
      const r = await c.query(
        `UPDATE categories SET name=$2, description=$3, image=$4, active=$5, size_label=$6, size_required=$7, color_label=$8, color_required=$9 WHERE id=$1 RETURNING id`,
        [id, ...vals],
      );
      if (r.rowCount) {
        await c.query("UPDATE products SET category = $2 WHERE category_id = $1", [id, name]);
        return;
      }
    }
    await c.query(
      `INSERT INTO categories (name, description, image, active, size_label, size_required, color_label, color_required) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      vals,
    );
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new UserError("A category with this name already exists.");
    throw e;
  }
}

async function deleteCategory(c: PoolClient, id: Id, moveTo: string | undefined) {
  const target = toId(moveTo);
  let name = "";
  if (target) {
    const r = await c.query("SELECT name FROM categories WHERE id = $1", [target]);
    if (!r.rowCount) throw new UserError("Target category not found.");
    name = r.rows[0].name;
  }
  await c.query("UPDATE products SET category_id = $2, category = $3 WHERE category_id = $1", [id, target, name]);
  await c.query("DELETE FROM categories WHERE id = $1", [id]);
}

/* ---------- inventory ---------- */
async function setStock(c: PoolClient, productId: Id, variantId: Id, q: number, type: string, note: string) {
  await movement(c, ["Restock", "Sale", "Adjustment", "Return", "Damaged"].includes(type) ? type : "Adjustment", text(note, "Note", 200) || "Manual edit");
  const r = await c.query(
    "UPDATE product_variants SET stock_qty=$3, available = CASE WHEN $3 = 0 THEN false ELSE available END, updated_at=now() WHERE id=$2 AND product_id=$1",
    [productId, variantId, q],
  );
  if (!r.rowCount) throw new UserError("Variant not found.");
}

async function adjustStock(c: PoolClient, productId: Id, variantId: Id, delta: number) {
  if (!Number.isInteger(delta) || Math.abs(delta) > 100_000) throw new UserError("Invalid quantity change.");
  await movement(c, delta > 0 ? "Restock" : "Adjustment", delta > 0 ? "Quick increment" : "Quick decrement");
  await c.query(
    `UPDATE product_variants SET stock_qty = GREATEST(0, stock_qty + $3),
       available = CASE WHEN GREATEST(0, stock_qty + $3) = 0 THEN false ELSE available END, updated_at = now()
     WHERE id = $2 AND product_id = $1`,
    [productId, variantId, delta],
  );
}

async function setAvailability(c: PoolClient, productId: Id, variantId: Id, available: boolean) {
  const r = await c.query("SELECT stock_qty FROM product_variants WHERE id=$2 AND product_id=$1", [productId, variantId]);
  if (!r.rowCount) throw new UserError("Variant not found.");
  if (available && r.rows[0].stock_qty <= 0) throw new UserError("Add stock before making this variant available.");
  await c.query("UPDATE product_variants SET available=$3, updated_at=now() WHERE id=$2 AND product_id=$1", [productId, variantId, available]);
}

async function bulkStock(c: PoolClient, items: { productId: Id; variantId: Id }[], mode: "add" | "set", value: number) {
  if (!Array.isArray(items) || items.length > 1000) throw new UserError("Too many items selected.");
  if (!Number.isInteger(value) || (mode === "set" && value < 0)) throw new UserError("Invalid quantity.");
  await movement(c, "Adjustment", "Bulk update");
  for (const it of items) {
    await c.query(
      `UPDATE product_variants SET stock_qty = GREATEST(0, CASE WHEN $4 = 'add' THEN stock_qty + $3 ELSE $3 END),
         available = CASE WHEN GREATEST(0, CASE WHEN $4 = 'add' THEN stock_qty + $3 ELSE $3 END) = 0 THEN false ELSE available END, updated_at = now()
       WHERE id = $2 AND product_id = $1`,
      [it.productId, it.variantId, value, mode],
    );
  }
}

/* ---------- orders & payments ---------- */
async function lockOrder(c: PoolClient, id: Id) {
  const r = await c.query("SELECT id, total, paid_amount, payment_status, status FROM orders WHERE id = $1 FOR UPDATE", [id]);
  if (!r.rowCount) throw new UserError("Order not found.");
  return { total: Number(r.rows[0].total), paid: Number(r.rows[0].paid_amount), payment: r.rows[0].payment_status as string, status: r.rows[0].status as string };
}
const orderEvent = (c: PoolClient, orderId: Id, title: string, detail?: string) =>
  c.query("INSERT INTO order_events (order_id, title, detail) VALUES ($1,$2,$3)", [orderId, title, detail ?? null]);

async function setOrderStatus(c: PoolClient, orderId: Id, status: string) {
  if (!ORDER_STATUSES.includes(status as OrderStatus)) throw new UserError("Invalid order status.");
  const r = await c.query("UPDATE orders SET status = $2 WHERE id = $1", [orderId, status]);
  if (!r.rowCount) throw new UserError("Order not found.");
}

async function verifyOrderPayment(c: PoolClient, orderId: Id): Promise<string> {
  const o = await lockOrder(c, orderId);
  if (o.payment === "Refunded") throw new UserError("Refunded orders cannot be verified.");
  const pending = await c.query("SELECT id, amount FROM payments WHERE order_id = $1 AND status = 'Pending' FOR UPDATE", [orderId]);
  const balance = o.status === "Cancelled" ? 0 : Math.max(0, o.total - o.paid);
  const gain = pending.rowCount ? pending.rows.reduce((s, r) => s + Number(r.amount), 0) : balance;
  if (gain <= 0) throw new UserError("Nothing left to verify — this order is fully paid.");
  if (pending.rowCount) {
    await c.query("UPDATE payments SET status = 'Verified' WHERE order_id = $1 AND status = 'Pending'", [orderId]);
  } else {
    await c.query(
      "INSERT INTO payments (order_id, amount, method, status, kind, reference) VALUES ($1,$2,'Bank Transfer','Verified',$3,$4)",
      [orderId, gain, o.paid > 0 ? "Balance" : "Full", `MANUAL${Math.floor(1000 + Math.random() * 9000)}`],
    );
  }
  const paid = Math.min(o.total, o.paid + gain);
  await c.query("UPDATE orders SET paid_amount = $2, payment_status = $3 WHERE id = $1", [orderId, paid, payStatus(o.total, paid)]);
  await orderEvent(c, orderId, "Payment verified", `${fmt(gain)} confirmed by admin`);
  return `Payment of ${fmt(gain)} verified.`;
}

async function refundOrder(c: PoolClient, orderId: Id) {
  const o = await lockOrder(c, orderId);
  if (o.payment === "Refunded") throw new UserError("This order is already refunded.");
  if (o.paid > 0)
    await c.query(
      "INSERT INTO payments (order_id, amount, method, status, kind, reference) VALUES ($1,$2,'Bank Transfer','Refunded','Refund',$3)",
      [orderId, o.paid, `REFUND${Math.floor(1000 + Math.random() * 9000)}`],
    );
  await c.query("UPDATE orders SET paid_amount = 0, payment_status = 'Refunded' WHERE id = $1", [orderId]);
  await orderEvent(c, orderId, "Payment refunded", `${fmt(o.paid)} returned to customer`);
}

async function addOrderNote(c: PoolClient, orderId: Id, body: string, author: string) {
  const t = text(body, "Note", 1000, true);
  const r = await c.query("INSERT INTO order_notes (order_id, author, text) SELECT id, $2, $3 FROM orders WHERE id = $1", [orderId, text(author, "Author", 60) || "Admin", t]);
  if (!r.rowCount) throw new UserError("Order not found.");
}

async function verifyTxn(c: PoolClient, txnId: string, ok: boolean) {
  const m = /^TXN-(\d+)$/.exec(String(txnId));
  if (!m) throw new UserError("Unknown transaction.");
  const r = await c.query("SELECT id, order_id, amount, method FROM payments WHERE id = $1 AND status = 'Pending' FOR UPDATE", [m[1]]);
  if (!r.rowCount) throw new UserError("This transaction is no longer pending.");
  const t = r.rows[0];
  await c.query("UPDATE payments SET status = $2 WHERE id = $1", [t.id, ok ? "Verified" : "Failed"]);
  if (!ok) return;
  const o = await lockOrder(c, String(t.order_id));
  const paid = Math.min(o.total, o.paid + Number(t.amount));
  await c.query("UPDATE orders SET paid_amount = $2, payment_status = CASE WHEN payment_status = 'Refunded' THEN payment_status ELSE $3 END WHERE id = $1", [t.order_id, paid, payStatus(o.total, paid)]);
  await orderEvent(c, String(t.order_id), "Payment verified", `TXN-${t.id} · ${t.method}`);
}

/* ---------- zones, customers, settings ---------- */
async function saveZone(c: PoolClient, z: DeliveryZone) {
  const name = text(z.name, "Zone name", 80, true);
  const fee = money(z.fee, "Delivery fee")!;
  const desc = text(z.description, "Coverage notes", 300);
  const id = toId(z.id);
  if (id) {
    const r = await c.query("UPDATE delivery_zones SET name=$2, fee_npr=$3, description=$4, active=$5 WHERE id=$1", [id, name, fee, desc, !!z.active]);
    if (r.rowCount) {
      await c.query("UPDATE orders SET zone_name = $2 WHERE zone_id = $1", [id, name]);
      return;
    }
  }
  await c.query("INSERT INTO delivery_zones (name, fee_npr, description, active) VALUES ($1,$2,$3,$4)", [name, fee, desc, !!z.active]);
}

async function setBotPaused(c: PoolClient, id: Id, paused: boolean) {
  const r = await c.query(
    "UPDATE customers SET bot_paused = $2, bot_paused_until = CASE WHEN $2 THEN bot_paused_until ELSE NULL END WHERE id = $1",
    [id, paused],
  );
  if (!r.rowCount) throw new UserError("Customer not found.");
  await c.query("INSERT INTO customer_events (customer_id, text) VALUES ($1,$2)", [id, paused ? "Auto-replies paused by admin" : "Auto-replies resumed by admin"]);
}

function cleanSettings(s: Settings): Partial<Settings> {
  const bool = (v: unknown) => !!v;
  const th = Number(s.lowStockThreshold);
  if (!Number.isInteger(th) || th < 0 || th > 1000) throw new UserError("Low-stock threshold must be a whole number between 0 and 1000.");
  const logo = typeof s.logo === "string" ? s.logo : "";
  if (logo.length > 300_000) throw new UserError("Logo is too large.");
  return {
    storeName: text(s.storeName, "Store name", 60, true), logo, currency: "NPR", lowStockThreshold: th,
    adminName: text(s.adminName, "Admin name", 60, true), adminEmail: text(s.adminEmail, "Admin email", 120), adminRole: text(s.adminRole, "Role", 60),
    defaultPeriod: ([1, 7, 30, 90] as number[]).includes(Number(s.defaultPeriod)) ? (Number(s.defaultPeriod) as Settings["defaultPeriod"]) : 30,
    showSparklines: bool(s.showSparklines), compactTables: bool(s.compactTables),
    pageSize: ([10, 20, 50] as number[]).includes(Number(s.pageSize)) ? Number(s.pageSize) : 10,
    notifyLowStock: bool(s.notifyLowStock), notifyNewOrder: bool(s.notifyNewOrder), notifyPayment: bool(s.notifyPayment),
    notifyDigest: (["off", "daily", "weekly"] as const).includes(s.notifyDigest) ? s.notifyDigest : "daily",
    theme: (["light", "dark", "system"] as const).includes(s.theme) ? s.theme : "light",
  };
}

/* ---------- dispatcher ---------- */
export interface CommandResult { ok: boolean; error?: string; message?: string }

export async function runCommand(cmd: { type: string; [k: string]: unknown }): Promise<CommandResult> {
  try {
    const msg = await tx(async (c) => {
      switch (cmd.type) {
        case "saveProduct": return void (await saveProduct(c, cmd.product as Product));
        case "deleteProducts": {
          const ids = (cmd.ids as unknown[]).filter(isId);
          if (!ids.length) return;
          return void (await c.query("DELETE FROM products WHERE id = ANY($1::bigint[])", [ids]));
        }
        case "setProductsActive": {
          const ids = (cmd.ids as unknown[]).filter(isId);
          if (!ids.length) return;
          return void (await c.query("UPDATE products SET active = $2 WHERE id = ANY($1::bigint[])", [ids, !!cmd.active]));
        }
        case "duplicateProduct": return void (await duplicateProduct(c, needId(cmd.id, "Product")));
        case "saveCategory": return void (await saveCategory(c, cmd.category as Category));
        case "deleteCategory": return void (await deleteCategory(c, needId(cmd.id, "Category"), cmd.moveTo as string | undefined));
        case "setStock": return void (await setStock(c, needId(cmd.productId, "Product"), needId(cmd.variantId, "Variant"), qty(cmd.qty), String(cmd.movementType ?? "Adjustment"), String(cmd.note ?? "")));
        case "adjustStock": return void (await adjustStock(c, needId(cmd.productId, "Product"), needId(cmd.variantId, "Variant"), Number(cmd.delta)));
        case "setAvailability": return void (await setAvailability(c, needId(cmd.productId, "Product"), needId(cmd.variantId, "Variant"), !!cmd.available));
        case "bulkStock": {
          const items = (cmd.items as { productId: string; variantId: string }[]).filter((i) => isId(i.productId) && isId(i.variantId));
          return void (await bulkStock(c, items, cmd.mode === "set" ? "set" : "add", Number(cmd.value)));
        }
        case "setOrderStatus": return void (await setOrderStatus(c, needId(cmd.orderId, "Order"), String(cmd.status)));
        case "verifyOrderPayment": return await verifyOrderPayment(c, needId(cmd.orderId, "Order"));
        case "refundOrder": return void (await refundOrder(c, needId(cmd.orderId, "Order")));
        case "addOrderNote": return void (await addOrderNote(c, needId(cmd.orderId, "Order"), String(cmd.text ?? ""), String(cmd.author ?? "Admin")));
        case "verifyTxn": return void (await verifyTxn(c, String(cmd.txnId), !!cmd.ok));
        case "saveZone": return void (await saveZone(c, cmd.zone as DeliveryZone));
        case "deleteZone": return void (await c.query("DELETE FROM delivery_zones WHERE id = $1", [needId(cmd.id, "Zone")]));
        case "setBotPaused": return void (await setBotPaused(c, needId(cmd.id, "Customer"), !!cmd.paused));
        case "saveSettings": return void (await c.query("INSERT INTO app_settings (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data", [JSON.stringify(cleanSettings(cmd.settings as Settings))]));
        default: throw new UserError(`Unknown command: ${cmd.type}`);
      }
    });
    return { ok: true, message: typeof msg === "string" ? msg : undefined };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    const code = (e as { code?: string }).code;
    console.error("[command]", cmd.type, e);
    if (code === "23505") return { ok: false, error: "That value already exists (duplicate SKU or name)." };
    if (code === "23503") return { ok: false, error: "This record is referenced by other data and cannot be changed that way." };
    return { ok: false, error: "Server error. Your change was not saved." };
  }
}
