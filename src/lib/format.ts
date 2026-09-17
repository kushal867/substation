export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export const CATEGORY_LABEL: Record<string, string> = {
  shoes: "Shoes",
  bags: "Bags",
  glasses: "Glasses",
};
