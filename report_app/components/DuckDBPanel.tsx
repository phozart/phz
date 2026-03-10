'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createDuckDBDataSource } from '@phozart/phz-duckdb';
import type { DuckDBDataSource } from '@phozart/phz-duckdb';
import { DynamicPhzGrid } from '@/components/wrappers/DynamicGrid';
import { DynamicKPICard, DynamicBarChart, DynamicPieChart } from '@/components/wrappers/DynamicWidgets';
import { DATASETS } from '@/lib/datasets-registry';

const DUCK_COLUMNS = DATASETS.sales_orders.columns;
const DUCK_STATUS = DATASETS.sales_orders.statusColors;

type DataSource = 'generate' | 'pg-csv' | 'pg-json' | 'pg-arrow' | 'rust-arrow';

const GEN_PRESETS = [
  { label: '1M',  count: 1_000_000 },
  { label: '4M',  count: 4_000_000 },
  { label: '10M', count: 10_000_000 },
  { label: '20M', count: 20_000_000 },
];

const PG_PRESETS = [
  { label: '100K', count: 100_000 },
  { label: '1M',   count: 1_000_000 },
  { label: '5M',   count: 5_000_000 },
  { label: '10M',  count: 10_000_000 },
  { label: '50M',  count: 50_000_000 },
  { label: '100M', count: 100_000_000 },
];

const RUST_PRESETS = [
  { label: '100K', count: 100_000 },
  { label: '1M',   count: 1_000_000 },
  { label: '5M',   count: 5_000_000 },
  { label: '10M',  count: 10_000_000 },
  { label: '50M',  count: 50_000_000 },
  { label: '100M', count: 100_000_000 },
];

function buildCreateSQL(count: number) {
  return `
CREATE OR REPLACE TABLE sales_orders AS
WITH src AS (
  SELECT i,
    ABS(i * 2654435761 % 730)::BIGINT AS d_off,
    1 + ABS(i * 2246822519 % 10)::BIGINT AS pi,
    1 + ABS(i * 3266489917 % 5)::BIGINT AS ri,
    1 + ABS(i * 668265263 % 20)::BIGINT AS rpi,
    1 + ABS(i * 374761393 % 20)::BIGINT AS qty,
    ABS(i * 1103515245 % 40)::BIGINT AS price_var,
    ABS(i * 1664525 % 10)::BIGINT AS disc_roll,
    ABS(i * 1013904223 % 20)::BIGINT AS disc_val,
    ABS(i * 214013 % 25)::BIGINT AS profit_pct,
    1 + ABS(i * 2531011 % 4)::BIGINT AS pay_idx,
    ABS(i * 12345 % 10)::BIGINT AS stat_roll,
    1 + ABS(i * 7654321 % 5)::BIGINT AS stat_idx,
    1 + ABS(i * 4987654 % 20)::BIGINT AS cust_first_idx,
    1 + ABS(i * 6543217 % 20)::BIGINT AS cust_last_idx,
    1 + ABS(i * 3141592 % 4)::BIGINT AS prio_idx,
    1 + ABS(i * 2718281 % 4)::BIGINT AS ship_idx,
    1 + ABS(i * 1618033 % 5)::BIGINT AS email_idx,
    1 + ABS(i * 5772156 % 6)::BIGINT AS wh_idx,
    1 + ABS(i * 4669201 % 4)::BIGINT AS chan_idx,
    1 + ABS(i * 8675309 % 5)::BIGINT AS curr_idx,
    ABS(i * 9876543 % 20)::BIGINT AS ret_roll,
    1 + ABS(i * 1357924 % 14)::BIGINT AS lead_days,
    ABS(i * 2468135 % 5)::BIGINT AS note_roll,
    1 + ABS(i * 3692581 % 8)::BIGINT AS note_idx
  FROM generate_series(1, ${count}) AS t(i)
),
base AS (
  SELECT *,
    ('2023-01-01'::DATE + d_off::INT) AS date,
    CASE WHEN disc_roll < 3 THEN disc_val ELSE 0 END AS discount,
    ([1200,450,120,60,180,90,250,15,85,65])[pi] * (80 + price_var) / 100 AS up
  FROM src
)
SELECT
  i AS id, strftime(date, '%Y-%m-%d') AS date,
  EXTRACT(YEAR FROM date)::INT AS year,
  'Q' || EXTRACT(QUARTER FROM date)::INT::VARCHAR AS quarter,
  (['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])[EXTRACT(MONTH FROM date)::BIGINT] AS month,
  (['Laptop','Monitor','Keyboard','Mouse','Headset','Webcam','Dock','Cable','SSD','RAM'])[pi] AS product,
  (['Hardware','Hardware','Peripherals','Peripherals','Audio','Video','Accessories','Accessories','Storage','Memory'])[pi] AS category,
  (['North America','Europe','Asia Pacific','Latin America','Middle East'])[ri] AS region,
  (['Alex Chen','Sarah Kim','James Wilson','Maria Garcia','David Lee','Emma Brown','Ryan Patel','Lisa Wang','Tom Harris','Nina Scott','Jake Miller','Amy Zhang','Chris Davis','Rachel Liu','Mark Taylor','Sophie Martin','Ben Thomas','Olivia Clark','Dan White','Kate Johnson'])[rpi] AS salesRep,
  qty::INT AS quantity, up::INT AS unitPrice, discount::INT AS discount,
  (qty * up * (100 - discount) / 100)::INT AS amount,
  (qty * up * (100 - discount) / 100 * (25 + profit_pct) / 100)::INT AS profit,
  (['Credit Card','Wire Transfer','Purchase Order','PayPal'])[pay_idx] AS paymentMethod,
  CASE WHEN stat_roll < 7 THEN 'completed' ELSE (['completed','processing','shipped','cancelled','refunded'])[stat_idx] END AS status,
  -- new columns
  (['James','Maria','Robert','Linda','Michael','Sarah','William','Emma','Richard','Jennifer','Thomas','Jessica','Daniel','Ashley','Matthew','Amanda','Anthony','Stephanie','Andrew','Nicole'])[cust_first_idx]
    || ' ' ||
    (['Anderson','Martinez','Thompson','Robinson','Clark','Rodriguez','Lewis','Walker','Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell'])[cust_last_idx]
    AS customerName,
  LOWER((['James','Maria','Robert','Linda','Michael','Sarah','William','Emma','Richard','Jennifer','Thomas','Jessica','Daniel','Ashley','Matthew','Amanda','Anthony','Stephanie','Andrew','Nicole'])[cust_first_idx])
    || '.' ||
    LOWER((['Anderson','Martinez','Thompson','Robinson','Clark','Rodriguez','Lewis','Walker','Hall','Allen','Young','King','Wright','Scott','Green','Baker','Adams','Nelson','Hill','Campbell'])[cust_last_idx])
    || '@' ||
    (['gmail.com','outlook.com','company.com','yahoo.com','proton.me'])[email_idx]
    AS customerEmail,
  (['High','Medium','Low','Critical'])[prio_idx] AS orderPriority,
  (['Standard','Express','Overnight','Freight'])[ship_idx] AS shippingMethod,
  ([8,15,25,35])[ship_idx]::INT AS shippingCost,
  (qty * up * (100 - discount) / 100 * 8 / 100)::INT AS taxAmount,
  (qty * up * (100 - discount) / 100)::INT + (qty * up * (100 - discount) / 100 * 8 / 100)::INT + ([8,15,25,35])[ship_idx] AS totalAmount,
  (['US-East','US-West','EU-Central','EU-West','APAC-Tokyo','APAC-Sydney'])[wh_idx] AS warehouse,
  (['Online','In-Store','Phone','Partner'])[chan_idx] AS channel,
  (['USD','EUR','GBP','JPY','AUD'])[curr_idx] AS currency,
  (['1.0000','0.9200','0.7900','149.5000','1.5300'])[curr_idx]::DOUBLE AS exchangeRate,
  ret_roll < 1 AS returnFlag,
  strftime(date + lead_days::INT, '%Y-%m-%d') AS fulfillmentDate,
  lead_days::INT AS leadTimeDays,
  ROUND((25 + profit_pct) * 1.0, 2)::DOUBLE AS marginPct,
  CASE WHEN note_roll = 0 THEN (['Expedited processing','Gift wrap requested','Bulk order discount','Customer VIP','Fragile - handle with care','Requires signature','Back-ordered item','Insurance added'])[note_idx] ELSE NULL END AS notes
FROM base;
`;
}

