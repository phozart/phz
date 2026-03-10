# God Object Decomposition Plan: phz-grid.ts

## Overview

`packages/grid/src/components/phz-grid.ts` is 4,434 lines and handles at least
10 distinct concerns. This document maps responsibilities, proposes Lit Reactive
Controllers, defines the extraction order, and assesses risk.

## Current State

File: `packages/grid/src/components/phz-grid.ts`
Lines: 4,434

Already extracted (out of scope):
- `KeyboardNavigator` — `a11y/keyboard-navigator.ts` (class, not a controller)
- `AriaManager` — `a11y/aria-manager.ts` (class, not a controller)
- `phz-context-menu` — separate LitElement
- `phz-filter-popover` — separate LitElement
- `phz-column-chooser` — separate LitElement
- `phz-chart-popover` — separate LitElement
- `phz-toolbar` — separate LitElement

---

## 1. Responsibility Inventory

### A. Lifecycle / Grid Initialization (lines 1242–1724)
- `connectedCallback` / `disconnectedCallback`
- `willUpdate` / `updated` (property-change side-effects)
- `initializeGrid()` — creates GridApi, AriaManager, KeyboardNavigator
- `destroyGrid()` — tears down all subscriptions and managers
- `wireEvents()` — bridges GridApi events to DOM custom events
- `syncFromState()` — pulls GridApi state into @state reactive fields
- `effectiveScrollMode` getter
- `initVirtualScroller()` / `applyEffectiveScrollMode()`
- `initRemoteDataManager()`
- `inferColumnsFromData()`

### B. Selection (lines 3019–3026, 3707–3756, ~2497–2571, ~2762–2883)
- `toggleRowSelection()`
- `handleRowClick()` — single/multi/range selection logic
- `lastClickedRowId` — range anchor
- `selectedRowIds` @state
- Cell range: `cellRangeAnchor`, `cellRangeEnd`, `isDraggingRange` @state
- `handleCellMouseDown/Move/Up()`
- `isCellInRange()`, `getCellRangeCount()`, `clearCellRange()`
- `extendCellRange()` — keyboard range extension

### C. Inline Editing (lines 3221–3289)
- `editingCell`, `editValue` @state
- `startInlineEdit()`
- `renderInlineEditor()` — input/select templates
- `commitInlineEdit()` — type-coerced update, validation
- `cancelInlineEdit()`

### D. Sorting (lines 3668–3705)
- `handleHeaderClick()` — single/multi sort with Ctrl modifier
- `sortColumns` @state
- Context menu sort actions (in `handleContextMenuSelect`)

### E. Filtering (lines 4199–4426, 4191–4197)
- `filterOpen`, `filterField`, `filterAnchorRect`, `filterValues`, `filterColumnType` @state
- `activeFilters` @state
- `handleHeaderMenuClick()` / `openFilterPopover()`
- `handleFilterApply()` — builds filter set, calls `setFilters`
- Search: `searchQuery`, `searchDebounceTimer`, `handleSearchInput()`
- `filteredRows` computed getter (cached)
- `_cachedFilteredRows`, `_filterCacheKey` cache state

### F. Column Resize & Auto-Fit (lines 3826–3874)
- `startResize()` — drag-to-resize with document listeners
- `autoFitColumn()` — content-based width calculation
- `autoSizeAllColumns()`

### G. Export (lines 1397–1485)
- `exportCSV()` / `exportExcel()`
- `buildExportGroupRows()`
- `exportIncludeFormatting`, `exportIncludeGroupHeaders` @state

### H. Copy / Clipboard (lines 2573–2883)
- `performCopy()` — cell/range/rows dispatch
- `performCopyRows()`
- `buildGroupedCopyLines()` / `buildGroupedRowsCopyLines()`
- `_buildGroupHeaderLine()` / `_countExpandedRows()` / `_groupHasSelectedRows()`
- `_formatCellForGroupedCopy()`
- `copyHeaders`, `copyFormatted`, `maxCopyRows`, `excludeFieldsFromCopy` props

