# Phozart-Grid: Deep Structural Analysis

**Date:** 2026-03-05
**Method:** 8 parallel subagents with 16+ distinct viewpoints
**Scope:** All 17 packages, full API surface, actual codebase inspection

---

## Table of Contents

1. [Part 1: Physical World Confrontation](#part-1-physical-world-confrontation)
2. [Part 2: What We're Doing Wrong](#part-2-what-were-doing-wrong)
3. [Part 3: Failure-Mode Reasoning](#part-3-failure-mode-reasoning)
4. [Part 4: Category Error](#part-4-category-error)
5. [Part 5: Hostile Review](#part-5-hostile-review)
6. [Part 6: Self-Audit](#part-6-self-audit)
7. [Specialist Reviews](#specialist-reviews)
8. [Synthesis: Ranked Findings](#synthesis-ranked-findings)

---

## Part 1: Physical World Confrontation

*Viewpoints: Industrial Engineer, Civil Engineer, Innovator/Inventor*

### 1. Air Traffic Control Strip Boards: Positional State as Primary Data Model

**What the strip board solves that phz-grid gets wrong:** An ATC strip board encodes state through physical position. Moving a strip from bay 3 to bay 5 IS the handoff -- position is the data. phz-grid has the opposite architecture: data and position are fully decoupled. `ColumnState` (state.ts:147-151) stores `order: string[]` as an abstract array. When User A reorders columns and User B applies a filter simultaneously in the collab layer, both changes hit `ygrid.state.set('columns', colState)` as undifferentiated map entries. Yjs cannot merge these because the system models position as an array index that gets overwritten, not as a semantic concept.

**Concrete change:** Replace `ColumnState.order: string[]` with a doubly-linked ordering structure. This enables Yjs `Y.Array` insert/delete operations instead of last-writer-wins on the entire columns key. Eliminates the class of bug where concurrent column reorders silently drop one user's changes. `GroupingState.groupBy` similarly becomes a linked list of group-lane assignments.

### 2. Operating Room Sterile Field: Irreversible Boundary Transitions

**What it solves:** Once an instrument crosses the sterile boundary outward, it cannot re-enter. phz-grid has no concept of irreversible state transitions. `exportCsv()` is a side-effect-free read operation, but in reality exporting data creates an external dependency on a particular data state. A user can export CSV, modify data, then import a saved view that restores pre-modification state -- the exported data now reflects a state the grid claims never existed.

**Concrete change:** Add `AuditBoundary` concept to `GridState`. When `exportCsv()` is called, increment an epoch and snapshot state. The `beforeEdit` hook system can then enforce acknowledgment when editing rows that were included in a boundary-crossing export. This changes `exportCsv` from a pure read to a state-advancing operation, which is what it actually is in compliance contexts.

### 3. Reference Desk Triage: Heterogeneous Attention Queues

**What it solves:** A librarian manages six patrons at different states of completion simultaneously. phz-grid has a single-track execution model. `StateManager.setState()` takes any partial update and synchronously notifies all listeners. A `viewport:scroll` event triggers the same `syncFromState()` as a `data:change` event. `invalidatePipeline()` (create-grid.ts:82-86) clears ALL three caches regardless of what changed -- a column width change blows the sort cache.

**Concrete change:** Replace the single `subscribe(listener)` pattern with tiered attention:
- **Immediate** (scroll, focus): sync this frame
- **Deferred** (filter, sort): batch within 16ms microtask
- **Background** (theme, column width): requestIdleCallback

Make pipeline cache invalidation granular: changing `state.sort` invalidates `sortedModelCache` only. Changing `state.columns.widths` invalidates nothing in the row pipeline. This replaces the `invalidatePipeline()` sledgehammer and makes `PerformanceConfig.debounceMs` unnecessary -- batching becomes structural, not temporal.

### 4. Trading Pit: Visible Intent Before Committed Action

**What it solves:** A trader raising their hand is not yet a bid, but everyone can see it. phz-grid's event system has exactly two states: not happened and happened. There is no "I am about to sort by this column" state.

**Concrete change:** Add `IntentState` to `GridState` with `PendingIntent` objects. Header cell `@mouseover` emits `sort:intent` after 300ms dwell. Collab broadcasts intent as ghost indicators. Critically: a DuckDB plugin subscribing to `sort:intent` could begin pre-computing the sorted result during hover dwell, making the DuckDB path feel instantaneous. This directly addresses the DuckDB disconnection -- `DuckDBBridge.attach()` currently only subscribes to committed events; intent events let it pre-fetch.

### 5. Chef's Mise en Place: Pre-staging Before Pipeline Execution

**What it solves:** A chef chops onions before service, not when the order arrives. `createGrid()` performs zero pre-staging. Column inference, initial state, `parseData()` (iterating all rows for UUID generation), `buildCoreRowModel`, `filterRows`, `sortRows` -- four full passes over the dataset happen before the first pixel renders.

**Concrete change:** Split `createGrid()` into two phases:
```typescript
// Phase 1: Mise en place (worker-safe, cacheable, no side effects)
const prep = prepareGrid(config);
// Returns: { columns, parsedData, rowMap, initialState, validatedPlugins }

// Phase 2: Service (main thread, wires live state, instant)
const api = activateGrid(prep);
```
For teardown, transition to `'draining'` state (emitter.emit no-ops) before destroying plugins. This replaces the monolithic `createGrid()` and `initializeGrid()`.

---

## Part 2: What We're Doing Wrong

*Viewpoints: Policy Maker, C-Level Executive, End User*

### Mistake 1: Two Independent Configuration Surfaces That Cannot See Each Other

**Real task:** Configure how a grid looks and behaves, have settings persist and be sharable.

**Indirect path:** Configuration lives in two places: 60+ `@property` declarations on PhzGrid and the headless `GridState` inside `createGrid()`. These overlap but are not unified. `defaultSortField`/`defaultSortDirection` exist as Lit props (lines 271-276) but are never passed to `createGrid()` in `initializeGrid()` (line 1604-1612). `enableSorting`, `enableEditing`, `enableFiltering`, the entire `FeatureFlags` interface -- declared and typed but never read by `createGrid()`.

**Direct path:** A single `GridPresentation` object that both the Web Component and headless core read from. PhzGrid's 60+ properties collapse to `<phz-grid .config=${presentation}>`. **Eliminates:** the entire `willUpdate`/`updated` property-syncing block, the `FeatureFlags` interface (dead code), and the split between "props the Web Component handles" vs. "config the core handles."

### Mistake 2: Four Filter Systems That Cannot Filter Each Other

**Real task:** Reduce the rows shown based on conditions.

**Indirect path:** Four independent implementations:
1. Core `FilterState` (state.ts:24-62) -- `{field, operator, value}` triples in row model pipeline
2. `PhzFilterPopover` -- Excel-style checklist with its own internal state, never persisted
3. Engine `CriteriaEngine` -- 6-layer state resolution with `FilterRegistry`, `FilterBindingStore`, `FilterStateManager`, `FilterRuleEngine`, `CriteriaOutputManager`, `FilterAdminService`
4. Criteria UI package -- 17 components that talk to the engine, not to the grid

`FilterCriterion` uses `'not_equals'` while core uses `'notEquals'`. A user filtering in the grid popover (system 2) and in the criteria bar (system 4) applies two independent filter passes with neither aware of the other.

**Direct path:** One filter interface with one operator set. `CriteriaEngine` becomes a filter configuration layer over the core filter pipeline, not a parallel execution engine. **Eliminates:** `filter-adapter.ts`, the operator translation layer, `applyArtefactCriteria()` as a separate function, `resolve-criteria.ts` hydration path.

### Mistake 3: Views Are Compensation for Non-Persistent Configuration

**Real task:** Open the grid and see it the way they left it.

**Indirect path:** `ViewsManager` stores named `GridState` snapshots in memory. Reloading the page loses everything. `isViewDirty()` uses `JSON.stringify` deep equality -- any incidental state change (scroll, focus) marks the view dirty. Admin panel produces `ReportPresentation`/`TableSettings` objects that are a different shape from `GridState` -- views and reports can't round-trip through each other.

**Direct path:** The grid's configuration IS its persistence format. Views become named `GridPresentation` instances, not runtime state snapshots. **Eliminates:** `ViewsManager` as separate peer to `StateManager`, `isViewDirty()` JSON.stringify, the gap between admin output and grid input.

### Mistake 4: DuckDB Cannot Actually Drive the Grid

**Real task:** Load large data and have the grid use DuckDB for sort/filter/aggregate.

**Indirect path:** `attachToGrid()` (duckdb-data-source.ts:301-303) stores the GridApi reference and does nothing with it. `DuckDBBridge.refresh()` calls `this.grid.updateState()` which does not exist on GridApi -- runtime crash. `HybridEngine` has no reference to either grid or data source. All data flows through the JS row model pipeline even when DuckDB could handle it.

**Direct path:** DuckDB implements the `AsyncDataSource` interface with `serverFetch()`. The grid's existing `RemoteDataManager` handles prefetching and pagination. **Eliminates:** `attachToGrid()`/`detachFromGrid()` (dead code), `DuckDBBridge` (replaced by AsyncDataSource contract), `HybridEngine` as standalone class.

### Mistake 5: Admin Panel Output Has No Consumer

**Real task:** Admin configures grid appearance; settings apply for all users.

**Indirect path:** `PhzGridAdmin` emits `settings-change`/`columns-change`/`formatting-change` events with configuration objects. The grid reads 60+ individual `@property` values. No method applies a `ReportPresentation` object to `<phz-grid>`. The only bridge is `PhzReportView` which manually maps fields one-by-one (lines 289-368). Three of the admin's eight tabs are deprecated but still rendered.

**Direct path:** `<phz-grid>` accepts a single `.presentation` property. Admin writes to it; grid reads from it. **Eliminates:** manual property mapping in PhzReportView, the 60+ individual properties, the three deprecated admin tabs.

### Unifying Pattern

All five mistakes share a root cause: no shared configuration contract that all layers (headless core, rendering, admin/engine) read from and write to. Every integration point requires bespoke translation. The 60+ prop surface is the symptom.

---

## Part 3: Failure-Mode Reasoning

*Viewpoints: Blue Collar Worker, White Collar Analyst, Developer*

### Scenario 1: "Filter 2.2M transactions to last month's chargebacks, export to fraud team"

**Failure chain:**
1. Filter apply -> `syncFromState()` -> `getFilteredRowModel()` -> `filterRows()` iterates all 2.2M rows with `columns.find()` per filter per row = 2.5M+ `Array.find()` calls, synchronously, main thread
2. Sort runs on top (`[...model.rows].sort()` copies array), then `sortedRowIds: sorted.map(r => r.__id)` allocates new array
3. Export calls `getSortedRowModel().rows` which may re-run entire pipeline if cache invalidated
4. Excel export builds entire XLSX as XML strings in memory + CRC-32 computation -- for 2M rows the XML string is 2-4 GB, hitting V8 string size limit

**Why SQL client feels safer:** `psql` query returns in under a second with optimized query plan. No ambiguity about frozen vs. processing. `\copy` streams results incrementally. The "worse" tool is honest about its capabilities.

**Required architectural change:** Pipeline must become a declarative query submitted to an execution engine that decides: main thread (< threshold), Web Worker, or DuckDB SQL. `syncFromState()` must become async. Export must use `WritableStream` or chunked Blob.

### Scenario 2: "Group 2M orders by region + category to find underperforming segments"

**Failure chain:**
1. `groupRows()` iterates all 2M rows to build `Map<unknown, RowData[]>` -- 4M row touches for two-level grouping
2. `flattenRows()` uses `result.push(...group.rows)` -- spread on 250K-element array hits call stack limit
3. Expanding a group with 500K rows, paginated at `pageSize: 10` shows "Page 1 of 50,000"
4. DuckDB has `buildGroupAggregationQuery()` that could run this as SQL in milliseconds but is disconnected

**Why Excel pivot feels safer:** Excel's pivot engine reads data once, builds aggregation accumulators, renders only summary. Never materializes intermediate results. The abstraction promised more but delivers less.

**Required architectural change:** Grouping must become query-plan operation. Compute group metadata (keys, counts, aggregates) without materializing child rows. Lazy-load children on expand with pagination at query level. `RowGroup.rows: RowData[]` must become `rows?: RowData[] | LazyRowProvider`.

### Scenario 3: "Load 2.3M-row parquet file, find sensor anomalies"

**Failure chain:**
1. DuckDB loads parquet efficiently into columnar store
2. But `DuckDBBridge.refresh()` builds `SELECT *` without LIMIT/OFFSET, materializing all 2.3M rows into JS objects
3. `query()` calls `result.toArray()` -- 2.3M object allocations
4. `grid.setData()` calls `parseData()` -- 2.3M more objects with `{...row, __id}` copies
5. `rebuildRowMap()` iterates again, `filterRows()` iterates again -- 5+ passes, ~7M+ objects
6. `fromArrowTable()` does batch-1000 INSERT with string interpolation, casting everything to VARCHAR

**Why CLI DuckDB feels safer:** `duckdb readings.parquet -c "SELECT * WHERE timestamp >= '...' ORDER BY vibration DESC LIMIT 100"` returns in 200ms with columnar predicate pushdown. The grid converts a sub-second problem into a 30-second problem by materializing everything into JS heap.

**Required architectural change:** Grid must support "query-only" mode where it never holds the full dataset. `DuckDBDataSource` implements `AsyncDataSource`. Data flows from DuckDB to viewport, never through a 2M-element JavaScript array.

---

## Part 4: Category Error

*Viewpoints: Anthropologist, Cognitive Scientist, Philosopher of Technology*

### 4a. What Need Does a "Data Grid" Actually Serve?

Not "viewing data." The need is **sensemaking under uncertainty with intent to act**.

The full package set (grid + engine + criteria + widgets + admin + collab + ai + duckdb) serves an iterative cycle:
1. **Scope** -- narrow entities to relevant subset (criteria engine, filter bindings)
2. **Assess** -- evaluate health/status/value (KPIs, conditional formatting, anomaly detection)
3. **Organize** -- impose structure for pattern visibility (sort, group, pivot, chart)
4. **Act** -- change something or communicate (edit, export, drill-through)
5. **Persist** -- save scoping/assessing/organizing for reuse (views, reports, presets)

### 4b. Is "Grid" the Right Primitive?

No. The grid is one rendering strategy for a more fundamental object already scattered across the codebase: a **configured lens over a data product**.

**Evidence:** `ReportConfig` (engine/report.ts:29-54) already IS the real primitive -- it specifies data source, columns, transformations, visual treatment, filters, navigation. `SavedView` is a degraded `ReportConfig`. `DashboardConfig` is a spatial composition of the same concept.

**The real primitive -- `DataView`:**

```typescript
interface DataView {
  id: ViewId;
  name: string;
  source: DataSourceRef;        // which data product/table/query
  scope: ScopeConfig;           // criteria bindings + current values
  shape: ShapeConfig;           // columns, sort, group, pivot, aggregation
  assessment: AssessmentConfig; // KPIs, thresholds, formatting, anomaly rules
  presentation: PresentationConfig; // target (table|chart|kpi) + visual settings
  navigation: NavigationConfig; // drill-through, linked views, cross-filter
  permissions: PermissionsConfig;
  history: ChangeHistory;
}
```

A Dashboard becomes a container of DataViews with spatial layout and cross-filter rules.

### 4c. What This Eliminates

- **SavedView + ViewsManager** -- absorbed into DataView. "Saving a view" = persisting a DataView.
- **ReportConfig** -- DataView replaces it. No `toGridConfig()` adapter needed.
- **WidgetConfig / WidgetPlacement** -- a widget IS a DataView with `presentation.target` set to a non-table value.
- **PhzReportView** (400-line bridge component) -- eliminated because renderer receives one object and dispatches to correct component.
- **The 97 @property declarations on PhzGrid** -- they decompose into DataView sub-objects: ~15 source, ~20 scope, ~25 shape, ~30 presentation, ~7 navigation.
- **GridConfig vs GridState duality** -- with DataView, configuration IS state.

### Where Current Category Causes Friction

1. **Grid vs Engine separation** forces `PhzReportView` to copy 80+ props one-by-one
2. **Criteria (17 components) severed from the data they filter** -- the grid's `api.filter()` and criteria system are independent paths the host app must reconcile
3. **Views save GridState but not criteria selections, formatting rules, or presentation** -- "save view" doesn't save the actual view
4. **DuckDB architecturally disconnected** -- data source is an attribute of the DataView, not a peer of the grid

---

## Part 5: Hostile Review

*Viewpoint: Hostile competent reviewer, 1 week on real financial data (500K rows, 40 columns)*

### Criticism 1: The pipeline runs synchronously on the main thread with no batching, no debounce, and no escape hatch

`deleteRows` (create-grid.ts:262-265) loops single-row deletes, each firing `invalidatePipeline()`, `updateStatus()` (which calls `getFilteredRowModel()`), and `emitter.emit()`. Delete 500 rows = 500 pipeline invalidations. `PerformanceConfig` declares `debounceMs`, `batchSize`, `enableWorkers` -- none are read anywhere. They are phantom config.

**Impact:** 500K rows + 5 filters = 2.5M `Array.find()` calls synchronously. Typing in search freezes browser 2-3 seconds.

**Competition:** AG Grid runs models in Web Workers with mutation batching. TanStack Table memoizes per pipeline stage independently.

### Criticism 2: `initializeGrid()` silently discards half your configuration

The config passed to `createGrid()` (phz-grid.ts:1604-1612) is 7 fields. The component declares 60+ properties. `defaultSortField`, `defaultSortDirection`, `userRole`, `performance`, `accessibility`, `features` -- never forwarded. The core supports them. The Web Component drops them.

**Impact:** Three hours debugging why default sort doesn't work. Trust violation.

**Competition:** AG Grid's `GridOptions` is the single source of truth. TanStack's `useReactTable` passes the entire options object directly.

### Criticism 3: DuckDB integration is a marketing checkbox

`attachToGrid()` stores a reference and does literally nothing with it. `this.grid` is never read. The grid runs `Array.filter()` on the main thread while DuckDB sits idle with columnar indexes, predicate pushdown, and vectorized execution.

**Impact:** The entire pitch is "data grid with DuckDB analytics." The grid ignores all DuckDB capabilities.

**Competition:** Perspective (FINOS) runs its WASM engine as the sole pipeline. AG Grid's server-side row model delegates all operations to the data source.

### Criticism 4: 100+ properties with no composition model -- a god-component

4,317-line monolith simultaneously responsible for: title bar, toolbar, header, body, pagination, aggregation, groups, editing, context menus, filter popovers, chart popovers, column chooser, toasts, virtual scroll, range selection, clipboard, drag-resize, anomaly detection, conditional formatting, drill-through, export, keyboard nav, ARIA. 30+ `@state()` fields track UI micro-state. Changing data re-evaluates everything because Lit cannot know `ctxMenuX` is unrelated to `visibleRows`.

**Impact:** Cannot customize one piece without understanding 4,317 lines. No composition, no replacement of parts.

**Competition:** TanStack is entirely headless -- compose your own UI. AG Grid uses feature modules. Glide separates canvas renderer from data model.

### Criticism 5: No transactional edit model -- undo/redo is a typed empty shell

`commitEdit` (create-grid.ts:641-688) writes directly to the row: `row[position.field] = value`. No shadow copy, no changeset. `getDirtyRows()` returns at most one row (the currently editing one). `HistoryState` defines `canUndo: boolean`, `undoStack: number` -- permanently frozen at false/0. No `undo()` or `redo()` method exists on GridApi. The type exists purely as fiction.

**Impact:** In financial app, users need changeset review before submitting to backend. Had to build own change tracking layer wrapping `edit:commit` events.

**Competition:** Handsontable has full undo/redo with history. AG Grid tracks dirty cells. Excel has unlimited undo by default.

---

## Part 6: Self-Audit

*Viewpoint: Meta-analyst*

### 6a. Contradiction Resolution

| Contradiction | Winner | Resolution |
|---|---|---|
| "Simplify props" vs "Add interaction modes" | Simplification via decomposition | Extract sub-components (PhzTitleBar, PhzSelectionBar, PhzPaginationFooter). Grid exposes slots+events. Physical-world patterns attach as plugins. Props drop to <20 while interaction surface increases. |
| "Grid primitive is wrong" vs "Fix broken features" | Fix broken features first | The core is already headless. The Category Error analyst is really arguing for more renderers, not a different core. Fix the broken features, then add card/kanban/pivot renderers consuming the same GridApi. |
| "Everything integrated" vs "Modular separation" | Modular with redrawn boundaries | Current fragmentation is accidental (4 filter systems). True modularity: single filter algebra in core, single filter UI in criteria, adapter layers in engine/admin. Preserves dependency direction. |
| "More control" vs "Less configuration" | Both, at different layers | Ship smart defaults + theme presets (3-5 named themes set all 18 visual props). Expose CSS custom properties for granular override. Remove the duplicate prop-based path. Cuts 15+ props without removing capability. |

### 6b. Three Weakest Suggestions

**1. "Redesign around spatial metaphors from physical systems"** -- Compelling in theory, but violates muscle memory of every spreadsheet user. Target personas (analysts, data engineers, ops teams) have deep Excel muscle memory. A "strip board grid" requires learning a new interaction model. Would need user research proving spatial organization is the primary pain point.

**2. "Merge DuckDB into core pipeline"** -- DuckDB WASM is ~10MB. Merging into core violates <50KB target by 160x. Correct fix is adapter pattern, not integration.

**3. "Replace event architecture with reactive state graph"** -- Would require rewriting entire core + all 17 packages that depend on it. Lit already has reactivity. The issue is impedance mismatch between Lit's property-level reactivity and core's monolithic GridState, not absence of reactivity.

### 6c. Strongest Suggestion (Most Likely to Survive Real Users)

**Decompose PhzGrid into composable sub-components + fix initializeGrid() contract violations.**

Users wouldn't notice the decomposition (rendered output identical). They immediately benefit from: default sort working, fewer mysterious prop interactions, ability to replace/omit sections. This is the only suggestion that simultaneously reduces technical debt and improves UX without requiring any user behavior change.

**Implementation path:**
- phz-grid.ts: extract title bar, selection bar, pagination footer, aggregation row into Lit sub-components
- phz-grid.ts line 1604-1612: add `defaultSortField`/`defaultSortDirection` to GridConfig passed to createGrid()
- duckdb-bridge.ts line 83: change `this.grid.updateState()` to actual GridApi methods
- Remove 18 visual color/size props that should be CSS-only

### 6d. Missing Viewpoints (Covered by Specialist Agents)

See Specialist Reviews section below.

---

## Specialist Reviews

### Accessibility Specialist

**AriaManager reality check:** 90 lines. Sets `role="grid"`, `aria-rowcount`, `aria-colcount` on host, creates `aria-live` region. Does NOT manage: cell aria-labels, describedby, column header associations, group expanded/collapsed state, selection propagation. `AccessibilityConfig.ariaLabels` (10 fields) is defined in types but NEVER CONSUMED.

**KeyboardNavigator broken tabindex:** `applyFocus()` (line 283-293) sets new cell `tabindex="0"` but never resets previous cell back to `-1`. Roving tabindex pattern is broken -- multiple cells accumulate `tabindex="0"`.

**Filter popover inaccessible by keyboard:**
- No focus management on open (focus stays on header cell)
- Popover is `<div>` with no `role="dialog"` or `aria-modal`
- No focus trap (Tab goes through popover into page)
- Checkbox items are `<div>` with `role="option"` and `@click` only -- no tabindex, no keyboard handler
- "Conditional Filter" toggle has no role, tabindex, or keyboard handler
- Criteria package is significantly MORE accessible than grid's own filter popover

**Virtual scroll + screen reader:** No announcement when switching from paginated to virtual mode. Skeleton rows have `role="row"` with no content -- screen readers announce empty rows.

**WCAG 2.1 AA violations identified:** 1.3.1 (filter popover structure), 2.1.1 (filter values not keyboard navigable), 2.1.2 (no focus trap), 2.4.3 (no focus move on popover open), 2.4.7 (broken roving tabindex), 4.1.2 (checkboxes lack role, context menu uses CSS focus instead of DOM focus), 1.4.13 (popovers can't be dismissed by hover)

### Data Governance Officer

**Column masking bypassed via DevTools:** Raw `data` array is unprotected property on element. `getData()` returns full unmasked dataset. Mask is rendering-layer only.

**Export has no audit trail:** No event emitted when data exported. 40+ event types but zero for export-started/completed/downloaded.

**Collab syncs raw data:** `syncGridToYjs()` iterates `grid.getData()` and writes every field value to Yjs document -- masked fields synced unmasked to all peers.

**State serialization leaks PII:** `SerializedGridState` includes `filter: FilterState` with literal filter values. If user filters by SSN or email, those values serialize into views, localStorage, collab sync.

**Client-side access control is UX convenience, not security boundary.** `getData()` bypasses all restrictions. No server-side enforcement contract exists.

### DevOps/Platform Engineer

**SharedArrayBuffer breaks everything:** DuckDB WASM requires COOP/COEP headers which break OAuth popups, third-party iframes, analytics scripts. No fallback exists -- DuckDB init will fail with opaque WASM error.

**SQL injection via string interpolation:** `sql-builder.ts` produces parameterized queries with `?` placeholders. `duckdb-data-source.ts` ignores the params and does string replacement via `bindParams()`. Protection negated.

**Memory at 2M rows:** JS heap: 2M rows x 10 fields x 80 bytes = ~1.6 GB (V8 limit ~1.7 GB). Pipeline creates 4-5 copies of row references. Crash point: ~200K-300K rows on 4GB RAM.

**Zero monitoring hooks:** No `performance.mark()`, no memory reporting, no render timing, no error reporting API. Grid is a production black box after `grid-ready` event.

**No versioning strategy:** All 16 packages at 0.1.0. No changesets, no lockstep versioning, no peerDependencies between packages. Version mismatch will cause runtime type errors.

### Technical Writer

**Most confusing API:** `filter()` silently replaces all filters (vs `addFilter()` which upserts). Identical signatures, radically different behavior.

**Configuration trap:** `defaultSortField` prop exists, has JSDoc, appears in attribute list, core supports it -- but never propagates from Web Component to core.

**Integration gap:** DuckDBBridge subscribes to `grouping:change` (doesn't exist in GridEventMap), calls `this.grid.updateState()` (doesn't exist on GridApi). This is a runtime crash, not a documentation gap.

### QA Engineer

**Combinatorial explosion:** ~200-300 meaningfully different prop configurations. `remoteDataSource` + grouping + editing + range selection is untestable (virtual scroller + group rows + range selection indexes are incompatible).

**State consistency risks:** Sort+Filter+Pagination desync (page 3 after filter reduces to 1 page). Edit state orphaning (editing cell in row deleted by `setData()`). Cell range selection uses positional indexes that break after sort.

### Compliance Officer

**Audit trail gaps:** No events for: export, clipboard copy (content not logged), filter preset deletion, view import, state import/export, column visibility changes (no userId attribution).

**Data leakage vectors:** Export (masks optional, not enforced), clipboard (masks optional), filter presets (PII in values), state serialization (PII in filter values), collab (raw data to all peers).

**Missing for SOC2/HIPAA/GDPR:** No data retention controls, no right-to-erasure propagation, no consent tracking, no field-level encryption, no audit log persistence, no session timeout.

### Resource-Constrained Environment

**Bundle cost:**
| Tier | Estimated Gzipped |
|------|-------------------|
| Basic grid (core + grid + Lit) | ~70-85 KB |
| Grid + Engine | ~100-130 KB |
| Grid + DuckDB (WASM binary) | ~4-5 MB |
| Full stack | ~6-8 MB |

DuckDB WASM on 3G (400 Kbps): 80-100 seconds download.

**Memory ceiling on 4GB RAM:** ~200K-300K rows before tab crash. Pipeline creates 4-5 copies of row references.

**Main thread blocking:** `setData()` 100K rows: 200-500ms. `sortRows()` 100K: 100-300ms. `fromArrowTable()` 100K: 2-5 seconds. Excel export 50K rows: 3-10 seconds.

---

## Synthesis: Ranked Findings

### Critical (Blocks Release)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| C1 | Filter popover not keyboard accessible (WCAG 2.1 AA fail) | A11y Specialist | phz-filter-popover.ts |
| C2 | Roving tabindex broken (multiple cells at tabindex=0) | A11y Specialist | keyboard-navigator.ts:283-293 |
| C3 | `initializeGrid()` drops `defaultSortField`, `defaultSortDirection`, `userRole` | Hostile Review, Tech Writer | phz-grid.ts:1604-1612 |
| C4 | DuckDBBridge calls non-existent `this.grid.updateState()` | Failure Mode, Tech Writer | duckdb-bridge.ts:83 |
| C5 | DuckDBBridge subscribes to non-existent `grouping:change` event | Tech Writer | duckdb-bridge.ts:28 |
| C6 | SQL injection via string interpolation in bindParams() | DevOps | duckdb-data-source.ts:346-353 |
| C7 | `getData()` bypasses column masking -- client-side security only | Governance | create-grid.ts:52-63 |
| C8 | No export audit event (40+ event types, zero for data export) | Governance, Compliance | events.ts, csv-exporter.ts |

### High Priority (Blocks Enterprise Deployment)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| H1 | Pipeline runs synchronously, no batching/debounce/workers (phantom PerformanceConfig) | Hostile Review | create-grid.ts:82-86, config.ts:69-74 |
| H2 | `invalidatePipeline()` clears ALL caches regardless of what changed | Physical World (triage) | create-grid.ts:82-86 |
| H3 | `deleteRows()`/`updateRows()` loop single-row ops (N pipeline invalidations) | Hostile Review | create-grid.ts:239-265 |
| H4 | DuckDB `attachToGrid()` is complete no-op | Hostile Review, Failure Mode | duckdb-data-source.ts:301-307 |
| H5 | Four independent filter systems with incompatible operators | Normalized Mistakes | core/state.ts, engine/criteria/, grid/filter-popover, criteria/ |
| H6 | Column pinning (`frozen`) typed but zero rendering logic | Hostile Review | column.ts:19, phz-grid.ts |
| H7 | Undo/Redo `HistoryState` permanently frozen at canUndo:false | Hostile Review | state.ts:182-187 |
| H8 | State serialization leaks PII in filter values | Governance | state.ts:291-304 |
| H9 | Collab `syncGridToYjs()` sends unmasked data to all peers | Governance | collab-session.ts:307-324 |
| H10 | SharedArrayBuffer required for DuckDB with no fallback | DevOps | duckdb-data-source.ts |
| H11 | Zero performance monitoring hooks | DevOps | entire codebase |
| H12 | No versioning strategy for 16-package monorepo | DevOps | package.json files |

### Medium Priority (Production Quality)

| # | Finding | Source | Location |
|---|---------|--------|----------|
| M1 | 4,317-line god-component needs decomposition | Hostile Review, Self-Audit | phz-grid.ts |
| M2 | `filter()` vs `addFilter()` naming causes silent data loss | Tech Writer | create-grid.ts:369-390 |
| M3 | Admin panel ships 3 deprecated tabs | Normalized Mistakes | grid-admin/index.ts:13-20 |
| M4 | `AccessibilityConfig.ariaLabels` declared but never consumed | A11y Specialist | config.ts:48-67, aria-manager.ts |
| M5 | Virtual scroll gives no screen reader announcement | A11y Specialist | phz-grid.ts |
| M6 | Collab records all changes as `type: 'sort'`, userId as `'remote'` | Governance | collab-session.ts:296-304 |
| M7 | Excel export builds multi-GB XML string for large datasets | Failure Mode | excel-exporter.ts |
| M8 | `fromArrowTable()` casts all columns to VARCHAR | Failure Mode | duckdb-data-source.ts:261-286 |
| M9 | Bundle size unverified -- no size-limit in CI | DevOps | none |
| M10 | `FeatureFlags` interface is dead code | Normalized Mistakes | config.ts:35-46 |

### Architectural (Long-term Direction)

| # | Finding | Source |
|---|---------|--------|
| A1 | Unify configuration into single `DataView`/`GridPresentation` type | Category Error, Normalized Mistakes |
| A2 | Split `createGrid()` into prepare (worker-safe) + activate (main thread) | Physical World (mise en place) |
| A3 | Replace synchronous pipeline with async query submission model | Failure Mode, Hostile Review |
| A4 | DuckDB implements `AsyncDataSource` for native grid integration | Normalized Mistakes, Failure Mode |
| A5 | Tiered attention system for state change priorities | Physical World (triage) |
| A6 | Intent-based events for pre-committed actions | Physical World (trading pit) |
| A7 | Audit boundary concept for irreversible state transitions | Physical World (sterile field) |
| A8 | Progressive enhancement tiers (3G/4G/broadband auto-detection) | Resource Constrained |
