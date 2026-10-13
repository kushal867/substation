import type { Settings } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  storeName: "SABSTATION",
  logo: "",
  currency: "NPR",
  lowStockThreshold: 5,
  adminName: "Admin",
  adminEmail: "",
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
