'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzGrid } from '@/components/wrappers/DynamicGrid';
import { DATASETS, type DatasetColumn } from '@/lib/datasets-registry';
import {
  DynamicKPICard,
  DynamicBarChart,
  DynamicLineChart,
} from '@/components/wrappers/DynamicWidgets';
import type { DuckDBDataSource } from '@phozart/phz-duckdb';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProgressState {
  phase: 'idle' | 'downloading' | 'loading-duckdb' | 'streaming' | 'done' | 'error';
  loaded: number; // rows in DuckDB after load
  total: number;  // requested count
  elapsed: number;
  bytes: number;
  aggregateMs: number | null;
  detailMs: number | null;
  detailLoadedAt: string | null;
}


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BROWSER_ROWS = 3_000_000; // Browser memory ceiling (~2GB for 30+ col schema)

const ROW_PRESETS = [
  { label: '1K', count: 1_000 },
  { label: '10K', count: 10_000 },
  { label: '100K', count: 100_000 },
  { label: '500K', count: 500_000 },
  { label: '1M', count: 1_000_000 },
  { label: '3M', count: 3_000_000 },
];

const COL_PRESETS = [16, 32, 48, 64] as const;
type ColPreset = (typeof COL_PRESETS)[number];

/** SQL expressions to generate extra computed columns beyond the base 32.
 *  Each adds a realistic derived column. DuckDB runs these as ALTER TABLE ADD COLUMN. */
const EXTRA_COLUMNS: { name: string; expr: string; type: 'number' | 'string' }[] = [
  // batch 1: 16 cols → 48 total
  { name: 'gross_value', expr: 'quantity * "unitPrice"', type: 'number' },
  { name: 'net_value', expr: 'amount - profit', type: 'number' },
  { name: 'discount_amount', expr: 'ROUND(quantity * "unitPrice" * discount / 100.0)::INTEGER', type: 'number' },
  { name: 'profit_per_unit', expr: 'CASE WHEN quantity > 0 THEN ROUND(profit::FLOAT / quantity, 2) ELSE 0 END', type: 'number' },
  { name: 'revenue_per_unit', expr: 'CASE WHEN quantity > 0 THEN ROUND(amount::FLOAT / quantity, 2) ELSE 0 END', type: 'number' },
  { name: 'tax_rate_pct', expr: 'CASE WHEN amount > 0 THEN ROUND("taxAmount"::FLOAT / amount * 100, 2) ELSE 0 END', type: 'number' },
  { name: 'ship_to_total_pct', expr: 'CASE WHEN "totalAmount" > 0 THEN ROUND("shippingCost"::FLOAT / "totalAmount" * 100, 2) ELSE 0 END', type: 'number' },
  { name: 'effective_price', expr: 'ROUND("unitPrice" * (1 - discount / 100.0), 2)', type: 'number' },
  { name: 'order_size_tier', expr: "CASE WHEN quantity <= 3 THEN 'Small' WHEN quantity <= 10 THEN 'Medium' WHEN quantity <= 15 THEN 'Large' ELSE 'Bulk' END", type: 'string' },
  { name: 'value_segment', expr: "CASE WHEN amount < 500 THEN 'Low' WHEN amount < 2000 THEN 'Mid' WHEN amount < 10000 THEN 'High' ELSE 'Premium' END", type: 'string' },
  { name: 'margin_tier', expr: "CASE WHEN \"marginPct\" < 30 THEN 'Low' WHEN \"marginPct\" < 40 THEN 'Mid' ELSE 'High' END", type: 'string' },
  { name: 'is_profitable', expr: 'profit > 0', type: 'string' },
  { name: 'region_channel', expr: 'region || \' - \' || channel', type: 'string' },
  { name: 'product_category', expr: 'product || \' (\' || category || \')\'', type: 'string' },
  { name: 'days_to_fulfill', expr: '"leadTimeDays"', type: 'number' },
  { name: 'amount_with_tax', expr: 'amount + "taxAmount"', type: 'number' },
  // batch 2: 16 more → 64 total
  { name: 'cost_estimate', expr: 'amount - profit', type: 'number' },
  { name: 'markup_pct', expr: 'CASE WHEN (amount - profit) > 0 THEN ROUND(profit::FLOAT / (amount - profit) * 100, 2) ELSE 0 END', type: 'number' },
  { name: 'total_per_qty', expr: 'CASE WHEN quantity > 0 THEN ROUND("totalAmount"::FLOAT / quantity, 2) ELSE 0 END', type: 'number' },
  { name: 'ship_cost_per_unit', expr: 'CASE WHEN quantity > 0 THEN ROUND("shippingCost"::FLOAT / quantity, 2) ELSE 0 END', type: 'number' },
  { name: 'tax_per_unit', expr: 'CASE WHEN quantity > 0 THEN ROUND("taxAmount"::FLOAT / quantity, 2) ELSE 0 END', type: 'number' },
  { name: 'gross_margin_pct', expr: 'CASE WHEN amount > 0 THEN ROUND((amount - "shippingCost" - "taxAmount")::FLOAT / amount * 100, 2) ELSE 0 END', type: 'number' },
  { name: 'net_after_ship', expr: 'amount - "shippingCost"', type: 'number' },
  { name: 'net_after_tax', expr: 'amount - "taxAmount"', type: 'number' },
  { name: 'discount_tier', expr: "CASE WHEN discount = 0 THEN 'None' WHEN discount < 10 THEN 'Low' WHEN discount < 15 THEN 'Medium' ELSE 'High' END", type: 'string' },
  { name: 'priority_score', expr: "CASE \"orderPriority\" WHEN 'Critical' THEN 4 WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END", type: 'number' },
  { name: 'fulfillment_speed', expr: "CASE WHEN \"leadTimeDays\" <= 3 THEN 'Fast' WHEN \"leadTimeDays\" <= 7 THEN 'Normal' ELSE 'Slow' END", type: 'string' },
  { name: 'currency_region', expr: 'currency || \' (\' || region || \')\'', type: 'string' },
  { name: 'rep_region', expr: '"salesRep" || \' - \' || region', type: 'string' },
  { name: 'is_high_value', expr: 'amount > 5000', type: 'string' },
  { name: 'is_discounted', expr: 'discount > 0', type: 'string' },
  { name: 'weighted_amount', expr: 'ROUND(amount * "exchangeRate", 2)', type: 'number' },
];

