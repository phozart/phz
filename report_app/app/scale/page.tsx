'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzGrid } from '@/components/wrappers/DynamicGrid';
import { DATASETS, listDatasets } from '@/lib/datasets-registry';

const DuckDBPanel = lazy(() => import('@/components/DuckDBPanel'));

const DATASET_LIST = listDatasets();

type ScaleMode = 'dashboard' | 'duckdb' | 'client' | 'virtual';

const CLIENT_PRESETS = [
  { label: '10K',  count: 10_000 },
  { label: '50K',  count: 50_000 },
  { label: '100K', count: 100_000 },
  { label: '200K', count: 200_000 },
];

const VIRTUAL_PRESETS = [
  { label: '100K', count: 100_000 },
  { label: '250K', count: 250_000 },
  { label: '500K', count: 500_000 },
  { label: '1M',   count: 1_000_000 },
];

const SEED_PRESETS = [
  { label: '1M',   count: 1_000_000 },
  { label: '10M',  count: 10_000_000 },
  { label: '50M',  count: 50_000_000 },
  { label: '100M', count: 100_000_000 },
];

const MODES: { id: ScaleMode; label: string; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard Viewer', desc: 'Live analytics dashboard — Rust data-service → Arrow IPC → DuckDB WASM. Auto-loads 1M rows, use data source selector for up to 100M.' },
  { id: 'duckdb',  label: 'DuckDB (Scale Test)',    desc: 'Data source comparison — generate in-browser or load from PG/Rust in CSV, JSON, or Arrow IPC. Scales to 100M+.' },
  { id: 'client',  label: 'Client Paginated', desc: 'Load up to 200K rows from PG into browser memory. Grid handles pagination client-side.' },
  { id: 'virtual', label: 'Virtual Scroll',   desc: 'Load up to 1M rows into browser. Virtual scrolling — smooth scroll through all rows.' },
];

