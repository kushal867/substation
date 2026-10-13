import type {
  AdminState, Category, Customer, DeliveryZone, Order, OrderStatus, PaymentMethod, PaymentStatus,
  PaymentTxn, Platform, Product, Settings, StockMovement, Variant, CustomerStatus, MovementType,
} from "../types";
import { orderTotal } from "../lib/range";

export const DEFAULT_SETTINGS: Settings = {
  storeName: "SABSTATION",
  logo: "",
  currency: "NPR",
  lowStockThreshold: 5,
  adminName: "Kushal Sapkota",
  adminEmail: "admin@sabstation.demo",
  adminRole: "Store Owner",
  defaultPeriod: 30,
  showSparklines: true,
  compactTables: false,
  pageSize: 10,
  notifyLowStock: true,
  notifyNewOrder: true,
  notifyPayment: true,
  notifyDigest: "daily",
  theme: "light",
};

/** Small deterministic PRNG so the demo data looks the same on every reset. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

/** Clean store: only the three base categories (they define variant fields). */
export function createEmptySeed(): AdminState {
  const base = createSampleSeed();
  return {
    products: [], orders: [], customers: [], payments: [], zones: [], movements: [], readNotifications: [],
    categories: base.categories.filter((c) => ["cat_shoes", "cat_glasses", "cat_bags"].includes(c.id)),
    settings: DEFAULT_SETTINGS,
  };
}

