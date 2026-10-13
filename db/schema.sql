-- ============================================================================
-- Shop2 / Substation production schema (PostgreSQL 14+)
-- Shared by: the admin panel (Next.js, via DATABASE_URL) and the n8n workflows.
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id             bigserial PRIMARY KEY,
  name           text NOT NULL UNIQUE,
  description    text NOT NULL DEFAULT '',
  image          text NOT NULL DEFAULT '',
  active         boolean NOT NULL DEFAULT true,
  size_label     text NOT NULL DEFAULT 'Size',
  size_required  boolean NOT NULL DEFAULT false,
  color_label    text NOT NULL DEFAULT 'Color',
  color_required boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id               bigserial PRIMARY KEY,
  platform         text NOT NULL DEFAULT 'website'
                   CHECK (platform IN ('messenger', 'instagram', 'whatsapp', 'tiktok', 'website', 'other')),
  platform_id      text NOT NULL,                 -- PSID / IGSID / phone / email
  page_id          text,                          -- Facebook page id (or Instagram account id) the customer wrote to
  name             text,
  phone_number     text,
  email            text,
  address          text,
  bot_paused       boolean NOT NULL DEFAULT false, -- manual pause (indefinite)
  bot_paused_until timestamptz,                    -- auto pause after the owner replies in the page inbox
  last_seen_at     timestamptz,                    -- last inbound message (Meta 24h window)
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_id)
);