### I. Conditional Formatting & Anomaly Detection (lines 1998–2054)
- `cfEngine: ConditionalFormattingEngine` (private ref)
- `conditionalFormattingRules` prop
- `addFormattingRule()` / `removeFormattingRule()`
- `getCellConditionalStyle()` — per-cell style string
- `anomalies`, `anomalyLookup` state
- `enableAnomalyDetection` prop
- `runAnomalyDetection()` / `rebuildAnomalyLookup()`
- `isAnomalous()`
- `getAnomalies()`

### J. Grouping (lines 3321–3506)
- `groupBy`, `groupByLevels`, `groupTotals`, `groupTotalsFn`, `groupTotalsOverrides` props
- `groups`, `isGrouped` @state
- `_effectiveGroupBy`, `_levelBoundaryDepths`, `groupColumnHeaders` getters
- `groupedFlatRows`, `totalColSpan` getters
- `_collectExpandedRows()` / `renderGroupedRows()` / `renderGroup()`
- `toggleGroup()`
- `computeGroupColumnAgg()` / `computeGroupAggregate()`

### K. Aggregation Row (lines 2062–2137, 3291–3319)
- `aggregation`, `aggregationFn`, `aggregationPosition` props
- `getColumnAggregation()` / `computeAggregation()`
- `renderAggregationRow()` template
- Group total row computation (part of grouping, but uses aggregation logic)

### L. Computed Columns (lines 1506–1620)
- `computedColumns` prop
- `applyComputedColumns()` — modifies data rows + column defs
- `computeGroupAggregate()` for computed column groups

### M. Pagination & Scroll (lines 1941–1988, 3508–3606)
- `currentPage`, `internalPageSize` @state
- `filteredRows`, `pagedRows`, `virtualScrollRows` computed getters
- `totalPages` getter
- `goToPage()`, `renderPaginationFooter()`, `renderVirtualScrollFooter()`
- Virtual scroll: `virtualStartIndex`, `virtualEndIndex`, `remoteLoading`,
  `remoteError`, `remoteTotalCount` @state
- `VirtualScroller`, `RemoteDataManager` refs
- `effectiveScrollMode`, `getDensityRowHeight()`
- `initVirtualScroller()`, `applyEffectiveScrollMode()`, `initRemoteDataManager()`
- Scroll mode auto-switch logic in `syncFromState()`

### N. Context Menu (lines 3971–4189)
- `ctxMenuOpen`, `ctxMenuX`, `ctxMenuY`, `ctxMenuItems`, `ctxMenuSource`,
  `ctxMenuField`, `ctxMenuRowId` @state
- `handleHeaderContextMenu()` / `showHeaderContextMenu()`
- `handleBodyContextMenu()`
- `handleContextMenuSelect()` — 18-case dispatcher (>80 lines)

### O. Column Chooser & Profiles (lines 4312–4389)
- `columnChooserOpen`, `colPanelOpen` @state
- `handleColumnChooserApply()` / `handleColumnSettingsChange()`
- `handleComputedColumnsChange()`
- `handleProfileSave()` / `handleProfileLoad()`
- `columnProfiles` prop

### P. Chart Popover (lines 4287–4310)
- `chartOpen`, `chartField`, `chartHeader`, `chartValues`, `chartLabels` @state
- `openChartPopover()`

### Q. Row Actions (lines 3876–3926)
- `rowActions` prop
- `effectiveRowActions` getter
- `handleRowAction()` / `handleBulkRowAction()`
- `resolveHref()` (static)

### R. Drill-Through (lines 3759–3824)
- `drillThroughConfig` prop
- `handleCellDblClick()` — drill trigger
- `handleSummaryRowClick/DblClick()` / `emitSummaryDrillThrough()`
- `emitDrillThrough()` / `resolveClickedCell()`

### S. Toast Notifications (lines 1990–1996)
- `toast` @state, `toastTimer`
- `showToast()`

### T. Cell Rendering (lines 3028–3219)
- `renderCell()` — full cell template with all decorations
- `renderCellContent()` — type dispatcher (status, bar, boolean, date, number, link, image)
- `renderStatusBadge()` / `renderActivityBar()`
- `renderInlineEditor()` (shared with editing)
- `isMonoColumn()`
- `formatCompactNumber()` (static)
- `inferColumnType()`
- `isSafeUrl()` (static, security)

