# Claude Code deployment prompt (run on your server)

Copy everything inside the box below into Claude Code on the server. Replace the values in `<ANGLE_BRACKETS>` first.

````text
You are deploying the "substation" project on THIS Linux server. Work step by step, show me each command's result, and ask before anything destructive (deleting data, changing firewall rules that could lock me out, overwriting existing nginx sites). Never print passwords or tokens in the chat; generate them, store them in files with chmod 600, and tell me only the file path.

## Inputs
- DOMAIN: <app.example.com>            (storefront + /admin)
- EMAIL for HTTPS certificate: <you@example.com>
- GIT repo: https://github.com/kushal867/substation  (branch: main; if the admin is not merged yet use claude/busy-galileo-wl0r3q)
- DB name: shop2   DB user: shop2_app   (generate a strong password)
- Admin basic-auth user: <admin>        (generate a strong password)

## Project facts
- Next.js 16 app (App Router, Tailwind v4). IMPORTANT: this Next.js has breaking changes. Before changing any Next.js code read the relevant guide in node_modules/next/dist/docs/ (see AGENTS.md in the repo).
- Storefront lives in src/app/(store), the admin panel in src/app/admin (frontend only, runs on mock data in the browser, no auth). The admin must NOT be public without a password.
- Build: `npm ci && npm run build`, start: `npm run start` (port 3000).
- If `npm run build` fails because of a truncated native binary (SIGBUS in lightningcss), run `rm -rf node_modules && npm ci`.

## Tasks
1. **Inspect the server**: OS, free disk/RAM, whether Docker, nginx, postgres, node are installed, what already listens on ports 80/443/5432. Report before changing anything.
2. **PostgreSQL 16**: install (or use Docker `postgres:16`), listen on localhost only. Create database `shop2` and user `shop2_app` with the generated password. Run the SQL in the "Schema" section below, then "Indexes", then "Seed". Verify with the "Sanity queries".
3. **Deploy the app** with Docker:
   - Write a multi-stage `Dockerfile` (node:22-alpine, `npm ci`, `npm run build`, run as non-root user, `next start` on 3000) and `docker-compose.yml` (service `web`, restart unless-stopped, bound to 127.0.0.1:3000).
   - Do not commit secrets. Use an `.env` file (chmod 600) if needed.
4. **nginx + HTTPS**: reverse proxy DOMAIN -> 127.0.0.1:3000, gzip, security headers, then `certbot --nginx -d DOMAIN -m EMAIL --agree-tos --redirect`. Confirm auto-renew (`certbot renew --dry-run`).
5. **Protect /admin** with nginx basic auth (`apache2-utils`/`htpasswd`) using the generated admin password; also add `X-Robots-Tag: noindex` for /admin. Keep the storefront public.
6. **Firewall**: allow only 22, 80, 443 (ufw). Make sure SSH stays allowed BEFORE enabling ufw. Postgres must not be reachable from the internet.
7. **Backups**: a daily cron `pg_dump -Fc shop2` to /var/backups/shop2/ keeping 14 days, plus the command to restore.
8. **Verify**: `curl -I https://DOMAIN/`, `curl -I https://DOMAIN/admin` (expect 401 without password, 200 with), open /admin/products etc. through curl with the password, check `docker compose logs --tail=50 web`.
9. **n8n handoff** (do not paste secrets in chat): print the values I must enter in n8n -> Postgres credential (host, port, db, user; password only as a file path), and say that the Postgres must be reachable from my n8n server (if n8n is elsewhere, propose an SSH tunnel or a restricted `pg_hba.conf` entry for its IP and ask me first).
10. Finish with a short report: what was installed, URLs, file locations of secrets/backups, and anything I still need to do (DNS record, Meta webhook, Instagram IDs).

