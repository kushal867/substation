# SABSTATION

A premium, editorial-style e-commerce front end for a fashion accessories
brand selling **Shoes, Bags, and Glasses**. Built with Next.js (App Router),
TypeScript, Tailwind CSS v4, and Framer Motion.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## What's included

- **Pages**: Home, Shop All, Shoes/Bags/Glasses category pages, Product
  detail, Cart, Checkout (UI only), About, Contact, Search (with a
  no-results state), and a custom 404.
- **Commerce**: 24 seeded products (8 per category) with colors, sizes
  (shoes), pricing/sale pricing, stock status, and tags — see
  `src/lib/products.ts`. Category/price/color/size filters, sorting, and
  full-text search live in `src/components/ShopExperience.tsx` and
  `src/lib/products.ts`.
- **Cart**: React context (`src/context/CartContext.tsx`) persisted to
  `localStorage`, with an animated slide-in drawer, quantity controls, and a
  full cart page.
- **Checkout**: a polished, validated checkout form. It is UI-only — no
  payment provider is connected and no charges are made; this is stated
  explicitly on the page.
- **Motion**: Framer Motion powers the hero text reveal, category card and
  product card hover states, the cart drawer, mobile menu, search overlay,
  and a subtle route transition (`src/app/template.tsx`). All motion
  respects `prefers-reduced-motion`.
- **Product imagery**: `src/components/ProductImage.tsx` renders a real photo
  from `/public/images/...` and automatically falls back to generated,
  brand-colored placeholder art (`ProductVisual.tsx`) if that file hasn't
  been added yet or fails to load — see **Adding real product photos** below.

## Project structure

```
src/
  app/            routes (App Router)
  components/     reusable UI (Navbar, ProductCard, CartDrawer, etc.)
  context/        CartContext (cart state + localStorage persistence)
  lib/            product data, types, formatting helpers
```

## Product photos

Each product's photo lives at `public/images/{category}/products/{01-08}/1.jpg`
(position within its category matches `src/lib/products.ts`), and each
category's homepage cover is at `public/images/{category}/cover/1.jpg`. The
mapping is computed in `imagesFor()` in `src/lib/products.ts` — if a file is
ever missing, `<ProductImage>` (`src/components/ProductImage.tsx`) falls back
to the generated brand-colored placeholder art automatically, so there's
never a broken image.

The current photos are a curated subset of a starter pack sourced from
Unsplash (license permits commercial use). Most of that pack's shoe and bag
photos showed a real, recognizable brand's logo (Nike, Gucci, Valentino,
Ferragamo, Saucony, Ray-Ban, etc.), which would misrepresent SABSTATION's
catalog as carrying those brands — those files were removed rather than
wired in, so those product slots currently show the generated placeholder
art instead. Kept: `bags/products/02, 03, 06` and `glasses/cover, 01, 02,
03, 05, 06, 07`. Everything else (all of shoes except `03`, and the rest of
bags/glasses) is waiting on a real, unbranded photo.

To add more than one photo per product (for the card hover-swap and a fuller
gallery), drop a `2.jpg` alongside `1.jpg` in the same folder and add it to
the array `imagesFor()` returns.

## Notes

- No API keys or backend integrations are configured; cart/checkout state
  is entirely client-side.

## Admin panel (`/admin`)

Production admin backed by PostgreSQL, behind a password login: Dashboard,
Products (with variants), Categories, Inventory, Orders (detail drawer +
printable invoice), Payments (verification), Delivery Zones, Customers,
Analytics (CSV export + printable report) and Settings. There is no sample
data: a fresh install is empty and shows only what is in your database
(including orders written by the n8n bot).

### Deploy (admin only)

Requirements: Node 20+, PostgreSQL 14+.

1. `cp .env.example .env.local` and fill in:
   - `DATABASE_URL` – e.g. `postgres://user:pass@127.0.0.1:5432/shop`
   - `SESSION_SECRET` – 32+ random chars (`openssl rand -hex 32`)
   - `ADMIN_PASSWORD_HASH` – output of `npm run admin:hash -- 'your password'`
2. `npm run db:apply` – creates the tables/triggers (idempotent, safe to re-run).
3. `npm run build && npm run start` (port 3000) behind your HTTPS reverse
   proxy (nginx/Caddy). Cookies are `Secure` in production; set
   `INSECURE_COOKIES=1` only for plain-HTTP testing.
4. Open `https://your-domain/admin` and sign in.

Notes: sign-in is rate limited (5 attempts / 15 min per IP); API routes
(`/api/admin/*`) return 401 without a session. Schema: `db/schema.sql`.
Layout: `src/admin` (UI), `src/server` (DB, auth, commands), `src/proxy.ts`
(auth gate). The storefront (`(store)` route group) still uses its own static
catalog in `src/lib/products.ts`.
