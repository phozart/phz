-- PHZ Data Database Schema
-- Contains: source data tables (sales_orders, employees, etc.)
-- Uses range partitioning by date for sales_orders (8 quarterly partitions)

CREATE TABLE IF NOT EXISTS sales_orders (
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
  PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- ─── Quarterly partitions (2023 Q1–Q4, 2024 Q1–Q4) ───
CREATE TABLE IF NOT EXISTS sales_orders_2023_q1 PARTITION OF sales_orders
  FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');
CREATE TABLE IF NOT EXISTS sales_orders_2023_q2 PARTITION OF sales_orders
  FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');
CREATE TABLE IF NOT EXISTS sales_orders_2023_q3 PARTITION OF sales_orders
  FOR VALUES FROM ('2023-07-01') TO ('2023-10-01');
CREATE TABLE IF NOT EXISTS sales_orders_2023_q4 PARTITION OF sales_orders
  FOR VALUES FROM ('2023-10-01') TO ('2024-01-01');
CREATE TABLE IF NOT EXISTS sales_orders_2024_q1 PARTITION OF sales_orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE IF NOT EXISTS sales_orders_2024_q2 PARTITION OF sales_orders
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
CREATE TABLE IF NOT EXISTS sales_orders_2024_q3 PARTITION OF sales_orders
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
CREATE TABLE IF NOT EXISTS sales_orders_2024_q4 PARTITION OF sales_orders
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS employees (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  department    VARCHAR(50) NOT NULL,
  position      VARCHAR(30) NOT NULL,
  salary        INTEGER NOT NULL,
  rating        NUMERIC(3,1) NOT NULL,
  start_date    DATE NOT NULL,
  status        VARCHAR(20) NOT NULL,
  location      VARCHAR(50) NOT NULL,
  projects      SMALLINT NOT NULL,
  is_remote     BOOLEAN NOT NULL DEFAULT false
);

-- ─── Single-column indexes (filter predicates) ───
-- On partitioned tables these are created on each partition automatically
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales_orders(region);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales_orders(category);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_orders(date);
CREATE INDEX IF NOT EXISTS idx_sales_year_quarter ON sales_orders(year, quarter);
CREATE INDEX IF NOT EXISTS idx_sales_amount ON sales_orders(amount);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales_orders(product);
CREATE INDEX IF NOT EXISTS idx_sales_channel ON sales_orders(channel);
CREATE INDEX IF NOT EXISTS idx_sales_priority ON sales_orders(order_priority);
CREATE INDEX IF NOT EXISTS idx_sales_warehouse ON sales_orders(warehouse);
CREATE INDEX IF NOT EXISTS idx_sales_currency ON sales_orders(currency);

-- ─── Composite indexes (filtered aggregation — cover WHERE + SUM columns) ───
-- These let PG satisfy filtered aggregate queries (SUM(amount), SUM(profit))
-- via index-only scans instead of full table scans at 100M+ rows.
CREATE INDEX IF NOT EXISTS idx_sales_region_amounts ON sales_orders(region) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_category_amounts ON sales_orders(category) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_status_amounts ON sales_orders(status) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_channel_amounts ON sales_orders(channel) INCLUDE (amount, profit);
CREATE INDEX IF NOT EXISTS idx_sales_year_amounts ON sales_orders(year) INCLUDE (amount, profit);

-- ─── BRIN index on id (tiny index ~100KB for 100M rows, fast range scans) ───
CREATE INDEX IF NOT EXISTS idx_sales_id_brin ON sales_orders USING brin(id) WITH (pages_per_range = 128);

CREATE INDEX IF NOT EXISTS idx_emp_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_emp_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_emp_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_salary ON employees(salary);
CREATE INDEX IF NOT EXISTS idx_emp_location ON employees(location);

-- Pre-aggregated summary for instant KPI loading (refresh after data changes)
CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_summary AS
SELECT
  COUNT(*)::bigint AS total_count,
  COALESCE(SUM(amount), 0)::bigint AS total_revenue,
  COALESCE(SUM(profit), 0)::bigint AS total_profit
FROM sales_orders;

CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_by_region AS
SELECT
  region,
  COALESCE(SUM(amount), 0)::bigint AS revenue
FROM sales_orders
GROUP BY region
ORDER BY revenue DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_by_category AS
SELECT
  category,
  COALESCE(SUM(amount), 0)::bigint AS revenue
FROM sales_orders
GROUP BY category
ORDER BY revenue DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_by_month AS
SELECT
  TO_CHAR(date, 'YYYY-MM') AS month,
  COALESCE(SUM(amount), 0)::bigint AS revenue,
  COALESCE(SUM(profit), 0)::bigint AS profit
FROM sales_orders
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;