CREATE TABLE IF NOT EXISTS customer_events (
  id          bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  at          timestamptz NOT NULL DEFAULT now(),
  text        text NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id                  bigserial PRIMARY KEY,
  customer_id         bigint NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  provider_message_id text UNIQUE,                 -- Meta mid (NULL for outgoing)
  direction           text NOT NULL CHECK (direction IN ('in', 'out')),
  text                text,
  image_url           text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_customer_created_idx ON messages (customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS products (
  id             bigserial PRIMARY KEY,
  name           text NOT NULL,
  category       text NOT NULL DEFAULT '',          -- category name (kept in sync; used by the n8n bot)
  category_id    bigint REFERENCES categories(id) ON DELETE SET NULL,
  description    text NOT NULL DEFAULT '',
  base_price_npr numeric NOT NULL,
  image_url      text,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id             bigserial PRIMARY KEY,
  product_id     bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku            text UNIQUE,
  size           text,
  color          text,
  price_npr      numeric,                           -- NULL = use the product base price
  stock_qty      integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  available      boolean NOT NULL DEFAULT true,
  low_alert_sent boolean NOT NULL DEFAULT false,    -- low-stock Telegram alert already sent
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  fee_npr     numeric NOT NULL,
  description text NOT NULL DEFAULT '',
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL,
  account_details text,
  qr_image_url    text,
  active          boolean NOT NULL DEFAULT true
);

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE TABLE IF NOT EXISTS orders (
  id               bigserial PRIMARY KEY,
  order_number     text NOT NULL UNIQUE,
  customer_id      bigint NOT NULL REFERENCES customers(id),
  customer_name    text,
  phone            text,
  address          text,
  zone_id          bigint REFERENCES delivery_zones(id) ON DELETE SET NULL,
  zone_name        text,
  delivery_fee     numeric NOT NULL DEFAULT 0,
  subtotal         numeric NOT NULL,
  total            numeric NOT NULL,
  advance_amount   numeric NOT NULL DEFAULT 0,
  paid_amount      numeric NOT NULL DEFAULT 0,      -- verified payments only
  status           text NOT NULL DEFAULT 'Pending'
                   CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_status   text NOT NULL DEFAULT 'Unpaid'
                   CHECK (payment_status IN ('Unpaid', 'Partially Paid', 'Paid', 'Refunded')),
  notified_status  text NOT NULL DEFAULT 'Pending', -- last status the customer was told about
  reminder_count   integer NOT NULL DEFAULT 0,      -- unpaid-order reminders sent (3 = cancelled)
  last_reminder_at timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_created_idx  ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx   ON orders (status, payment_status);
CREATE INDEX IF NOT EXISTS orders_notify_idx   ON orders (notified_status, status);

CREATE TABLE IF NOT EXISTS order_items (
  id            bigserial PRIMARY KEY,
  order_id      bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id    bigint REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  variant_label text,
  qty           integer NOT NULL,
  unit_price    numeric NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

CREATE TABLE IF NOT EXISTS order_events (
  id       bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at       timestamptz NOT NULL DEFAULT now(),
  title    text NOT NULL,
  detail   text
);
CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events (order_id, at);

CREATE TABLE IF NOT EXISTS order_notes (
  id       bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at       timestamptz NOT NULL DEFAULT now(),
  author   text NOT NULL DEFAULT 'Admin',
  text     text NOT NULL
);
CREATE INDEX IF NOT EXISTS order_notes_order_idx ON order_notes (order_id, at DESC);

CREATE TABLE IF NOT EXISTS payments (
  id         bigserial PRIMARY KEY,
  order_id   bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount     numeric NOT NULL,
  method     text NOT NULL,
  status     text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Failed', 'Refunded')),
  kind       text NOT NULL CHECK (kind IN ('Advance', 'Balance', 'Full', 'Refund')),
  reference  text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_order_idx   ON payments (order_id, status);
CREATE INDEX IF NOT EXISTS payments_created_idx ON payments (created_at DESC);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            bigserial PRIMARY KEY,
  at            timestamptz NOT NULL DEFAULT now(),
  product_id    bigint,
  variant_id    bigint,
  product_name  text NOT NULL,
  variant_label text NOT NULL DEFAULT '',
  type          text NOT NULL CHECK (type IN ('Restock', 'Sale', 'Adjustment', 'Return', 'Damaged')),
  delta         integer NOT NULL,
  after_qty     integer NOT NULL,
  note          text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS stock_movements_at_idx ON stock_movements (at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  id   integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
INSERT INTO app_settings (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS variants_product_idx    ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS customers_last_seen_idx ON customers (last_seen_at);

-- ---------------------------------------------------------------------------
-- Audit trail: order timeline + stock movements are written by triggers so the
-- admin panel AND the n8n workflows both leave a history.
-- The admin sets app.movement_type / app.movement_note per transaction.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_order_events() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_events (order_id, title, detail) VALUES (NEW.id, 'Order placed', NULL);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO order_events (order_id, title, detail)
    VALUES (NEW.id, CASE WHEN NEW.status = 'Cancelled' THEN 'Order cancelled' ELSE 'Marked ' || NEW.status END, NULL);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_log_events ON orders;
CREATE TRIGGER orders_log_events AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_events();

CREATE OR REPLACE FUNCTION log_stock_movement() RETURNS trigger AS $$
DECLARE
  v_type text := NULLIF(current_setting('app.movement_type', true), '');
  v_note text := COALESCE(current_setting('app.movement_note', true), '');
  v_name text;
BEGIN
  IF NEW.stock_qty IS DISTINCT FROM OLD.stock_qty THEN
    SELECT name INTO v_name FROM products WHERE id = NEW.product_id;
    INSERT INTO stock_movements (product_id, variant_id, product_name, variant_label, type, delta, after_qty, note)
    VALUES (NEW.product_id, NEW.id, COALESCE(v_name, 'Product'),
            concat_ws(' / ', NULLIF(NEW.color, ''), NULLIF(NEW.size, '')),
            COALESCE(v_type, CASE WHEN NEW.stock_qty < OLD.stock_qty THEN 'Sale' ELSE 'Restock' END),
            NEW.stock_qty - OLD.stock_qty, NEW.stock_qty,
            CASE WHEN v_type IS NULL THEN 'Automatic (bot / workflow)' ELSE v_note END);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS variants_log_movement ON product_variants;
CREATE TRIGGER variants_log_movement AFTER UPDATE OF stock_qty ON product_variants
  FOR EACH ROW EXECUTE FUNCTION log_stock_movement();