## Schema (run as shop2_app on database shop2)
```sql
-- Postgres schema assumed by the "Shop2 - Messenger/Instagram Bot" and
-- "Shop2 - Daily Owner Report" n8n workflows. Adjust names if your DB differs.

CREATE TABLE customers (
  id            bigserial PRIMARY KEY,
  platform      text NOT NULL CHECK (platform IN ('messenger', 'instagram')),
  platform_id   text NOT NULL,                 -- PSID / IGSID
  name          text,
  phone_number  text,
  bot_paused    boolean NOT NULL DEFAULT false, -- manual pause (indefinite)
  bot_paused_until timestamptz,                 -- auto pause after the owner replies in the page inbox
  page_id       text,                          -- Facebook page id (or Instagram account id) the customer wrote to
  last_seen_at  timestamptz,                   -- last inbound message; used for Meta's 24h window
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_id)
);

CREATE TABLE messages (
  id                   bigserial PRIMARY KEY,
  customer_id          bigint NOT NULL REFERENCES customers(id),
  provider_message_id  text UNIQUE,             -- Meta mid (NULL for outgoing)
  direction            text NOT NULL CHECK (direction IN ('in', 'out')),
  text                 text,
  image_url            text,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_customer_created_idx ON messages (customer_id, created_at DESC);

CREATE TABLE products (
  id             bigserial PRIMARY KEY,
  name           text NOT NULL,
  category       text NOT NULL,                 -- shoes | glasses | bags | ...
  base_price_npr numeric NOT NULL,
  image_url      text,
  active         boolean NOT NULL DEFAULT true
);

CREATE TABLE product_variants (
  id         bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id),
  size       text,
  color      text,
  price_npr  numeric,                           -- NULL = use product base price
  stock_qty  integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  available  boolean NOT NULL DEFAULT true,
  low_alert_sent boolean NOT NULL DEFAULT false  -- low-stock Telegram alert already sent
);

CREATE TABLE delivery_zones (
  id      bigserial PRIMARY KEY,
  name    text NOT NULL,
  fee_npr numeric NOT NULL,
  active  boolean NOT NULL DEFAULT true
);

CREATE TABLE payment_methods (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL,
  account_details text,
  qr_image_url    text,
  active          boolean NOT NULL DEFAULT true
);

CREATE SEQUENCE order_number_seq START 1001;

CREATE TABLE orders (
  id             bigserial PRIMARY KEY,
  order_number   text NOT NULL UNIQUE,
  customer_id    bigint NOT NULL REFERENCES customers(id),
  customer_name  text,
  phone          text,
  address        text,
  zone_id        bigint REFERENCES delivery_zones(id),
  zone_name      text,
  delivery_fee   numeric NOT NULL DEFAULT 0,
  subtotal       numeric NOT NULL,
  total          numeric NOT NULL,
  advance_amount numeric NOT NULL DEFAULT 0,
  paid_amount    numeric NOT NULL DEFAULT 0,     -- only verified payments
  notified_status text NOT NULL DEFAULT 'Pending', -- last status the customer was told about
  reminder_count integer NOT NULL DEFAULT 0,     -- unpaid-order reminders sent (3 = cancelled)
  last_reminder_at timestamptz,
  status         text NOT NULL DEFAULT 'Pending',
  payment_status text NOT NULL DEFAULT 'Unpaid',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id            bigserial PRIMARY KEY,
  order_id      bigint NOT NULL REFERENCES orders(id),
  variant_id    bigint REFERENCES product_variants(id),
  product_name  text NOT NULL,
  variant_label text,
  qty           integer NOT NULL,
  unit_price    numeric NOT NULL
);

CREATE TABLE payments (
  id         bigserial PRIMARY KEY,
  order_id   bigint NOT NULL REFERENCES orders(id),
  amount     numeric NOT NULL,
  method     text NOT NULL,
  status     text NOT NULL DEFAULT 'Pending',    -- Pending | Verified | Failed | Refunded
  kind       text NOT NULL,                      -- Advance | Balance | Full | Refund
  reference  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Migrating an EXISTING database (skip on a fresh install):
-- run once BEFORE activating "Shop2 - Order Status Notifier", otherwise it
-- treats every old order as a new status change and tries to message all customers.
--   ALTER TABLE orders ADD COLUMN notified_status text NOT NULL DEFAULT 'Pending';
--   ALTER TABLE orders ADD COLUMN reminder_count integer NOT NULL DEFAULT 0;
--   ALTER TABLE orders ADD COLUMN last_reminder_at timestamptz;
--   UPDATE orders SET notified_status = status, reminder_count = 3;  -- old orders: no nagging
--   ALTER TABLE customers ADD COLUMN page_id text;
--   ALTER TABLE customers ADD COLUMN bot_paused_until timestamptz;
--   ALTER TABLE product_variants ADD COLUMN low_alert_sent boolean NOT NULL DEFAULT false;
-- ---------------------------------------------------------------------------
```

