export type Category = "shoes" | "bags" | "glasses";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  oldPrice?: number;
  colors: ColorOption[];
  sizes?: string[];
  images: string[];
  description: string;
  details: string[];
  stock: StockStatus;
  tags: string[];
  createdAt: string;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  color: string;
  colorHex: string;
  size?: string;
  quantity: number;
}
