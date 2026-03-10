-- PHZ Reports Database Schema

CREATE TABLE IF NOT EXISTS sales_orders (
  id              SERIAL PRIMARY KEY,
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
  notes           VARCHAR(200)
);

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

CREATE TABLE IF NOT EXISTS saved_reports (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  dataset       VARCHAR(50) NOT NULL,
  config_json   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_dashboards (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  config_json   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS filter_presets (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  report_id     INTEGER REFERENCES saved_reports(id) ON DELETE CASCADE,
  dashboard_id  INTEGER REFERENCES saved_dashboards(id) ON DELETE CASCADE,
  values_json   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
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

CREATE INDEX IF NOT EXISTS idx_emp_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_emp_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_emp_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_salary ON employees(salary);
CREATE INDEX IF NOT EXISTS idx_emp_location ON employees(location);

CREATE INDEX IF NOT EXISTS idx_presets_report ON filter_presets(report_id);
CREATE INDEX IF NOT EXISTS idx_presets_dashboard ON filter_presets(dashboard_id);
