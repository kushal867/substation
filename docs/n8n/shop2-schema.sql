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
  last_seen_at  timestamptz,
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
  available  boolean NOT NULL DEFAULT true
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
