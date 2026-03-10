-- PHZ Settings Database Schema
-- Contains: report definitions, dashboard definitions, filter presets, auth (future)

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

-- Datasource connection definitions
CREATE TABLE IF NOT EXISTS datasource_connections (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  driver        VARCHAR(30) NOT NULL DEFAULT 'postgres',  -- postgres, oracle
  host          VARCHAR(255) NOT NULL,
  port          INTEGER NOT NULL,
  database_name VARCHAR(200) NOT NULL,
  username      VARCHAR(200),
  -- credentials stored encrypted or via vault reference in production
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presets_report ON filter_presets(report_id);
CREATE INDEX IF NOT EXISTS idx_presets_dashboard ON filter_presets(dashboard_id);
