import type { Category, Product } from "./types";

const SHOE_SIZES = ["6", "7", "8", "9", "10", "11", "12", "13"];

/**
 * Real photos live at /public/images/{category}/products/{01-08}/1.jpg, matching
 * each product's position within its category (see SABSTATION-image-pack). If a
 * file is ever missing, <ProductImage> automatically falls back to the generated
 * placeholder art.
 */
function imagesFor(category: Category, indexInCategory: number): string[] {
  const n = String(indexInCategory + 1).padStart(2, "0");
  return [`/images/${category}/products/${n}/1.jpg`];
}

const RAW_PRODUCTS: Omit<Product, "images">[] = [
  // ---------------- SHOES ----------------
  {
    id: "sh-01",
    slug: "voltage-runner",
    name: "Voltage Runner",
    category: "shoes",
    price: 189,
    oldPrice: 230,
    colors: [
      { name: "Volt Lime", hex: "#d7ff3f" },
      { name: "Blackout", hex: "#111111" },
      { name: "Cloud", hex: "#f4f1ea" },
    ],
    sizes: SHOE_SIZES,
    description:
      "A featherweight trainer built for the pace of the city. Responsive foam, a knit upper that moves with you, and a sole unit that refuses to blend in.",
    details: [
      "Engineered knit upper for breathability",
      "Dual-density foam midsole",
      "Recycled rubber outsole",
      "Reflective heel tab for low-light visibility",
    ],
    stock: "in-stock",
    tags: ["new", "bestseller"],
    createdAt: "2026-08-20",
    rating: 4.8,
    reviewCount: 214,
  },
  {
    id: "sh-02",
    slug: "concrete-high",
    name: "Concrete High",
    category: "shoes",
    price: 215,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Bone", hex: "#e8e2d4" },
    ],
    sizes: SHOE_SIZES,
    description:
      "A high-top silhouette with reinforced panels and a padded collar. Built from durable canvas and leather trims that age like your favorite jacket.",
    details: [
      "Waxed canvas + leather overlays",
      "Padded ankle collar",
      "Vulcanized rubber sole",
      "Metal eyelets, flat waxed laces",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-05-11",
    rating: 4.6,
    reviewCount: 158,
  },
  {
    id: "sh-03",
    slug: "glide-slip",
    name: "Glide Slip-On",
    category: "shoes",
    price: 129,
    colors: [
      { name: "Warm Sand", hex: "#d8c6a5" },
      { name: "Blackout", hex: "#111111" },
    ],
    sizes: SHOE_SIZES,
    description:
      "No laces, no friction, no compromise. A sock-fit slip-on with a contoured footbed for all-day comfort between meetings and movement.",
    details: [
      "Stretch-knit sock construction",
      "Memory-foam contoured footbed",
      "Lightweight EVA outsole",
      "Machine washable upper",
    ],
    stock: "low-stock",
    tags: ["new"],
    createdAt: "2026-09-01",
    rating: 4.4,
    reviewCount: 76,
  },
  {
    id: "sh-04",
    slug: "trail-apex",
    name: "Trail Apex",
    category: "shoes",
    price: 245,
    colors: [
      { name: "Rust Orange", hex: "#ff5a1f" },
      { name: "Slate", hex: "#4a4a4a" },
    ],
    sizes: SHOE_SIZES,
    description:
      "Off-road capability with on-road manners. An aggressive lug outsole and a water-resistant upper mean the terrain never dictates the route.",
    details: [
      "Water-resistant ripstop upper",
      "Multi-directional lug outsole",
      "Rock plate for underfoot protection",
      "Gusseted tongue keeps debris out",
    ],
    stock: "in-stock",
    tags: ["new"],
    createdAt: "2026-08-02",
    rating: 4.7,
    reviewCount: 92,
  },
  {
    id: "sh-05",
    slug: "low-line-classic",
    name: "Low Line Classic",
    category: "shoes",
    price: 149,
    oldPrice: 180,
    colors: [
      { name: "Cloud", hex: "#f4f1ea" },
      { name: "Forest", hex: "#2f3d2c" },
      { name: "Blackout", hex: "#111111" },
    ],
    sizes: SHOE_SIZES,
    description:
      "The everyday low-top, refined. Minimal branding, a clean toe cap, and a cupsole built to outlast trend cycles.",
    details: [
      "Full-grain leather upper",
      "Cushioned cupsole construction",
      "Perforated toe cap for airflow",
      "Recycled felt lining",
    ],
    stock: "in-stock",
    tags: ["sale"],
    createdAt: "2026-02-14",
    rating: 4.5,
    reviewCount: 301,
  },
  {
    id: "sh-06",
    slug: "flux-trainer",
    name: "Flux Trainer",
    category: "shoes",
    price: 175,
    colors: [
      { name: "Volt Lime", hex: "#d7ff3f" },
      { name: "Blackout", hex: "#111111" },
    ],
    sizes: SHOE_SIZES,
    description:
      "A cross-trainer that holds its shape under load. Lateral support cages and a firm heel clip keep you stable through every cut and jump.",
    details: [
      "Lateral support cage overlays",
      "Firm heel clip for stability",
      "Compression-molded midsole",
      "Herringbone traction pattern",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-04-18",
    rating: 4.6,
    reviewCount: 133,
  },
  {
    id: "sh-07",
    slug: "night-shift-boot",
    name: "Night Shift Boot",
    category: "shoes",
    price: 259,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Slate", hex: "#4a4a4a" },
    ],
    sizes: SHOE_SIZES,
    description:
      "A combat-inspired boot with a sealed construction. Weatherproof, quiet on pavement, and unbothered by the forecast.",
    details: [
      "Sealed, weatherproof construction",
      "Side-zip with lace overlay",
      "Shock-absorbing heel pod",
      "Oil and slip-resistant outsole",
    ],
    stock: "low-stock",
    tags: ["limited"],
    createdAt: "2026-07-09",
    rating: 4.9,
    reviewCount: 47,
  },
  {
    id: "sh-08",
    slug: "featherweight-mule",
    name: "Featherweight Mule",
    category: "shoes",
    price: 139,
    colors: [
      { name: "Bone", hex: "#e8e2d4" },
      { name: "Warm Sand", hex: "#d8c6a5" },
    ],
    sizes: SHOE_SIZES,
    description:
      "Backless ease with a structured toe box. The mule you reach for on travel days and everything after.",
    details: [
      "Backless slip-in design",
      "Structured toe box holds shape",
      "Cork-blend footbed",
      "Packs flat for travel",
    ],
    stock: "in-stock",
    tags: [],
    createdAt: "2026-06-25",
    rating: 4.3,
    reviewCount: 64,
  },

  // ---------------- BAGS ----------------
  {
    id: "bg-01",
    slug: "commuter-tote",
    name: "Commuter Tote",
    category: "bags",
    price: 165,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Bone", hex: "#e8e2d4" },
    ],
    sizes: ["Standard"],
    description:
      "A structured tote built for the laptop-and-lunch commute. Wide enough for a day's essentials, sharp enough for a boardroom.",
    details: [
      "Fits up to 15\" laptop",
      "Water-resistant recycled canvas",
      "Magnetic top closure",
      "Interior zip and slip pockets",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-03-12",
    rating: 4.7,
    reviewCount: 189,
  },
  {
    id: "bg-02",
    slug: "cross-body-sling",
    name: "Cross-Body Sling",
    category: "bags",
    price: 95,
    colors: [
      { name: "Volt Lime", hex: "#d7ff3f" },
      { name: "Blackout", hex: "#111111" },
      { name: "Rust Orange", hex: "#ff5a1f" },
    ],
    sizes: ["Mini", "Standard"],
    description:
      "Hands-free carry for a fast-moving day. Adjustable strap, a dedicated phone sleeve, and just enough room for the essentials.",
    details: [
      "Adjustable, quick-release strap",
      "Dedicated phone + card sleeves",
      "Water-resistant zipper",
      "Recycled ballistic nylon shell",
    ],
    stock: "in-stock",
    tags: ["new"],
    createdAt: "2026-08-28",
    rating: 4.5,
    reviewCount: 87,
  },
  {
    id: "bg-03",
    slug: "structured-mini-bag",
    name: "Structured Mini Bag",
    category: "bags",
    price: 210,
    oldPrice: 260,
    colors: [
      { name: "Bone", hex: "#e8e2d4" },
      { name: "Forest", hex: "#2f3d2c" },
    ],
    sizes: ["Mini"],
    description:
      "A boxy mini silhouette with a rigid frame and a detachable chain strap. Small enough to be a statement.",
    details: [
      "Rigid internal frame",
      "Detachable gold-tone chain strap",
      "Suede-lined interior",
      "Magnetic snap closure",
    ],
    stock: "in-stock",
    tags: ["sale"],
    createdAt: "2026-01-30",
    rating: 4.6,
    reviewCount: 122,
  },
  {
    id: "bg-04",
    slug: "weekender-duffel",
    name: "Weekender Duffel",
    category: "bags",
    price: 245,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Warm Sand", hex: "#d8c6a5" },
    ],
    sizes: ["Standard", "Large"],
    description:
      "Two days or two weeks, the duffel that outlasts the trip. A reinforced base and a shoe compartment keep everything in its place.",
    details: [
      "Separate ventilated shoe compartment",
      "Reinforced, water-resistant base",
      "Adjustable, removable shoulder strap",
      "Trolley sleeve for luggage stacking",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-04-05",
    rating: 4.8,
    reviewCount: 176,
  },
  {
    id: "bg-05",
    slug: "everyday-backpack",
    name: "Everyday Backpack",
    category: "bags",
    price: 189,
    colors: [
      { name: "Slate", hex: "#4a4a4a" },
      { name: "Blackout", hex: "#111111" },
    ],
    sizes: ["Standard"],
    description:
      "A minimal backpack that carries more than it shows. Padded laptop sleeve, a hidden back pocket, and straps that don't dig in.",
    details: [
      "Padded 16\" laptop sleeve",
      "Hidden anti-theft back pocket",
      "Breathable mesh shoulder straps",
      "External bottle pocket",
    ],
    stock: "in-stock",
    tags: [],
    createdAt: "2026-05-22",
    rating: 4.7,
    reviewCount: 203,
  },
  {
    id: "bg-06",
    slug: "clutch-fold",
    name: "Clutch Fold",
    category: "bags",
    price: 110,
    colors: [
      { name: "Rust Orange", hex: "#ff5a1f" },
      { name: "Bone", hex: "#e8e2d4" },
    ],
    sizes: ["One Size"],
    description:
      "An architectural fold-over clutch that goes from desk to dinner. A slim wrist strap keeps your hands free when you need them.",
    details: [
      "Origami-inspired fold construction",
      "Detachable wrist strap",
      "Card slots inside main compartment",
      "Vegan leather exterior",
    ],
    stock: "low-stock",
    tags: ["new"],
    createdAt: "2026-08-15",
    rating: 4.4,
    reviewCount: 58,
  },
  {
    id: "bg-07",
    slug: "utility-belt-bag",
    name: "Utility Belt Bag",
    category: "bags",
    price: 79,
    colors: [
      { name: "Volt Lime", hex: "#d7ff3f" },
      { name: "Blackout", hex: "#111111" },
    ],
    sizes: ["One Size"],
    description:
      "The belt bag that earned a permanent spot in rotation. Multiple compartments, a durable webbing strap, and zero bounce.",
    details: [
      "Multi-compartment layout",
      "Adjustable webbing strap",
      "Water-resistant YKK zippers",
      "Reflective logo hit",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-03-30",
    rating: 4.6,
    reviewCount: 241,
  },
  {
    id: "bg-08",
    slug: "laptop-portfolio",
    name: "Laptop Portfolio",
    category: "bags",
    price: 135,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Forest", hex: "#2f3d2c" },
    ],
    sizes: ["Standard"],
    description:
      "A slim portfolio sleeve for the minimalist carry. Fits a laptop, a notebook, and nothing you don't need.",
    details: [
      "Fits up to 14\" laptop",
      "Full-grain leather exterior",
      "Magnetic flap closure",
      "Interior document pocket",
    ],
    stock: "in-stock",
    tags: [],
    createdAt: "2026-02-01",
    rating: 4.5,
    reviewCount: 71,
  },

  // ---------------- GLASSES ----------------
  {
    id: "gl-01",
    slug: "horizon-square",
    name: "Horizon Square",
    category: "glasses",
    price: 165,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Tortoise", hex: "#7a5230" },
    ],
    description:
      "Bold square frames with a flat brow bar. Polarized lenses cut glare without cutting contrast.",
    details: [
      "Polarized UV400 lenses",
      "Acetate frame, spring hinges",
      "Includes microfiber pouch",
      "100% UVA/UVB protection",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-05-08",
    rating: 4.7,
    reviewCount: 168,
  },
  {
    id: "gl-02",
    slug: "aviator-edge",
    name: "Aviator Edge",
    category: "glasses",
    price: 189,
    oldPrice: 220,
    colors: [
      { name: "Gunmetal", hex: "#5b5f63" },
      { name: "Gold", hex: "#c9a24b" },
    ],
    description:
      "The classic aviator, sharpened. A thinner metal frame and a gradient lens built for peak daylight.",
    details: [
      "Gradient polarized lenses",
      "Lightweight titanium alloy frame",
      "Adjustable silicone nose pads",
      "Scratch-resistant coating",
    ],
    stock: "in-stock",
    tags: ["sale"],
    createdAt: "2026-01-19",
    rating: 4.8,
    reviewCount: 254,
  },
  {
    id: "gl-03",
    slug: "clear-vision-optical",
    name: "Clear Vision Optical",
    category: "glasses",
    price: 145,
    colors: [
      { name: "Crystal", hex: "#e9ecef" },
      { name: "Blackout", hex: "#111111" },
    ],
    description:
      "Blue-light filtering optical frames for screen-heavy days. Lightweight enough to forget you're wearing them.",
    details: [
      "Blue-light filtering lenses",
      "TR90 flexible frame material",
      "Anti-reflective coating",
      "Adjustable temple tips",
    ],
    stock: "in-stock",
    tags: ["new"],
    createdAt: "2026-08-10",
    rating: 4.6,
    reviewCount: 99,
  },
  {
    id: "gl-04",
    slug: "shield-wrap",
    name: "Shield Wrap",
    category: "glasses",
    price: 175,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Volt Lime", hex: "#d7ff3f" },
    ],
    description:
      "A wraparound shield silhouette built for movement. Maximum coverage, minimal weight, unmistakable presence.",
    details: [
      "Wraparound single-lens shield",
      "Mirror-coated polarized lens",
      "Rubberized non-slip temples",
      "Impact-resistant polycarbonate",
    ],
    stock: "low-stock",
    tags: ["limited"],
    createdAt: "2026-07-22",
    rating: 4.5,
    reviewCount: 61,
  },
  {
    id: "gl-05",
    slug: "round-heritage",
    name: "Round Heritage",
    category: "glasses",
    price: 155,
    colors: [
      { name: "Tortoise", hex: "#7a5230" },
      { name: "Gold", hex: "#c9a24b" },
    ],
    description:
      "A vintage-inspired round frame in hand-polished acetate. Understated, until it isn't.",
    details: [
      "Hand-polished acetate frame",
      "UV400 solid tint lenses",
      "Keyhole bridge detail",
      "Includes hard case",
    ],
    stock: "in-stock",
    tags: ["bestseller"],
    createdAt: "2026-03-17",
    rating: 4.6,
    reviewCount: 143,
  },
  {
    id: "gl-06",
    slug: "night-drive",
    name: "Night Drive",
    category: "glasses",
    price: 135,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Gunmetal", hex: "#5b5f63" },
    ],
    description:
      "Yellow-tint lenses tuned to reduce glare after dark. A low-profile frame that stays put on the move.",
    details: [
      "Anti-glare yellow-tint lenses",
      "Low-profile lightweight frame",
      "Non-slip rubber temple grips",
      "Spring-loaded hinges",
    ],
    stock: "in-stock",
    tags: ["new"],
    createdAt: "2026-08-30",
    rating: 4.4,
    reviewCount: 52,
  },
  {
    id: "gl-07",
    slug: "cat-eye-statement",
    name: "Cat-Eye Statement",
    category: "glasses",
    price: 165,
    colors: [
      { name: "Blackout", hex: "#111111" },
      { name: "Crystal", hex: "#e9ecef" },
    ],
    description:
      "An exaggerated cat-eye silhouette with a sculpted brow line. Made to be the first thing people notice.",
    details: [
      "Sculpted acetate frame",
      "Gradient UV400 lenses",
      "Metal core-wire temples",
      "Includes branded hard case",
    ],
    stock: "in-stock",
    tags: [],
    createdAt: "2026-04-27",
    rating: 4.5,
    reviewCount: 84,
  },
  {
    id: "gl-08",
    slug: "featherlight-titanium",
    name: "Featherlight Titanium",
    category: "glasses",
    price: 245,
    colors: [
      { name: "Gunmetal", hex: "#5b5f63" },
      { name: "Gold", hex: "#c9a24b" },
    ],
    description:
      "Precision titanium construction at nearly half the weight of standard metal frames. Built for all-day wear.",
    details: [
      "Aerospace-grade titanium frame",
      "Weighs under 15 grams",
      "Hypoallergenic nose pads",
      "Includes lifetime hinge warranty",
    ],
    stock: "out-of-stock",
    tags: ["limited"],
    createdAt: "2026-02-20",
    rating: 4.9,
    reviewCount: 39,
  },
];

const categoryCounters: Record<Category, number> = { shoes: 0, bags: 0, glasses: 0 };

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((product) => {
  const index = categoryCounters[product.category]++;
  return { ...product, images: imagesFor(product.category, index) };
});

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductsByCategory(category: Product["category"]): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, limit);
}

export function getFeaturedProducts(limit = 8): Product[] {
  return PRODUCTS.filter((p) => p.tags.includes("bestseller")).slice(0, limit);
}

export function getNewArrivals(limit = 8): Product[] {
  return [...PRODUCTS]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter((p) =>
    [p.name, p.category, ...p.tags, p.description]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

export function getAllColors(): { name: string; hex: string }[] {
  const map = new Map<string, string>();
  for (const p of PRODUCTS) {
    for (const c of p.colors) map.set(c.name, c.hex);
  }
  return Array.from(map, ([name, hex]) => ({ name, hex }));
}