### U. Theming / CSS Variables (lines 1289–1377 in `updated()`)
- `containerShadow`, `containerRadius` style updates
- `gridLineColor`, `gridLineWidth` CSS var updates
- `bandingColor` CSS var update
- `cellTextOverflow` multi-var switch
- `density` attribute sync

### V. Header Rendering (lines 2885–2966)
- `renderHeaderBar()` — title bar
- `renderGroupHeaderRow()` — multi-level column group header
- `renderHeaderCell()` — single th with sort, filter button, resize handle
- `renderColumnPanel()` — inline column visibility dropdown

### W. Generate Dashboard (lines 3928–3969)
- `generateDashboardConfig`, `reportId`, `reportName` props
- `_handleGenerateDashboard()`

### X. SVG Icons (lines 2139–2191)
- 11 private svg* methods returning TemplateResult

---

## 2. Proposed Reactive Controllers

Lit Reactive Controllers implement `ReactiveController` with `hostConnected()`,
`hostDisconnected()`, and `hostUpdated()` lifecycle hooks. Each controller holds
its own state (plain class fields, NOT @state — the host triggers re-renders by
calling `host.requestUpdate()` when needed).

### Controller 1: `GridCoreController`

**File:** `packages/grid/src/controllers/grid-core.controller.ts`

**Responsibility:** Grid API lifecycle — create, wire, destroy, sync state from
GridApi to host reactive state.

**State owned (class fields, not @state):**
- `gridApi: GridApi | null`
- `ariaManager: AriaManager | null`
- `keyboardNav: KeyboardNavigator | null`
- `isInitialized: boolean`
- `unsubscribers: Unsubscribe[]`
- `forcedColorsCleanup: (() => void) | null`
- `resizeObserver: ResizeObserver | null`

**Methods to extract:**
- `initializeGrid()`
- `destroyGrid()`
- `wireEvents()`
- `syncFromState()` (triggers `host.requestUpdate()`)
- `inferColumnsFromData()`
- `getGridInstance()`
- `refresh()` / `invalidate()`

**Host state updated (via callback/setter):**
- `visibleRows`, `columnDefs`, `selectedRowIds`, `sortColumns`, `totalRowCount`,
  `isInitialized`, `activeFilters`, `isGrouped`, `groups`

**Dependencies:** SelectionController, FilterController, GroupController,
ScrollController (all read from GridApi state during sync)

**Lines extracted:** ~1242–1724, ~1841–1939 (partial overlap with scroll)

**Host interface required:**
```ts
interface GridCoreHost {
  gridApi: GridApi | null;
  data: unknown[];
  columns: ColumnDefinition[];
  selectionMode: string;
  editMode: string;
  virtualization: boolean;
  userRole: string;
  ariaLabels: AriaLabels;
  groupBy: string[];
  groupByLevels: string[][];
  // ... and setters for all @state fields it updates
}
```

---

### Controller 2: `SelectionController`

**File:** `packages/grid/src/controllers/selection.controller.ts`

**Responsibility:** Row selection (single/multi/range) and cell range selection.

**State owned:**
- `selectedRowIds: Set<RowId>`
- `lastClickedRowId: RowId | null`
- `cellRangeAnchor: { rowIndex: number; colIndex: number } | null`
- `cellRangeEnd: { rowIndex: number; colIndex: number } | null`
- `isDraggingRange: boolean`

**Methods to extract:**
- `toggleRowSelection()`
- `handleRowClick()`
- `handleCellMouseDown/Move/Up()`
- `isCellInRange()`
- `getCellRangeCount()`
- `clearCellRange()`
- `extendCellRange()`

**Events handled:** row click, cell mousedown/move/up

**Dependencies:** GridCoreController (for `gridApi`)

**Lines extracted:** ~456–462, ~491–538, ~2497–2571, ~3019–3026, ~3707–3756

---

### Controller 3: `EditController`

**File:** `packages/grid/src/controllers/edit.controller.ts`

**Responsibility:** Inline cell editing — start, commit, cancel.

**State owned:**
- `editingCell: EditingCell | null`
- `editValue: string`