const FILTER_OPTIONS = {
  region: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'],
  category: ['Hardware', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Storage', 'Memory'],
  status: ['completed', 'processing', 'shipped', 'cancelled', 'refunded'],
  channel: ['Online', 'In-Store', 'Phone', 'Partner'],
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
const PIE_COLORS = ['#6366f1', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#eab308', '#a855f7', '#f43f5e'];

const ds = DATASETS.sales_orders;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtBytes(bytes: number): string {
  const b = bytes ?? 0;
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

function fmtDuration(ms: number): string {
  const m = ms ?? 0;
  if (m < 1000) return `${Math.round(m)}ms`;
  if (m < 60_000) return `${(m / 1000).toFixed(1)}s`;
  return `${Math.floor(m / 60_000)}m ${Math.round((m % 60_000) / 1000)}s`;
}

/** Known date columns that DuckDB may return as epoch numbers or Date objects */
const DATE_COLUMNS = new Set(['date', 'fulfillment_date', 'fulfillmentDate']);

/** Convert an epoch value (ms, µs, or days) to ISO date string */
function epochToDateStr(v: number): string {
  // DuckDB can return dates as epoch-days (small), epoch-ms (~1e12), or epoch-µs (~1e15)
  let ms: number;
  if (Math.abs(v) < 1e8) {
    // Likely days since epoch (Date32): ×86400000
    ms = v * 86400000;
  } else if (Math.abs(v) > 1e14) {
    // Likely microseconds: ÷1000
    ms = v / 1000;
  } else {
    // Likely milliseconds already
    ms = v;
  }
  const d = new Date(ms);
  return isNaN(d.getTime()) ? String(v) : d.toISOString().slice(0, 10);
}

/** Convert DuckDB result rows (which may have .toJSON()) to plain objects.
 *  Fixes date columns that DuckDB returns as epoch numbers or invalid Date objects. */
function toRows(data: unknown[]): any[] {
  return (data as any[]).map(row => {
    let obj: Record<string, unknown>;
    try {
      obj = typeof row?.toJSON === 'function' ? row.toJSON() : { ...row };
    } catch {
      // toJSON threw — extract manually
      obj = {};
      for (const key of Object.keys(row as any)) {
        obj[key] = (row as any)[key];
      }
    }
    // Fix date columns: convert epoch numbers / invalid Dates to ISO strings
    for (const key of DATE_COLUMNS) {
      const v = obj[key];
      if (v == null) continue;
      if (v instanceof Date) {
        obj[key] = isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
      } else if (typeof v === 'number' || typeof v === 'bigint') {
        obj[key] = epochToDateStr(Number(v));
      }
    }
    return obj;
  });
}

/** Read a fetch Response body with progress tracking */
async function readResponseWithProgress(
  resp: Response,
  onProgress: (bytesReceived: number) => void,
): Promise<Uint8Array> {
  if (!resp.body) {
    const buf = new Uint8Array(await resp.arrayBuffer());
    onProgress(buf.byteLength);
    return buf;
  }
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(received);
  }
  const result = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/** Rename snake_case columns from PG/Rust exports to camelCase for the grid */
async function renameSnakeToCamel(ds: DuckDBDataSource) {
  const renames: [string, string][] = [
    ['sales_rep', 'salesRep'],
    ['unit_price', 'unitPrice'],
    ['payment_method', 'paymentMethod'],
    ['customer_name', 'customerName'],
    ['customer_email', 'customerEmail'],
    ['order_priority', 'orderPriority'],
    ['shipping_method', 'shippingMethod'],
    ['shipping_cost', 'shippingCost'],
    ['tax_amount', 'taxAmount'],
    ['total_amount', 'totalAmount'],
    ['exchange_rate', 'exchangeRate'],
    ['return_flag', 'returnFlag'],
    ['fulfillment_date', 'fulfillmentDate'],
    ['lead_time_days', 'leadTimeDays'],
    ['margin_pct', 'marginPct'],
  ];
  for (const [from, to] of renames) {
    try {
      await ds.query(`ALTER TABLE sales_orders RENAME COLUMN "${from}" TO "${to}"`);
    } catch {
      // Column doesn't exist or already renamed — skip
    }
  }
}

/** Add computed columns to DuckDB and return grid column defs for the target count.
 *  16 = first 16 base cols, 32 = all base cols, 48/64 = base + computed extras. */
async function applyColumnPreset(duck: DuckDBDataSource, preset: ColPreset): Promise<DatasetColumn[]> {
  const base = ds.columns; // 32 base columns (after rename)

  if (preset <= 16) {
    return base.slice(0, 16);
  }
  if (preset <= 32) {
    return base;
  }

  // Need extra columns — add them via ALTER TABLE
  const needed = preset - 32; // 16 or 32 extras
  const extras = EXTRA_COLUMNS.slice(0, needed);

  for (const col of extras) {
    try {
      await duck.query(`ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS "${col.name}" AS (${col.expr})`);
    } catch {
      // Generated column syntax varies — fall back to UPDATE
      try {
        await duck.query(`ALTER TABLE sales_orders ADD COLUMN "${col.name}" VARCHAR`);
        await duck.query(`UPDATE sales_orders SET "${col.name}" = ${col.expr}`);
      } catch { /* column likely already exists */ }
    }
  }

  const extraDefs: DatasetColumn[] = extras.map(c => ({
    field: c.name,
    header: c.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    width: c.type === 'number' ? 90 : 120,
    type: c.type,
    sortable: true,
    filterable: false,
  }));

  return [...base, ...extraDefs];
}

// ---------------------------------------------------------------------------
// DuckDB QueryBackend — the grid calls execute() on every sort/filter change.
// All queries run against local DuckDB WASM, so no server round-trips.
// ---------------------------------------------------------------------------

// Max rows returned to the grid per query. The grid paginates locally over these.
// DuckDB still holds ALL data — sorting and filtering operates on the full dataset.
const GRID_QUERY_LIMIT = 50_000;

interface DuckDBQueryBackend {
  execute(query: {
    filters: Array<{ field: string; operator: string; value: unknown }>;
    sort: Array<{ field: string; direction: 'asc' | 'desc' }>;
    groupBy: string[];
    offset?: number;
    limit?: number;
    fields?: string[];
  }): Promise<{
    rows: Record<string, unknown>[];
    totalCount: number;
    filteredCount: number;
    executionEngine: 'duckdb-wasm';
    executionTimeMs: number;
  }>;
  getCapabilities(): { filter: boolean; sort: boolean; group: boolean; aggregate: boolean; pagination: boolean };
  destroy?(): void;
}

function createDuckDBQueryBackend(
  dsRef: React.MutableRefObject<DuckDBDataSource | null>,
  dashFilter: { region?: string; category?: string; month?: string },
  lastQueryRef?: React.MutableRefObject<{ where: string; orderBy: string }>,
): DuckDBQueryBackend {
  return {
    async execute(query) {
      const t0 = performance.now();
      const duck = dsRef.current;
      if (!duck) {
        console.warn('[QueryBackend] execute called but DuckDB not ready');
        return { rows: [], totalCount: 0, filteredCount: 0, executionEngine: 'duckdb-wasm', executionTimeMs: 0 };
      }

      // Build WHERE conditions from dashboard filter + grid's own filters
      const conditions: string[] = [];

      // Dashboard click-to-filter
      if (dashFilter.region) {
        conditions.push(`"region" = '${String(dashFilter.region).replace(/'/g, "''")}'`);
      }
      if (dashFilter.category) {
        conditions.push(`"category" = '${String(dashFilter.category).replace(/'/g, "''")}'`);
      }
      if (dashFilter.month) {
        conditions.push(`CAST("date" AS VARCHAR) LIKE '${dashFilter.month}%'`);
      }

      // Grid-level filters from LocalQuery
      if (query.filters?.length) {
        for (const f of query.filters) {
          const safeVal = String(f.value).replace(/'/g, "''");
          if (f.operator === 'contains') {
            conditions.push(`CAST("${f.field}" AS VARCHAR) ILIKE '%${safeVal}%'`);
          } else if (f.operator === 'equals' || f.operator === '=' || f.operator === 'eq') {
            conditions.push(`"${f.field}" = '${safeVal}'`);
          } else if (f.operator === 'in') {
            const vals = Array.isArray(f.value) ? f.value : [f.value];
            const inList = vals.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
            conditions.push(`"${f.field}" IN (${inList})`);
          } else if (f.operator === 'startsWith') {
            conditions.push(`CAST("${f.field}" AS VARCHAR) ILIKE '${safeVal}%'`);
          } else if (f.operator === 'endsWith') {
            conditions.push(`CAST("${f.field}" AS VARCHAR) ILIKE '%${safeVal}'`);
          } else if (f.operator === '>' || f.operator === 'gt') {
            conditions.push(`"${f.field}" > '${safeVal}'`);
          } else if (f.operator === '<' || f.operator === 'lt') {
            conditions.push(`"${f.field}" < '${safeVal}'`);
          } else if (f.operator === '>=' || f.operator === 'gte') {
            conditions.push(`"${f.field}" >= '${safeVal}'`);
          } else if (f.operator === '<=' || f.operator === 'lte') {
            conditions.push(`"${f.field}" <= '${safeVal}'`);
          } else if (f.operator === 'year') {
            const years = Array.isArray(f.value) ? f.value : [f.value];
            const yearList = years.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
            conditions.push(`CAST(EXTRACT(YEAR FROM CAST("${f.field}" AS DATE)) AS VARCHAR) IN (${yearList})`);
          } else if (f.operator === 'month') {
            const months = Array.isArray(f.value) ? f.value : [f.value];
            const monthList = months.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
            conditions.push(`CAST(EXTRACT(MONTH FROM CAST("${f.field}" AS DATE)) AS VARCHAR) IN (${monthList})`);
          }
        }
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY
      let orderBy = '';
      if (query.sort?.length) {
        const parts = query.sort.map(s => `"${s.field}" ${s.direction === 'desc' ? 'DESC' : 'ASC'}`);
        orderBy = `ORDER BY ${parts.join(', ')}`;
      }

      // Store current WHERE + ORDER BY so export can match exactly
      if (lastQueryRef) lastQueryRef.current = { where, orderBy };

      const limit = query.limit ?? GRID_QUERY_LIMIT;
      const offset = query.offset ?? 0;

      try {
        // Detect actual date column names (snake_case before rename, camelCase after)
        const colsResult = await duck.query("SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND data_type IN ('DATE','TIMESTAMP','TIMESTAMP WITH TIME ZONE')");
        const dateCols = toRows(colsResult.data).map((r: any) => r.column_name as string);
        // Cast date/timestamp columns to VARCHAR so DuckDB doesn't return JS Date objects
        // (which throw "Invalid time value" during Arrow→JS conversion)
        const replaceParts = dateCols.map(c => `CAST("${c}" AS VARCHAR) AS "${c}"`);
        const select = replaceParts.length > 0
          ? `SELECT * REPLACE(${replaceParts.join(', ')}) FROM sales_orders`
          : `SELECT * FROM sales_orders`;
        const sql = `${select} ${where} ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
        const [dataResult, countResult] = await Promise.all([
          duck.query(sql),
          duck.query(`SELECT COUNT(*)::INTEGER as cnt FROM sales_orders ${where}`),
        ]);

        const rows = toRows(dataResult.data);
        const filteredCount = Number(toRows(countResult.data)[0]?.cnt ?? 0);
        console.log(`[QueryBackend] ${rows.length} rows, ${filteredCount} total, ${Math.round(performance.now() - t0)}ms`);

        return {
          rows,
          totalCount: filteredCount,
          filteredCount,
          executionEngine: 'duckdb-wasm',
          executionTimeMs: Math.round(performance.now() - t0),
        };
      } catch (err: any) {
        console.error('[QueryBackend] execute failed:', err.message);
        return { rows: [], totalCount: 0, filteredCount: 0, executionEngine: 'duckdb-wasm', executionTimeMs: 0 };
      }
    },

    getCapabilities() {
      return { filter: true, sort: true, group: false, aggregate: false, pagination: false };
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const { resolved } = useTheme();
  const theme = resolved === 'dark' ? 'dark' : 'light';

  // --- Refs ---
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef(0);
  const duckRef = useRef<DuckDBDataSource | null>(null);
  const duckPromise = useRef<Promise<void> | null>(null);
  // Tracks the last WHERE + ORDER BY the grid's QueryBackend used, so export matches exactly
  const lastGridQueryRef = useRef<{ where: string; orderBy: string }>({ where: '', orderBy: '' });

  // --- React state ---
  const [gridColumns, setGridColumns] = useState<DatasetColumn[]>(ds.columns);
  const [kpis, setKpis] = useState({ revenue: 0, profit: 0, count: 0, avgOrder: 0 });
  const [regionMap, setRegionMap] = useState<Record<string, number>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, number>>({});
  const [aggTimeline, setAggTimeline] = useState<{ month: string; revenue: number; profit: number }[]>([]);
  const [progress, setProgress] = useState<ProgressState>({
    phase: 'idle', loaded: 0, total: 0, elapsed: 0, bytes: 0, aggregateMs: null, detailMs: null, detailLoadedAt: null,
  });
  const [activeCount, setActiveCount] = useState(1_000);
  const [customCount, setCustomCount] = useState('');
  const [colPreset, setColPreset] = useState<ColPreset>(32);
  const [error, setError] = useState<string | null>(null);

  // Loading strategy: 'direct' = single request (fastest), 'preview' = 5K preview then full load
  const [loadMode, setLoadMode] = useState<'direct' | 'preview'>('preview');
  // Database source — always local PostgreSQL
  const dbSource = 'local' as const;

  // DuckDB state
  const [duckStatus, setDuckStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [duckRowCount, setDuckRowCount] = useState(0);
  const [duckBackend, setDuckBackend] = useState<DuckDBQueryBackend | null>(null);
  const [gridKey, setGridKey] = useState(0);

  // --- Filter state ---
  const [filterRegion, setFilterRegion] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterYear, setFilterYear] = useState<number[]>([]);

  // --- Dashboard click-to-filter ---
  const [dashFilter, setDashFilter] = useState<{
    region?: string;
    category?: string;
    month?: string;
  }>({});

  const toggleDashFilter = useCallback((key: 'region' | 'category' | 'month', value: string) => {
    setDashFilter(prev => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearDashFilter = useCallback(() => setDashFilter({}), []);

  const hasDashFilter = Object.keys(dashFilter).length > 0;

  // Recreate query backend when dashFilter changes (bakes filter into WHERE).
  // The grid detects the new queryBackend prop and re-queries DuckDB automatically.
  useEffect(() => {
    if (duckStatus === 'ready' && duckRef.current) {
      setDuckBackend(createDuckDBQueryBackend(duckRef, dashFilter, lastGridQueryRef));
    }
  }, [dashFilter, duckStatus]);

  // --- SQL editor state ---
  const [sqlOpen, setSqlOpen] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT region, COUNT(*) as orders, SUM(amount) as revenue, SUM(profit) as profit\nFROM sales_orders\nGROUP BY region\nORDER BY revenue DESC');
  const [sqlResult, setSqlResult] = useState<{ data: any[]; columns: string[]; rowCount: number; time: number } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);

  // --- Status log ---
  const [aggLastUpdated, setAggLastUpdated] = useState<string | null>(null);
  const [statusLog, setStatusLog] = useState<{ time: number; msg: string }[]>([]);
  const logStatus = useCallback((msg: string) => {
    setStatusLog(prev => [...prev.slice(-14), { time: Date.now(), msg }]);
  }, []);

  // -----------------------------------------------------------------------
  // Build filter query string for API calls
  // -----------------------------------------------------------------------

  const buildFilterQs = useCallback(() => {
    const parts: string[] = [];
    if (filterRegion.length > 0) parts.push(`region:in:${filterRegion.join('|')}`);
    if (filterCategory.length > 0) parts.push(`category:in:${filterCategory.join('|')}`);
    if (filterStatus) parts.push(`status:eq:${filterStatus}`);
    if (filterChannel.length > 0) parts.push(`channel:in:${filterChannel.join('|')}`);
    if (filterYear.length > 0) parts.push(`year:in:${filterYear.join('|')}`);
    if (filterDateFrom) parts.push(`date:gte:${filterDateFrom}`);
    if (filterDateTo) parts.push(`date:lte:${filterDateTo}`);
    return parts.length > 0 ? `&filter=${encodeURIComponent(parts.join(','))}` : '';
  }, [filterRegion, filterCategory, filterStatus, filterChannel, filterYear, filterDateFrom, filterDateTo]);

  // -----------------------------------------------------------------------
  // Ensure DuckDB WASM is initialized
  // -----------------------------------------------------------------------

  const duckPromiseRef = useRef<Promise<DuckDBDataSource> | null>(null);
  const ensureDuckDB = useCallback((): Promise<DuckDBDataSource> => {
    if (duckRef.current) return Promise.resolve(duckRef.current);
    if (duckPromiseRef.current) return duckPromiseRef.current;
    duckPromiseRef.current = (async () => {
      const { createDuckDBDataSource } = await import('@phozart/phz-duckdb');
      const instance = createDuckDBDataSource({
        wasmUrl: '/duckdb/duckdb-eh.wasm',
        workerUrl: '/duckdb/duckdb-browser-eh.worker.js',
        memoryLimit: 2048, // 2 GB — stay within browser tab limits
        threads: 2,        // reduce memory pressure from parallel ops
      });
      await instance.initialize();
      await instance.connect();
      // Tune DuckDB for large in-memory workloads
      await instance.query("SET preserve_insertion_order = false").catch(() => {});
      await instance.query("SET enable_progress_bar = false").catch(() => {});
      duckRef.current = instance;
      return instance;
    })();
    return duckPromiseRef.current;
  }, []);

  // -----------------------------------------------------------------------
  // Load Arrow IPC into DuckDB WASM
  // -----------------------------------------------------------------------

  const loadArrowIntoDuckDB = useCallback(async (
    count: number,
    signal: AbortSignal,
    filterQs: string,
    mode: 'direct' | 'preview',
    db: 'local',
    callbacks?: {
      onFirstChunk?: () => void;
      onChunkLoaded?: (rowsInDb: number) => void;
    },
  ) => {
    const duck = await ensureDuckDB();
    const dbQs = '';

    // Drop existing table before reload
    await duck.query('DROP TABLE IF EXISTS sales_orders').catch(() => {});
    await duck.query('DROP TABLE IF EXISTS _chunk').catch(() => {});

    const CHUNK_SIZE = 2_000_000; // rows per HTTP request — browser can handle ~2M rows in one buffer
    const PREVIEW_SIZE = 5_000;
    const useChunks = count > CHUNK_SIZE;
    const wantPreview = mode === 'preview' && count > PREVIEW_SIZE;
    let totalBytes = 0;
    let loaded = 0;
    let isFirst = true;

    setProgress(prev => ({ ...prev, phase: 'downloading' }));

    // --- Preview mode: small first load for fast grid interactivity ---
    if (wantPreview) {
      logStatus(`Preview: fetching ${fmt(PREVIEW_SIZE)} rows...`);
      const previewUrl = `/api/data/sales_orders/export?format=arrow&limit=${PREVIEW_SIZE}&offset=0${filterQs}${dbQs}`;
      const previewResp = await fetch(previewUrl, { signal });
      if (previewResp.ok) {
        const buf = await previewResp.arrayBuffer();
        if (buf.byteLength > 0) {
          const file = new File([buf], 'preview.arrow', { type: 'application/vnd.apache.arrow.stream' });
          await duck.loadFile(file, { tableName: 'sales_orders', format: 'arrow' });
          // Don't rename yet — keep snake_case consistent for chunk INSERTs
          if (!useChunks) await renameSnakeToCamel(duck);
          setDuckRowCount(PREVIEW_SIZE);
          setProgress(prev => ({ ...prev, phase: 'streaming', loaded: PREVIEW_SIZE, elapsed: performance.now() - startTimeRef.current }));
          logStatus(`Preview: ${fmt(PREVIEW_SIZE)} rows ready — grid active`);
          if (!useChunks) callbacks?.onFirstChunk?.();
          callbacks?.onChunkLoaded?.(PREVIEW_SIZE);
        }
      }
    }

    if (!useChunks) {
      // --- Small dataset: single request ---
      logStatus(`${wantPreview ? 'Full load' : 'Direct'}: downloading ${fmt(count)} rows...`);
      const url = `/api/data/sales_orders/export?format=arrow&limit=${count}&offset=0${filterQs}${dbQs}`;
      const resp = await fetch(url, { signal });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(`HTTP ${resp.status}: ${(errBody as any).error ?? 'Request failed'}`);
      }
      const buffer = await readResponseWithProgress(resp, (received) => {
        setProgress(prev => ({ ...prev, bytes: totalBytes + received, elapsed: performance.now() - startTimeRef.current }));
      });
      if (buffer.byteLength === 0) return { totalRows: 0, downloadBytes: 0 };
      totalBytes += buffer.byteLength;

      setProgress(prev => ({ ...prev, phase: 'loading-duckdb', bytes: totalBytes }));
      logStatus(`Loading ${fmtBytes(totalBytes)} into DuckDB...`);
      await duck.query('DROP TABLE IF EXISTS sales_orders').catch(() => {});
      const file = new File([buffer.buffer as ArrayBuffer], 'data.arrow', { type: 'application/vnd.apache.arrow.stream' });
      await duck.loadFile(file, { tableName: 'sales_orders', format: 'arrow' });
      await renameSnakeToCamel(duck);
    } else {
      // --- Large dataset: chunked loading (500K per request) ---
      const totalChunks = Math.ceil(count / CHUNK_SIZE);
      logStatus(`Chunked: ${fmt(count)} rows in ${totalChunks} chunks of ${fmt(CHUNK_SIZE)}...`);

      // If preview created the table, drop it — we'll rebuild with consistent schema
      if (wantPreview) {
        await duck.query('DROP TABLE IF EXISTS sales_orders').catch(() => {});
      }

      while (loaded < count) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        const chunkSize = Math.min(CHUNK_SIZE, count - loaded);
        const chunkNum = Math.floor(loaded / CHUNK_SIZE) + 1;
        logStatus(`Chunk ${chunkNum}/${totalChunks}: fetching ${fmt(chunkSize)} rows (offset ${fmt(loaded)})...`);

        const url = `/api/data/sales_orders/export?format=arrow&limit=${chunkSize}&offset=${loaded}${filterQs}${dbQs}`;
        const resp = await fetch(url, { signal });
        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          throw new Error(`HTTP ${resp.status}: ${(errBody as any).error ?? 'Request failed'}`);
        }

        const buffer = await readResponseWithProgress(resp, (received) => {
          setProgress(prev => ({
            ...prev,
            bytes: totalBytes + received,
            elapsed: performance.now() - startTimeRef.current,
          }));
        });

        if (buffer.byteLength === 0) break;
        totalBytes += buffer.byteLength;

        const file = new File([buffer.buffer as ArrayBuffer], 'chunk.arrow', { type: 'application/vnd.apache.arrow.stream' });

        if (isFirst) {
          // First chunk: create the table (keeps snake_case for consistency)
          await duck.loadFile(file, { tableName: 'sales_orders', format: 'arrow' });
          isFirst = false;

          // Make grid interactive after first chunk
          setProgress(prev => ({ ...prev, phase: 'streaming', loaded: chunkSize }));
          callbacks?.onFirstChunk?.();
        } else {
          // Subsequent chunks: load into temp, INSERT, drop (both tables in snake_case — compatible)
          await duck.loadFile(file, { tableName: '_chunk', format: 'arrow' });
          await duck.query('INSERT INTO sales_orders SELECT * FROM _chunk');
          await duck.query('DROP TABLE IF EXISTS _chunk');
        }

        loaded += chunkSize;
        setDuckRowCount(loaded);
        setProgress(prev => ({
          ...prev,
          loaded,
          elapsed: performance.now() - startTimeRef.current,
        }));
        logStatus(`Chunk ${chunkNum}/${totalChunks}: ${fmt(loaded)} / ${fmt(count)} rows (${fmtBytes(totalBytes)})`);
        callbacks?.onChunkLoaded?.(loaded);
      }

      // Rename columns now that all chunks are loaded
      await renameSnakeToCamel(duck);
    }

    // Detect columns
    try {
      const schema = await duck.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders'");
      const colNames = new Set(toRows(schema.data).map((r: any) => r.column_name));
      if (colNames.has('salesRep') || colNames.has('unitPrice')) {
        setGridColumns(ds.columns);
      }
    } catch { /* use defaults */ }

    // Final count
    const countResult = await duck.query('SELECT COUNT(*)::INTEGER as cnt FROM sales_orders');
    const totalRows = Number(toRows(countResult.data)[0]?.cnt ?? 0);
    setDuckRowCount(totalRows);
    logStatus(`Done: ${fmt(totalRows)} rows in DuckDB (${fmtBytes(totalBytes)})`);

    if (!useChunks && !wantPreview) callbacks?.onFirstChunk?.();
    callbacks?.onChunkLoaded?.(totalRows);

    return { totalRows, downloadBytes: totalBytes };
  }, [ensureDuckDB, logStatus]);

  // -----------------------------------------------------------------------
  // Preload aggregates — fast DB query for KPIs + charts
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // Compute KPIs/charts/timeline from DuckDB
  // -----------------------------------------------------------------------

  const computeFromDuckDB = useCallback(async () => {
    const duck = duckRef.current;
    if (!duck) return;
    const start = performance.now();
    logStatus('Computing KPIs + charts from DuckDB...');

    try {
      const [totals, byRegion, byCategory, byMonth] = await Promise.all([
        duck.query('SELECT COUNT(*)::INTEGER as count, COALESCE(SUM(amount),0)::BIGINT as revenue, COALESCE(SUM(profit),0)::BIGINT as profit FROM sales_orders'),
        duck.query('SELECT region, COALESCE(SUM(amount),0)::BIGINT as revenue FROM sales_orders GROUP BY region ORDER BY revenue DESC LIMIT 12'),
        duck.query('SELECT category, COALESCE(SUM(amount),0)::BIGINT as revenue FROM sales_orders GROUP BY category ORDER BY revenue DESC LIMIT 8'),
        duck.query("SELECT substr(CAST(date AS VARCHAR), 1, 7) as month, COALESCE(SUM(amount),0)::BIGINT as revenue, COALESCE(SUM(profit),0)::BIGINT as profit FROM sales_orders GROUP BY 1 ORDER BY 1"),
      ]);

      const totRow = toRows(totals.data)[0] ?? { count: 0, revenue: 0, profit: 0 };
      const count = Number(totRow.count);
      const revenue = Number(totRow.revenue);
      const profit = Number(totRow.profit);
      setKpis({ revenue, profit, count, avgOrder: count > 0 ? Math.round(revenue / count) : 0 });

      const rm: Record<string, number> = {};
      for (const r of toRows(byRegion.data)) rm[r.region] = Number(r.revenue) || 0;
      setRegionMap(rm);

      const cm: Record<string, number> = {};
      for (const c of toRows(byCategory.data)) cm[c.category] = Number(c.revenue) || 0;
      setCategoryMap(cm);

      const monthRows = toRows(byMonth.data);
      console.log('[Timeline] monthRows:', monthRows.length, monthRows.slice(0, 3));
      if (monthRows.length > 0) {
        setAggTimeline(monthRows.map((m: any) => ({ month: m.month, revenue: Number(m.revenue) || 0, profit: Number(m.profit) || 0 })));
      }

      const ms = Math.round(performance.now() - start);
      logStatus(`KPIs + charts computed in ${ms}ms from DuckDB`);
      setProgress(prev => ({ ...prev, aggregateMs: ms }));
      setAggLastUpdated(new Date().toISOString());
    } catch (err: any) {
      logStatus(`DuckDB aggregate failed: ${err.message}`);
    }
  }, [logStatus]);

  // -----------------------------------------------------------------------
  // Load handler
  // -----------------------------------------------------------------------

  const handleLoad = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const filterQs = buildFilterQs();
    const mode = loadMode;

    // Reset ALL dashboard state immediately
    setError(null);
    setStatusLog([]);
    setDuckStatus('loading');
    setDuckRowCount(0);
    setDuckBackend(null);
    setKpis({ revenue: 0, profit: 0, count: 0, avgOrder: 0 });
    setRegionMap({});
    setCategoryMap({});
    setAggTimeline([]);
    setAggLastUpdated(null);
    startTimeRef.current = performance.now();
    setProgress({ phase: 'downloading', loaded: 0, total: activeCount, elapsed: 0, bytes: 0, aggregateMs: null, detailMs: null, detailLoadedAt: null });

    const estMB = Math.round((activeCount * 400) / (1024 * 1024));
    logStatus(`Load: ${fmt(activeCount)} rows [${mode}]${estMB > 100 ? ` (~${estMB}MB)` : ''}`);

    try {
      const detailStart = performance.now();

      // Arrow IPC → DuckDB WASM
      const { totalRows, downloadBytes } = await loadArrowIntoDuckDB(
        activeCount,
        controller.signal,
        filterQs,
        mode,
        dbSource,
        {
          onFirstChunk: () => {
            // Preview mode: grid becomes interactive while full load continues
            setDuckBackend(createDuckDBQueryBackend(duckRef, dashFilter, lastGridQueryRef));
            setDuckStatus('ready');
            logStatus('Grid active — computing KPIs from DuckDB...');
            computeFromDuckDB();
          },
        },
      );

      const detailMs = Math.round(performance.now() - detailStart);
      const detailTs = new Date().toISOString();

      setDuckStatus('ready');
      setDuckRowCount(totalRows);

      // Apply column preset (adds computed columns for 48/64 mode)
      if (duckRef.current) {
        const colStart = performance.now();
        const cols = await applyColumnPreset(duckRef.current, colPreset);
        setGridColumns(cols);
        if (colPreset > 32) {
          logStatus(`Added ${colPreset - 32} computed columns in ${Math.round(performance.now() - colStart)}ms`);
        }
      }

      // Re-query grid with complete dataset (new backend ref triggers the Lit component)
      setDuckBackend(createDuckDBQueryBackend(duckRef, dashFilter, lastGridQueryRef));
      await computeFromDuckDB();

      const finalElapsed = Math.round(performance.now() - startTimeRef.current);
      logStatus(`Complete: ${fmt(totalRows)} rows in ${fmtDuration(finalElapsed)} [${mode}]`);
      setProgress(prev => ({
        ...prev,
        phase: 'done',
        loaded: totalRows,
        elapsed: finalElapsed,
        bytes: downloadBytes,
        detailMs,
        detailLoadedAt: detailTs,
      }));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setDuckStatus('error');
        setProgress(prev => ({ ...prev, phase: 'error', elapsed: performance.now() - startTimeRef.current }));
        logStatus(`Error: ${err.message}`);
      }
    }
  }, [buildFilterQs, activeCount, loadMode, colPreset, dbSource, loadArrowIntoDuckDB, computeFromDuckDB, logStatus, dashFilter]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setProgress(prev => ({ ...prev, phase: 'done', elapsed: performance.now() - startTimeRef.current }));
  }, []);

  // --- Export from DuckDB ---
  const [exporting, setExporting] = useState(false);
  const exportFromDuckDB = useCallback(async (format: 'csv' | 'excel') => {
    const duck = duckRef.current;
    if (!duck || exporting) return;
    setExporting(true);
    try {
      // Use the exact same WHERE + ORDER BY the grid is currently showing
      const { where, orderBy } = lastGridQueryRef.current;

      // Cast date columns to VARCHAR to avoid "Invalid time value" during Arrow→JS
      const colsRes = await duck.query("SELECT column_name FROM information_schema.columns WHERE table_name='sales_orders' AND data_type IN ('DATE','TIMESTAMP','TIMESTAMP WITH TIME ZONE')");
      const eDateCols = toRows(colsRes.data).map((r: any) => r.column_name as string);
      const eReplace = eDateCols.map(c => `CAST("${c}" AS VARCHAR) AS "${c}"`);
      const eSel = eReplace.length > 0
        ? `SELECT * REPLACE(${eReplace.join(', ')}) FROM sales_orders`
        : `SELECT * FROM sales_orders`;
      const result = await duck.query(`${eSel} ${where} ${orderBy}`);
      const rows = toRows(result.data);
      if (rows.length === 0) return;

      const columns = Object.keys(rows[0]);

      if (format === 'csv') {
        const lines = [columns.join(',')];
        for (const row of rows) {
          lines.push(columns.map(col => {
            const v = row[col];
            if (v == null) return '';
            const s = String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n')
              ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(','));
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sales_orders.csv'; a.click();
        URL.revokeObjectURL(url);
      } else {
        // Excel export via server endpoint (DuckDB doesn't do xlsx)
        // Fall back to CSV with .xls extension for Excel compatibility
        const lines = [columns.join('\t')];
        for (const row of rows) {
          lines.push(columns.map(col => String(row[col] ?? '')).join('\t'));
        }
        const blob = new Blob([lines.join('\n')], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sales_orders.xls'; a.click();
        URL.revokeObjectURL(url);
      }
      logStatus(`Exported ${fmt(rows.length)} rows as ${format.toUpperCase()}`);
    } catch (err: any) {
      logStatus(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }, [exporting, logStatus]);

  // --- SQL query runner (in-browser DuckDB) ---
  const runSqlQuery = useCallback(async () => {
    if (!sqlQuery.trim() || sqlRunning) return;

    // Wait for DuckDB to finish loading if it's in progress
    if (duckPromise.current) {
      setSqlRunning(true);
      setSqlError(null);
      await duckPromise.current;
    }

    if (!duckRef.current) {
      setSqlError('No data loaded yet. Press "Load Data" first, then run your query.');
      return;
    }
    setSqlRunning(true);
    setSqlError(null);
    setSqlResult(null);
    try {
      const start = performance.now();
      const result = await duckRef.current.query(sqlQuery) as any;
      const time = Math.round(performance.now() - start);

      const data = toRows(result.toArray ? result.toArray() : Array.isArray(result) ? result : result.data ?? []);
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      setSqlResult({ data, columns, rowCount: data.length, time });
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setSqlRunning(false);
    }
  }, [sqlQuery, sqlRunning]);

  // -----------------------------------------------------------------------
  // Auto-load preview on mount
  // -----------------------------------------------------------------------

  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      startTimeRef.current = performance.now();
      setProgress({ phase: 'downloading', loaded: 0, total: 1000, elapsed: 0, bytes: 0, aggregateMs: null, detailMs: null, detailLoadedAt: null });
      logStatus('Auto-load: 1K row preview');
      setDuckStatus('loading');

      // Load 1K rows Arrow → DuckDB (direct — small enough, no preview needed)
      try {
        const { totalRows, downloadBytes } = await loadArrowIntoDuckDB(1000, signal, '', 'direct', 'local', {
          onFirstChunk: () => {
            setDuckBackend(createDuckDBQueryBackend(duckRef, {}, lastGridQueryRef));
            computeFromDuckDB();
          },
        });

        setDuckStatus('ready');
        setDuckRowCount(totalRows);

        const elapsed = Math.round(performance.now() - startTimeRef.current);
        logStatus(`Preview: ${fmt(totalRows)} rows ready in ${fmtDuration(elapsed)}`);
        setProgress(prev => ({
          ...prev,
          phase: totalRows > 0 ? 'done' : 'idle',
          loaded: totalRows,
          elapsed,
          bytes: downloadBytes,
          detailMs: elapsed,
          detailLoadedAt: new Date().toISOString(),
        }));
      } catch {
        logStatus('Preview: Arrow load failed');
        setDuckStatus('error');
        setProgress(prev => ({ ...prev, phase: 'error' }));
      }
    })();

    return () => {
      controller.abort();
      abortRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const revenueByRegion = useMemo(() => ({
    label: 'Revenue',
    data: Object.entries(regionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([x, y]) => ({ x, y: Math.round(y) })),
  }), [regionMap]);

  const revenueByCategory = useMemo(() =>
    Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value: Math.round(value) })),
  [categoryMap]);

  // Timeline: from aggregate endpoint or DuckDB (depending on mode)
  const timelineSeries = useMemo(() => {
    if (aggTimeline.length === 0) return [];
    const months = aggTimeline.map(m => m.month).sort();
    const revMap = Object.fromEntries(aggTimeline.map(m => [m.month, m.revenue]));
    const profMap = Object.fromEntries(aggTimeline.map(m => [m.month, m.profit]));
    return [
      { label: 'Revenue', points: months.map(m => ({ x: m, y: Math.round(revMap[m]) })), color: '#6366f1' },
      { label: 'Profit', points: months.map(m => ({ x: m, y: Math.round(profMap[m]) })), color: '#22c55e' },
    ];
  }, [aggTimeline]);

  const detailPct = progress.total > 0 ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;
  const aggPct = progress.aggregateMs !== null ? 100 : 0;
  const pct = progress.total > 0 ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;
  const isLoading = progress.phase === 'downloading' || progress.phase === 'loading-duckdb' || progress.phase === 'streaming';
  const isDone = progress.phase === 'done';
  const dbLabel = 'PostgreSQL';
  const sourceLabel = `${dbLabel} \u2192 DuckDB (${loadMode === 'preview' ? 'preview' : 'direct'})`;

  // Live elapsed timer — ticks every second during loading
  const [liveElapsed, setLiveElapsed] = useState(0);
  useEffect(() => {
    if (!isLoading) return;
    const tick = () => setLiveElapsed(Math.round(performance.now() - startTimeRef.current));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [isLoading]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5 relative">
      {/* Status log — floating top-right */}
      {statusLog.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-y-auto bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg p-3 space-y-0.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Status Log</span>
            <button
              onClick={() => setStatusLog([])}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              clear
            </button>
          </div>
          {statusLog.map((entry, i) => (
            <div key={i} className="flex gap-2 text-[10px] font-mono leading-snug">
              <span className="text-[var(--text-muted)] shrink-0 tabular-nums">
                {new Date(entry.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={
                entry.msg.includes('done') || entry.msg.includes('Complete') || entry.msg.includes('ready') ? 'text-green-400' :
                entry.msg.includes('failed') || entry.msg.includes('Error') ? 'text-red-400' :
                entry.msg.includes('starting') || entry.msg.includes('fetching') || entry.msg.includes('querying') || entry.msg.includes('loading') || entry.msg.includes('downloaded') ? 'text-[var(--accent)]' :
                'text-[var(--text-secondary)]'
              }>
                {entry.msg}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Arrow IPC &middot; DuckDB WASM &middot; virtual scroll &middot;{' '}
          {loadMode === 'preview' ? 'preview mode (5K instant + full load)' : 'direct mode (single request)'}
        </p>
      </div>

      {/* Loading banner — prominent live indicator */}
      {isLoading && (
        <div className="flex items-center gap-4 px-5 py-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 animate-pulse-subtle">
          <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
            <svg className="animate-spin w-8 h-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-indigo-300">
                Loading {fmt(progress.total)} rows
              </span>
              <span className="text-sm font-mono text-indigo-400 tabular-nums">
                {fmtDuration(liveElapsed)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
              <span>
                {progress.phase === 'downloading' && `Downloading Arrow IPC... ${fmtBytes(progress.bytes)}`}
                {progress.phase === 'loading-duckdb' && `Loading ${fmtBytes(progress.bytes)} into DuckDB WASM...`}
                {progress.phase === 'streaming' && `Preview active \u2014 downloading full dataset... ${fmtBytes(progress.bytes)}`}
              </span>
              {progress.loaded > 0 && (
                <span className="font-mono">{fmt(progress.loaded)} / {fmt(progress.total)} rows</span>
              )}
            </div>
            {/* Mini progress bar */}
            <div className="w-full h-1.5 mt-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              {progress.phase === 'downloading' ? (
                <div className="h-full bg-indigo-500/60 rounded-full animate-indeterminate" />
              ) : (
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${detailPct}%` }} />
              )}
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 space-y-3">
        {/* Row 1: Rows + Custom + Load button */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0">Rows</span>
          {activeCount === 1_000 && (
            <span className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded shrink-0">
              Preview (1K rows)
            </span>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {ROW_PRESETS.map(p => (
              <button
                key={p.count}
                onClick={() => setActiveCount(p.count)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  activeCount === p.count
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="border-l border-[var(--border)] h-6 shrink-0" />

          <input
            type="text"
            value={customCount}
            onChange={e => {
              setCustomCount(e.target.value);
              const n = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
              if (n > 0) setActiveCount(Math.min(n, MAX_BROWSER_ROWS));
            }}
            placeholder="Custom"
            disabled={isLoading}
            className="w-24 px-2 py-1.5 rounded text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--accent)]"
          />

          <div className="border-l border-[var(--border)] h-6 shrink-0" />

          <button
            onClick={handleLoad}
            disabled={isLoading}
            className="px-5 py-1.5 rounded text-xs font-semibold bg-[var(--accent)] text-white disabled:opacity-50 transition-colors hover:opacity-90 shrink-0"
          >
            Load Data
          </button>

          {isLoading && (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
            >
              Cancel
            </button>
          )}

          <div className="border-l border-[var(--border)] h-6 shrink-0" />

          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0">Cols</span>
          <div className="flex gap-1">
            {COL_PRESETS.map(c => (
              <button
                key={c}
                onClick={() => setColPreset(c)}
                disabled={isLoading}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  colPreset === c
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Row 1.5: Loading strategy toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0">Load</span>
          <div className="flex rounded-md overflow-hidden border border-[var(--border)]">
            <button
              onClick={() => setLoadMode('direct')}
              disabled={isLoading}
              className={`px-3 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                loadMode === 'direct'
                  ? 'bg-indigo-500/20 text-indigo-300 border-r border-[var(--border)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-r border-[var(--border)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setLoadMode('preview')}
              disabled={isLoading}
              className={`px-3 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                loadMode === 'preview'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Preview
            </button>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            {loadMode === 'direct'
              ? 'Single request — fastest total time, data appears when fully loaded'
              : '5K preview first (grid in ~2s), then full dataset replaces it'}
          </span>

          <div className="border-l border-[var(--border)] h-6 shrink-0" />

          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0">DB</span>
          <span className="px-3 py-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 rounded-md border border-[var(--border)]">
            PostgreSQL
          </span>
        </div>

        {/* Row 2: Filters */}
        <div className="flex items-start gap-4 flex-wrap">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0 mt-1.5">Filters</span>

          {/* Region */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Region</span>
            <div className="flex gap-1 flex-wrap">
              {FILTER_OPTIONS.region.map(v => {
                const on = filterRegion.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => setFilterRegion(prev => on ? prev.filter(x => x !== v) : [...prev, v])}
                    disabled={isLoading}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors disabled:opacity-50 ${
                      on ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-l border-[var(--border)] h-8 shrink-0 mt-1" />

          {/* Category */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Category</span>
            <div className="flex gap-1 flex-wrap">
              {FILTER_OPTIONS.category.map(v => {
                const on = filterCategory.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => setFilterCategory(prev => on ? prev.filter(x => x !== v) : [...prev, v])}
                    disabled={isLoading}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors disabled:opacity-50 ${
                      on ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-l border-[var(--border)] h-8 shrink-0 mt-1" />

          {/* Status */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Status</span>
            <div className="flex gap-1 flex-wrap">
              {FILTER_OPTIONS.status.map(v => (
                <button
                  key={v}
                  onClick={() => setFilterStatus(prev => prev === v ? '' : v)}
                  disabled={isLoading}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors disabled:opacity-50 ${
                    filterStatus === v ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="border-l border-[var(--border)] h-8 shrink-0 mt-1" />

          {/* Channel */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Channel</span>
            <div className="flex gap-1 flex-wrap">
              {FILTER_OPTIONS.channel.map(v => {
                const on = filterChannel.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => setFilterChannel(prev => on ? prev.filter(x => x !== v) : [...prev, v])}
                    disabled={isLoading}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors disabled:opacity-50 ${
                      on ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-l border-[var(--border)] h-8 shrink-0 mt-1" />

          {/* Year */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Year</span>
            <div className="flex gap-1 flex-wrap">
              {[2023, 2024].map(y => {
                const on = filterYear.includes(y);
                return (
                  <button
                    key={y}
                    onClick={() => setFilterYear(prev => on ? prev.filter(x => x !== y) : [...prev, y])}
                    disabled={isLoading}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors disabled:opacity-50 ${
                      on ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-l border-[var(--border)] h-8 shrink-0 mt-1" />

          {/* Date Range */}
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Date Range</span>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)] disabled:opacity-50 focus:outline-none focus:border-[var(--accent)]"
                min="2023-01-01"
                max="2024-12-31"
              />
              <span className="text-[10px] text-[var(--text-muted)]">to</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)] disabled:opacity-50 focus:outline-none focus:border-[var(--accent)]"
                min="2023-01-01"
                max="2024-12-31"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(filterRegion.length > 0 || filterCategory.length > 0 || filterStatus || filterChannel.length > 0 || filterYear.length > 0 || filterDateFrom || filterDateTo) && (
            <>
              <div className="border-l border-[var(--border)] h-8 shrink-0 mt-1" />
              <button
                onClick={() => { setFilterRegion([]); setFilterCategory([]); setFilterStatus(''); setFilterChannel([]); setFilterYear([]); setFilterDateFrom(''); setFilterDateTo(''); }}
                disabled={isLoading}
                className="mt-2 px-2 py-0.5 rounded text-[11px] text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        {/* Progress bar — always visible, two bars from center */}
        <div className="space-y-2">
          {/* Status line */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
            <span className={
              isLoading ? 'text-[var(--accent)] animate-pulse font-medium' :
              isDone ? 'text-green-400 font-medium' :
              progress.phase === 'error' ? 'text-red-400 font-medium' :
              'text-[var(--text-muted)] font-medium'
            }>
              {progress.phase === 'downloading' ? 'Downloading...' :
               progress.phase === 'loading-duckdb' ? 'Loading into DuckDB...' :
               progress.phase === 'streaming' ? 'Streaming...' :
               isDone ? 'Ready' :
               progress.phase === 'error' ? 'Error' : 'Idle'}
            </span>
            {(isLoading || isDone) && (
              <>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {fmt(progress.loaded)} / {fmt(progress.total)} rows
                </span>
                <span>{pct}%</span>
                <span>{fmtDuration(progress.elapsed)}</span>
                {progress.bytes > 0 && <span>{fmtBytes(progress.bytes)}</span>}
                <span className="text-[var(--text-muted)]">{sourceLabel}</span>
              </>
            )}
            {progress.phase === 'idle' && (
              <span className="text-[var(--text-muted)]">Select options and press Load Data</span>
            )}
          </div>

          {/* Two-bar center-origin layout */}
          <div className="flex items-center gap-0">
            {/* Left bar: Aggregate (grows right-to-left) */}
            <div className="flex-1 flex flex-col items-end gap-1">
              <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-l-full overflow-hidden relative flex justify-end">
                {isLoading && progress.aggregateMs === null && (
                  <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/60 via-emerald-500/20 to-transparent animate-pulse" />
                )}
                <div
                  className={`h-full rounded-l-full transition-all duration-500 ${
                    progress.aggregateMs !== null ? 'bg-emerald-500' : 'bg-transparent'
                  }`}
                  style={{ width: `${aggPct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] pr-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  progress.aggregateMs !== null ? 'bg-emerald-500' :
                  isLoading ? 'bg-emerald-500/50 animate-pulse' :
                  'bg-[var(--bg-tertiary)]'
                }`} />
                <span className="text-[var(--text-muted)]">Aggregate (DuckDB)</span>
                <span className={`font-mono ${
                  progress.aggregateMs !== null ? 'text-emerald-400' :
                  isLoading ? 'text-emerald-400/60' :
                  'text-[var(--text-muted)]'
                }`}>
                  {progress.aggregateMs !== null ? fmtDuration(progress.aggregateMs) : isLoading ? '...' : '\u2014'}
                </span>
                {aggLastUpdated && (
                  <span className="text-[var(--text-muted)] ml-1" title={`DuckDB aggregate computed: ${aggLastUpdated}`}>
                    (computed {new Date(aggLastUpdated).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
            </div>

            {/* Center divider */}
            <div className="w-px h-6 bg-[var(--border)] shrink-0 mx-0.5" />

            {/* Right bar: Detail (grows left-to-right) */}
            <div className="flex-1 flex flex-col items-start gap-1">
              <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-r-full overflow-hidden">
                <div
                  className={`h-full rounded-r-full transition-all duration-300 ${
                    isDone && progress.detailMs !== null ? 'bg-indigo-500' :
                    isLoading ? 'bg-indigo-500' :
                    'bg-transparent'
                  }`}
                  style={{ width: `${detailPct}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] pl-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  progress.detailMs !== null ? 'bg-indigo-500' :
                  isLoading ? 'bg-indigo-500 animate-pulse' :
                  'bg-[var(--bg-tertiary)]'
                }`} />
                <span className="text-[var(--text-muted)]">Detail</span>
                <span className={`font-mono ${
                  progress.detailMs !== null ? 'text-indigo-400' :
                  isLoading ? 'text-indigo-400' :
                  'text-[var(--text-muted)]'
                }`}>
                  {progress.detailMs !== null ? fmtDuration(progress.detailMs) :
                   isLoading ? `${progress.phase === 'streaming' ? `${fmt(progress.loaded)} rows` : progress.phase === 'loading-duckdb' ? 'DuckDB...' : fmtBytes(progress.bytes)}` :
                   '\u2014'}
                </span>
                {progress.detailLoadedAt && (
                  <span className="text-[var(--text-muted)] ml-1" title={`Detail data loaded: ${progress.detailLoadedAt}`}>
                    (loaded {new Date(progress.detailLoadedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <DynamicKPICard
            kpiDefinition={kpiDef('total-revenue', 'Total Revenue', 5_000_000, 'currency', 'amount')}
            value={kpis.revenue}
            previousValue={kpis.revenue * 0.91}
            cardStyle="expanded"
          />
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <DynamicKPICard
            kpiDefinition={kpiDef('total-profit', 'Total Profit', 2_000_000, 'currency', 'profit')}
            value={kpis.profit}
            previousValue={kpis.profit * 0.85}
            cardStyle="expanded"
          />
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <DynamicKPICard
            kpiDefinition={kpiDef('avg-order', 'Avg Order Value', 3000, 'currency', 'amount')}
            value={kpis.avgOrder}
            previousValue={kpis.avgOrder * 0.94}
            cardStyle="expanded"
          />
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <DynamicKPICard
            kpiDefinition={kpiDef('order-count', 'Order Count', 1200, 'count', 'id')}
            value={kpis.count}
            previousValue={kpis.count * 0.87}
            cardStyle="expanded"
          />
        </div>
      </div>

      {/* Charts Row — clickable to filter detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Region — bar chart + clickable labels */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">Revenue by Region</h2>
          <div style={{ height: 300, overflowY: 'auto', overflowX: 'hidden' }}>
            <DynamicBarChart data={revenueByRegion} chartTitle="" maxBars={6} colors={CHART_COLORS} />
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {revenueByRegion.data.map((d, i) => (
              <button
                key={d.x}
                onClick={() => toggleDashFilter('region', d.x)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dashFilter.region === d.x
                    ? 'bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/50'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.x}
              </button>
            ))}
          </div>
        </div>

        {/* Revenue & Profit Timeline */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Revenue &amp; Profit Timeline</h2>
            {/* Category filter pills */}
            <div className="flex gap-1 flex-wrap">
              {revenueByCategory.slice(0, 5).map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => toggleDashFilter('category', d.label)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                    dashFilter.category === d.label
                      ? 'bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/50'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-0.5" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 280, overflow: 'hidden' }}>
            {timelineSeries.length > 0 ? (
              <DynamicLineChart data={timelineSeries} title="" showGrid showAxis showLegend />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[var(--text-muted)]">
                Load data to see timeline
              </div>
            )}
          </div>
          {/* Clickable month pills */}
          {timelineSeries.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5 max-h-12 overflow-y-auto">
              {timelineSeries[0]?.points.map(p => (
                <button
                  key={p.x}
                  onClick={() => toggleDashFilter('month', p.x)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                    dashFilter.month === p.x
                      ? 'bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/50'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {p.x}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Filter Indicator */}
      {hasDashFilter && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <span className="text-xs font-medium text-indigo-300">Filtered by:</span>
          {dashFilter.region && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300">
              Region: {dashFilter.region}
              <button onClick={() => toggleDashFilter('region', dashFilter.region!)} className="hover:text-white ml-0.5">&times;</button>
            </span>
          )}
          {dashFilter.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300">
              Category: {dashFilter.category}
              <button onClick={() => toggleDashFilter('category', dashFilter.category!)} className="hover:text-white ml-0.5">&times;</button>
            </span>
          )}
          {dashFilter.month && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/20 text-indigo-300">
              Month: {dashFilter.month}
              <button onClick={() => toggleDashFilter('month', dashFilter.month!)} className="hover:text-white ml-0.5">&times;</button>
            </span>
          )}
          <button
            onClick={clearDashFilter}
            className="ml-auto text-[11px] text-indigo-400 hover:text-indigo-200 transition-colors"
          >
            Clear all
          </button>
          <span className="text-[11px] text-[var(--text-muted)]">
            {fmt(duckRowCount)} rows in DuckDB
          </span>
        </div>
      )}

      {/* SQL Query Panel */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
        <button
          onClick={() => setSqlOpen(prev => !prev)}
          className="w-full px-5 py-3 flex items-center justify-between text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <span>SQL Query Editor</span>
          <span className="text-xs text-[var(--text-muted)]">{sqlOpen ? 'collapse' : 'expand'}</span>
        </button>
        {sqlOpen && (
          <div className="border-t border-[var(--border)] p-4 space-y-3">
            <div className="flex gap-2">
              <textarea
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
                placeholder="SELECT region, COUNT(*) as orders, SUM(amount) as revenue FROM sales_orders GROUP BY region ORDER BY revenue DESC"
                disabled={sqlRunning}
                rows={4}
                className="flex-1 px-3 py-2 rounded text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--accent)] resize-y"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runSqlQuery(); } }}
              />
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={runSqlQuery}
                  disabled={sqlRunning || !sqlQuery.trim()}
                  className="px-4 py-2 rounded text-xs font-semibold bg-[var(--accent)] text-white disabled:opacity-50 transition-colors hover:opacity-90"
                >
                  {sqlRunning ? 'Running...' : 'Run'}
                </button>
                <button
                  onClick={() => { setSqlResult(null); setSqlError(null); }}
                  disabled={!sqlResult && !sqlError}
                  className="px-4 py-2 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] disabled:opacity-50 transition-colors hover:text-[var(--text-primary)]"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
              <span>Cmd+Enter to run. Queries run in-browser via DuckDB against the loaded dataset.</span>
              <span className={
                duckStatus === 'ready' ? 'text-green-400' :
                duckStatus === 'loading' ? 'text-yellow-400 animate-pulse' :
                duckStatus === 'error' ? 'text-red-400' :
                'text-[var(--text-muted)]'
              }>
                {duckStatus === 'ready' ? `DuckDB ready (${fmt(duckRowCount)} rows)` :
                 duckStatus === 'loading' ? 'Loading into DuckDB...' :
                 duckStatus === 'error' ? 'DuckDB load failed' :
                 'Load data first'}
              </span>
            </div>
            {sqlError && <div className="text-xs text-red-400 bg-red-500/10 rounded px-3 py-2">{sqlError}</div>}
            {sqlResult && (
              <div className="text-xs text-[var(--text-muted)]">
                {fmt(sqlResult.rowCount)} rows in {fmtDuration(sqlResult.time)} &middot; {sqlResult.columns.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Sales Orders
              {hasDashFilter && (
                <span className="ml-2 text-xs font-normal text-indigo-400">(filtered)</span>
              )}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {fmt(duckRowCount)} rows in DuckDB
              {' via Arrow IPC'}
              {isLoading && ' \u2014 loading...'}
              {' \u00b7 virtual scroll'}
              {progress.detailLoadedAt && (
                <span className="ml-2">
                  &middot; detail {new Date(progress.detailLoadedAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  {aggLastUpdated && (
                    <span> &middot; agg {new Date(aggLastUpdated).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  )}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {duckStatus === 'ready' && !isLoading && (
              <>
                <button
                  onClick={() => exportFromDuckDB('csv')}
                  disabled={exporting}
                  className="px-2.5 py-1 text-[11px] font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border)] transition-colors disabled:opacity-50"
                >
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  onClick={() => exportFromDuckDB('excel')}
                  disabled={exporting}
                  className="px-2.5 py-1 text-[11px] font-medium rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border)] transition-colors disabled:opacity-50"
                >
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
              </>
            )}
            {isLoading && (
              <span className={`text-xs animate-pulse ${progress.phase === 'streaming' ? 'text-amber-400' : 'text-[var(--accent)]'}`}>
                {progress.phase === 'streaming' ? `Streaming: ${fmt(progress.loaded)} / ${fmt(progress.total)} rows` :
                 progress.phase === 'downloading' ? `Downloading: ${fmtBytes(progress.bytes)}` :
                 'Loading into DuckDB...'}
              </span>
            )}
          </div>
        </div>
        <div style={{ height: 700 }}>
          {duckBackend ? (
            <DynamicPhzGrid
              key={gridKey}
              data={[]}
              queryBackend={duckBackend}
              columns={gridColumns}
              height="700px"
              theme={theme}
              density="compact"
              showToolbar
              showSearch
              statusColors={ds.statusColors}
              rowBanding
              hoverHighlight
              gridLines="horizontal"
              allowSorting
              allowFiltering
              compactNumbers
              dateFormats={{ date: 'dd/mmm/yyyy', fulfillmentDate: 'dd/mmm/yyyy' }}
              showPagination
              pageSize={100}
              pageSizeOptions={[50, 100, 200, 500]}
              gridTitle={`Sales Orders \u00b7 ${fmt(duckRowCount)} rows \u00d7 ${gridColumns.length} cols${hasDashFilter ? ' (filtered)' : ''}`}
              gridSubtitle={`${sourceLabel}${isLoading ? ` (streaming ${fmt(progress.loaded)}/${fmt(progress.total)})` : ` \u00b7 ${fmtDuration(progress.elapsed)}`}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
              {isLoading ? (
                <span className="animate-pulse">
                  {progress.phase === 'downloading' ? `Downloading Arrow IPC... ${fmtBytes(progress.bytes)}` : 'Loading into DuckDB WASM...'}
                </span>
              ) : (
                'Select options above and press Load Data'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function kpiDef(id: string, name: string, target: number, unit: string, field: string) {
  return {
    id, name, target,
    unit: unit as 'currency' | 'number' | 'count',
    direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 },
    deltaComparison: 'previous_period' as const,
    dimensions: [],
    dataSource: { type: 'field' as const, field },
  };
}