// KPI definitions for the phz-widgets KPI cards
const KPI_DEFS = {
  revenue: {
    id: 'total-revenue', name: 'Total Revenue', target: 5_000_000_000,
    unit: 'currency' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'amount' },
  },
  profit: {
    id: 'total-profit', name: 'Total Profit', target: 2_000_000_000,
    unit: 'currency' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'profit' },
  },
  avgOrder: {
    id: 'avg-order', name: 'Avg Order Value', target: 3000,
    unit: 'currency' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'amount' },
  },
  avgDiscount: {
    id: 'avg-discount', name: 'Avg Discount', target: 5,
    unit: 'percent' as const, direction: 'lower_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'discount' },
  },
  totalOrders: {
    id: 'total-orders', name: 'Total Orders', target: 10_000_000,
    unit: 'count' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'id' },
  },
};

const STATUS_PALETTE: Record<string, string> = {
  completed: '#10B981', processing: '#3B82F6', shipped: '#F59E0B',
  cancelled: '#EF4444', refunded: '#8B5CF6',
};

interface Metrics {
  totalRows: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  avgDiscount: number;
  regionBreakdown: Array<{ region: string; revenue: number; orders: number }>;
  categoryBreakdown: Array<{ category: string; revenue: number; profit: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}

interface ActiveFilter {
  field: 'region' | 'category' | 'status';
  value: string;
}

interface TimingBreakdown {
  wasmInit: number;
  networkFetch?: number;
  transferSize?: string;
  duckdbLoad: number;
  metricsCalc: number;
  total: number;
  source: DataSource;
}

interface QueryStats {
  queryMs: number;
  totalCount: number;
}

interface Props {
  theme: 'light' | 'dark';
  /** Auto-load data on mount (for viewer mode) */
  autoLoad?: { source: DataSource; count: number };
  /** Hide the data source selector bar */
  hideSelector?: boolean;
}

function ChartClickCapture({ children, onFilter }: {
  children: React.ReactNode;
  onFilter: (field: string, value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleBarClick = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.xValue) onFilter('', String(detail.xValue));
    };
    const handleSliceClick = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.label) onFilter('', String(detail.label));
    };
    el.addEventListener('bar-click', handleBarClick);
    el.addEventListener('slice-click', handleSliceClick);
    return () => {
      el.removeEventListener('bar-click', handleBarClick);
      el.removeEventListener('slice-click', handleSliceClick);
    };
  }, [onFilter]);
  return <div ref={ref}>{children}</div>;
}

