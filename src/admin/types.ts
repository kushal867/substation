export type ID = string;

export interface VariantSchema {
  /** Label for the "size" attribute (e.g. "Size", "Lens width"). */
  sizeLabel: string;
  sizeRequired: boolean;
  /** Label for the "color" attribute (e.g. "Color", "Frame color"). */
  colorLabel: string;
  colorRequired: boolean;
}

export interface Category {
  id: ID;
  name: string;
  description: string;
  image: string;
  active: boolean;
  variantSchema: VariantSchema;
  createdAt: string;
}

export interface Variant {
  id: ID;
  sku: string;
  size: string;
  color: string;
  /** Optional variant specific price; falls back to product base price. */
  price?: number;
  stock: number;
  available: boolean;
  updatedAt: string;
}

export interface Product {
  id: ID;
  name: string;
  categoryId: ID;
  description: string;
  basePrice: number;
  image: string;
  active: boolean;
  variants: Variant[];
  createdAt: string;
}

export type OrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Unpaid" | "Partially Paid" | "Paid" | "Refunded";

export interface OrderItem {
  productId: ID;
  variantId: ID;
  categoryId: ID;
  name: string;
  variantLabel: string;
  qty: number;
  price: number;
  image: string;
}

export interface TimelineEntry {
  at: string;
  title: string;
  detail?: string;
}

export interface OrderNote {
  id: ID;
  at: string;
  text: string;
  author: string;
}

export interface Order {
  id: ID;
  number: string;
  customerId: ID;
  date: string;
  items: OrderItem[];
  zoneId: ID;
  zoneName: string;
  deliveryFee: number;
  address: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Verified amount collected so far. */
  paid: number;
  notes: OrderNote[];
  timeline: TimelineEntry[];
}

export type PaymentMethod = "eSewa" | "Khalti" | "FonePay" | "Bank Transfer" | "Cash on Delivery";
export type PaymentTxnStatus = "Pending" | "Verified" | "Failed" | "Refunded";
export type PaymentKind = "Advance" | "Full" | "Balance" | "Refund";

export interface PaymentTxn {
  id: ID;
  orderId: ID;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: PaymentTxnStatus;
  kind: PaymentKind;
  reference: string;
}

export type Platform = "Facebook" | "Instagram" | "WhatsApp" | "TikTok" | "Website";
export type CustomerStatus = "Active" | "VIP" | "Inactive";

export interface Customer {
  id: ID;
  name: string;
  phone: string;
  email: string;
  platform: Platform;
  status: CustomerStatus;
  address: string;
  joinedAt: string;
  botPaused: boolean;
  activity: { at: string; text: string }[];
}

export interface DeliveryZone {
  id: ID;
  name: string;
  fee: number;
  active: boolean;
  description: string;
}

export type MovementType = "Restock" | "Sale" | "Adjustment" | "Return" | "Damaged";

export interface StockMovement {
  id: ID;
  at: string;
  productId: ID;
  variantId: ID;
  productName: string;
  variantLabel: string;
  type: MovementType;
  delta: number;
  after: number;
  note: string;
}

export interface Settings {
  storeName: string;
  logo: string;
  currency: "NPR";
  lowStockThreshold: number;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  defaultPeriod: 7 | 30 | 90 | 1;
  showSparklines: boolean;
  compactTables: boolean;
  pageSize: number;
  notifyLowStock: boolean;
  notifyNewOrder: boolean;
  notifyPayment: boolean;
  notifyDigest: "off" | "daily" | "weekly";
  theme: "light" | "dark" | "system";
}

export interface AdminState {
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  payments: PaymentTxn[];
  zones: DeliveryZone[];
  movements: StockMovement[];
  settings: Settings;
  readNotifications: string[];
}

export type StockStatus = "in" | "low" | "out";
