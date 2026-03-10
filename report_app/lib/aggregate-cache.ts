import { dataPool as pool } from './db';

/**
 * Background aggregate cache — refreshes materialized views every 15 minutes.
 * Provides instant (~1ms) aggregate reads for the analytics dashboard.
 *
 * Flow:
 *  1. On first read, tries materialized views. If they don't exist or are empty,
 *     creates them and kicks off a background refresh (non-blocking),
 *     returning a TABLESAMPLE fallback (~50ms) immediately.
 *  2. A background interval refreshes CONCURRENTLY every 15 min (non-blocking reads
 *     while refresh runs).
 *  3. Falls back to TABLESAMPLE if views are unavailable.
 */

const REFRESH_INTERVAL = 15 * 60_000; // 15 minutes

let initialized = false;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let lastRefresh = 0;
let refreshing = false;

/**
 * Ensure materialized views exist. Idempotent.
 * Returns 'ready' if views have data, 'fallback' if they need a refresh
 * (refresh is kicked off in the background — caller should use TABLESAMPLE).
 */
async function ensureViews(): Promise<'ready' | 'fallback'> {
  if (initialized) return 'ready';
  try {
    // Fast check: do matviews already exist and have data?
    const check = await pool.query('SELECT total_count FROM sales_orders_summary LIMIT 1').catch(() => null);
    if (check && check.rows.length > 0 && Number(check.rows[0].total_count) > 0) {
      initialized = true;
      return 'ready';
    }

    // Views don't exist or are empty — create them
    await pool.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_summary AS
      SELECT COUNT(*)::bigint AS total_count, COALESCE(SUM(amount),0)::bigint AS total_revenue, COALESCE(SUM(profit),0)::bigint AS total_profit
      FROM sales_orders
    `);
    await pool.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_by_region AS
      SELECT region, COALESCE(SUM(amount),0)::bigint AS revenue
      FROM sales_orders GROUP BY region ORDER BY revenue DESC
    `);
    await pool.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_by_category AS
      SELECT category, COALESCE(SUM(amount),0)::bigint AS revenue
      FROM sales_orders GROUP BY category ORDER BY revenue DESC
    `);
    await pool.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS sales_orders_by_month AS
      SELECT TO_CHAR(date, 'YYYY-MM') AS month, COALESCE(SUM(amount),0)::bigint AS revenue, COALESCE(SUM(profit),0)::bigint AS profit
      FROM sales_orders GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month
    `);

    // Add UNIQUE index for CONCURRENTLY refresh (required by PG)
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_summary_single ON sales_orders_summary (total_count)').catch(() => {});
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_region_pk ON sales_orders_by_region (region)').catch(() => {});
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_category_pk ON sales_orders_by_category (category)').catch(() => {});
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_month_pk ON sales_orders_by_month (month)').catch(() => {});

    initialized = true;

    // Re-check if CREATE populated the views with data
    const recheck = await pool.query('SELECT total_count FROM sales_orders_summary LIMIT 1').catch(() => null);
    if (recheck && recheck.rows.length > 0 && Number(recheck.rows[0].total_count) > 0) {
      return 'ready';
    }

    // Views are empty — kick off refresh in background (don't await), return fallback
    doRefresh(false).catch(() => {});
    return 'fallback';
  } catch (err: any) {
    console.error('[aggregate-cache] ensureViews failed:', err.message);
    return 'fallback';
  }
}

/** Refresh all 3 views. Uses CONCURRENTLY when possible (non-blocking reads). */
async function doRefresh(concurrent: boolean) {
  if (refreshing) return;
  refreshing = true;
  const start = Date.now();
  try {
    const mode = concurrent ? 'CONCURRENTLY' : '';
    await Promise.all([
      pool.query(`REFRESH MATERIALIZED VIEW ${mode} sales_orders_summary`),
      pool.query(`REFRESH MATERIALIZED VIEW ${mode} sales_orders_by_region`),
      pool.query(`REFRESH MATERIALIZED VIEW ${mode} sales_orders_by_category`),
      pool.query(`REFRESH MATERIALIZED VIEW ${mode} sales_orders_by_month`),
    ]);
    lastRefresh = Date.now();
    const elapsed = Date.now() - start;
    if (elapsed > 1000) {
      console.log(`[aggregate-cache] refreshed in ${elapsed}ms`);
    }
  } catch (err: any) {
    console.error('[aggregate-cache] refresh failed:', err.message);
    // If CONCURRENTLY fails (no unique index), retry without
    if (concurrent) {
      await doRefresh(false).catch(() => {});
    }
  } finally {
    refreshing = false;
  }
}

/** Start the background refresh timer. Idempotent. */
function startRefreshTimer() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    doRefresh(true).catch(() => {});
  }, REFRESH_INTERVAL);
  // Don't block process exit
  if (refreshTimer && typeof refreshTimer === 'object' && 'unref' in refreshTimer) {
    (refreshTimer as any).unref();
  }
}

