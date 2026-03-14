# phz-grid Feature Roadmap

**Date**: 2026-03-05
**Scope**: Comprehensive feature gap analysis, DuckDB strategy, and prioritized roadmap
**Companion**: `GRID-IMPROVEMENTS-PLAN.md` (Work Items 1-5: creation & configuration)
**Methodology**: Strict TDD (Red-Green-Refactor) via `/tdd` skill for all implementation

---

## Table of Contents

1. [Feature Gap Matrix](#feature-gap-matrix)
2. [DuckDB Strategy](#duckdb-strategy)
3. [Server-Side Operations](#server-side-operations)
4. [Metrics, KPIs & Aggregation](#metrics-kpis--aggregation)
5. [Grid Rendering Gaps](#grid-rendering-gaps)
6. [Innovative Differentiators](#innovative-differentiators)
7. [Prioritized Work Items](#prioritized-work-items)
8. [Execution Phases](#execution-phases)
9. [Parallel Session Strategy](#parallel-session-strategy)

---

## Feature Gap Matrix

### Legend

| Status | Meaning |
|--------|---------|
| **EXISTS** | Fully implemented and working |
| **PARTIAL** | Typed/declared but incomplete or not wired |
| **MISSING** | Not present at all |

### Core Grid Features

| Feature | Status | Details |
|---------|--------|---------|
| Virtual scrolling | **EXISTS** | DOM virtualization with configurable threshold |
| Column sorting (single) | **EXISTS** | Click header to sort |
| Column sorting (multi) | **EXISTS** | Shift-click for multi-sort |
| **Default sort** | **PARTIAL** | `defaultSortField`/`defaultSortDirection` declared on `<phz-grid>` but NEVER READ in `initializeGrid()` |
| Column filtering | **EXISTS** | Multiple filter operators |
| Row selection (single/multi) | **EXISTS** | Checkbox and click modes |
| Cell editing (inline) | **EXISTS** | Click-to-edit, async validation |
| Keyboard navigation | **EXISTS** | Arrow keys, Tab, Enter |
| Column resize | **EXISTS** | Drag header border |
| Column reorder | **EXISTS** | Drag column headers |
| **Column freeze/pin** | **PARTIAL** | `frozen`/`pinLeft`/`pinRight` typed in `ColumnDefinition` but NO sticky CSS rendering |
| Column auto-sizing | **EXISTS** | `autoSizeColumns` prop |
| Responsive layout | **EXISTS** | Column hiding by priority at breakpoints |
| Theme system | **EXISTS** | Three-layer CSS custom properties |
| Density toggle | **EXISTS** | Compact/comfortable/spacious |
| CSV export | **EXISTS** | Client-side only, operates on local data |
| Excel export | **PARTIAL** | Button exists, export logic is stub |
| Copy to clipboard | **EXISTS** | TSV format with header/formatting options |
| **Paste from clipboard** | **MISSING** | Only copy, no paste handler |
| **Undo/Redo** | **PARTIAL** | `UndoRedoState` typed in state, `undo()`/`redo()` on API — but implementation is empty shell |
| **Print/PDF** | **MISSING** | No print stylesheet or PDF generation |
| **RTL layout** | **MISSING** | No `dir="rtl"` support |
| **i18n / locale** | **PARTIAL** | `locale` property declared, never used for translations |
| **Row reorder** | **MISSING** | No drag-drop row reordering |
| **Master-detail** | **MISSING** | No expandable detail rows |
| **Cell merge/spanning** | **MISSING** | No colspan/rowspan |
| **Context menu** | **EXISTS** | Full right-click menu for both header and body cells (`phz-context-menu.ts`) |
| **Column header menu** | **EXISTS** | Header filter button + context menu (sort, filter, hide, group, export) |
| **Row grouping** | **EXISTS** | Multi-level grouping with expand/collapse |
| **Tree data** | **MISSING** | No parent-child hierarchy |
| **Status bar** | **MISSING** | No summary/status bar at bottom |
| **Footer/summary rows** | **EXISTS** | `aggregation`, `aggregationFn`, `aggregationPosition` props work; `renderAggregationRow()` renders `<tfoot>` with per-column aggregation (sum/avg/min/max/count); top/bottom/both placement; per-column overrides via admin |

### Data & Server-Side

| Feature | Status | Details |
|---------|--------|---------|
| AsyncDataSource | **EXISTS** | `fetch()` with offset/limit, sort, filter |
| RemoteDataManager | **EXISTS** | Page-cache for virtual scroll with remote data |
| **Debouncing** | **PARTIAL** | `debounceMs` declared in `PerformanceConfig` but NEVER IMPLEMENTED |
| **Request cancellation** | **MISSING** | No AbortController integration |
| **Cursor pagination** | **MISSING** | Only offset/limit |
| **Compound filters** | **MISSING** | Flat filter array only, no AND/OR groups |
| **Server-side export** | **MISSING** | Export is client-side only |
| **Server-side grouping** | **MISSING** | No lazy-expand group protocol |
| **Server capabilities** | **MISSING** | Grid cannot discover server features |
| **Retry/error handling** | **MISSING** | Single fetch, no retry |
| **Optimistic mutations** | **MISSING** | No write-back interface on AsyncDataSource |
| **Real-time updates** | **MISSING** | No push-update subscription (collab package is Yjs-specific) |
| **Cache TTL** | **MISSING** | No time-based cache expiry |

### DuckDB Integration

| Feature | Status | Details |
|---------|--------|---------|
| DuckDB initialization | **EXISTS** | Worker spawn, WASM bundle loading |
| File loading (CSV/Parquet/JSON) | **EXISTS** | `loadFile()` with format detection |
| SQL query execution | **EXISTS** | `query()` + `queryStream()` |
| Arrow table export | **EXISTS** | `toArrowTable()` returns raw Arrow |
| **Arrow table import** | **PARTIAL** | `fromArrowTable()` does row-by-row INSERT — unusable at scale |
| **Grid binding** | **PARTIAL** | `attachToGrid()` stores `GridApi` reference but NEVER USES IT |
| **SQL push-down** | **MISSING** | Grid always uses JS sort/filter/group, never DuckDB SQL |
| **DuckDB aggregation** | **MISSING** | Engine uses JS, not DuckDB |
| **DuckDB pivot** | **MISSING** | Pivot engine is pure JS |
| **Parameterized queries** | **PARTIAL** | String interpolation (regex), not prepared statements — SQL injection risk |
| **Progress reporting** | **PARTIAL** | Hardcoded 0/1, DuckDB progress callbacks not wired |
| **Arrow IPC file format** | **PARTIAL** | `.arrow`/`.ipc` files fall back to CSV format — bug |
| **AI query execution** | **PARTIAL** | AI generates SQL with `dialect: 'duckdb'`, no executor wired |

### BI Engine Integration

| Feature | Status | Details |
|---------|--------|---------|
| Aggregation engine | **EXISTS** | `computeAggregation()` — sum/avg/min/max/count/first/last |
| KPI definitions | **EXISTS** | Full KPI system with targets, thresholds, breakdowns, status |
| Pivot engine | **EXISTS** | `computePivot()` — but only uses first value field |
| Dashboard resolver | **EXISTS** | `resolveDashboardWidgets()` hydrates widget data from engine |
| Expression parser | **EXISTS** | Full recursive-descent parser with field/param/metric/calc refs |
| Conditional formatting | **EXISTS** | Cell/row/column scope, threshold rules |
| Drill-through | **EXISTS** | Multi-source (pivot, chart, KPI, scorecard, grid-row) |
| Sparkline renderer | **EXISTS** | SVG-based line/bar/area sparklines |
| **Grid footer aggregation** | **EXISTS** | Engine computes and grid renders in footer via `renderAggregationRow()` — wired through `phz-report-view` |
| **Grid-to-KPI binding** | **PARTIAL** | KPI cards and drill-through exist; missing bidirectional filter bus (click KPI → filter grid) |
| **Selection aggregation** | **MISSING** | No live sum/avg/count of selected cells |
| **Color scale gradients** | **PARTIAL** | `createColorScaleRule()` exists but no gradient interpolation |
| **Data bars** | **MISSING** | No horizontal bar inside cells |
| **Icon sets** | **PARTIAL** | `CellStyleConfig.icon` field exists, no icon set mapping |
| **Running calculations** | **MISSING** | No running sum/avg/rank |
| **Window functions** | **MISSING** | No LAG/LEAD/MAVG |
| **Multiple pivot value fields** | **PARTIAL** | `valueFields[]` typed, `computePivot()` uses `[0]` only |

---

## DuckDB Strategy

### Current State: Well-Designed, Not Connected

The `@phozart/duckdb` package has correct initialization, query execution, and streaming. ADR-004 lays out an ambitious vision. But **zero bytes of DuckDB output flow into the grid's rendering pipeline**. The grid always uses the JavaScript row model.

### Critical Bugs to Fix First

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | `fromArrowTable()` does row-by-row INSERT | `duckdb-data-source.ts:267-287` | Use `db.insertArrowTable()` (DuckDB-WASM native) |
| 2 | Arrow IPC files detected as CSV | `duckdb-data-source.ts:343` | Add `'arrow'` and `'ipc'` → `'arrow_ipc'` to `inferFormat()` |
| 3 | Named params use string interpolation | `duckdb-data-source.ts:186-190` | Use prepared statements via `connection.prepare()` |
| 4 | `getQueryPlan()` returns `estimatedRows: 1` always | `duckdb-data-source.ts:377` | Parse actual estimate from EXPLAIN text |

### Phase 1: Wire DuckDB to the Grid (SQL Push-Down)

**Goal**: When the grid's data source is DuckDB, sort/filter/group/paginate via SQL instead of JavaScript.

```
User action (sort/filter/scroll)
  → Grid emits state change event
  → DuckDB bridge builds SQL: SELECT * FROM tbl WHERE ... ORDER BY ... LIMIT ... OFFSET ...
  → DuckDB Worker executes SQL (off main thread)
  → Arrow result → toArray() → grid.setData()
```

**Key components:**
- `DuckDBBridge` class — subscribes to grid events, builds SQL, executes, pushes results
- SQL builder — converts `SortState` + `FilterState` + `GroupingState` → parameterized SQL
- `attachToGrid()` becomes the activation point (currently a no-op)
- Fall back to JS pipeline if DuckDB not initialized

**Performance target**: 1M rows with <50ms sort/filter response (DuckDB vectorized engine vs JS array scan).

### Phase 2: DuckDB for Aggregation & Pivot

Replace the JavaScript aggregation/pivot engines with DuckDB SQL for large datasets:

```sql
-- Footer aggregation
SELECT SUM(revenue), AVG(revenue), COUNT(*) FROM sales WHERE active = true

-- Group subtotals
SELECT region, SUM(revenue), COUNT(*) FROM sales GROUP BY region

-- Pivot
PIVOT sales ON quarter USING SUM(revenue) GROUP BY region

-- Window functions (not possible in current JS engine)
SELECT *, SUM(revenue) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_total,
         LAG(revenue, 1) OVER (ORDER BY date) AS prev_revenue
FROM sales
```

### Phase 3: DuckDB as Local Data Cache

For server-side data sources: load fetched pages into DuckDB as a local cache. Subsequent sorts/filters can query the cache instead of hitting the server:

```
Server → fetch page → INSERT INTO cache_table → DuckDB
User sorts → SELECT * FROM cache_table ORDER BY ... → instant response
Cache miss → fetch from server → append to cache
```

### Phase 4: AI + DuckDB Pipeline

Wire the AI toolkit's SQL generation to DuckDB execution:

```
User types "show me top 10 customers by revenue"
  → AI generates: SELECT customer, SUM(revenue) FROM orders GROUP BY customer ORDER BY 2 DESC LIMIT 10
  → DuckDB executes
  → Grid displays result
```

The AI toolkit already has `dialect: 'duckdb'` support — just needs the executor connection.

### Phase 5: Advanced DuckDB Features

- **Parquet URL streaming**: `read_parquet('https://...')` with predicate pushdown — only fetch needed columns/rows
- **Multi-table JOINs**: Load multiple data sources, JOIN for data blending dashboards
- **Full-text search**: DuckDB FTS extension for search-within-grid
- **JSON/nested data**: Struct/list types for complex column data
- **File import UI**: Drag Parquet/CSV onto grid → auto-load into DuckDB

### Bundle Size Strategy

DuckDB-WASM is ~5MB. Strategy:
1. **Never bundled** — `@phozart/duckdb` uses dynamic `import()` at runtime
2. **Separate package** — not included in the base grid bundle
3. **Lazy initialization** — WASM loads only when `createDuckDBDataSource()` is called
4. **Web Worker isolation** — all DuckDB work happens off main thread

---

## Server-Side Operations

### Enhanced AsyncDataSource Interface

The current `AsyncDataSource` is minimal. The enhanced version adds:

```typescript
interface AsyncDataSource<TData> {
  type: 'async';

  // Required
  fetch(request: ServerDataRequest): Promise<ServerDataResponse<TData>>;

  // Optional enhancements
  export?: ServerExportProvider;        // Server-side export
  subscribe?: RealtimeProvider<TData>;  // Push updates
  mutate?: DataMutationProvider<TData>; // Write-back
  capabilities?: ServerCapabilities;    // Feature negotiation
}
```

### ServerDataRequest (Unified)

```typescript
interface ServerDataRequest {
  // Pagination (offset OR cursor)
  offset?: number;
  limit: number;
  cursor?: string;
  cursorDirection?: 'forward' | 'backward';

  // Sorting
  sort?: SortDescriptor[];

  // Filtering (flat = implicit AND, or recursive group for compound)
  filter?: ServerFilter;

  // Grouping (lazy-expand)
  grouping?: ServerGroupRequest;

  // Pivot
  pivot?: ServerPivotRequest;

  // Cancellation
  requestId?: string;
  signal?: AbortSignal;

  // Pass-through context
  context?: Record<string, unknown>;
}
```

### Key Additions

| Feature | What | Why |
|---------|------|-----|
| **Compound filters** | Recursive `ServerFilterGroup` with `logic: 'and' \| 'or'` | Cannot represent `(A AND B) OR (C AND D)` today |
| **Cursor pagination** | `cursor` + `cursorDirection` alongside offset | Better for real-time datasets |
| **Request cancellation** | `AbortSignal` on every request | Rapid filter typing generates stale requests |
| **Debouncing** | `ServerDataOrchestrator` with configurable `debounceMs` | Declared but never implemented |
| **Retry policy** | Exponential backoff with configurable `maxRetries` | Single fetch failure = broken grid today |
| **Server capabilities** | `ServerCapabilities` object from server | Grid can show/hide UI based on server support |
| **Server-side export** | `ServerExportProvider` with sync/async + progress | `exportCsv()` is client-only, useless for 1M rows |
| **Optimistic mutations** | `DataMutationProvider` with conflict detection | No write-back exists today |
| **Real-time push** | `subscribe()` with delta updates + sequence gap detection | Grid has no generic push-update mechanism |
| **Cache policy** | LRU eviction, TTL, stale-while-revalidate | No cache management today |
| **Adaptive data source** | Auto-switch client/server based on row count threshold | Simplifies config for unknown dataset sizes |

### Server-Side Grouping Protocol

```typescript
interface ServerGroupRequest {
  groupBy: GroupDescriptor[];           // Fields, in nesting order
  expandedGroupKeys: unknown[];         // Path to expanded group
  aggregations?: AggregationDescriptor[]; // Per-group aggregates
}
```

When user expands a group → grid sends `expandedGroupKeys: ['USA']` → server returns children (sub-groups or leaf rows). This is how AG Grid SSRM works.

---

## Metrics, KPIs & Aggregation

### What the Engine Has vs What the Grid Renders

The engine (`phz-engine`) has a complete aggregation/KPI/pivot/expression system. The grid renders basic aggregation in footer rows, and `phz-report-view` bridges engine presentation to grid properties. However, advanced features (user-selectable aggregation, multiple summary rows, selection aggregation, KPI bidirectional binding) are not yet wired.

### Work Item 6: Advanced Aggregation

**Current state**: Basic footer aggregation WORKS — `renderAggregationRow()` renders `<tfoot>` with per-column aggregation (sum/avg/min/max/count). Position configurable (top/bottom/both). Per-column overrides via admin. Wired through `phz-report-view` and `phz-admin-table-settings`.

**What's missing**:

| Capability |
|------------|
| User-selectable aggregation per column (dropdown in header/footer) |
| Multiple summary rows (e.g., SUM row + AVG row stacked) |
| MEDIAN, STDEV, PERCENTILE, WEIGHTED_AVG aggregation functions |
| Custom aggregation functions (user-defined) |
| Filtered vs all-data dual summary ("85 of 120 total") |
| Group subtotals with header/footer placement choice |
| % of parent / % of grand total computed columns |
| Pinned summary rows (independent of auto-aggregation) |

### Work Item 7: Status Bar

| Capability |
|------------|
| Row count display |
| Filtered row count |
| Selected row/cell count |
| Selection aggregation (live SUM/AVG of selected range) |
| Custom status bar panels |

**Implementation**: `<phz-status-bar>` component at grid bottom with left/center/right slots.

### Work Item 8: Grid-to-Engine Bridge

Wire the engine's computed outputs into the grid:
- KPI cards above grid (already have `phz-kpi-card`, need binding)
- Click KPI → filter grid (drill-through exists, need UI trigger)
- Sparklines as a column type (renderer exists, need column config)
- Conditional formatting applied during rendering (engine has rules, grid doesn't apply them)

### Additional Aggregation Features (Engine)

| Feature | Status | Priority |
|---------|--------|----------|
| Multiple pivot value fields | Fix `computePivot()` to iterate all fields | High |
| Running calculations (running sum/avg/rank) | New functions in expression evaluator | Medium |
| Window functions (LAG, LEAD, MAVG) | New builtins or DuckDB push-down | Medium |
| Color scale gradient interpolation | Extend `createColorScaleRule()` | Medium |
| Data bars in cells | New cell renderer | Medium |
| Icon set mapping | Map value ranges to SVG icons | Low |
| Top N / Bottom N highlighting | New conditional formatting rule type | Low |

---

## Grid Rendering Gaps

### Priority Fixes (Broken Features)

| # | Feature | Issue | Effort |
|---|---------|-------|--------|
| 1 | Default sort | Properties declared, never read in `initializeGrid()` | Small — wire into initial state |
| 2 | Column pinning | Types exist, no sticky CSS | Medium — add `position: sticky` rendering |
| 3 | Debounce | Config declared, never implemented | Small — add timer in filter/sort handlers |

### Missing Standard Features

| # | Feature | Competitor Status | Effort |
|---|---------|-------------------|--------|
| 4 | Paste from clipboard | AG Grid, Handsontable, DevExpress | Medium |
| 5 | Undo/Redo | AG Grid, Handsontable, DevExpress | Medium |
| 6 | Print/PDF | AG Grid, DevExpress | Medium |
| 7 | i18n/locale | All competitors | Medium |
| 8 | Status bar | AG Grid | Medium |
| 9 | Master-detail | AG Grid, DevExpress | Large |
| 10 | Tree data | AG Grid, DevExpress | Large |
| 11 | Row reorder (drag) | Handsontable, AG Grid | Medium |
| 12 | Cell merge/spanning | Handsontable, DevExpress | Large |
| 13 | RTL layout | AG Grid, DevExpress | Medium |
| 14 | Excel export (real) | AG Grid, DevExpress | Large |

**Note**: Context menu and column header menu already EXISTS (full implementation with `phz-context-menu.ts`, header filter button, and right-click menus for both header and body). Footer aggregation also EXISTS via `renderAggregationRow()`.

---

## Innovative Differentiators

Features that would differentiate phz-grid beyond table stakes:

| # | Feature | Description | Competitive Edge |
|---|---------|-------------|-----------------|
| 1 | **DuckDB-native SQL push-down** | Sort/filter/group via DuckDB SQL, not JS — handle 1M+ rows in-browser | No other grid does this |
| 2 | **AI NL-to-grid** | "Show me top 10 customers by revenue" → DuckDB SQL → grid result | Schema-as-contract + DuckDB is unique combo |
| 3 | **Live collaboration cursors** | See other users' selections in real-time (Yjs foundation exists) | Only Notion/Google Sheets have this for grids |
| 4 | **DuckDB data blending** | JOIN multiple data sources in the browser via DuckDB | No grid offers client-side JOINs |
| 5 | **Time-travel debugging** | Yjs version history → replay grid state changes | Unique to CRDT architecture |
| 6 | **Schema-first auto-rendering** | JSON Schema → full grid config (columns, types, formatting) | Schema-as-contract differentiator |
| 7 | **Data quality scoring** | AI-powered anomaly detection, completeness scoring per column | No grid has this |
| 8 | **Responsive card view** | Grid auto-switches to card layout on mobile | Rare — most grids just scroll |
| 9 | **Heatmap mode** | One-click toggle to show all numeric columns as color gradients | Excel has it, grids don't |
| 10 | **Formula bar** | Selected cell shows formula/expression — spreadsheet UX for the grid | Unique for non-spreadsheet grids |

---

## Prioritized Work Items

All features are MIT open source.

### Phase A: Fix Broken Features (No Dependencies)

These are features that are declared/typed but don't work. Fix them first.

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 6 | Wire default sort | core, grid | XS |
| 7 | Implement debouncing | core, grid | S |
| 8 | Render column pinning (sticky CSS) | grid | M |
| 9 | Fix DuckDB bugs (Arrow import, IPC format, params, progress) | duckdb | M |

### Phase B: Missing Table-Stakes Features

These are standard features every competitor has. Needed for market credibility.

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 10 | Paste from clipboard | grid | M |
| 11 | Undo/Redo (proper implementation) | core, grid | M |
| 12 | i18n/locale translations | core, grid | M |
| 13 | Status bar (row count, filtered count, selected count) | grid | M |
| 14 | RTL layout support | grid | M |

### Phase C: Server-Side Operations

Make the grid work with real backends.

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 15 | Enhanced AsyncDataSource (compound filters, cursor pagination) | core | L |
| 16 | Request cancellation + debouncing orchestrator | core, grid | M |
| 17 | Retry policy + error handling | core | M |
| 18 | Server capabilities negotiation | core | S |
| 19 | Server-side export | core, grid | M |
| 20 | Server-side grouping (lazy expand) | core, grid | L |
| 21 | Optimistic mutations + write-back | core | L |
| 22 | Real-time push updates | core, grid | L |

### Phase D: DuckDB Bridge

Connect DuckDB to the grid's data pipeline.

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 23 | DuckDB SQL push-down (sort/filter/group/paginate) | duckdb, core | L |
| 24 | DuckDB aggregation bridge (footer + group subtotals) | duckdb, engine | M |
| 25 | DuckDB pivot computation | duckdb, engine | M |
| 26 | AI + DuckDB execution pipeline | ai, duckdb | M |
| 27 | Parquet URL streaming | duckdb | M |
| 28 | Multi-table JOINs / data blending | duckdb | M |

### Phase E: Advanced Grid Features

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 29 | Master-detail / expandable rows | core, grid | L |
| 30 | Tree data (parent-child hierarchy) | core, grid | L |
| 31 | Excel export (real XLSX via exceljs/sheetjs) | grid | L |
| 32 | Print/PDF export | grid | M |
| 33 | Row reorder (drag-drop) | grid | M |
| 34 | Cell merge/spanning | core, grid | L |

### Phase F: Metrics & Visualization

Wire the BI engine to the grid rendering layer.

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 35 | Selection aggregation (live) | core, grid | M |
| 36 | User-selectable aggregation per column | grid | M |
| 37 | Multiple summary rows | grid | M |
| 38 | Color scale gradient interpolation | engine | S |
| 39 | Data bars in cells | grid | M |
| 40 | Icon sets for conditional formatting | engine, grid | M |
| 41 | Multiple pivot value fields (fix) | engine | S |
| 42 | Running calculations + window functions | engine | L |
| 43 | Grid-to-KPI bidirectional binding | widgets, grid, criteria | M |
| 47 | Sparklines as column type | grid | M |

### Phase G: Differentiators

Innovative features that set phz-grid apart.

| WI | Feature | Packages | Effort |
|----|---------|----------|--------|
| 44 | Schema-first auto-rendering | ai, core | M |
| 45 | Responsive card view (mobile) | grid | L |
| 46 | Heatmap mode toggle | grid, engine | M |
| 47 | Formula bar | grid | L |
| 48 | Live collaboration cursors | collab, grid | L |
| 49 | Data quality scoring | ai | L |
| 50 | Time-travel debugging | collab | L |

---

## Execution Phases

### Recommended Order

```
Phase A: Fix Broken Features (WI 6-9)
  Quick wins — things that should already work but don't.
  No new packages. Immediate credibility boost.

Phase B: Missing Table-Stakes (WI 10-14)
  Paste, undo/redo, i18n, status bar, RTL.
  Makes the grid competitive with existing products.

     ┌─── (can run in parallel with B) ───┐
Phase C: Server-Side (WI 15-22)           Phase D: DuckDB Bridge (WI 23-28)
  Makes the grid work with              Unique differentiator.
  real backends.                         DuckDB-native grid.
     └───────────────┬──────────────────┘

Phase E: Advanced Grid (WI 29-34)
  Advanced features that close competitive gaps.

Phase F: Metrics & Visualization (WI 35-43)
  Wire the BI engine to the grid. Full analytics experience.

Phase G: Differentiators (WI 44-50)
  Features no other grid has.
```

### Scope Summary

| Phase | Work Items | New Files (est.) | Modified Files (est.) | New Tests (est.) |
|-------|------------|------------------|-----------------------|------------------|
| A | 4 | 1 | 8 | ~15 |
| B | 5 | 7 | 12 | ~40 |
| C | 8 | 12 | 10 | ~60 |
| D | 6 | 8 | 8 | ~40 |
| E | 6 | 12 | 10 | ~45 |
| F | 9 | 11 | 14 | ~55 |
| G | 7 | 14 | 10 | ~40 |
| **Total** | **45** | **~66** | **~72** | **~295** |

Combined with GRID-IMPROVEMENTS-PLAN.md (WI 1-5): **50 work items, ~109 new files, ~97 modified files, ~444 new tests**.

---

## Parallel Session Strategy

### TDD Methodology

All work items MUST follow strict TDD via the `/tdd` skill:

1. **Red**: Write failing test(s) first — define the expected behavior
2. **Green**: Write minimum code to make the test pass
3. **Refactor**: Clean up while keeping tests green

Each session starts with `/tdd` to activate the workflow. Tests are written BEFORE implementation code. No feature code without a corresponding test.

### Recommended Session Allocation

```
┌─────────────────────────────────────────────────────────────┐
│                    PARALLEL SESSIONS                         │
├──────────────────┬──────────────────┬───────────────────────┤
│ Session 1        │ Session 2        │ Session 3             │
│ Phase A → B      │ Phase C          │ Phase D               │
│ Fix Broken +     │ Server-Side      │ DuckDB Bridge         │
│ Table Stakes     │ Operations       │                       │
│                  │                  │                       │
│ core + grid      │ core/types/ +    │ packages/duckdb/      │
│ fixes + features │ new server types │ + core bridge         │
├──────────────────┴──────────────────┴───────────────────────┤
│ Session 4 (optional parallel)                                │
│ WI 1-5: Creation & Configuration (GRID-IMPROVEMENTS-PLAN)   │
│ packages/definitions/ + packages/grid-creator/ (new)         │
└─────────────────────────────────────────────────────────────┘

After Sessions 1-4 merge:
┌──────────────────┬──────────────────┬───────────────────────┐
│ Session 5        │ Session 6        │ Session 7             │
│ Phase E          │ Phase F          │ Phase G               │
│ Advanced Grid    │ Metrics & Viz    │ Differentiators       │
└──────────────────┴──────────────────┴───────────────────────┘
```

### Session Details

#### Session 1: Phase A + B (core + grid)
**Branch**: `feat/grid-fixes-and-table-stakes`
**Packages**: `core`, `grid`
**WI**: 6-14 (default sort, debounce, column pin, paste, undo/redo, i18n, status bar, RTL)
**Conflict risk**: Low (modifies different areas of phz-grid.ts)

#### Session 2: Phase C (server-side)
**Branch**: `feat/server-side-operations`
**Packages**: `core` (new types in `types/server.ts`), `grid` (orchestrator)
**WI**: 15-22 (compound filters, cursor pagination, cancellation, retry, export, grouping, mutations, real-time)
**Conflict risk**: Low (mostly new files, touches `types/datasource.ts`)

#### Session 3: Phase D (DuckDB)
**Branch**: `feat/duckdb-bridge`
**Packages**: `duckdb`, `core` (minor type additions), `engine` (bridge)
**WI**: 23-28 (SQL push-down, aggregation, pivot, AI pipeline, Parquet, JOINs)
**Conflict risk**: Very low (isolated package)

#### Session 4: WI 1-5 (creation)
**Branch**: `feat/grid-creation-config`
**Packages**: `core` (auto-inference), `definitions` (new), `grid` (views), `grid-admin`, `grid-creator` (new)
**WI**: 1-5 from GRID-IMPROVEMENTS-PLAN.md
**Conflict risk**: Low (new packages, core changes in different areas)

### Merge Order

1. Merge Session 1 first (fixes broken features — others may depend on working defaults)
2. Sessions 2, 3, 4 can merge in any order after Session 1
3. Resolve any `core/src/index.ts` export conflicts (additive only — clean merge)
4. Run full test suite after each merge: `npx vitest run`

### Per-Session Checklist

Each session must:
- [ ] Start with `/tdd` skill activation
- [ ] Create feature branch from `main`
- [ ] Write tests RED first, then GREEN, then REFACTOR
- [ ] Run `npx vitest run` to verify no regressions
- [ ] Run `npx tsc --noEmit` to verify types compile
- [ ] Update the relevant plan doc (mark WIs as DONE)
- [ ] PR with test coverage summary

---

## Cross-References

- **WI 1-5** (Creation & Configuration): `docs/plans/GRID-IMPROVEMENTS-PLAN.md`
- **System Architecture**: `docs/architecture/SYSTEM-ARCHITECTURE.md`
- **DuckDB ADR**: `docs/architecture/ADR/ADR-004-duckdb-wasm-apache-arrow.md`
- **API Contracts**: `docs/contracts/API-CONTRACTS.md`
- **Type Contracts**: `docs/contracts/TYPE-CONTRACTS.md`
