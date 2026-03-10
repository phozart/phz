-- ─────────────────────────────────────────────────────────────────────
-- Migrate sales_orders to a RANGE-partitioned table (by year).
--
-- At 100M+ rows, partitioning enables:
--   1. Partition pruning — queries filtered by year only scan 1 partition
--   2. Parallel sequential scans — PG scans partitions in parallel
--   3. Fast bulk deletes — DROP PARTITION instead of DELETE
--   4. Per-partition VACUUM & maintenance
--
-- Strategy: rename old table → create partitioned table → move data
-- This is a one-time offline migration. Run during maintenance window.
--
-- Usage:
--   psql -h localhost -p 5434 -U phz -d phz_data -f lib/migrate-to-partitioned.sql
-- ─────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Skip if already partitioned (check for a known partition)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'sales_orders_y2020' AND relkind = 'r'
  ) THEN
    RAISE NOTICE 'Already partitioned — skipping migration.';
    RETURN;
  END IF;
END $$;

-- 2. Drop materialized views (they reference old table)
DROP MATERIALIZED VIEW IF EXISTS sales_orders_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS sales_orders_by_region CASCADE;
DROP MATERIALIZED VIEW IF EXISTS sales_orders_by_category CASCADE;

-- 3. Rename existing table
ALTER TABLE IF EXISTS sales_orders RENAME TO sales_orders_old;

-- 4. Create partitioned table (identical schema, partitioned by year)
CREATE TABLE sales_orders (
  id              SERIAL,
  date            DATE NOT NULL,
  year            SMALLINT NOT NULL,
  quarter         VARCHAR(2) NOT NULL,
  month           VARCHAR(3) NOT NULL,
  product         VARCHAR(50) NOT NULL,
  category        VARCHAR(50) NOT NULL,
  region          VARCHAR(50) NOT NULL,
  sales_rep       VARCHAR(100) NOT NULL,
  quantity        INTEGER NOT NULL,
  unit_price      INTEGER NOT NULL,
  discount        SMALLINT NOT NULL DEFAULT 0,
  amount          INTEGER NOT NULL,
  profit          INTEGER NOT NULL,
  payment_method  VARCHAR(30) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  customer_name   VARCHAR(100) NOT NULL DEFAULT '',
  customer_email  VARCHAR(200) NOT NULL DEFAULT '',
  order_priority  VARCHAR(20) NOT NULL DEFAULT 'Medium',
  shipping_method VARCHAR(30) NOT NULL DEFAULT 'Standard',
  shipping_cost   INTEGER NOT NULL DEFAULT 0,
  tax_amount      INTEGER NOT NULL DEFAULT 0,
  total_amount    INTEGER NOT NULL DEFAULT 0,
  warehouse       VARCHAR(50) NOT NULL DEFAULT '',
  channel         VARCHAR(30) NOT NULL DEFAULT 'Online',
  currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate   NUMERIC(10,4) NOT NULL DEFAULT 1.0000,
  return_flag     BOOLEAN NOT NULL DEFAULT false,
  fulfillment_date DATE,
  lead_time_days  SMALLINT NOT NULL DEFAULT 0,
  margin_pct      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  notes           VARCHAR(200),
  PRIMARY KEY (id, year)
) PARTITION BY RANGE (year);

-- 5. Create partitions (2018–2030 + default for anything outside)
CREATE TABLE sales_orders_y2018 PARTITION OF sales_orders FOR VALUES FROM (2018) TO (2019);
CREATE TABLE sales_orders_y2019 PARTITION OF sales_orders FOR VALUES FROM (2019) TO (2020);
CREATE TABLE sales_orders_y2020 PARTITION OF sales_orders FOR VALUES FROM (2020) TO (2021);
CREATE TABLE sales_orders_y2021 PARTITION OF sales_orders FOR VALUES FROM (2021) TO (2022);
CREATE TABLE sales_orders_y2022 PARTITION OF sales_orders FOR VALUES FROM (2022) TO (2023);
CREATE TABLE sales_orders_y2023 PARTITION OF sales_orders FOR VALUES FROM (2023) TO (2024);
CREATE TABLE sales_orders_y2024 PARTITION OF sales_orders FOR VALUES FROM (2024) TO (2025);
CREATE TABLE sales_orders_y2025 PARTITION OF sales_orders FOR VALUES FROM (2025) TO (2026);
CREATE TABLE sales_orders_y2026 PARTITION OF sales_orders FOR VALUES FROM (2026) TO (2027);
CREATE TABLE sales_orders_y2027 PARTITION OF sales_orders FOR VALUES FROM (2027) TO (2028);
CREATE TABLE sales_orders_y2028 PARTITION OF sales_orders FOR VALUES FROM (2028) TO (2029);
CREATE TABLE sales_orders_y2029 PARTITION OF sales_orders FOR VALUES FROM (2029) TO (2030);
CREATE TABLE sales_orders_y2030 PARTITION OF sales_orders FOR VALUES FROM (2030) TO (2031);
CREATE TABLE sales_orders_default PARTITION OF sales_orders DEFAULT;

-- 6. Move data from old table into partitioned table
-- This is the slow step (~5-10 min for 100M rows).
INSERT INTO sales_orders SELECT * FROM sales_orders_old;

-- 7. Drop old table
DROP TABLE sales_orders_old;

-- 8. Recreate indexes on the partitioned table
-- PG automatically creates per-partition indexes when you index the parent.
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales_orders(region);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales_orders(category);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_orders(date);
CREATE INDEX IF NOT EXISTS idx_sales_year_quarter ON sales_orders(year, quarter);
CREATE INDEX IF NOT EXISTS idx_sales_amount ON sales_orders(amount);
CREATE INDEX IF NOT EXISTS idx_sales_channel ON sales_orders(channel);

-- Composite covering indexes for filtered aggregation
CREATE INDEX IF NOT EXISTS idx_sales_region_amounts ON sales_orders(region) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_category_amounts ON sales_orders(category) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_status_amounts ON sales_orders(status) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_channel_amounts ON sales_orders(channel) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_year_amounts ON sales_orders(year) INCLUDE (amount, profit);

-- 9. Recreate materialized views
CREATE MATERIALIZED VIEW sales_orders_summary AS
SELECT COUNT(*)::bigint AS total_count, COALESCE(SUM(amount),0)::bigint AS total_revenue, COALESCE(SUM(profit),0)::bigint AS total_profit
FROM sales_orders;

CREATE MATERIALIZED VIEW sales_orders_by_region AS
SELECT region, COALESCE(SUM(amount),0)::bigint AS revenue
FROM sales_orders GROUP BY region ORDER BY revenue DESC;

CREATE MATERIALIZED VIEW sales_orders_by_category AS
SELECT category, COALESCE(SUM(amount),0)::bigint AS revenue
FROM sales_orders GROUP BY category ORDER BY revenue DESC;

-- Unique indexes required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_summary_single ON sales_orders_summary (total_count);
CREATE UNIQUE INDEX idx_region_pk ON sales_orders_by_region (region);
CREATE UNIQUE INDEX idx_category_pk ON sales_orders_by_category (category);

-- 10. Analyze for query planner statistics
ANALYZE sales_orders;

COMMIT;

-- Verify
SELECT
  'Partitioned table' AS item,
  (SELECT count(*) FROM pg_inherits WHERE inhparent = 'sales_orders'::regclass) AS partition_count;
SELECT
  'Total rows' AS item,
  (SELECT reltuples::bigint FROM pg_class WHERE relname = 'sales_orders') AS count;