**Methods to extract:**
- `startInlineEdit()`
- `commitInlineEdit()`
- `cancelInlineEdit()`
- `renderInlineEditor()` (template helper — remains callable from host render)

**Events handled:** cell dblclick (via `handleCellDblClick`), keydown inside editor

**Dependencies:** GridCoreController

**Lines extracted:** ~517–518, ~3221–3289

---

### Controller 4: `FilterController`

**File:** `packages/grid/src/controllers/filter.controller.ts`

**Responsibility:** Column filter popover state, search debounce, active filter
management.

**State owned:**
- `filterOpen: boolean`
- `filterField: string`
- `filterAnchorRect: DOMRect | null`
- `filterValues: FilterValueEntry[]`
- `filterColumnType: string`
- `activeFilters: Map<string, FilterInfo>` (mirrors GridApi state)
- `searchQuery: string`
- `searchDebounceTimer`
- `_cachedFilteredRows`, `_filterCacheKey` (perf cache)

**Methods to extract:**
- `openFilterPopover()`
- `handleHeaderMenuClick()`
- `handleFilterApply()`
- `handleSearchInput()`
- `filteredRows` getter

**Dependencies:** GridCoreController

**Lines extracted:** ~463–466, ~499–514, ~1941–1969, ~4191–4426

---

### Controller 5: `ColumnResizeController`

**File:** `packages/grid/src/controllers/column-resize.controller.ts`

**Responsibility:** Column drag-resize and double-click auto-fit.

**State owned:** none (no reactive state — pure imperative)

**Methods to extract:**
- `startResize()` — attaches/detaches document mousemove/mouseup
- `autoFitColumn()`
- `autoSizeAllColumns()`

**Events handled:** header resize-handle mousedown, dblclick

**Dependencies:** GridCoreController

**Lines extracted:** ~3826–3874, ~1699–1705

---

### Controller 6: `ExportController`

**File:** `packages/grid/src/controllers/export.controller.ts`

**Responsibility:** CSV and Excel export including group row flattening.

**State owned:**
- `exportIncludeFormatting: boolean`
- `exportIncludeGroupHeaders: boolean`

**Methods to extract:**
- `exportCSV()` / `exportExcel()`
- `buildExportGroupRows()`

**Dependencies:** GridCoreController, GroupController (for `groups`),
FilterController (for `filteredRows`)

**Lines extracted:** ~531–534, ~1397–1485

---

### Controller 7: `ClipboardController`

**File:** `packages/grid/src/controllers/clipboard.controller.ts`

**Responsibility:** All copy-to-clipboard paths — cell, range, rows, grouped.

**State owned:** none (reads host/controller state, no own state)

**Methods to extract:**
- `performCopy()`
- `performCopyRows()`
- `buildGroupedCopyLines()`
- `buildGroupedRowsCopyLines()`
- `_buildGroupHeaderLine()`
- `_countExpandedRows()`
- `_groupHasSelectedRows()`
- `_formatCellForGroupedCopy()`

**Dependencies:** SelectionController (range/row state), GroupController,
FilterController, GridCoreController

**Lines extracted:** ~2573–2883

---

### Controller 8: `ConditionalFormattingController`

**File:** `packages/grid/src/controllers/conditional-formatting.controller.ts`

**Responsibility:** CF rule engine and anomaly detection.

**State owned:**
- `cfEngine: ConditionalFormattingEngine`
- `anomalies: Map<string, AnomalyResult[]>`
- `anomalyLookup: Map<string, AnomalyResult>`

**Methods to extract:**
- `addFormattingRule()` / `removeFormattingRule()`
- `getCellConditionalStyle()` — used during cell render
- `runAnomalyDetection()` / `rebuildAnomalyLookup()`
- `isAnomalous()` / `getAnomalies()`

**Dependencies:** GridCoreController (for `visibleRows`)

**Lines extracted:** ~494–496, ~551–552, ~1998–2054, and `updated()` CF rules
handler at ~1316–1321, ~1322–1327

---

### Controller 9: `GroupController`

**File:** `packages/grid/src/controllers/group.controller.ts`

**Responsibility:** Row grouping — state, expand/collapse, rendering helpers.

**State owned:**
- `groups: RowGroup[]`
- `isGrouped: boolean`