## Indexes
```sql
CREATE INDEX IF NOT EXISTS orders_customer_idx      ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx        ON orders (status, payment_status);
CREATE INDEX IF NOT EXISTS orders_notify_idx        ON orders (notified_status, status);
CREATE INDEX IF NOT EXISTS order_items_order_idx    ON order_items (order_id);
CREATE INDEX IF NOT EXISTS payments_order_idx       ON payments (order_id, status);
CREATE INDEX IF NOT EXISTS variants_product_idx     ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS customers_last_seen_idx  ON customers (last_seen_at);
```

## Seed (edit values to match the real shop before running)
```sql
INSERT INTO delivery_zones (name, fee_npr, active) VALUES
  ('Kathmandu Valley', 100, true),
  ('Pokhara', 150, true),
  ('Outside Valley', 250, true),
  ('Remote Districts', 400, true);

INSERT INTO payment_methods (name, account_details, qr_image_url, active) VALUES
  ('eSewa',  '<98XXXXXXXX - Shop name>', NULL, true),
  ('Khalti', '<98XXXXXXXX - Shop name>', NULL, true),
  ('Bank Transfer', '<Bank, account no., account name>', NULL, true);

-- optional starter catalogue
INSERT INTO products (name, category, base_price_npr, active) VALUES
  ('Nike Air Max', 'shoes', 14500, true),
  ('Classic Black Sunglasses', 'glasses', 3200, true),
  ('Leather Office Bag', 'bags', 8900, true);
INSERT INTO product_variants (product_id, size, color, price_npr, stock_qty, available) VALUES
  (1, '41', 'Black', NULL, 8, true), (1, '42', 'Black', NULL, 10, true), (1, '43', 'White', 15500, 6, true),
  (2, NULL, 'Gloss Black', NULL, 15, true),
  (3, NULL, 'Brown', NULL, 5, true), (3, NULL, 'Black', NULL, 7, true);
```

## Sanity queries (expect the shown shape, no errors)
```sql
SELECT count(*) AS zones FROM delivery_zones;                       -- 4
SELECT count(*) AS methods FROM payment_methods;                    -- 3
SELECT p.name, v.size, v.color, v.stock_qty FROM products p JOIN product_variants v ON v.product_id = p.id ORDER BY p.name;
SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND column_name IN ('page_id','bot_paused_until');  -- 2 rows
SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('notified_status','reminder_count','last_reminder_at'); -- 3 rows
```

## Handy operations queries (keep for later)
```sql
-- today's orders and revenue
SELECT count(*) AS orders, COALESCE(sum(total) FILTER (WHERE status <> 'Cancelled'), 0) AS revenue
FROM orders WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kathmandu');

-- payments waiting for verification
SELECT p.id, o.order_number, p.amount, p.kind, p.created_at
FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.status = 'Pending' ORDER BY p.created_at;

-- verify a payment (replace 12) and update the order
WITH v AS (UPDATE payments SET status = 'Verified' WHERE id = 12 AND status = 'Pending' RETURNING order_id, amount)
UPDATE orders o SET paid_amount = LEAST(o.total, o.paid_amount + v.amount),
       payment_status = CASE WHEN o.paid_amount + v.amount >= o.total THEN 'Paid' ELSE 'Partially Paid' END
FROM v WHERE o.id = v.order_id;

-- low stock
SELECT p.name, v.color, v.size, v.stock_qty FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.stock_qty <= 5 ORDER BY v.stock_qty;

-- pause / resume the bot for one customer (replace id)
UPDATE customers SET bot_paused = true  WHERE id = 1;
UPDATE customers SET bot_paused = false, bot_paused_until = NULL WHERE id = 1;
```
````

## Notes
- The admin panel in the repo currently stores data in the browser (demo). The n8n bot and automations use this Postgres database. Connecting the admin to Postgres is a separate step (needs an API layer) and is not part of this deployment.
- Do not commit the Meta page tokens; they currently live inside two n8n Code nodes. Move them into n8n credentials when you can.
