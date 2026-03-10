import pg from 'pg';

/**
 * Settings database — app config (reports, dashboards, presets, auth).
 * Connects to postgres-settings on port 5433.
 */
export const settingsPool = new pg.Pool({
  host: process.env.SETTINGS_DB_HOST ?? 'localhost',
  port: Number(process.env.SETTINGS_DB_PORT ?? 5433),
  database: process.env.SETTINGS_DB_NAME ?? 'phz_settings',
  user: process.env.SETTINGS_DB_USER ?? 'phz',
  password: process.env.SETTINGS_DB_PASSWORD ?? 'phz',
  max: 10,
  idleTimeoutMillis: 30000,
});

/**
 * Data database — source data (sales_orders, employees).
 * Connects to postgres-data on port 5434.
 * Used by seed script and as fallback when Rust data-service is unavailable.
 */
export const dataPool = new pg.Pool({
  host: process.env.DATA_DB_HOST ?? 'localhost',
  port: Number(process.env.DATA_DB_PORT ?? 5434),
  database: process.env.DATA_DB_NAME ?? 'phz_data',
  user: process.env.DATA_DB_USER ?? 'phz',
  password: process.env.DATA_DB_PASSWORD ?? 'phz',
  max: 20,
  idleTimeoutMillis: 30000,
  query_timeout: 120_000,       // 2 min for large exports
  statement_timeout: 120_000,   // 2 min PG-side timeout
});

/**
 * @deprecated Use settingsPool or dataPool directly.
 * Kept for backward compatibility during migration.
 */
const pool = settingsPool;
export default pool;