**Methods to extract:**
- `_effectiveGroupBy` getter
- `_levelBoundaryDepths` getter
- `groupColumnHeaders` getter
- `totalColSpan` getter
- `groupedFlatRows` getter
- `_collectExpandedRows()`
- `renderGroupedRows()` / `renderGroup()` (template helpers)
- `toggleGroup()`
- `computeGroupColumnAgg()` / `computeGroupAggregate()`
- `renderAggregationRow()` (aggregation shared with group totals)

**Dependencies:** GridCoreController, AggregationController

**Lines extracted:** ~504–506, ~3321–3506

---

### Controller 10: `AggregationController`

**File:** `packages/grid/src/controllers/aggregation.controller.ts`

**Responsibility:** Footer/header aggregation row computation.

**State owned:** none (reads from FilterController's `filteredRows`)

**Methods to extract:**
- `getColumnAggregation()` / `computeAggregation()`
- `renderAggregationRow()` (could stay as a host template method called with
  controller data)

**Dependencies:** FilterController

**Lines extracted:** ~2062–2137, ~3291–3319

---

### Controller 11: `ComputedColumnsController`

**File:** `packages/grid/src/controllers/computed-columns.controller.ts`

**Responsibility:** Computed column evaluation — formula parsing, row augmentation,
column def injection.

**State owned:** none (mutates host's `data` and `columns` props)

**Methods to extract:**
- `applyComputedColumns()`

**Dependencies:** GridCoreController

**Lines extracted:** ~1506–1582

---

### Controller 12: `ScrollController`

**File:** `packages/grid/src/controllers/scroll.controller.ts`

**Responsibility:** Virtual scroll and remote data management.

**State owned:**
- `virtualStartIndex: number`
- `virtualEndIndex: number`
- `remoteLoading: boolean`
- `remoteError: string | null`
- `remoteTotalCount: number`
- `virtualScroller: VirtualScroller | null`
- `remoteDataManager: RemoteDataManager | null`

**Methods to extract:**
- `effectiveScrollMode` getter
- `getDensityRowHeight()`
- `initVirtualScroller()`
- `applyEffectiveScrollMode()`
- `initRemoteDataManager()`
- `virtualScrollRows` getter
- `pagedRows` getter (collaborates with FilterController)
- `renderVirtualScrollFooter()`
- `renderSkeletonRow()` / `isSkeletonRow()`

**Dependencies:** GridCoreController, FilterController

**Lines extracted:** ~536–546, ~1726–1823, ~1978–1984

---

### Controller 13: `ContextMenuController`

**File:** `packages/grid/src/controllers/context-menu.controller.ts`

**Responsibility:** Context menu open/close state and action dispatch.

**State owned:**
- `ctxMenuOpen: boolean`
- `ctxMenuX, ctxMenuY: number`
- `ctxMenuItems: MenuItem[]`
- `ctxMenuSource: 'header' | 'body'`
- `ctxMenuField: string`
- `ctxMenuRowId: RowId | null`

**Methods to extract:**
- `handleHeaderContextMenu()` / `showHeaderContextMenu()`
- `handleBodyContextMenu()`
- `handleContextMenuSelect()` — delegates back to other controllers

**Dependencies:** All controllers (menu actions touch sort, filter, copy, export,
grouping, anomaly, column visibility — all via callbacks/host reference)

**Lines extracted:** ~471–479, ~3971–4189

**Note:** This controller has the most inter-controller dependencies because the
context menu is an aggregation point. Prefer passing a command object or callback
map rather than direct controller references.

---

### Controller 14: `ColumnChooserController`

**File:** `packages/grid/src/controllers/column-chooser.controller.ts`

**Responsibility:** Column chooser panel state and profile management.

**State owned:**
- `columnChooserOpen: boolean`
- `colPanelOpen: boolean`

**Methods to extract:**
- `handleColumnChooserApply()`
- `handleColumnSettingsChange()`
- `handleComputedColumnsChange()`
- `handleProfileSave()` / `handleProfileLoad()`

**Dependencies:** GridCoreController, ComputedColumnsController

**Lines extracted:** ~480–481, ~4312–4389

---

### Controller 15: `ToastController`

**File:** `packages/grid/src/controllers/toast.controller.ts`

**Responsibility:** Toast notification lifecycle.

**State owned:**
- `toast: ToastInfo | null`
- `toastTimer: ReturnType<typeof setTimeout> | null`

**Methods to extract:**
- `showToast()`

**Dependencies:** none

**Lines extracted:** ~520–522, ~1990–1996

---

### Non-Controller Extractions (Helpers / Static Modules)

These do not warrant controllers but should be extracted as module-level helpers:

| Concern | Destination | Current lines |
|---------|-------------|---------------|
| SVG icon methods | `packages/grid/src/icons.ts` | 2139–2191 |
| Cell content rendering | `packages/grid/src/renderers/cell-renderer.ts` | 3081–3219 |
| CSS styles (`static styles`) | `packages/grid/src/components/phz-grid.styles.ts` | 570–1238 |
| `isSafeUrl()` | `packages/grid/src/security.ts` | 3082–3088 |
| `formatCompactNumber()` | `packages/grid/src/formatters/number-formatter.ts` | 3163–3171 |
| `resolveHref()` | `packages/grid/src/utils/url-utils.ts` | 3878–3883 |

---

## 3. Migration Strategy

### Phase 1: Zero-risk extractions (no structural change)

Extract these first — they have no inter-component state coupling and can be
tested in isolation before any controller work begins.

1. **CSS styles** — move `static styles` to `phz-grid.styles.ts`, import back.
   No logic, no test needed. Saves ~670 lines.

2. **SVG icons** — extract 11 svg* methods to `icons.ts` as named exports
   returning `TemplateResult`. Host imports and calls them. Saves ~55 lines.

3. **`isSafeUrl()`** — move to `security.ts`. Already static. Used in 3 places.

4. **`formatCompactNumber()`** — move to `number-formatter.ts`. Already static.

5. **Cell renderer** — extract `renderCellContent()`, `renderStatusBadge()`,
   `renderActivityBar()`, `isMonoColumn()`, `inferColumnType()` to a pure
   module-level function `renderCellContent(value, col, options)`. Reduces
   `renderCell()` to a thin template wrapper. Saves ~130 lines.

After Phase 1: ~3,500 lines remaining.

---

### Phase 2: Leaf controllers (no dependencies on other controllers)

Extract controllers that only depend on `GridApi` (via `GridCoreController`):

Order: `ToastController` → `ColumnResizeController` → `EditController` →
`AggregationController` → `ConditionalFormattingController`

For each:
1. Write controller class implementing `ReactiveController`
2. Write the host interface type
3. Extract methods from `phz-grid.ts` to controller
4. Replace host fields with `this.xController.field`
5. Run existing tests; fix any regressions

---

### Phase 3: Mid-tier controllers

Extract with moderate coupling:

Order: `FilterController` → `SelectionController` → `ScrollController`

`FilterController` must be extracted before `ClipboardController` and
`ExportController` because both consume `filteredRows`.

---

### Phase 4: Complex controllers

Extract controllers with many inter-dependencies:

Order: `GroupController` → `ComputedColumnsController` →
`ClipboardController` → `ExportController`

---

### Phase 5: Aggregation-point controllers

Extract last because they dispatch to other controllers:

Order: `ColumnChooserController` → `ContextMenuController`

`ContextMenuController` is last because its `handleContextMenuSelect()` calls
into sort, filter, clipboard, export, grouping, anomaly, and column visibility.
Pattern: pass a `commands: GridCommandMap` object at construction time, mapping
command IDs to callbacks provided by the host.

---

### Phase 6: `GridCoreController`

Extract after all other controllers are in place. The core controller becomes
the "hub" that holds the `GridApi` reference and provides it to others via a
shared ref pattern.

---

### Phase 7: Extract render methods

After controller extraction, the main `render()` method will still be large
(~300 lines) due to the table template. Extract sub-render methods into template
factories:

- `renderHeaderSection(controller, columnDefs)` → `header-renderer.ts`
- `renderBodyRows(rows, controllers)` → `row-renderer.ts`
- `renderFooter(paginationCtrl, scrollCtrl)` → `footer-renderer.ts`

---

## 4. Risk Assessment

### High Risk

**R1: Shared mutable state between controllers**
- Example: `filteredRows` is computed in `FilterController` but consumed by
  `ScrollController`, `ClipboardController`, and `ExportController`.
- Mitigation: `FilterController` exposes `filteredRows` as a getter. All
  consumers hold a reference to the `FilterController` instance.

**R2: `handleContextMenuSelect()` cross-cutting dispatch**
- This 18-case switch touches sort, filter, copy, export, group, anomaly,
  column visibility — every domain.
- Mitigation: Introduce a `GridCommandBus` interface. The context menu
  controller receives a command map keyed by menu item ID. The host wires
  commands at construction time.

**R3: Circular dependencies between controllers**
- Example: `GroupController` ← `AggregationController` ← `FilterController`
- Mitigation: Enforce a strict dependency graph (tree, not DAG). Use host-level
  callbacks to break any cycles.

**R4: `renderGroup()` template method**
- Currently 100+ lines of mixed logic and template. It recursively calls itself
  and accesses 12+ controller state fields.
- Mitigation: Keep `renderGroup()` on the host (or in `row-renderer.ts`) but
  pass a `GroupRenderContext` object that aggregates all needed state from
  controllers.

### Medium Risk

**R5: `syncFromState()` — central state fan-out**
- Currently one method that updates 8 @state fields after every GridApi
  subscription callback.
- Mitigation: `GridCoreController.syncFromState()` calls `requestUpdate()` once
  and exposes typed accessors. Each controller subscribes to the parts of state
  it owns rather than one monolithic update.

**R6: `updated()` property-change handlers**
- Currently a 90-line method with 15+ `changed.has(...)` branches.
- Mitigation: Move each branch to `hostUpdated()` on the relevant controller.
  The host's `updated()` becomes a thin delegator.

**R7: CSS extraction**
- `static styles` is 670 lines. Extracting to a separate file is safe but
  requires verifying that style encapsulation still works (adoptedStyleSheets or
  tagged template import).

### Low Risk

**R8: Toast controller**
- Completely self-contained. No coupling. Trivial to extract. Do first.

**R9: Column resize controller**
- Attaches/detaches document listeners. Already well-isolated. Low risk.

**R10: Icons extraction**
- Pure TemplateResult factories. Zero state. Zero risk.

---

## 5. Controller Dependency Graph

```
ToastController          (no deps)
ColumnResizeController   (no deps)
EditController           -> GridCoreController
AggregationController    -> GridCoreController, FilterController
CFController             -> GridCoreController
FilterController         -> GridCoreController
SelectionController      -> GridCoreController
ScrollController         -> GridCoreController, FilterController
GroupController          -> GridCoreController, AggregationController
ComputedColumnsController -> GridCoreController
ClipboardController      -> SelectionController, GroupController, FilterController
ExportController         -> GridCoreController, GroupController, FilterController
ColumnChooserController  -> GridCoreController, ComputedColumnsController
ContextMenuController    -> CommandBus (all controllers injected via callbacks)
GridCoreController       -> (owns GridApi, provides to all)
```

---

## 6. Estimated Line Count After Decomposition

| File | Before | After (estimate) |
|------|--------|-----------------|
| `phz-grid.ts` | 4,434 | ~700 |
| `phz-grid.styles.ts` (new) | — | ~680 |
| `icons.ts` (new) | — | ~60 |
| `grid-core.controller.ts` (new) | — | ~250 |
| `selection.controller.ts` (new) | — | ~160 |
| `edit.controller.ts` (new) | — | ~120 |
| `filter.controller.ts` (new) | — | ~200 |
| `column-resize.controller.ts` (new) | — | ~80 |
| `export.controller.ts` (new) | — | ~120 |
| `clipboard.controller.ts` (new) | — | ~220 |
| `cf.controller.ts` (new) | — | ~100 |
| `group.controller.ts` (new) | — | ~300 |
| `aggregation.controller.ts` (new) | — | ~100 |
| `computed-columns.controller.ts` (new) | — | ~120 |
| `scroll.controller.ts` (new) | — | ~150 |
| `context-menu.controller.ts` (new) | — | ~200 |
| `column-chooser.controller.ts` (new) | — | ~100 |
| `toast.controller.ts` (new) | — | ~40 |
| `renderers/cell-renderer.ts` (new) | — | ~150 |
| `security.ts` (new) | — | ~15 |
| **Total** | **4,434** | **~3,865** |

The 14% increase in total lines is expected — controller boilerplate (interface,
constructor, lifecycle hooks) adds overhead while the main file drops from 4,434
to ~700.

**Residual `phz-grid.ts` content (~700 lines):**
- `@customElement`, `@property` declarations (~70 props)
- `connectedCallback` / `disconnectedCallback` (delegating to controllers)
- `updated()` (thin, delegating to controllers' `hostUpdated()`)
- `render()` (top-level template, delegates to sub-renderer functions)
- Public API methods: `getGridInstance()`, `refresh()`, `invalidate()`,
  `exportCSV()`, `exportExcel()`, `getPreferences()`, `setPreferences()`,
  `getAnomalies()`, `addFormattingRule()`, `removeFormattingRule()`,
  `runAnomalyDetection()`, `autoSizeAllColumns()`
- Controller instantiation in constructor

---

## 7. Testing Requirements Per Phase

Each controller extraction must maintain the following before merging:

1. **Unit test** for the extracted controller in isolation (mock GridApi).
2. **Integration test** that the host + controller behaves identically to the
   pre-extraction behavior (use existing `grid.test.ts` as the baseline).
3. `vitest run` on the full test suite must pass with zero new failures.
4. TypeScript compiler must report 0 errors.

Key test files to keep green throughout:
- `packages/grid/src/__tests__/grid.test.ts`
- `packages/grid/src/__tests__/keyboard-a11y.test.ts`
- `packages/grid/src/__tests__/filter-popover-a11y.test.ts`
- `packages/grid/src/__tests__/formula-injection.test.ts`
- `packages/grid/src/__tests__/bug-fixes.test.ts`

---

## 8. Lit Reactive Controller Pattern Reference

```ts
// Template for a controller
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface MyFeatureHost extends ReactiveControllerHost {
  gridApi: GridApi | null;
  // ... any host properties the controller reads/writes
}

export class MyFeatureController implements ReactiveController {
  private host: MyFeatureHost;

  // Own state — plain fields, not @state
  myField: string = '';

  constructor(host: MyFeatureHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    // Equivalent to connectedCallback logic for this concern
  }

  hostDisconnected(): void {
    // Cleanup
  }

  hostUpdated(): void {
    // React to property changes (replaces changed.has(...) branches in updated())
  }

  // Feature methods — called by the host
  doSomething(): void {
    // ... update this.myField
    this.host.requestUpdate();
  }
}
```

The host declares controllers in its constructor:

```ts
@customElement('phz-grid')
export class PhzGrid extends LitElement {
  private toast = new ToastController(this);
  private edit = new EditController(this);
  // ...

  // Host reads from controllers in render():
  protected override render() {
    return html`
      ${this.toast.toast ? html`<div>${this.toast.toast.message}</div>` : nothing}
    `;
  }
}
```

---

## 9. Known Issues That Complicate Decomposition

From the codebase audit (MEMORY.md):

1. **Default sort BROKEN** — `defaultSortField` / `defaultSortDirection` props
   are declared but never read in `initializeGrid()`. Must be wired in
   `GridCoreController.initializeGrid()` during extraction, not left broken.

2. **Column pinning BROKEN** — `frozen` typed but zero rendering logic. Out of
   scope for this decomposition, but must not be made harder to add.

3. **DuckDB DISCONNECTED** — `attachToGrid()` is a no-op. Out of scope, but the
   `GridCoreController` interface must be compatible with future wiring.

4. **Engine import undeclared** — `phz-grid.ts` imports `@phozart/phz-engine`
   but doesn't declare it in `package.json`. This must be fixed (add to
   `peerDependencies`) during Phase 1 before any extraction.

5. **`sideEffects: false` wrong** — `packages/grid/package.json` has
   `"sideEffects": false` which is wrong given 21 custom element registrations.
   Fix before extraction to avoid tree-shaking issues.

---

_Last updated: 2026-03-05_
_Status: PLANNING — no source files modified_