/**
 * Creates an AsyncDataSource backed by DuckDB WASM.
 * The grid calls fetch({ offset, limit, sort, filter }) and all queries
 * run locally in-browser against the WASM analytical engine.
 */
function createDuckDBAsyncSource(
  dsRef: React.MutableRefObject<DuckDBDataSource | null>,
  externalFilter: ActiveFilter | null,
  columnNames: Set<string>,
  onStats?: (stats: QueryStats) => void,
) {
  return {
    type: 'async' as const,
    async fetch(request: {
      offset: number;
      limit: number;
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
      filter?: Array<{ field: string; operator: string; value: unknown }>;
    }) {
      const ds = dsRef.current;
      if (!ds) throw new Error('DuckDB not initialized');

      // Build WHERE from external chart filter + grid's own filters
      const conditions: string[] = [];
      if (externalFilter) {
        // Use the column name that exists in the table
        const col = columnNames.has(externalFilter.field) ? externalFilter.field : externalFilter.field;
        conditions.push(`"${col}" = '${externalFilter.value}'`);
      }
      if (request.filter?.length) {
        for (const f of request.filter) {
          const col = columnNames.has(f.field) ? f.field : f.field;
          const op = f.operator === 'contains' ? 'ILIKE' : f.operator === '=' ? '=' : f.operator;
          const val = f.operator === 'contains' ? `'%${f.value}%'` : `'${f.value}'`;
          conditions.push(`"${col}" ${op} ${val}`);
        }
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY
      let orderBy = '';
      if (request.sort?.length) {
        const s = request.sort[0];
        const col = columnNames.has(s.field) ? s.field : s.field;
        orderBy = `ORDER BY "${col}" ${s.direction}`;
      }

      const t0 = performance.now();
      const [dataResult, countResult] = await Promise.all([
        ds.query(`SELECT * FROM sales_orders ${where} ${orderBy} LIMIT ${request.limit} OFFSET ${request.offset}`),
        ds.query(`SELECT COUNT(*) as cnt FROM sales_orders ${where}`),
      ]);
      const queryMs = Math.round(performance.now() - t0);
      const totalCount = Number(toRows(countResult.data)[0].cnt);

      onStats?.({ queryMs, totalCount });

      return {
        data: toRows(dataResult.data),
        totalCount,
      };
    },
  };
}

export default function DuckDBPanel({ theme, autoLoad, hideSelector }: Props) {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'generating' | 'ready' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [dataSource, setDataSource] = useState<DataSource>('generate');
  const [rowCount, setRowCount] = useState(4_000_000);
  const [timing, setTiming] = useState<TimingBreakdown | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter | null>(null);
  const [gridKey, setGridKey] = useState(0);
  const [columnNames, setColumnNames] = useState<Set<string>>(new Set());
  const [sqlInput, setSqlInput] = useState('SELECT region, COUNT(*) as orders, SUM(amount) as revenue, SUM(profit) as profit\nFROM sales_orders\nGROUP BY region\nORDER BY revenue DESC');
  const [sqlResult, setSqlResult] = useState<{ data: any[]; columns: string[]; rowCount: number; time: number } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);
  const dsRef = useRef<DuckDBDataSource | null>(null);

  const ensureDuckDB = useCallback(async (): Promise<DuckDBDataSource> => {
    if (dsRef.current) return dsRef.current;
    const ds = createDuckDBDataSource({
      wasmUrl: '/duckdb/duckdb-eh.wasm',
      workerUrl: '/duckdb/duckdb-browser-eh.worker.js',
    });
    await ds.initialize();
    await ds.connect();
    dsRef.current = ds;
    return ds;
  }, []);

  const cleanup = useCallback(async () => {
    if (dsRef.current) {
      await dsRef.current.terminateWorker().catch(() => {});
      dsRef.current = null;
    }
  }, []);

  // Detect column names after data is loaded
  const detectColumns = useCallback(async (ds: DuckDBDataSource) => {
    const schema = await ds.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders' LIMIT 30`);
    const cols = new Set(toRows(schema.data).map((r: any) => r.column_name));
    setColumnNames(cols);
    return cols;
  }, []);

  // Generate data inside DuckDB WASM (synthetic)
  const loadGenerated = useCallback(async (count: number) => {
    await cleanup();
    setStatus('initializing');
    setStatusMsg('Loading DuckDB WASM...');
    setActiveFilter(null);
    setSqlResult(null);
    setTiming(null);
    setQueryStats(null);

    try {
      const t0 = performance.now();
      const ds = await ensureDuckDB();
      const wasmInit = Math.round(performance.now() - t0);

      setStatus('generating');
      setStatusMsg(`Generating ${(count / 1_000_000).toFixed(0)}M rows in DuckDB WASM...`);
      const t1 = performance.now();
      await ds.query(buildCreateSQL(count));
      const duckdbLoad = Math.round(performance.now() - t1);

      await detectColumns(ds);

      setStatusMsg('Computing metrics...');
      const t2 = performance.now();
      await computeMetrics(ds);
      const metricsCalc = Math.round(performance.now() - t2);

      setRowCount(count);
      setGridKey(k => k + 1);
      setTiming({
        wasmInit,
        duckdbLoad,
        metricsCalc,
        total: Math.round(performance.now() - t0),
        source: 'generate',
      });
      setStatus('ready');
      setStatusMsg('');
    } catch (err: any) {
      console.error('DuckDB init error:', err);
      setStatus('error');
      setStatusMsg(err.message);
    }
  }, [cleanup, ensureDuckDB, detectColumns]);

  // Load data from PG via API → DuckDB WASM
  const loadFromPG = useCallback(async (count: number, format: 'csv' | 'json' | 'arrow') => {
    await cleanup();
    setStatus('initializing');
    setStatusMsg('Loading DuckDB WASM...');
    setActiveFilter(null);
    setSqlResult(null);
    setTiming(null);
    setQueryStats(null);

    try {
      const t0 = performance.now();
      const ds = await ensureDuckDB();
      const wasmInit = Math.round(performance.now() - t0);

      setStatus('generating');
      const label = count >= 1_000_000 ? `${(count / 1_000_000).toFixed(0)}M` : `${(count / 1000).toFixed(0)}K`;
      setStatusMsg(`Fetching ${label} rows from PostgreSQL as ${format.toUpperCase()}...`);

      const t1 = performance.now();
      // PG path always goes through Next.js API — no Rust
      const resp = await fetch(`/api/datasets/sales_orders?mode=export&format=${format}&limit=${count}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }
      const buffer = await readResponseWithProgress(resp, (received) => {
        setStatusMsg(`Downloading ${format.toUpperCase()}... ${formatBytes(received)}`);
      });
      const networkFetch = Math.round(performance.now() - t1);
      const transferSize = formatBytes(buffer.byteLength);

      setStatusMsg(`Loading ${transferSize} into DuckDB WASM...`);
      const t2 = performance.now();

      await ds.query('DROP TABLE IF EXISTS sales_orders').catch(() => {});
      const extMap = { csv: 'pg_data.csv', json: 'pg_data.json', arrow: 'pg_data.arrow' } as const;
      const mimeMap = { csv: 'text/csv', json: 'application/json', arrow: 'application/vnd.apache.arrow.file' } as const;
      const fmtMap = { csv: 'csv', json: 'json', arrow: 'arrow' } as const;
      const file = new File([buffer.buffer as ArrayBuffer], extMap[format], { type: mimeMap[format] });
      await ds.loadFile(file, { tableName: 'sales_orders', format: fmtMap[format] });
      const duckdbLoad = Math.round(performance.now() - t2);

      // Verify table was created (empty Arrow IPC won't create a table)
      const check = await ds.query(`SELECT COUNT(*) as cnt FROM sales_orders`).catch(() => null);
      if (!check || Number(toRows(check.data)[0]?.cnt) === 0) {
        throw new Error('No data loaded. Is the database seeded? Seed via the Client/Virtual tab, or use "Generate in DuckDB WASM" instead.');
      }

      // PG exports use snake_case columns; grid expects camelCase
      await renameSnakeToCamel(ds);

      await detectColumns(ds);

      setStatusMsg('Computing metrics...');
      const t3 = performance.now();
      await computeMetrics(ds);
      const metricsCalc = Math.round(performance.now() - t3);

      setRowCount(count);
      setGridKey(k => k + 1);
      setTiming({
        wasmInit,
        networkFetch,
        transferSize,
        duckdbLoad,
        metricsCalc,
        total: Math.round(performance.now() - t0),
        source: `pg-${format}` as DataSource,
      });
      setStatus('ready');
      setStatusMsg('');
    } catch (err: any) {
      console.error('PG load error:', err);
      setStatus('error');
      setStatusMsg(err.message);
    }
  }, [cleanup, ensureDuckDB, detectColumns]);

  // Load data from Rust data-service via Arrow IPC → DuckDB WASM
  const loadFromRust = useCallback(async (count: number) => {
    await cleanup();
    setStatus('initializing');
    setStatusMsg('Loading DuckDB WASM...');
    setActiveFilter(null);
    setSqlResult(null);
    setTiming(null);
    setQueryStats(null);

    try {
      const t0 = performance.now();
      const ds = await ensureDuckDB();
      const wasmInit = Math.round(performance.now() - t0);

      setStatus('generating');
      const label = count >= 1_000_000 ? `${(count / 1_000_000).toFixed(0)}M` : `${(count / 1000).toFixed(0)}K`;
      setStatusMsg(`Fetching ${label} rows from Rust data-service as Arrow IPC...`);

      const t1 = performance.now();
      const dataServiceUrl = process.env.NEXT_PUBLIC_DATA_SERVICE_URL ?? 'http://localhost:8080';
      // Generous timeout: ~30s per 1M rows (300s for 10M)
      const timeoutMs = Math.max(60_000, Math.ceil(count / 1_000_000) * 30_000);
      let resp: Response;
      let usedFallback = false;
      try {
        resp = await fetch(
          `${dataServiceUrl}/api/data/sales_orders/export?format=arrow&limit=${count}`,
          { signal: AbortSignal.timeout(timeoutMs) },
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      } catch {
        // Rust service unavailable — fall back to PG Arrow via Next.js
        usedFallback = true;
        setStatusMsg(`Rust service unavailable, falling back to PG → Arrow IPC...`);
        resp = await fetch(`/api/datasets/sales_orders?mode=export&format=arrow&limit=${count}`);
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
          throw new Error(err.error ?? `HTTP ${resp.status}`);
        }
      }
      const buffer = await readResponseWithProgress(resp, (received) => {
        setStatusMsg(`Downloading Arrow IPC${usedFallback ? ' (PG fallback)' : ' from Rust'}... ${formatBytes(received)}`);
      });
      const networkFetch = Math.round(performance.now() - t1);
      const transferSize = formatBytes(buffer.byteLength);

      setStatusMsg(`Loading ${transferSize} Arrow IPC into DuckDB WASM...`);
      const t2 = performance.now();
      await ds.query('DROP TABLE IF EXISTS sales_orders').catch(() => {});

      // Try Arrow IPC loading, fall back to JSON if DuckDB WASM can't handle it
      let arrowLoadOk = false;
      if (buffer.byteLength > 0) {
        try {
          const file = new File([buffer.buffer as ArrayBuffer], 'rust_data.arrow', { type: 'application/vnd.apache.arrow.stream' });
          await ds.loadFile(file, { tableName: 'sales_orders', format: 'arrow' });
          const verifyResult = await ds.query('SELECT COUNT(*) as cnt FROM sales_orders').catch(() => null);
          arrowLoadOk = !!verifyResult && Number(toRows(verifyResult.data)[0]?.cnt) > 0;
        } catch (e) {
          console.warn('Arrow IPC load failed, falling back to JSON:', e);
        }
      }

      if (arrowLoadOk) {
        setStatusMsg(`Arrow IPC loaded successfully (${transferSize}), renaming columns...`);
      } else {
        // Arrow IPC didn't work — re-fetch as JSON (slower but reliable)
        setStatusMsg(`Arrow IPC load failed, re-fetching as JSON...`);
        await ds.query('DROP TABLE IF EXISTS sales_orders').catch(() => {});
        const jsonResp = await fetch(`/api/datasets/sales_orders?mode=export&format=json&limit=${count}`);
        if (!jsonResp.ok) throw new Error(`JSON fallback failed: HTTP ${jsonResp.status}`);
        const jsonBuf = new Uint8Array(await jsonResp.arrayBuffer());
        const jsonFile = new File([jsonBuf], 'data.json', { type: 'application/json' });
        await ds.loadFile(jsonFile, { tableName: 'sales_orders', format: 'json' });

        const check2 = await ds.query('SELECT COUNT(*) as cnt FROM sales_orders').catch(() => null);
        if (!check2 || Number(toRows(check2.data)[0]?.cnt) === 0) {
          throw new Error('No data loaded. Is the database seeded? Seed via the Client/Virtual tab, or use "Generate in DuckDB WASM" instead.');
        }
      }
      const duckdbLoad = Math.round(performance.now() - t2);

      // Rust/PG Arrow exports use snake_case columns; grid expects camelCase
      await renameSnakeToCamel(ds);

      await detectColumns(ds);

      setStatusMsg('Computing metrics...');
      const t3 = performance.now();
      await computeMetrics(ds);
      const metricsCalc = Math.round(performance.now() - t3);

      setRowCount(count);
      setGridKey(k => k + 1);
      setTiming({
        wasmInit,
        networkFetch,
        transferSize,
        duckdbLoad,
        metricsCalc,
        total: Math.round(performance.now() - t0),
        source: usedFallback ? 'pg-arrow' : 'rust-arrow',
      });
      setStatus('ready');
      setStatusMsg('');
    } catch (err: any) {
      console.error('Rust Arrow load error:', err);
      setStatus('error');
      setStatusMsg(err.message);
    }
  }, [cleanup, ensureDuckDB, detectColumns]);

  const computeMetrics = async (ds: DuckDBDataSource) => {
    let amountCol = 'amount', profitCol = 'profit', discountCol = 'discount';
    let regionCol = 'region', categoryCol = 'category', statusCol = 'status';

    const schema = await ds.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders' LIMIT 30`);
    const cols = new Set(toRows(schema.data).map((r: any) => r.column_name));
    if (cols.has('sales_rep')) {
      // PG snake_case columns — amount/profit/discount/region/category/status are the same
    }

    const [totals, byRegion, byCategory, byStatus] = await Promise.all([
      ds.query(`SELECT COUNT(*) as totalRows, SUM(${amountCol}) as totalRevenue, SUM(${profitCol}) as totalProfit, ROUND(AVG(${amountCol})) as avgOrderValue, ROUND(AVG(${discountCol}), 1) as avgDiscount FROM sales_orders`),
      ds.query(`SELECT ${regionCol} as region, SUM(${amountCol}) as revenue, COUNT(*) as orders FROM sales_orders GROUP BY ${regionCol} ORDER BY revenue DESC`),
      ds.query(`SELECT ${categoryCol} as category, SUM(${amountCol}) as revenue, SUM(${profitCol}) as profit FROM sales_orders GROUP BY ${categoryCol} ORDER BY revenue DESC`),
      ds.query(`SELECT ${statusCol} as status, COUNT(*) as count FROM sales_orders GROUP BY ${statusCol} ORDER BY count DESC`),
    ]);

    const t = toRows(totals.data)[0];
    setMetrics({
      totalRows: Number(t.totalRows),
      totalRevenue: Number(t.totalRevenue),
      totalProfit: Number(t.totalProfit),
      avgOrderValue: Number(t.avgOrderValue),
      avgDiscount: Number(t.avgDiscount),
      regionBreakdown: toRows(byRegion.data).map((r: any) => ({ region: r.region, revenue: Number(r.revenue), orders: Number(r.orders) })),
      categoryBreakdown: toRows(byCategory.data).map((r: any) => ({ category: r.category, revenue: Number(r.revenue), profit: Number(r.profit) })),
      statusBreakdown: toRows(byStatus.data).map((r: any) => ({ status: r.status, count: Number(r.count) })),
    });
  };

  const handleFilterClick = useCallback(async (field: ActiveFilter['field'], value: string) => {
    const newFilter = activeFilter?.field === field && activeFilter?.value === value
      ? null
      : { field, value };
    setActiveFilter(newFilter);
    setGridKey(k => k + 1); // Remount grid with new filter baked into AsyncDataSource
  }, [activeFilter]);

  const runSQL = useCallback(async () => {
    const ds = dsRef.current;
    if (!ds || !sqlInput.trim()) return;
    setSqlRunning(true);
    setSqlError(null);
    try {
      const t = performance.now();
      const result = await ds.query(sqlInput);
      const rows = toRows(result.data);
      const columns = result.schema.map(c => c.name);
      setSqlResult({ data: rows, columns, rowCount: result.rowCount, time: Math.round(performance.now() - t) });
    } catch (err: any) {
      setSqlError(err.message);
      setSqlResult(null);
    } finally {
      setSqlRunning(false);
    }
  }, [sqlInput]);

  const handleLoad = useCallback((source: DataSource, count: number) => {
    setDataSource(source);
    if (source === 'generate') {
      loadGenerated(count);
    } else if (source === 'rust-arrow') {
      loadFromRust(count);
    } else if (source === 'pg-csv') {
      loadFromPG(count, 'csv');
    } else if (source === 'pg-arrow') {
      loadFromPG(count, 'arrow');
    } else {
      loadFromPG(count, 'json');
    }
  }, [loadGenerated, loadFromRust, loadFromPG]);

  // Auto-load on mount (viewer mode)
  const autoLoadDone = useRef(false);
  useEffect(() => {
    if (autoLoad && !autoLoadDone.current) {
      autoLoadDone.current = true;
      handleLoad(autoLoad.source, autoLoad.count);
    }
  }, [autoLoad, handleLoad]);

  // Cleanup DuckDB on unmount
  useEffect(() => {
    return () => { dsRef.current?.terminateWorker().catch(() => {}); };
  }, []);

  // AsyncDataSource backed by DuckDB WASM — grid calls this for each page/sort/filter
  const remoteDataSource = useMemo(
    () => createDuckDBAsyncSource(dsRef, activeFilter, columnNames, setQueryStats),
    // Recreate when filter or gridKey changes so grid remounts with fresh source
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFilter, gridKey, columnNames],
  );

  // Widget data
  const regionBarData = metrics ? {
    field: 'region', label: 'Revenue by Region',
    data: metrics.regionBreakdown.map(r => ({ x: r.region, y: r.revenue, label: r.region })),
  } : null;
  const categoryBarData = metrics ? {
    field: 'category', label: 'Revenue by Category',
    data: metrics.categoryBreakdown.map(r => ({ x: r.category, y: r.revenue, label: r.category })),
  } : null;
  const statusPieData = metrics
    ? metrics.statusBreakdown.map(s => ({ label: s.status, value: s.count, color: STATUS_PALETTE[s.status] ?? '#6B7280' }))
    : [];

  const handleRegionClick = useCallback((value: string) => handleFilterClick('region', value), [handleFilterClick]);
  const handleCategoryClick = useCallback((value: string) => handleFilterClick('category', value), [handleFilterClick]);
  const handleStatusClick = useCallback((value: string) => handleFilterClick('status', value), [handleFilterClick]);

  if (status !== 'ready') {
    return (
      <div className="space-y-4">
        {!hideSelector && (
          <DataSourceSelector
            activeSource={dataSource}
            onLoad={handleLoad}
            disabled={status !== 'idle' && status !== 'error'}
          />
        )}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
          {status === 'error' ? (
            <>
              <p className="text-red-400 font-medium mb-2">Loading failed</p>
              <p className="text-xs text-[var(--text-muted)] mb-4 max-w-lg mx-auto break-words">{statusMsg}</p>
              <button onClick={() => handleLoad(dataSource, rowCount)} className="px-4 py-2 bg-[var(--accent)] text-white rounded text-sm">Retry</button>
            </>
          ) : (
            <div className="animate-pulse text-[var(--accent)] font-medium">{statusMsg}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data source selector */}
      {!hideSelector && (
        <DataSourceSelector
          activeSource={dataSource}
          onLoad={handleLoad}
          disabled={false}
        />
      )}

      {/* Timing breakdown */}
      {timing && (
        <div className="flex gap-3 flex-wrap items-center">
          <Stat label="Total" value={`${timing.total}ms`} accent />
          <Stat label="WASM Init" value={`${timing.wasmInit}ms`} />
          {timing.networkFetch != null && <Stat label="Network" value={`${timing.networkFetch}ms`} />}
          {timing.transferSize && <Stat label="Transfer" value={timing.transferSize} />}
          <Stat label="DuckDB Load" value={`${timing.duckdbLoad}ms`} />
          <Stat label="Metrics" value={`${timing.metricsCalc}ms`} />
          <Stat label="Source" value={
            timing.source === 'generate' ? 'DuckDB Gen' :
            timing.source === 'rust-arrow' ? 'Rust → Arrow IPC' :
            timing.source === 'pg-csv' ? 'PG → CSV' :
            timing.source === 'pg-arrow' ? 'PG → Arrow' : 'PG → JSON'
          } />
          <Stat label="Rows" value={rowCount.toLocaleString()} />
          {queryStats && <Stat label="Page Query" value={`${queryStats.queryMs}ms`} />}
        </div>
      )}

      {/* Active filter */}
      {activeFilter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Filtered:</span>
          <span className="bg-[var(--accent)] text-white px-2 py-0.5 rounded text-xs font-medium">
            {activeFilter.field} = {activeFilter.value}
          </span>
          <button onClick={() => handleFilterClick(activeFilter.field, activeFilter.value)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline">clear</button>
          {queryStats && <span className="text-xs text-[var(--text-muted)]">({queryStats.totalCount.toLocaleString()} matching rows)</span>}
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <DynamicKPICard kpiDefinition={KPI_DEFS.revenue} value={metrics.totalRevenue} cardStyle="compact" />
          <DynamicKPICard kpiDefinition={KPI_DEFS.profit} value={metrics.totalProfit} cardStyle="compact" />
          <DynamicKPICard kpiDefinition={KPI_DEFS.avgOrder} value={metrics.avgOrderValue} cardStyle="compact" />
          <DynamicKPICard kpiDefinition={KPI_DEFS.avgDiscount} value={metrics.avgDiscount} cardStyle="compact" />
          <DynamicKPICard kpiDefinition={KPI_DEFS.totalOrders} value={metrics.totalRows} cardStyle="compact" />
        </div>
      )}

      {/* Charts */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ChartClickCapture onFilter={(_f, v) => handleRegionClick(v)}>
            <DynamicBarChart data={regionBarData} maxBars={5} rankOrder="desc"
              colors={activeFilter?.field === 'region' ? ['#f97316'] : ['#3B82F6']} />
          </ChartClickCapture>
          <ChartClickCapture onFilter={(_f, v) => handleCategoryClick(v)}>
            <DynamicBarChart data={categoryBarData} maxBars={10} rankOrder="desc"
              colors={activeFilter?.field === 'category' ? ['#f97316'] : ['#10B981']} />
          </ChartClickCapture>
          <ChartClickCapture onFilter={(_f, v) => handleStatusClick(v)}>
            <DynamicPieChart data={statusPieData} title="Orders by Status" donut showLegend />
          </ChartClickCapture>
        </div>
      )}

      {/* Grid — uses remoteDataSource backed by DuckDB WASM */}
      <div style={{ height: 700 }}>
        <DynamicPhzGrid
          key={gridKey}
          data={[]}
          remoteDataSource={remoteDataSource}
          columns={DUCK_COLUMNS}
          height="600px"
          theme={theme}
          density="compact"
          scrollMode="virtual"
          showToolbar
          showSearch
          showPagination={false}
          showCsvExport
          statusColors={DUCK_STATUS}
          rowBanding
          hoverHighlight
          gridLines="horizontal"
          allowSorting
          allowFiltering
          compactNumbers
          fetchPageSize={200}
          gridTitle={`DuckDB WASM — ${rowCount.toLocaleString()} rows${activeFilter ? ' (filtered)' : ''}`}
          gridSubtitle="Virtual scroll with sort & filter — all queries run locally in DuckDB WASM"
        />
      </div>

      {/* SQL Console */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">SQL Console</h3>
          <button onClick={runSQL} disabled={sqlRunning}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded disabled:opacity-50">
            {sqlRunning ? 'Running...' : 'Run Query'}
          </button>
        </div>
        <textarea value={sqlInput} onChange={e => setSqlInput(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runSQL(); }}
          rows={4} className="w-full font-mono text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded p-3 resize-y"
          placeholder="SELECT * FROM sales_orders LIMIT 10" />
        <p className="text-[10px] text-[var(--text-muted)] mt-1">
          Cmd+Enter to run · Table: <code>sales_orders</code> ({rowCount.toLocaleString()} rows) ·
          Widgets: <code>@phozart/phz-widgets</code> · Engine: <code>@phozart/phz-duckdb</code>
        </p>
        {sqlError && <div className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-800 rounded p-2">{sqlError}</div>}
        {sqlResult && (
          <div className="mt-3">
            <div className="flex gap-3 text-xs text-[var(--text-muted)] mb-2">
              <span>{sqlResult.rowCount} row{sqlResult.rowCount !== 1 ? 's' : ''}</span>
              <span>{sqlResult.time}ms</span>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>{sqlResult.columns.map(col => (
                    <th key={col} className="text-left px-2 py-1 border-b border-[var(--border)] font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] sticky top-0">{col}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {sqlResult.data.slice(0, 200).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-[var(--bg-tertiary)]'}>
                      {sqlResult!.columns.map(col => (
                        <td key={col} className="px-2 py-1 border-b border-[var(--border)] font-mono whitespace-nowrap">{formatValue(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sqlResult.rowCount > 200 && (
                <p className="text-xs text-[var(--text-muted)] mt-1 p-2">Showing first 200 of {sqlResult.rowCount.toLocaleString()} rows</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Data Source Selector ──────────────────────────────────────────────

function DataSourceSelector({ activeSource, onLoad, disabled }: {
  activeSource: DataSource;
  onLoad: (source: DataSource, count: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex flex-wrap gap-6">
        {/* Generate in DuckDB */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Generate in DuckDB WASM</h4>
          <div className="flex gap-2">
            {GEN_PRESETS.map(p => (
              <button key={p.count} onClick={() => onLoad('generate', p.count)} disabled={disabled}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  activeSource === 'generate' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>{p.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Synthetic data, generated in-browser</p>
        </div>

        <div className="border-l border-[var(--border)]" />

        {/* Load from Rust data-service as Arrow IPC */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Rust Data Service (Arrow IPC)</h4>
          <div className="flex gap-2">
            {RUST_PRESETS.map(p => (
              <button key={p.count} onClick={() => onLoad('rust-arrow', p.count)} disabled={disabled}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  activeSource === 'rust-arrow' ? 'bg-orange-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>{p.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Rust/Axum → Arrow IPC → DuckDB WASM (fastest path)</p>
        </div>

        <div className="border-l border-[var(--border)]" />

        {/* Load from PG as CSV */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Load from PG (CSV)</h4>
          <div className="flex gap-2">
            {PG_PRESETS.map(p => (
              <button key={p.count} onClick={() => onLoad('pg-csv', p.count)} disabled={disabled}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  activeSource === 'pg-csv' ? 'bg-blue-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>{p.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">PG → CSV → DuckDB WASM</p>
        </div>

        <div className="border-l border-[var(--border)]" />

        {/* Load from PG as Arrow IPC */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Load from PG (Arrow)</h4>
          <div className="flex gap-2">
            {PG_PRESETS.map(p => (
              <button key={p.count} onClick={() => onLoad('pg-arrow', p.count)} disabled={disabled}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  activeSource === 'pg-arrow' ? 'bg-green-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>{p.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">PG → Arrow IPC → DuckDB WASM (binary columnar)</p>
        </div>

        <div className="border-l border-[var(--border)]" />

        {/* Load from PG as JSON */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Load from PG (JSON)</h4>
          <div className="flex gap-2">
            {PG_PRESETS.map(p => (
              <button key={p.count} onClick={() => onLoad('pg-json', p.count)} disabled={disabled}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  activeSource === 'pg-json' ? 'bg-purple-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}>{p.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">PG → JSON → DuckDB WASM (largest payload)</p>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Read a fetch Response body with streaming progress callback.
 * Falls back to arrayBuffer() if ReadableStream is unavailable.
 */
async function readResponseWithProgress(
  resp: Response,
  onProgress: (bytesReceived: number) => void,
): Promise<Uint8Array> {
  if (!resp.body) {
    // No streaming — fallback
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

  // Combine chunks into a single Uint8Array
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return buffer;
}

/**
 * Rename snake_case PG/Rust columns to camelCase expected by grid columns.
 * Safely skips columns that don't exist or are already renamed.
 */
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

  // Enforce DATE/TIMESTAMP columns → VARCHAR with ISO-8601 format.
  // PG exports keep native DATE types which Arrow serialises as
  // epoch-day integers — coerce them to readable strings at the table level.
  await enforceDateColumnsAsVarchar(ds);
}

/**
 * Convert any DATE / TIMESTAMP columns in `sales_orders` to VARCHAR so
 * downstream consumers always receive 'YYYY-MM-DD' strings, not raw
 * epoch-day / epoch-µs integers from Arrow.
 */
async function enforceDateColumnsAsVarchar(ds: DuckDBDataSource) {
  // Both possible column names (pre- and post-rename)
  const dateCols = ['date', 'fulfillmentDate', 'fulfillment_date'];
  let schema: any[];
  try {
    const result = await ds.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales_orders'`
    );
    schema = toRows(result.data);
  } catch {
    return; // table doesn't exist yet
  }

  for (const col of dateCols) {
    const info = schema.find((r: any) => r.column_name === col);
    if (!info) continue;
    const dtype = String(info.data_type).toUpperCase();
    if (dtype === 'VARCHAR' || dtype === 'TEXT') continue; // already a string

    // Recreate the table with the date column cast to strftime output.
    // DuckDB supports ALTER COLUMN … SET DATA TYPE but only in recent versions;
    // a safer approach: create → swap.
    try {
      await ds.query(
        `CREATE OR REPLACE TABLE sales_orders AS ` +
        `SELECT * REPLACE (strftime("${col}", '%Y-%m-%d') AS "${col}") FROM sales_orders`
      );
      // After the replace only one column changes; refresh schema for next iter.
      const refreshed = await ds.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales_orders'`
      );
      schema = toRows(refreshed.data);
    } catch (e) {
      console.warn(`enforceDateColumnsAsVarchar: failed to convert "${col}":`, e);
    }
  }
}

function toRows(data: unknown[]): any[] {
  return (data as any[]).map(row => {
    if (typeof row?.toJSON === 'function') return row.toJSON();
    return { ...row };
  });
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'bigint') return v.toLocaleString();
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
  return String(v);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded px-3 py-2 ${accent ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] border-[var(--border)]'}`}>
      <p className={`text-[10px] uppercase ${accent ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>{label}</p>
      <p className={`text-sm font-bold ${accent ? '' : ''}`}>{value}</p>
    </div>
  );
}
