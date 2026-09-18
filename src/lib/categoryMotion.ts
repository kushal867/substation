export type MotionCategory = "default" | "shoes" | "bags" | "glasses";

export interface CategoryMotionConfig {
  label: string;
  accent: string;
  accentSoft: string;
  from: string;
  to: string;
}

/**
 * Centralized visual identity per category — background atmosphere colors and
 * accent used by <MotionBackground> and the category motif primitives. Keeping
 * this in one place means every surface (hero, category pages, product pages,
 * cards) stays visually consistent without hardcoding colors per component.
 */
export const CATEGORY_MOTION: Record<MotionCategory, CategoryMotionConfig> = {
  default: {
    label: "SABSTATION",
    accent: "#b6905a",
    accentSoft: "rgba(182,144,90,0.22)",
    from: "#171310",
    to: "#0d0b09",
  },
  shoes: {
    label: "Shoes",
    accent: "#b6905a",
    accentSoft: "rgba(182,144,90,0.26)",
    from: "#191410",
    to: "#0d0b09",
  },
  bags: {
    label: "Bags",
    accent: "#a06a44",
    accentSoft: "rgba(160,106,68,0.28)",
    from: "#1c130c",
    to: "#100a06",
  },
  glasses: {
    label: "Glasses",
    accent: "#cdc5b4",
    accentSoft: "rgba(205,197,180,0.18)",
    from: "#151515",
    to: "#0a0a0a",
  },
};
