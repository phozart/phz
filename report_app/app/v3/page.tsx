'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createGrid } from '@phozart/phz-core';
import type { ColumnDefinition, GridApi, GridState } from '@phozart/phz-core';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzGrid } from '@/components/wrappers/DynamicGrid';

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'];
const STATUSES = ['active', 'inactive', 'on-leave', 'probation'];
const LOCATIONS = ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney'];

function generateData(count: number) {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Davis',
    'Frank Wilson', 'Grace Lee', 'Hank Miller', 'Iris Chen', 'Jack Taylor',
    'Kate Anderson', 'Leo Thomas', 'Mia Jackson', 'Noah White', 'Olivia Harris',
    'Paul Martin', 'Quinn Thompson', 'Rosa Garcia', 'Sam Martinez', 'Tina Robinson',
    'Uma Clark', 'Victor Lewis', 'Wendy Walker', 'Xander Hall', 'Yuki Allen',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length],
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    salary: 65000 + Math.floor(Math.random() * 85000),
    rating: Math.round((3 + Math.random() * 2) * 10) / 10,
    startDate: `${2016 + (i % 9)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    status: STATUSES[i % STATUSES.length],
    location: LOCATIONS[i % LOCATIONS.length],
    projects: Math.floor(Math.random() * 20) + 1,
    isRemote: i % 3 === 0,
  }));
}

const SAMPLE_DATA = generateData(40);

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active: { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
  inactive: { bg: '#1c1917', color: '#78716c', dot: '#57534e' },
  'on-leave': { bg: '#422006', color: '#fb923c', dot: '#f97316' },
  probation: { bg: '#1e1b4b', color: '#818cf8', dot: '#6366f1' },
};

// ---------------------------------------------------------------------------
// Section: Undo / Redo (headless createGrid API)
// ---------------------------------------------------------------------------
function UndoRedoSection() {
  const [log, setLog] = useState<string[]>([]);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false, undoStack: 0, redoStack: 0 });
  const [sortState, setSortState] = useState<string>('none');
  const gridRef = useRef<GridApi | null>(null);

  useEffect(() => {
    const grid = createGrid({
      data: SAMPLE_DATA,
      columns: [
        { field: 'id', header: 'ID', type: 'number' },
        { field: 'name', header: 'Name' },
        { field: 'department', header: 'Department' },
        { field: 'salary', header: 'Salary', type: 'number' },
      ],
    });
    gridRef.current = grid;

    // Subscribe to state changes to track history
    grid.subscribe((state: GridState) => {
      setHistory({
        canUndo: state.history?.canUndo ?? false,
        canRedo: state.history?.canRedo ?? false,
        undoStack: state.history?.undoStack ?? 0,
        redoStack: state.history?.redoStack ?? 0,
      });
      const sortCols = state.sort?.columns ?? [];
      setSortState(
        sortCols.length > 0
          ? sortCols.map((s: any) => `${s.field} ${s.direction}`).join(', ')
          : 'none',
      );
    });

    addLog('Grid created with undo/redo support');
    return () => { gridRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = useCallback((msg: string) => {
    setLog(prev => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 15));
  }, []);

  const doSort = (field: string, dir: 'asc' | 'desc') => {
    gridRef.current?.sort(field, dir);
    addLog(`Sort: ${field} ${dir}`);
  };

  const doUndo = () => {
    const ok = gridRef.current?.undo();
    addLog(ok ? 'Undo successful' : 'Nothing to undo');
  };

  const doRedo = () => {
    const ok = gridRef.current?.redo();
    addLog(ok ? 'Redo successful' : 'Nothing to redo');
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">Undo / Redo</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">NEW</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Every sort, filter, column, and grouping mutation is tracked in a 50-entry undo stack.
        Call <code className="text-[var(--accent)]">grid.undo()</code> / <code className="text-[var(--accent)]">grid.redo()</code> to
        navigate state history.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => doSort('name', 'asc')} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Sort Name ASC
        </button>
        <button onClick={() => doSort('salary', 'desc')} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Sort Salary DESC
        </button>
        <button onClick={() => doSort('department', 'asc')} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Sort Dept ASC
        </button>
        <div className="border-l border-[var(--border)] mx-1" />
        <button
          onClick={doUndo}
          disabled={!history.canUndo}
          className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white disabled:opacity-30 transition-opacity"
        >
          Undo ({history.undoStack})
        </button>
        <button
          onClick={doRedo}
          disabled={!history.canRedo}
          className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white disabled:opacity-30 transition-opacity"
        >
          Redo ({history.redoStack})
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider mb-1">Current Sort</p>
          <p className="text-sm font-mono text-[var(--text-primary)]">{sortState}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider mb-1">History State</p>
          <p className="text-sm font-mono text-[var(--text-primary)]">
            undo: {history.undoStack} | redo: {history.redoStack}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-[var(--border)] pt-3 max-h-32 overflow-y-auto">
        {log.map((entry, i) => (
          <div key={i} className="text-[11px] font-mono text-[var(--text-muted)] leading-5">{entry}</div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: subscribeSelector — granular state subscriptions
// ---------------------------------------------------------------------------
function SubscribeSelectorSection() {
  const [sortCount, setSortCount] = useState(0);
  const [filterCount, setFilterCount] = useState(0);
  const [totalCallbacks, setTotalCallbacks] = useState(0);
  const [selectorCallbacks, setSelectorCallbacks] = useState(0);
  const gridRef = useRef<GridApi | null>(null);

  useEffect(() => {
    const grid = createGrid({
      data: SAMPLE_DATA,
      columns: [
        { field: 'id', header: 'ID', type: 'number' },
        { field: 'name', header: 'Name' },
        { field: 'salary', header: 'Salary', type: 'number' },
      ],
    });
    gridRef.current = grid;

    // Full subscribe — fires on EVERY state change
    grid.subscribe(() => {
      setTotalCallbacks(prev => prev + 1);
    });

    // Selector subscribe — fires ONLY when sort changes
    grid.subscribeSelector(
      (s: GridState) => s.sort?.columns?.length ?? 0,
      (newLen: number) => {
        setSelectorCallbacks(prev => prev + 1);
        setSortCount(newLen);
      },
    );

    // Selector subscribe — fires ONLY when filter changes
    grid.subscribeSelector(
      (s: GridState) => (s.filter?.filters ?? []).length,
      (newLen: number) => {
        setFilterCount(newLen);
      },
    );

    return () => { gridRef.current = null; };
  }, []);

  const doSort = (field: string) => {
    gridRef.current?.sort(field, 'asc');
  };

  const doFilter = () => {
    gridRef.current?.addFilter('name', 'contains', 'Al');
  };

  const clearSort = () => {
    gridRef.current?.clearSort();
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">subscribeSelector</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">NEW</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Efficient partial state subscriptions. Only fires when the selected slice changes.
        Compare <code className="text-[var(--accent)]">subscribe()</code> (every change) vs{' '}
        <code className="text-[var(--accent)]">subscribeSelector()</code> (targeted).
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => doSort('name')} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Sort Name
        </button>
        <button onClick={() => doSort('salary')} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Sort Salary
        </button>
        <button onClick={doFilter} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Filter name contains &quot;Al&quot;
        </button>
        <button onClick={clearSort} className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Clear Sort
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <CounterCard label="subscribe() calls" value={totalCallbacks} desc="Every state change" />
        <CounterCard label="sortSelector calls" value={selectorCallbacks} desc="Only sort changes" accent />
        <CounterCard label="Active sorts" value={sortCount} />
        <CounterCard label="Active filters" value={filterCount} />
      </div>
    </div>
  );
}

function CounterCard({ label, value, desc, accent }: { label: string; value: number; desc?: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${accent ? 'bg-blue-600/10 border-blue-600/30' : 'bg-[var(--bg-tertiary)] border-[var(--border)]'}`}>
      <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-blue-400' : 'text-[var(--text-primary)]'}`}>{value}</p>
      {desc && <p className="text-[10px] text-[var(--text-muted)]">{desc}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Column Pinning
// ---------------------------------------------------------------------------
function ColumnPinningSection() {
  const { resolved } = useTheme();

  const pinnedColumns: ColumnDefinition[] = [
    { field: 'id', header: 'ID', width: 60, type: 'number', sortable: true, frozen: 'left' },
    { field: 'name', header: 'Name', width: 180, sortable: true, frozen: 'left' },
    { field: 'department', header: 'Department', width: 140, sortable: true, filterable: true },
    { field: 'salary', header: 'Salary', width: 110, type: 'number', sortable: true },
    { field: 'rating', header: 'Rating', width: 80, type: 'number', sortable: true },
    { field: 'startDate', header: 'Start Date', width: 120, type: 'date', sortable: true },
    { field: 'status', header: 'Status', width: 110, sortable: true, filterable: true },
    { field: 'location', header: 'Location', width: 140, sortable: true },
    { field: 'projects', header: 'Projects', width: 90, type: 'number', sortable: true },
    { field: 'isRemote', header: 'Remote', width: 80, type: 'boolean', sortable: true, frozen: 'right' },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">Column Pinning</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">NEW</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Pin columns to the left or right edge using <code className="text-[var(--accent)]">frozen: &apos;left&apos; | &apos;right&apos;</code> on ColumnDefinition.
        Pinned columns stay visible while scrolling horizontally. ID and Name are pinned left; Remote is pinned right.
      </p>

      <div className="mb-3 flex gap-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> frozen: &apos;left&apos; (ID, Name)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> frozen: &apos;right&apos; (Remote)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" /> scrollable (rest)
        </span>
      </div>

      <div style={{ height: 380 }}>
        <DynamicPhzGrid
          data={SAMPLE_DATA}
          columns={pinnedColumns}
          height="360px"
          theme={resolved}
          density="compact"
          showToolbar
          statusColors={STATUS_COLORS}
          rowBanding
          hoverHighlight
          gridLines="horizontal"
          allowSorting
          compactNumbers
          gridTitle="Column Pinning Demo"
          gridSubtitle="Scroll horizontally to see frozen columns"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: DuckDB SQL Builder
// ---------------------------------------------------------------------------
function SqlBuilderSection() {
  const [queries, setQueries] = useState<Array<{ label: string; sql: string; params: unknown[] }>>([]);

  useEffect(() => {
    // Dynamic import since phz-duckdb may not be installed in all envs
    import('@phozart/phz-duckdb').then(({ buildGridQuery, buildCountQuery }) => {
      const results: Array<{ label: string; sql: string; params: unknown[] }> = [];

      // Basic query with filter + sort + pagination
      const q1 = buildGridQuery({
        tableName: 'sales_orders',
        filters: [{ field: 'status', operator: 'equals', value: 'completed' }],
        sort: [{ field: 'amount', direction: 'desc' }],
        groupBy: [],
        viewport: { offset: 0, limit: 50 },
      });
      results.push({ label: 'Filter + Sort + Paginate', sql: q1.sql, params: q1.params });

      // Count query
      const q2 = buildCountQuery({
        tableName: 'sales_orders',
        filters: [{ field: 'status', operator: 'equals', value: 'completed' }],
      });
      results.push({ label: 'Count Query', sql: q2.sql, params: q2.params });

      // GROUP BY with aggregates
      const q3 = buildGridQuery({
        tableName: 'sales_orders',
        filters: [],
        sort: [{ field: 'total_revenue', direction: 'desc' }],
        groupBy: ['region', 'status'],
        aggregates: [
          { field: 'amount', function: 'sum' },
          { field: 'amount', function: 'avg' },
          { field: 'id', function: 'count' },
        ],
      });
      results.push({ label: 'GROUP BY + Aggregates', sql: q3.sql, params: q3.params });

      // HAVING clause
      const q4 = buildGridQuery({
        tableName: 'sales_orders',
        filters: [],
        sort: [],
        groupBy: ['region'],
        aggregates: [{ field: 'amount', function: 'sum' }],
        having: [{ field: 'amount', operator: 'greaterThan', value: 100000, aggregation: 'sum' }],
      });
      results.push({ label: 'HAVING (aggregate filter)', sql: q4.sql, params: q4.params });

      setQueries(results);
    }).catch(() => {
      setQueries([{ label: 'Error', sql: '@phozart/phz-duckdb not available', params: [] }]);
    });
  }, []);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">DuckDB SQL Builder</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">NEW</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Parameterized SQL generation with <code className="text-[var(--accent)]">buildGridQuery()</code> and{' '}
        <code className="text-[var(--accent)]">buildCountQuery()</code>. Supports GROUP BY, HAVING, LIMIT/OFFSET,
        and injection-safe identifiers.
      </p>

      <div className="space-y-3">
        {queries.map((q, i) => (
          <div key={i} className="border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-xs font-semibold text-[var(--text-secondary)]">
              {q.label}
            </div>
            <div className="p-3">
              <pre className="text-xs font-mono text-blue-400 whitespace-pre-wrap break-all leading-5">{q.sql}</pre>
              {q.params.length > 0 && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">
                  params: [{q.params.map(p => JSON.stringify(p)).join(', ')}]
                </p>
              )}
            </div>
          </div>
        ))}
        {queries.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] animate-pulse">Loading SQL builder...</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Controller Architecture
// ---------------------------------------------------------------------------
function ControllerArchSection() {
  const controllers = [
    { name: 'GridCoreController', desc: 'Headless grid instantiation and subscription', lines: '135' },
    { name: 'VirtualScrollController', desc: 'Virtual scrolling + remote data management', lines: '197' },
    { name: 'SelectionController', desc: 'Row and cell range selection with keyboard', lines: '167' },
    { name: 'SortController', desc: 'Header click to sort, multi-sort with Ctrl', lines: '60' },
    { name: 'FilterController', desc: 'Filter popover state and UI coordination', lines: '197' },
    { name: 'EditController', desc: 'Inline cell editing lifecycle', lines: '71' },
    { name: 'ColumnResizeController', desc: 'Drag-to-resize and auto-fit', lines: '73' },
    { name: 'ExportController', desc: 'CSV and Excel export', lines: '160' },
    { name: 'ClipboardController', desc: 'Copy/paste for cells, rows, and ranges', lines: '74' },
    { name: 'GroupController', desc: 'Row grouping management', lines: '51' },
    { name: 'AggregationController', desc: 'Column aggregation (sum, avg, min, max)', lines: '48' },
    { name: 'ToastController', desc: 'Toast notification management', lines: '33' },
    { name: 'ContextMenuController', desc: 'Right-click context menu', lines: '~80' },
    { name: 'ConditionalFormattingController', desc: 'Cell styling rules', lines: '~75' },
    { name: 'ColumnChooserController', desc: 'Column visibility and ordering', lines: '~60' },
    { name: 'ComputedColumnsController', desc: 'Computed column support', lines: '~50' },
  ];

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">Controller Architecture</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">REFACTORED</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        The monolithic <code className="text-[var(--accent)]">phz-grid.ts</code> (4,434 lines) has been decomposed into{' '}
        <strong>16 Lit Reactive Controllers</strong>. Each controller manages a single concern with its own host interface.
        The main component dropped from 4,434 to 975 lines.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {controllers.map(c => (
          <div key={c.name} className="flex items-start gap-2 px-3 py-2 rounded bg-[var(--bg-tertiary)] border border-[var(--border)]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">{c.name}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{c.desc}</p>
            </div>
            <span className="ml-auto text-[10px] text-[var(--text-muted)] shrink-0">{c.lines}L</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Grid with Undo/Redo live (PhzGrid React wrapper)
// ---------------------------------------------------------------------------
function LiveUndoRedoGrid() {
  const { resolved } = useTheme();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false, undoStack: 0, redoStack: 0 });

  const columns: ColumnDefinition[] = [
    { field: 'id', header: 'ID', width: 60, type: 'number', sortable: true, frozen: 'left' },
    { field: 'name', header: 'Name', width: 160, sortable: true, filterable: true, editable: true, frozen: 'left' },
    { field: 'department', header: 'Department', width: 130, sortable: true, filterable: true },
    { field: 'salary', header: 'Salary', width: 110, type: 'number', sortable: true, filterable: true },
    { field: 'status', header: 'Status', width: 100, sortable: true, filterable: true },
    { field: 'location', header: 'Location', width: 130, sortable: true, filterable: true },
    { field: 'projects', header: 'Projects', width: 90, type: 'number', sortable: true },
    { field: 'isRemote', header: 'Remote', width: 80, type: 'boolean', frozen: 'right' },
  ];

  const handleGridReady = useCallback((e: any) => {
    const api = e?.api ?? e?.detail?.api;
    if (!api) return;
    setGridApi(api);

    api.subscribe((state: GridState) => {
      setHistoryState({
        canUndo: state.history?.canUndo ?? false,
        canRedo: state.history?.canRedo ?? false,
        undoStack: state.history?.undoStack ?? 0,
        redoStack: state.history?.redoStack ?? 0,
      });
    });
  }, []);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-base font-semibold">Live Grid with Undo/Redo + Column Pinning</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">NEW</span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Full PhzGrid with undo/redo and pinned columns. Sort or filter, then undo.
        ID &amp; Name are pinned left, Remote is pinned right.
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => gridApi?.undo()}
          disabled={!historyState.canUndo}
          className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white disabled:opacity-30 transition-opacity"
        >
          Undo ({historyState.undoStack})
        </button>
        <button
          onClick={() => gridApi?.redo()}
          disabled={!historyState.canRedo}
          className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white disabled:opacity-30 transition-opacity"
        >
          Redo ({historyState.redoStack})
        </button>
        <span className="text-xs text-[var(--text-muted)] self-center ml-2">
          Sort or filter the grid, then press Undo
        </span>
      </div>

      <div style={{ height: 420 }}>
        <DynamicPhzGrid
          data={SAMPLE_DATA}
          columns={columns}
          height="400px"
          theme={resolved}
          density="compact"
          showToolbar
          showSearch
          showPagination
          statusColors={STATUS_COLORS}
          rowBanding
          hoverHighlight
          gridLines="horizontal"
          allowSorting
          allowFiltering
          editMode="dblclick"
          compactNumbers
          pageSize={15}
          gridTitle="v3 Feature Grid"
          gridSubtitle={`Undo: ${historyState.undoStack} | Redo: ${historyState.redoStack}`}
          onGridReady={handleGridReady}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function V3ChangesPage() {
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">v3 Changes</h1>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
            Sprint 6
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2 max-w-2xl">
          Architecture decomposition, core upgrades, and DuckDB push-down.
          The headless core gained undo/redo, granular subscriptions, and two-phase initialization.
          The grid component was decomposed from a 4,434-line monolith into 16 Lit Reactive Controllers.
          DuckDB integration got parameterized SQL generation and auto-bridge sync.
        </p>
      </div>

      {/* Feature summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <SummaryCard label="Undo/Redo" value="50-entry stack" detail="Sort, filter, column, grouping" />
        <SummaryCard label="subscribeSelector" value="Granular" detail="Fires only on slice change" />
        <SummaryCard label="Column Pinning" value="Left / Right" detail="Sticky positioning via frozen" />
        <SummaryCard label="Controllers" value="16 extracted" detail="4,434 -> 975 lines" />
      </div>

      {/* Interactive demos */}
      <div className="space-y-6">
        <UndoRedoSection />
        <SubscribeSelectorSection />
        <ColumnPinningSection />
        <LiveUndoRedoGrid />
        <SqlBuilderSection />
        <ControllerArchSection />
      </div>

      {/* API reference */}
      <div className="mt-8 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
        <h3 className="text-base font-semibold mb-4">v3 API Reference</h3>
        <div className="space-y-3">
          <ApiEntry
            pkg="@phozart/phz-core"
            apis={[
              { name: 'grid.undo()', ret: 'boolean', desc: 'Revert last state mutation' },
              { name: 'grid.redo()', ret: 'boolean', desc: 'Re-apply reverted mutation' },
              { name: 'grid.canUndo()', ret: 'boolean', desc: 'Check if undo stack has entries' },
              { name: 'grid.canRedo()', ret: 'boolean', desc: 'Check if redo stack has entries' },
              { name: 'grid.subscribe(listener)', ret: 'Unsubscribe', desc: 'Full state subscription (microtask-batched)' },
              { name: 'grid.subscribeSelector(selector, cb, eq?)', ret: 'Unsubscribe', desc: 'Granular subscription — fires only when selector output changes' },
              { name: 'state.history', ret: '{ canUndo, canRedo, undoStack, redoStack }', desc: 'History state slice on GridState' },
            ]}
          />
          <ApiEntry
            pkg="@phozart/phz-core (ColumnDefinition)"
            apis={[
              { name: "frozen: 'left' | 'right' | null", ret: 'ColumnDefinition', desc: 'Pin column to left or right edge' },
            ]}
          />
          <ApiEntry
            pkg="@phozart/phz-duckdb"
            apis={[
              { name: 'buildGridQuery(input)', ret: 'SqlResult', desc: 'Parameterized SELECT with WHERE, GROUP BY, HAVING, ORDER BY, LIMIT/OFFSET' },
              { name: 'buildCountQuery(input)', ret: 'SqlResult', desc: 'Parameterized COUNT(*) for filtered rows' },
              { name: 'new DuckDBAsyncSource(ds, table)', ret: 'AsyncDataSource', desc: 'Adapter for grid async data loading from DuckDB' },
              { name: 'new DuckDBBridge(ds, table)', ret: 'DuckDBBridge', desc: 'Auto-wire grid state changes to DuckDB push-down queries' },
              { name: 'sanitizeIdentifier(name)', ret: 'string', desc: 'SQL injection prevention for identifiers' },
            ]}
          />
          <ApiEntry
            pkg="@phozart/phz-grid (Controllers)"
            apis={[
              { name: 'GridCoreController', ret: 'ReactiveController', desc: 'Grid instantiation + state sync' },
              { name: 'VirtualScrollController', ret: 'ReactiveController', desc: 'Virtual scrolling + remote data' },
              { name: 'SelectionController', ret: 'ReactiveController', desc: 'Row/cell range selection' },
              { name: 'FilterController', ret: 'ReactiveController', desc: 'Filter popover state' },
              { name: 'ClipboardController', ret: 'ReactiveController', desc: 'Copy/paste support' },
              { name: '...11 more', ret: 'ReactiveController', desc: 'Sort, edit, resize, export, group, aggregation, toast, etc.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4" style={{ boxShadow: 'var(--card-shadow)' }}>
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{detail}</p>
    </div>
  );
}

function ApiEntry({ pkg, apis }: { pkg: string; apis: Array<{ name: string; ret: string; desc: string }> }) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="px-3 py-1.5 bg-[var(--bg-tertiary)] text-xs font-semibold text-[var(--accent)]">{pkg}</div>
      <div className="divide-y divide-[var(--border)]">
        {apis.map((a, i) => (
          <div key={i} className="px-3 py-1.5 flex items-baseline gap-3 text-xs">
            <code className="font-mono text-[var(--text-primary)] shrink-0">{a.name}</code>
            <span className="text-[var(--text-muted)]">{a.desc}</span>
            <code className="ml-auto text-[10px] font-mono text-[var(--text-muted)] shrink-0">{a.ret}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