export interface AggregateResult {
  count: number;
  revenue: number;
  profit: number;
  avgOrder: number;
  byRegion: { region: string; revenue: number }[];
  byCategory: { category: string; revenue: number }[];
  byMonth: { month: string; revenue: number; profit: number }[];
  executionTime: number;
  source: 'materialized_view' | 'tablesample';
  lastUpdated: string | null; // ISO timestamp of last refresh
  nextRefresh: string | null; // ISO timestamp of next scheduled refresh
}

/**
 * Get aggregate data. Tries materialized views first (~1ms),
 * falls back to TABLESAMPLE (~50ms).
 */
export async function getAggregate(): Promise<AggregateResult> {
  const start = performance.now();

  const viewState = await ensureViews();
  startRefreshTimer();

  // Try materialized views (skip if ensureViews told us to fall back)
  if (viewState === 'ready') try {
    const [totals, byRegion, byCategory, byMonth] = await Promise.all([
      pool.query('SELECT total_count AS count, total_revenue AS revenue, total_profit AS profit FROM sales_orders_summary LIMIT 1'),
      pool.query('SELECT region, revenue FROM sales_orders_by_region LIMIT 12'),
      pool.query('SELECT category, revenue FROM sales_orders_by_category LIMIT 8'),
      pool.query('SELECT month, revenue, profit FROM sales_orders_by_month ORDER BY month'),
    ]);

    const row = totals.rows[0];
    if (row && Number(row.count) > 0) {
      const count = Number(row.count);
      const revenue = Number(row.revenue);
      const profit = Number(row.profit);
      return {
        count,
        revenue,
        profit,
        avgOrder: count > 0 ? Math.round(revenue / count) : 0,
        byRegion: byRegion.rows.map((r: any) => ({ region: r.region, revenue: Number(r.revenue) })),
        byCategory: byCategory.rows.map((r: any) => ({ category: r.category, revenue: Number(r.revenue) })),
        byMonth: byMonth.rows.map((r: any) => ({ month: r.month, revenue: Number(r.revenue), profit: Number(r.profit) })),
        executionTime: Math.round(performance.now() - start),
        source: 'materialized_view',
        lastUpdated: lastRefresh > 0 ? new Date(lastRefresh).toISOString() : null,
        nextRefresh: lastRefresh > 0 ? new Date(lastRefresh + REFRESH_INTERVAL).toISOString() : null,
      };
    }
  } catch {
    // Views don't exist or failed — fall through
  }

  // Fallback: TABLESAMPLE
  const samplePct = '0.1';
  const [countRes, sampleTotals, sampleRegion, sampleCategory, sampleMonth] = await Promise.all([
    pool.query(`SELECT reltuples::bigint AS count FROM pg_class WHERE relname = 'sales_orders'`),
    pool.query(`SELECT AVG(amount) AS avg_amount, AVG(profit) AS avg_profit FROM sales_orders TABLESAMPLE SYSTEM(${samplePct})`),
    pool.query(`SELECT region, SUM(amount)::bigint AS revenue FROM sales_orders TABLESAMPLE SYSTEM(${samplePct}) GROUP BY region ORDER BY revenue DESC LIMIT 12`),
    pool.query(`SELECT category, SUM(amount)::bigint AS revenue FROM sales_orders TABLESAMPLE SYSTEM(${samplePct}) GROUP BY category ORDER BY revenue DESC LIMIT 8`),
    pool.query(`SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(amount)::bigint AS revenue, SUM(profit)::bigint AS profit FROM sales_orders TABLESAMPLE SYSTEM(${samplePct}) GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month`),
  ]);

  const totalCount = Number(countRes.rows[0]?.count) || 0;
  const avgAmount = Number(sampleTotals.rows[0]?.avg_amount) || 0;
  const avgProfit = Number(sampleTotals.rows[0]?.avg_profit) || 0;
  const revenue = Math.round(totalCount * avgAmount);
  const profit = Math.round(totalCount * avgProfit);

  const sampleTotal = sampleRegion.rows.reduce((s: number, r: any) => s + Number(r.revenue), 0);
  const scaleFactor = sampleTotal > 0 ? revenue / sampleTotal : 1;

  return {
    count: totalCount,
    revenue,
    profit,
    avgOrder: totalCount > 0 ? Math.round(revenue / totalCount) : 0,
    byRegion: sampleRegion.rows.map((r: any) => ({ region: r.region, revenue: Math.round(Number(r.revenue) * scaleFactor) })),
    byCategory: sampleCategory.rows.map((r: any) => ({ category: r.category, revenue: Math.round(Number(r.revenue) * scaleFactor) })),
    byMonth: sampleMonth.rows.map((r: any) => ({ month: r.month, revenue: Math.round(Number(r.revenue) * scaleFactor), profit: Math.round(Number(r.profit) * scaleFactor) })),
    executionTime: Math.round(performance.now() - start),
    source: 'tablesample',
    lastUpdated: new Date().toISOString(),
    nextRefresh: new Date(Date.now() + REFRESH_INTERVAL).toISOString(),
  };
}