function snakeToCamel(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ScalePage() {
  const { resolved } = useTheme();
  const [mode, setMode] = useState<ScaleMode>('dashboard');
  const [datasetId, setDatasetId] = useState('sales_orders');
  const ds = DATASETS[datasetId];

  // ── Shared: PG row count + seed status ─────────────────────────────
  const [pgRowCount, setPgRowCount] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  // ── Client/Virtual: data loaded from PG into browser ───────────────
  const [clientData, setClientData] = useState<any[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientTiming, setClientTiming] = useState<{
    networkMs: number; parseMs: number; totalMs: number;
    transferSize: string; rowCount: number;
  } | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // Reset state when switching datasets
  const switchDataset = useCallback((id: string) => {
    setDatasetId(id);
    setClientData([]);
    setClientTiming(null);
    setClientError(null);
  }, []);

  // ── Probe PG for row count on mount + dataset change ───────────────
  const probePG = useCallback(async () => {
    try {
      const resp = await fetch(`/api/datasets/${datasetId}?mode=count`);
      if (!resp.ok) throw new Error('PG not available');
      const body = await resp.json();
      setPgRowCount(Number(body.count));
      return Number(body.count);
    } catch {
      setPgRowCount(0);
      return 0;
    }
  }, [datasetId]);

  useEffect(() => {
    probePG();
  }, [probePG]);

  // ── Seed PG (shared across all modes) ──────────────────────────────
  const seedPG = useCallback(async (count: number) => {
    setSeeding(true);
    setSeedError(null);
    try {
      const resp = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      const body = await resp.json().catch(() => ({ error: 'Request failed' }));
      if (!resp.ok) throw new Error(body.error ?? `HTTP ${resp.status}`);
      setPgRowCount(count);
    } catch (e: any) {
      setSeedError(`${e.message} — is PostgreSQL running? Run: docker compose up -d`);
    } finally {
      setSeeding(false);
    }
  }, []);

  // ── Load data from PG into browser (client paginated & virtual) ────
  const loadFromPG = useCallback(async (count: number) => {
    setClientLoading(true);
    setClientError(null);
    setClientTiming(null);
    setClientData([]);

    try {
      const t0 = performance.now();
      const resp = await fetch(`/api/datasets/${datasetId}?mode=export&format=json&limit=${count}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }
      const buffer = await resp.arrayBuffer();
      const networkMs = Math.round(performance.now() - t0);
      const transferSize = formatBytes(buffer.byteLength);

      const t1 = performance.now();
      const text = new TextDecoder().decode(buffer);
      const rawRows: Record<string, any>[] = JSON.parse(text);
      const rows = rawRows.map(snakeToCamel);
      const parseMs = Math.round(performance.now() - t1);

      setClientData(rows);
      setClientTiming({
        networkMs,
        parseMs,
        totalMs: Math.round(performance.now() - t0),
        transferSize,
        rowCount: rows.length,
      });
    } catch (e: any) {
      setClientError(`${e.message} — is PostgreSQL running? Run: docker compose up -d`);
    } finally {
      setClientLoading(false);
    }
  }, [datasetId]);

  // ── Derived ────────────────────────────────────────────────────────
  const isClientMode = mode === 'client' || mode === 'virtual';
  const presets = mode === 'virtual' ? VIRTUAL_PRESETS : CLIENT_PRESETS;
  const memEst = isClientMode ? Math.round((clientData.length * 200) / (1024 * 1024)) : 0;
  const pgHasData = pgRowCount !== null && pgRowCount > 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scale Test</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Performance testing with large datasets (32 columns, up to 100M rows) — Rust data-service serves Arrow IPC, DuckDB WASM for in-browser analytics, PostgreSQL for storage
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === m.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <p className="text-xs text-[var(--text-muted)]">
          {MODES.find(m => m.id === mode)?.desc}
        </p>
        {isClientMode && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <span className="text-xs text-[var(--text-muted)]">Source:</span>
            {DATASET_LIST.map(d => (
              <button
                key={d.id}
                onClick={() => switchDataset(d.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  datasetId === d.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Seed PG bar (shown for client/virtual modes) ── */}
      {isClientMode && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">PostgreSQL</span>
              {pgRowCount !== null && (
                <span className={`text-sm font-bold ${pgHasData ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                  {pgHasData ? `${pgRowCount.toLocaleString()} rows` : 'empty'}
                </span>
              )}
              {pgRowCount === null && (
                <span className="text-xs text-[var(--text-muted)] animate-pulse">checking...</span>
              )}
            </div>
            <div className="border-l border-[var(--border)] h-6" />
            <span className="text-xs text-[var(--text-muted)]">Seed:</span>
            {SEED_PRESETS.map(p => (
              <button
                key={p.count}
                onClick={() => seedPG(p.count)}
                disabled={seeding}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {p.label}
              </button>
            ))}
            {seeding && <span className="text-xs text-[var(--accent)] animate-pulse">Seeding PG...</span>}
          </div>
          {seedError && (
            <div className="mt-2 text-xs text-red-400">{seedError}</div>
          )}
        </div>
      )}

      {/* ── Dashboard Viewer — auto-loads from Rust data-service ────── */}
      {mode === 'dashboard' && (
        <Suspense fallback={<div className="text-[var(--text-muted)] p-8 text-center animate-pulse">Loading DuckDB module...</div>}>
          <DuckDBPanel
            theme={resolved}
            autoLoad={{ source: 'rust-arrow', count: 1_000_000 }}
          />
        </Suspense>
      )}

      {/* ── DuckDB WASM scale test — data source comparison ──────────── */}
      {mode === 'duckdb' && (
        <Suspense fallback={<div className="text-[var(--text-muted)] p-8 text-center animate-pulse">Loading DuckDB module...</div>}>
          <DuckDBPanel theme={resolved} />
        </Suspense>
      )}

      {/* ── Client / Virtual mode ──────────────────────────────────────── */}
      {isClientMode && (
        <>
          {/* Load presets */}
          <div className="flex gap-2 mb-4 items-center flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">Load from PG:</span>
            {presets.map(p => (
              <button
                key={p.count}
                onClick={() => loadFromPG(p.count)}
                disabled={clientLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                  clientTiming?.rowCount === p.count && !clientLoading
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
            {clientLoading && <span className="text-xs text-[var(--accent)] animate-pulse">Loading from PG...</span>}
          </div>

          {/* Error */}
          {clientError && (
            <div className="mb-4 bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400">
              {clientError}
            </div>
          )}

          {/* Stats */}
          {clientTiming && (
            <div className="flex gap-3 mb-4 flex-wrap">
              <Stat label="Rows" value={clientTiming.rowCount.toLocaleString()} />
              <Stat label="Total Time" value={`${clientTiming.totalMs}ms`} accent />
              <Stat label="Network" value={`${clientTiming.networkMs}ms`} />
              <Stat label="Parse" value={`${clientTiming.parseMs}ms`} />
              <Stat label="Transfer" value={clientTiming.transferSize} />
              <Stat label="Est Memory" value={`~${memEst}MB`} />
              <Stat label="Mode" value={mode === 'virtual' ? 'Virtual Scroll' : 'Client Paginated'} />
              <Stat label="Source" value="PG → JSON → Browser" />
            </div>
          )}

          {/* Grid */}
          {!clientLoading && clientData.length > 0 && mode === 'client' && (
            <div style={{ height: 760 }}>
              <DynamicPhzGrid
                data={clientData}
                columns={ds.columns}
                height="600px"
                theme={resolved}
                density="compact"
                showToolbar
                showSearch
                showPagination
                showCsvExport
                statusColors={ds.statusColors}
                rowBanding
                hoverHighlight
                gridLines="horizontal"
                allowSorting
                allowFiltering
                compactNumbers
                pageSize={50}
                pageSizeOptions={[25, 50, 100, 200]}
                gridTitle={`Client Paginated — ${ds.name} · ${clientData.length.toLocaleString()} rows`}
                gridSubtitle={`${clientTiming?.totalMs ?? 0}ms total load time`}
              />
            </div>
          )}

          {!clientLoading && clientData.length > 0 && mode === 'virtual' && (
            <div style={{ height: 700 }}>
              <DynamicPhzGrid
                data={clientData}
                columns={ds.columns}
                height="600px"
                theme={resolved}
                density="compact"
                showToolbar
                showSearch
                showPagination={false}
                showCsvExport
                statusColors={ds.statusColors}
                rowBanding
                hoverHighlight
                gridLines="horizontal"
                allowSorting
                allowFiltering
                compactNumbers
                scrollMode="virtual"
                gridTitle={`Virtual Scroll — ${ds.name} · ${clientData.length.toLocaleString()} rows`}
                gridSubtitle={`${clientTiming?.totalMs ?? 0}ms total load time`}
              />
            </div>
          )}

          {/* Loading state */}
          {clientLoading && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
              <div className="animate-pulse text-[var(--accent)] font-medium">Loading data from PostgreSQL...</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border rounded px-3 py-2 ${accent ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] border-[var(--border)]'}`}>
      <p className={`text-[10px] uppercase ${accent ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>{label}</p>
      <p className={`text-sm font-bold ${accent ? '' : ''}`}>{value}</p>
    </div>
  );
}