export function createSampleSeed(now = new Date()): AdminState {
  const rand = rng(20240611);
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
  const ago = (days: number, hour = int(8, 20)) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour, int(0, 59));
    return d.toISOString();
  };

  // ---- Categories ----
  const cat = (id: string, name: string, description: string, image: string, schema: Category["variantSchema"], days: number, active = true): Category => ({
    id, name, description, image, active, variantSchema: schema, createdAt: ago(days, 10),
  });
  const categories: Category[] = [
    cat("cat_shoes", "Shoes", "Sneakers, runners and everyday footwear.", "", { sizeLabel: "Size (EU)", sizeRequired: true, colorLabel: "Color", colorRequired: true }, 240),
    cat("cat_glasses", "Glasses", "Sunglasses, sports eyewear and reading frames.", "", { sizeLabel: "Lens size", sizeRequired: false, colorLabel: "Frame color", colorRequired: true }, 238),
    cat("cat_bags", "Bags", "Backpacks, office bags and travel carry.", "", { sizeLabel: "Size", sizeRequired: false, colorLabel: "Color", colorRequired: true }, 236),
    cat("cat_acc", "Accessories", "Belts, wallets and small leather goods.", "", { sizeLabel: "Material", sizeRequired: false, colorLabel: "Finish", colorRequired: false }, 150),
    cat("cat_watch", "Watches", "Minimal analog and digital watches. (Coming soon)", "", { sizeLabel: "Case size", sizeRequired: false, colorLabel: "Strap", colorRequired: true }, 60, false),
  ];

  // ---- Products ----
  const shoeSizes = ["38", "39", "40", "41", "42", "43", "44"];
  let skuN = 1000;
  const mkVariants = (prefix: string, combos: { size?: string; color: string; price?: number }[], stockProfile?: (i: number) => number): Variant[] =>
    combos.map((c, i) => {
      const stock = stockProfile ? stockProfile(i) : int(7, 32);
      return {
        id: `var_${prefix}_${i}`,
        sku: `${prefix.toUpperCase()}-${(skuN++).toString(36).toUpperCase()}`,
        size: c.size ?? "",
        color: c.color,
        price: c.price,
        stock,
        available: stock > 0,
        updatedAt: ago(int(0, 20)),
      };
    });

  const shoeCombos = (colors: string[], sizes: string[]) =>
    colors.flatMap((color) => sizes.map((size) => ({ color, size })));

  type P = [string, string, string, number, string, number, { size?: string; color: string; price?: number }[], ((i: number) => number)?];
  const defs: P[] = [
    ["nike-air-max", "Nike Air Max", "cat_shoes", 14500, "Iconic cushioned sneaker with visible Air unit for all-day comfort.", 200, shoeCombos(["Black", "White", "Red"], ["40", "41", "42", "43"]).map((c, i) => ({ ...c, price: i % 5 === 0 ? 15500 : undefined }))],
    ["adidas-running-shoes", "Adidas Running Shoes", "cat_shoes", 11800, "Lightweight breathable runner built for daily mileage.", 190, shoeCombos(["Navy", "Grey"], ["39", "40", "41", "42", "43", "44"]), (i) => (i === 3 ? 2 : i === 7 ? 0 : int(8, 22))],
    ["puma-suede-classic", "Puma Suede Classic", "cat_shoes", 9900, "Retro suede court shoe with a soft rubber outsole.", 170, shoeCombos(["Maroon", "Black"], ["39", "40", "41", "42"])],
    ["converse-chuck-70", "Converse Chuck 70", "cat_shoes", 8700, "Canvas high-top with premium cushioning and vintage trim.", 150, shoeCombos(["Off White", "Black"], ["38", "39", "40", "41", "42"])],
    ["reebok-classic-leather", "Reebok Classic Leather", "cat_shoes", 10400, "Soft garment leather upper with EVA midsole.", 120, shoeCombos(["White"], shoeSizes), (i) => (i % 3 === 0 ? int(0, 4) : int(9, 20))],
    ["new-balance-574", "New Balance 574", "cat_shoes", 12900, "Heritage runner silhouette with ENCAP midsole support.", 95, shoeCombos(["Grey", "Green"], ["40", "41", "42", "43"])],
    ["classic-black-sunglasses", "Classic Black Sunglasses", "cat_glasses", 3200, "Timeless black acetate frame with UV400 lenses.", 180, [{ color: "Gloss Black", size: "52mm" }, { color: "Matte Black", size: "52mm" }, { color: "Gloss Black", size: "55mm", price: 3500 }]],
    ["polarized-sports-glasses", "Polarized Sports Glasses", "cat_glasses", 4800, "Wrap-around polarized lenses, anti-slip nose pads for sport.", 160, [{ color: "Blue Mirror" }, { color: "Green Mirror" }, { color: "Black" }, { color: "Orange" }], (i) => (i === 2 ? 3 : int(8, 18))],
    ["aviator-gold-frame", "Aviator Gold Frame", "cat_glasses", 4200, "Gold metal aviator with gradient lenses.", 140, [{ color: "Gold", size: "58mm" }, { color: "Silver", size: "58mm" }]],
    ["blue-light-reading-glasses", "Blue-Light Reading Glasses", "cat_glasses", 2400, "Lightweight frames with blue-light filter coating.", 110, [{ color: "Clear" }, { color: "Tortoise" }], () => 0],
    ["round-retro-frames", "Round Retro Frames", "cat_glasses", 3600, "Vintage round metal frames, spring hinges.", 85, [{ color: "Bronze", size: "49mm" }, { color: "Black", size: "49mm" }, { color: "Bronze", size: "51mm" }]],
    ["wayfarer-tortoise", "Wayfarer Tortoise", "cat_glasses", 3900, "Classic wayfarer shape in tortoise-shell acetate.", 60, [{ color: "Tortoise" }, { color: "Havana" }]],
    ["leather-office-bag", "Leather Office Bag", "cat_bags", 8900, "Full-grain leather briefcase with padded 15\" laptop sleeve.", 175, [{ color: "Brown", size: "Standard" }, { color: "Black", size: "Standard" }, { color: "Tan", size: "Standard", price: 9400 }]],
    ["everyday-backpack", "Everyday Backpack", "cat_bags", 4500, "Water-resistant 24L daypack with hidden anti-theft pocket.", 165, [{ color: "Charcoal", size: "24L" }, { color: "Olive", size: "24L" }, { color: "Navy", size: "24L" }, { color: "Charcoal", size: "30L", price: 5200 }]],
    ["canvas-tote", "Canvas Tote", "cat_bags", 2100, "Heavy cotton canvas tote with inner zip pocket.", 130, [{ color: "Natural" }, { color: "Black" }]],
    ["travel-duffel", "Travel Duffel", "cat_bags", 7200, "Weekender duffel with shoe compartment.", 100, [{ color: "Black", size: "40L" }, { color: "Khaki", size: "40L" }, { color: "Black", size: "60L", price: 8600 }], (i) => (i === 1 ? 1 : int(6, 12))],
    ["crossbody-sling", "Crossbody Sling", "cat_bags", 2900, "Compact sling for daily essentials.", 70, [{ color: "Black" }, { color: "Maroon" }]],
    ["laptop-messenger", "Laptop Messenger", "cat_bags", 5600, "Slim messenger bag with padded shoulder strap.", 50, [{ color: "Grey" }, { color: "Black" }]],
    ["leather-wallet", "Leather Wallet", "cat_acc", 1800, "Bi-fold wallet with RFID-blocking lining.", 125, [{ color: "Dark Brown", size: "Leather" }, { color: "Black", size: "Leather" }]],
    ["classic-leather-belt", "Classic Leather Belt", "cat_acc", 1500, "Reversible leather belt with brushed buckle.", 105, [{ color: "Black", size: "32in" }, { color: "Black", size: "34in" }, { color: "Brown", size: "34in" }, { color: "Brown", size: "36in" }]],
    ["wool-cap", "Wool Cap", "cat_acc", 900, "Warm merino-blend beanie.", 20, [{ color: "Grey" }, { color: "Navy" }]],
  ];

  const products: Product[] = defs.map(([slug, name, categoryId, basePrice, description, days, combos, profile]) => ({
    id: `prod_${slug}`,
    name,
    categoryId,
    description,
    basePrice,
    image: "",
    active: slug !== "wool-cap",
    variants: mkVariants(slug.split("-").map((w) => w[0]).join("") + String(skuN), combos, profile),
    createdAt: ago(days, 11),
  }));

  // ---- Zones ----
  const zones: DeliveryZone[] = [
    { id: "zone_ktm", name: "Kathmandu Valley", fee: 100, active: true, description: "Kathmandu, Lalitpur, Bhaktapur — same or next-day delivery." },
    { id: "zone_pkr", name: "Pokhara", fee: 150, active: true, description: "Pokhara metropolitan area." },
    { id: "zone_out", name: "Outside Valley (Major Cities)", fee: 250, active: true, description: "Biratnagar, Butwal, Birgunj, Chitwan, Nepalgunj." },
    { id: "zone_rem", name: "Remote Districts", fee: 400, active: true, description: "Hill and mountain districts via cargo, 5–7 days." },
    { id: "zone_int", name: "International (Pilot)", fee: 1800, active: false, description: "Paused until courier partner is confirmed." },
  ];

  // ---- Customers ----
  const names: [string, string, Platform][] = [
    ["Aarav Sharma", "9841234501", "Facebook"], ["Sita Gurung", "9851098712", "Instagram"], ["Bikash Thapa", "9803456718", "WhatsApp"],
    ["Anjali Karki", "9860123490", "Instagram"], ["Rohan Shrestha", "9818765432", "Website"], ["Pooja Adhikari", "9845671230", "Facebook"],
    ["Nabin Rai", "9842001987", "TikTok"], ["Sunita Magar", "9867543210", "WhatsApp"], ["Prakash Bhandari", "9813322110", "Facebook"],
    ["Mina Tamang", "9808877665", "Instagram"], ["Dipesh Joshi", "9856001122", "Website"], ["Kritika Pandey", "9819988776", "Instagram"],
    ["Sagar Lama", "9846677889", "Facebook"], ["Rashmi Basnet", "9863344556", "WhatsApp"], ["Umesh Chaudhary", "9811122334", "TikTok"],
    ["Nisha Koirala", "9844455667", "Website"], ["Hari Poudel", "9857788990", "Facebook"], ["Asmita Dahal", "9802233445", "Instagram"],
  ];
  const customers: Customer[] = names.map(([name, phone, platform], i) => ({
    id: `cus_${i + 1}`,
    name,
    phone: `+977 ${phone}`,
    email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com",
    platform,
    status: "Active" as CustomerStatus,
    address: pick(["Baneshwor, Kathmandu", "Lakeside, Pokhara", "Jawalakhel, Lalitpur", "Suryabinayak, Bhaktapur", "Butwal-8, Rupandehi", "Biratnagar-4, Morang", "Bharatpur-10, Chitwan"]),
    joinedAt: ago(int(30, 220)),
    botPaused: i % 7 === 3,
    activity: [],
  }));

  // ---- Orders ----
  const orders: Order[] = [];
  const payments: PaymentTxn[] = [];
  const methods: PaymentMethod[] = ["eSewa", "Khalti", "FonePay", "Bank Transfer", "Cash on Delivery"];
  const activeProducts = products.filter((p) => p.active);
  let orderNo = 1001;
  let txnNo = 5001;
  const days: number[] = [];
  for (let d = 119; d >= 0; d--) {
    // more orders on recent days to simulate growth
    const n = d === 0 ? 4 : d < 30 ? int(1, 4) : d < 70 ? int(1, 3) : int(0, 3);
    for (let k = 0; k < n; k++) days.push(d);
  }
  for (const d of days) {
    const cust = pick(customers);
    const zone = pick(zones.filter((z) => z.active));
    const itemCount = rand() < 0.65 ? 1 : rand() < 0.8 ? 2 : 3;
    const chosen = new Set<string>();
    const items = [] as Order["items"];
    for (let i = 0; i < itemCount; i++) {
      const p = pick(activeProducts);
      if (chosen.has(p.id)) continue;
      chosen.add(p.id);
      const v = pick(p.variants);
      items.push({
        productId: p.id, variantId: v.id, categoryId: p.categoryId, name: p.name,
        variantLabel: [v.color, v.size].filter(Boolean).join(" / "), qty: rand() < 0.8 ? 1 : 2,
        price: v.price ?? p.basePrice, image: p.image,
      });
    }
    // status mix: older orders are mostly delivered
    const r = rand();
    let status: OrderStatus;
    if (d > 20) status = r < 0.86 ? "Delivered" : r < 0.94 ? "Cancelled" : "Shipped";
    else if (d > 7) status = r < 0.55 ? "Delivered" : r < 0.7 ? "Shipped" : r < 0.82 ? "Processing" : r < 0.92 ? "Confirmed" : "Cancelled";
    else if (d > 2) status = r < 0.3 ? "Shipped" : r < 0.55 ? "Processing" : r < 0.8 ? "Confirmed" : r < 0.93 ? "Pending" : "Cancelled";
    else status = r < 0.5 ? "Pending" : r < 0.8 ? "Confirmed" : "Processing";

    const date = ago(d);
    const number = `ORD-${orderNo++}`;
    const o: Order = {
      id: `ord_${number}`, number, customerId: cust.id, date, items, zoneId: zone.id, zoneName: zone.name,
      deliveryFee: zone.fee, address: cust.address, orderStatus: status, paymentStatus: "Unpaid", paid: 0, notes: [], timeline: [],
    };
    const total = orderTotal(o);
    // payment pattern
    let pay: PaymentStatus;
    const pr = rand();
    if (status === "Cancelled") pay = pr < 0.25 ? "Refunded" : "Unpaid";
    else if (status === "Delivered") pay = pr < 0.9 ? "Paid" : "Partially Paid";
    else if (status === "Shipped") pay = pr < 0.6 ? "Paid" : "Partially Paid";
    else pay = pr < 0.3 ? "Paid" : pr < 0.7 ? "Partially Paid" : "Unpaid";
    const method = pick(methods.slice(0, 4));
    const addTxn = (amount: number, kind: PaymentTxn["kind"], st: PaymentTxn["status"], when: string, m = method) =>
      payments.push({ id: `TXN-${txnNo++}`, orderId: o.id, amount, method: m, date: when, status: st, kind, reference: `${m.slice(0, 3).toUpperCase()}${int(100000, 999999)}` });

    if (pay === "Paid") {
      const adv = rand() < 0.5 ? Math.round((total * 0.4) / 10) * 10 : 0;
      const verified = !(d < 3 && rand() < 0.5);
      if (adv) {
        addTxn(adv, "Advance", "Verified", date);
        addTxn(total - adv, "Balance", verified ? "Verified" : "Pending", ago(Math.max(0, d - 1)));
      } else addTxn(total, "Full", verified ? "Verified" : "Pending", date);
      if (verified) o.paid = total;
      else if (adv) o.paid = adv;
      o.paymentStatus = verified ? "Paid" : adv ? "Partially Paid" : "Unpaid";
    } else if (pay === "Partially Paid") {
      const adv = Math.round((total * 0.3) / 10) * 10;
      const verified = !(d < 4 && rand() < 0.55);
      addTxn(adv, "Advance", verified ? "Verified" : "Pending", date);
      o.paid = verified ? adv : 0;
      o.paymentStatus = verified ? "Partially Paid" : "Unpaid";
    } else if (pay === "Refunded") {
      addTxn(total, "Full", "Verified", date);
      addTxn(total, "Refund", "Refunded", ago(Math.max(0, d - 1)));
      o.paymentStatus = "Refunded";
    }
    if (rand() < 0.04 && pay !== "Paid") addTxn(Math.round(total * 0.3), "Advance", "Failed", date);

    o.timeline.push({ at: date, title: "Order placed", detail: `via ${cust.platform}` });
    const flow: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
    if (status === "Cancelled") o.timeline.push({ at: ago(Math.max(0, d - 1)), title: "Order cancelled", detail: "Cancelled at customer request" });
    else flow.slice(1, flow.indexOf(status) + 1).forEach((s, i) => o.timeline.push({ at: new Date(new Date(date).getTime() + (i + 1) * 0.6 * DAY).toISOString().replace(/^(.*)$/, (x) => (new Date(x) > now ? now.toISOString() : x)), title: `Marked ${s}` }));
    if (rand() < 0.15) o.notes.push({ id: `note_${o.number}`, at: date, author: "Kushal", text: pick(["Customer asked for evening delivery.", "Call before delivery — gate code needed.", "Gift wrap requested.", "VIP customer — prioritise."]) });
    orders.push(o);
  }
  orders.sort((a, b) => b.date.localeCompare(a.date));
  payments.sort((a, b) => b.date.localeCompare(a.date));

  // customer status + activity
  for (const c of customers) {
    const mine = orders.filter((o) => o.customerId === c.id);
    const spent = mine.filter((o) => o.orderStatus !== "Cancelled").reduce((s, o) => s + orderTotal(o), 0);
    const last = mine[0]?.date;
    c.status = spent > 60000 ? "VIP" : !last || Date.now() - new Date(last).getTime() > 75 * DAY ? "Inactive" : "Active";
    c.activity = [
      ...mine.slice(0, 3).map((o) => ({ at: o.date, text: `Placed order ${o.number}` })),
      { at: c.joinedAt, text: `Joined via ${c.platform}` },
    ].sort((a, b) => b.at.localeCompare(a.at));
  }

  // ---- Stock movement history ----
  const movements: StockMovement[] = [];
  const mvTypes: [MovementType, number, string][] = [
    ["Restock", 12, "Supplier delivery PO-"], ["Sale", -1, "Order fulfilled "], ["Adjustment", -2, "Cycle count correction"],
    ["Return", 1, "Customer return RMA-"], ["Damaged", -1, "Damaged in storage"],
  ];
  for (let i = 0; i < 40; i++) {
    const p = pick(products);
    const v = pick(p.variants);
    const [type, base, note] = pick(mvTypes);
    const delta = type === "Restock" ? int(6, 24) : type === "Sale" ? -int(1, 2) : base;
    movements.push({
      id: `mv_${i}`, at: ago(int(0, 25)), productId: p.id, variantId: v.id, productName: p.name, variantLabel: [v.color, v.size].filter(Boolean).join(" / "),
      type, delta, after: Math.max(0, v.stock), note: note.endsWith("-") || note.endsWith(" ") ? note + int(100, 999) : note,
    });
  }
  movements.sort((a, b) => b.at.localeCompare(a.at));

  return { products, categories, orders, customers, payments, zones, movements, settings: DEFAULT_SETTINGS, readNotifications: [] };
}
