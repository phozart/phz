# phz-grid Developer Guide

> Complete architecture reference, API documentation, and development patterns.
>
> **Version**: 0.2.0 (v15) | **Date**: 2026-03-08 | **Tests**: 5,557 passing | **Packages**: 20

> **New to phz-grid workspace?** Start with the [Workspace Integration Guide](./WORKSPACE-INTEGRATION-GUIDE.md)
> to learn how to mount `<phz-workspace>` in your application. This Developer Guide covers
> internals, extension points, and advanced topics.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Package Reference](#package-reference)
3. [v15 New Packages](#v15-new-packages)
4. [Core Concepts](#core-concepts)
5. [BI Engine Reference](#bi-engine-reference)
6. [Widget Components](#widget-components)
7. [Criteria & Filters](#criteria--filters)
8. [Definitions & Serialization](#definitions--serialization)
9. [Admin Panels](#admin-panels)
10. [Authoring Module Architecture](#authoring-module-architecture)
11. [Three-Shell Architecture](#three-shell-architecture)
12. [CSS Architecture](#css-architecture)
13. [Development Setup](#development-setup)
14. [Testing Patterns](#testing-patterns)
15. [Key File Locations](#key-file-locations)

---

## Architecture Overview

### 6-Layer Architecture (v15)

```
┌─────────────────────────────────────────────────────────────┐
│  Shell Layer       workspace (admin), viewer (analyst),      │
│                    editor (author) — three shells             │
├─────────────────────────────────────────────────────────────┤
│  UI Layer          grid-admin, engine-admin, grid-creator,  │
│                    criteria (admin panels, wizards, filter)  │
├─────────────────────────────────────────────────────────────┤
│  Rendering Layer   widgets (20+ Lit Web Components)         │
│                    KPI cards, charts, gauges, dashboards     │
├─────────────────────────────────────────────────────────────┤
│  Computation Layer engine (BIEngine facade + alerts,         │
│                    subscriptions, analytics, API, attention) │
├─────────────────────────────────────────────────────────────┤
│  Shared Layer      shared (adapters, types, design system,   │
│                    artifacts, coordination)                   │
├─────────────────────────────────────────────────────────────┤
│  Foundation        core + definitions                        │
│                    State, events, types, serialization        │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Accessibility first** — screen readers, keyboard nav, Forced Colors Mode
2. **Modular by default** — tree-shakeable, core < 50 KB gzipped
3. **Schema-as-contract** — JSON Schema drives AI, docs, and type generation
4. **Three-model extensibility** — hooks (middleware), slots (Web Component), headless (functional)
5. **Open-core** — MIT community tier, commercial enterprise tier

### Build Order (v15 dependency chain)

```
shared → core → definitions → engine → duckdb → criteria → widgets → grid →
workspace → viewer → editor → grid-admin(shim) → engine-admin(shim) →
grid-creator(shim) → ai → collab → react → vue → angular
```

The `shared` package is the new foundation layer — it contains adapter SPIs,
type definitions, design system tokens, artifact metadata types, and runtime
coordination state machines that all shells depend on.

---

## Package Reference

### Core Packages

| Package | Purpose | Key File |
|---------|---------|----------|
| **core** | Headless grid engine — StateManager, GridApi, events, types, views, row model, subscribeSelector(), tiered attention, filter expressions, query planner | `packages/core/src/create-grid.ts` |
| **grid** | Web Components rendering — 17 Lit Reactive Controllers, virtual scrolling, column pinning, cell formatting, keyboard nav, a11y | `packages/grid/src/components/phz-grid.ts` |
| **definitions** | Serializable blueprints — GridDefinition, data sources (local/url/data-product/duckdb-query), Zod validation, stores, converters, migration | `packages/definitions/src/types/grid-definition.ts` |

### BI Engine Packages

| Package | Purpose | Key File |
|---------|---------|----------|
| **engine** | BI computation — BIEngine facade, KPI/metric registries, aggregation, pivot, 5-layer expression DAG, CriteriaEngine, widget resolver, chart projection, drill-through, config layering, window functions | `packages/engine/src/engine.ts` |
| **widgets** | Dashboard widgets — 20+ Lit components (KPI card, scorecard, gauge, bar/line/area/pie/scatter/heatmap/waterfall/funnel charts, trend-line, bottom-N, status table). SVG-based, 3 themes | `packages/widgets/src/components/phz-dashboard.ts` |
| **criteria** | Filter UI — SelectionCriteria (bar + drawer), CriteriaPanel, field types (date-range, tree-select, chip-select, numeric-range, search, field-presence), admin (FilterDesigner, FilterConfigurator, RuleAdmin, PresetAdmin) | `packages/criteria/src/components/phz-selection-criteria.ts` |

### Admin & Tools

| Package | Purpose | Key File |
|---------|---------|----------|
| **grid-admin** | Visual config admin — table settings, columns, formatting, filters, export, theme, views. getSettings()/setSettings() API | `packages/grid-admin/src/components/phz-grid-admin.ts` |
| **engine-admin** | BI artifact designers — ReportDesigner (6-step), KPIDesigner (6-step), DashboardBuilder (3-panel), MetricBuilder, FilterStudio. SaveController, UndoController | `packages/engine-admin/src/components/phz-engine-admin.ts` |
| **grid-creator** | 5-step wizard — Identity → Data Source → Columns → Config → Review. Pure functional state machine | `packages/grid-creator/src/wizard-state.ts` |
| **workspace/authoring** | Report & dashboard authoring — state machines, undo/redo, auto-save, drag-drop, context menus, template pipeline, keyboard shortcuts. All pure functions + thin Lit views | `packages/workspace/src/authoring/index.ts` |

### Specialized

| Package | Purpose | Key File |
|---------|---------|----------|
| **duckdb** | DuckDB-WASM adapter — AsyncDataSource, SQL push-down (aggregation, GROUP BY, HAVING), DuckDBBridge | `packages/duckdb/src/duckdb-data-source.ts` |
| **ai** | AI toolkit — schema-as-contract, NL query translation | `packages/ai/src/index.ts` |
| **collab** | Real-time collaboration — Yjs CRDTs, sync adapters | `packages/collab/src/collab-session.ts` |
| **local** | Local Node.js server with native DuckDB, filesystem persistence, CLI binary (`phz-local`). For offline, desktop, and demo scenarios | `packages/local/src/local-server.ts` |

### Framework Adapters

| Package | Purpose | Key File |
|---------|---------|----------|
| **react** | React wrapper — uses `@lit/react` `createComponent()` for automatic property bridging. Strips `undefined` props before forwarding to prevent overriding Web Component defaults. Uses `'use client'` directive for Next.js SSR compatibility. Event callbacks unwrap `CustomEvent.detail` for idiomatic React usage | `packages/react/src/phz-grid.ts` |
| **vue** | Vue wrapper — factory pattern (e.g., `createPhzGridComponent()`, `createUseGrid()`). No hard dependency on Vue; accepts Vue runtime as parameter. Works with Vue 3 composition API. Composables: `useGrid`, `useGridSelection`, `useGridSort`, `useGridFilter`, `useGridEdit` | `packages/vue/src/index.ts` |
| **angular** | Angular wrapper — standalone components + RxJS-based factory functions for reactive bindings. `createPhzGridComponent()` and `createGridService()` avoid hard dependency on Angular decorators at build time. Service factories: `createSelectionService`, `createSortService`, `createFilterService`, `createEditService`, `createDataService` | `packages/angular/src/index.ts` |
| **python** | Python package — pip install, anywidget + Arrow IPC for Jupyter/Panel/Streamlit | `packages/python/` |

---

## v15 New Packages

### `@phozart/phz-shared` — Shared Infrastructure

The shared package is the foundation layer extracted from workspace in v15. It
contains everything that workspace, viewer, and editor all depend on, eliminating
circular dependency chains.

**Sub-path imports** (preferred for tree-shaking):

| Import | Contents |
|--------|----------|
| `@phozart/phz-shared/adapters` | `DataAdapter`, `DataQuery`, `DataResult`, persistence SPIs, `AlertChannelAdapter`, `AttentionAdapter`, `UsageAnalyticsAdapter`, `SubscriptionAdapter`, `MeasureRegistryAdapter`, `HelpConfig` |
| `@phozart/phz-shared/types` | `ShareTarget`, `FieldEnrichment`, `FilterPresetValue`, `FilterValueMatchRule`, `FilterValueHandling`, `PersonalAlert`, `AsyncReportJob`, `Subscription`, `ErrorState`, `EmptyState`, `WidgetPosition`, `DashboardWidget`, `DecisionTreeNode`, `ApiSpec`, `MessagePool`, `SingleValueAlertConfig`, `AttentionFilterState`, `MicroWidgetCellConfig`, `CellRendererRegistry`, `ImpactChainNode` |
| `@phozart/phz-shared/design-system` | `DESIGN_TOKENS`, responsive breakpoints, container queries, component patterns, shell layout, icons, mobile interactions, alert tokens, chain tokens |
| `@phozart/phz-shared/artifacts` | `ArtifactVisibility`, `DefaultPresentation`, `PersonalView`, `GridArtifact`, `ArtifactMeta` |
| `@phozart/phz-shared/coordination` | `FilterContextManager`, `DashboardDataPipeline`, `QueryCoordinator`, `InteractionBus`, navigation events, `LoadingState`, `ExecutionStrategy`, `ServerGridConfig`, `GridExportConfig`, `FilterAutoSaveConfig`, `AsyncReportUIState`, `ExportsTabState`, `SubscriptionsTabState`, `ExpressionBuilderState`, `PreviewContextState`, `AttentionFacetedState` |

**Source**: `packages/shared/src/`

### `@phozart/phz-viewer` — Read-Only Consumption Shell

The viewer package provides the analyst experience: catalog browsing, dashboard
viewing, report viewing, ad-hoc exploration, attention notifications, and filter
bars. It has no dependency on workspace — only on shared.

**Key exports**:

| Module | State machines | Components |
|--------|---------------|------------|
| Shell | `ViewerShellState` (navigation, error, empty, loading, mobile) | `<phz-viewer-shell>` |
| Catalog | `CatalogState` (search, type filter, sort, pagination, favorites) | `<phz-viewer-catalog>` |
| Dashboard | `DashboardViewState` (widget loading, cross-filter, fullscreen) | `<phz-viewer-dashboard>` |
| Report | `ReportViewState` (sort, pagination, column visibility, export) | `<phz-viewer-report>` |
| Explorer | `ExplorerScreenState` (data sources, fields, preview, chart suggest) | `<phz-viewer-explorer>` |
| Attention | `AttentionDropdownState` (items, filtering, read/dismiss) | `<phz-attention-dropdown>` |
| Filter bar | `FilterBarState` (filter defs, values, presets, collapse) | `<phz-filter-bar>` |
| Error/Empty | -- | `<phz-viewer-error>`, `<phz-viewer-empty>` |

**Navigation**: `ViewerRoute` with `parseRoute()` and `buildRoutePath()` for
client-side routing. `ViewerShellConfig` with `ViewerFeatureFlags` and
`ViewerBranding` for customization.

**Source**: `packages/viewer/src/`

### `@phozart/phz-editor` — Authoring Shell

The editor package provides the author experience: catalog management, dashboard
editing (drag-and-drop, widget config), report editing, exploration, measure
palette, sharing flow, and alert/subscription management.

**Key exports**:

| Module | State machines | Components |
|--------|---------------|------------|
| Shell | `EditorShellState` (navigation, edit mode, undo/redo, auto-save) | `<phz-editor-shell>` |
| Catalog | `CatalogState` (search, type/visibility filter, create dialog) | `<phz-editor-catalog>` |
| Dashboard view | `DashboardViewState` (permissions, expand/collapse) | `<phz-editor-dashboard>` |
| Dashboard edit | `DashboardEditState` (add/remove/move/resize widgets, drag, layout) | -- |
| Report edit | `ReportEditState` (columns, filters, sorts, preview, data source) | `<phz-editor-report>` |
| Explorer | `ExplorerState` (dimensions, measures, filters, save dialog) | `<phz-editor-explorer>` |
| Measure palette | `MeasurePaletteState` (search, category, tab, selection) | `<phz-measure-palette>` |
| Config panel | `ConfigPanelState` (values, validation, sections) | `<phz-config-panel>` |
| Sharing | `SharingFlowState` (visibility, targets, search) | `<phz-sharing-flow>` |
| Alerts/Subs | `AlertSubscriptionState` (CRUD, tabs, search, enable/disable) | `<phz-alert-subscription>` |

**Navigation**: `EditorRoute` with `parseRoute()`, `buildRoutePath()`,
`buildBreadcrumbs()`, and `buildEditorDeepLink()`. `EditorShellConfig` with
`EditorFeatureFlags`.

**Source**: `packages/editor/src/`

### New Engine Subsystems (v15)

The engine package gained five new subsystems, all pure functions with no DOM
dependencies:

| Subsystem | Import | Key types/functions |
|-----------|--------|---------------------|
| **Personal Alert Engine** | `@phozart/phz-engine` | `AlertEvaluationResult`, `evaluatePersonalAlerts()`, `AlertEvaluationContract`, `createInMemoryAlertContract()` |
| **Subscription Engine** | `@phozart/phz-engine` | `SubscriptionEngineState`, `createSubscriptionEngineState()`, `addSubscription()`, `removeSubscription()`, `isReadyForExecution()`, `getNextExecutionTime()` |
| **Usage Analytics** | `@phozart/phz-engine` | `UsageCollectorState`, `createUsageCollector()`, `trackEvent()`, `flush()`, `shouldFlush()` |
| **OpenAPI Generator** | `@phozart/phz-engine` | `OpenAPIDocument`, `generateOpenAPISpec()` — generates OpenAPI 3.1.0 from `ApiSpec` types |
| **Attention System** | `@phozart/phz-engine` | `AttentionSystemState`, `createAttentionSystemState()`, `addItems()`, `markAsRead()`, `dismissItem()`, `getUnreadCount()` |

The **Explorer** module was also moved from `@phozart/phz-workspace/explore`
to `@phozart/phz-engine/explorer` in v15. It exports `createFieldPalette()`,
`createDropZoneState()`, `suggestChartType()`, `exploreToReport()`,
`createDataExplorer()`, and dashboard integration helpers.

### Spec Amendment Features (v15)

Four spec amendments were implemented:

**A: Alert-Aware KPI Cards** (`@phozart/phz-shared/types`):
- `SingleValueAlertConfig` — binds a widget to an alert rule with visual mode (`none`, `indicator`, `background`, `border`)
- `resolveAlertVisualState()` — resolves current severity from alert events
- `getAlertTokens()` — maps severity + mode to design token names
- `degradeAlertMode()` — responsive degradation at `full`/`compact`/`minimal` container sizes
- Alert design tokens in `@phozart/phz-shared/design-system` (alert-tokens.ts)

**B: Micro-Widget Cell Renderers** (`@phozart/phz-shared/types`):
- `CellRendererRegistry` — runtime registration of cell renderers (avoids circular deps)
- `MicroWidgetCellConfig` — per-column config for in-cell widgets
- `MicroWidgetRenderer` interface — `render()` returns SVG/HTML string, `canRender()` checks minimum width
- Four display modes: `value-only`, `sparkline`, `delta`, `gauge-arc`
- `createCellRendererRegistry()` — Map-based factory

**C: Impact Chain Widget** (`@phozart/phz-shared/types`):
- `ImpactChainNode` extends `DecisionTreeNode` with `nodeRole` (`root-cause`, `failure`, `impact`, `hypothesis`), `hypothesisState`, `impactMetrics`, and `edgeLabel`
- `ChainLayout` for horizontal/vertical flow with edge labels and collapse behavior
- `DecisionTreeVariantConfig` with `renderVariant: 'tree' | 'impact-chain'`

**D: Faceted Attention Filtering** (`@phozart/phz-shared/types` + `@phozart/phz-shared/coordination`):
- `filterAttentionItems()` — pure filter function over attention items by priority, source, artifact, acknowledged state, and date range
- `computeAttentionFacets()` — computes facet counts for sidebar display
- `AttentionFacetedState` coordination state with `toggleFacetValue()`, `clearFacet()`, `acknowledgeItem()`, `setAttentionSort()`, `getVisibleItems()`

### CellRendererRegistry Pattern

The `CellRendererRegistry` uses runtime registration to break build-time
circular dependencies. The grid package defines the registry interface and
creates an empty registry. Shell packages populate it with renderers at mount
time:

```typescript
import { createCellRendererRegistry } from '@phozart/phz-shared/types';

// Create at app init
const cellRenderers = createCellRendererRegistry();

// Register renderers (from widgets package or custom)
cellRenderers.register('sparkline', sparklineRenderer);
cellRenderers.register('gauge-arc', gaugeArcRenderer);
cellRenderers.register('delta', deltaRenderer);
cellRenderers.register('value-only', valueOnlyRenderer);

// Pass to grid component
<phz-grid .cellRendererRegistry=${cellRenderers} ...></phz-grid>
```

Grid columns reference renderers by type key in their `MicroWidgetCellConfig`.
The grid calls `registry.get(config.widgetType)` at render time. If a renderer
is not registered, the cell falls back to plain text display.

### Python Package (`@phozart/phz-python`)

Install via `pip install phz-grid`. The Python package provides a `Grid` anywidget class
that renders the phz-grid Web Component inside Jupyter notebooks, Panel apps, and Streamlit apps.

**Key modules** (in `packages/python/src/phz_grid/`):

- **`_grid.py`** — `Grid` class (extends `anywidget.Widget`). Accepts `data` as pandas DataFrame,
  polars DataFrame, PyArrow Table, or list of dicts. All data is serialized to Arrow IPC bytes
  for zero-copy transfer to the browser.
- **`_column.py`** — `Column` dataclass for column configuration. Fields: `field`, `header`,
  `width`, `min_width`, `max_width`, `type`, `sortable`, `filterable`, `editable`, `resizable`,
  `frozen`, `priority`, `formatter`, `cell_class`.
- **`_theme.py`** — `Theme` object for custom theme configuration.

**Data format support**: pandas, polars, PyArrow, and plain `list[dict]` are all auto-converted
to Arrow IPC internally.

**Event callbacks** for interactivity:
- `grid.on_selection_change(callback)` — selection changes
- `grid.on_sort_change(callback)` — sort state changes
- `grid.on_filter_change(callback)` — filter state changes
- `grid.on_cell_edit(callback)` — cell edits
- `grid.on_cell_click(callback)` — cell clicks

**Read-back state**: `grid.selected_rows`, `grid.sort_state`, `grid.filter_state`,
`grid.edit_history` are synced traits that update automatically from the browser.

```python
from phz_grid import Grid, Column

grid = Grid(
    data=df,
    columns=[
        Column(field="name", header="Name"),
        Column(field="revenue", header="Revenue", type="currency"),
    ],
    height="500px",
    theme="dark",
    selection_mode="multi",
)
grid  # display in Jupyter
```

---

## Core Concepts

### State Management

```typescript
import { createGrid } from '@phozart/phz-core';

const grid = createGrid({
  columns: [
    { field: 'name', header: 'Name' },
    { field: 'revenue', header: 'Revenue', type: 'number' },
  ],
  data: myData,
  initialState: {
    sort: { field: 'revenue', direction: 'desc' },
  },
});

// Access state
const state = grid.getState();

// Update state
grid.setState({ sort: { field: 'name', direction: 'asc' } });

// Subscribe with selector (granular, equality-checked)
const unsub = grid.subscribeSelector(
  (state) => state.sort,
  (sort) => console.log('Sort changed:', sort),
);
```

**Tiered Attention** — `setState(patch, { priority })`:
- `'immediate'` — synchronous update (user interactions)
- `'deferred'` — microtask batching (programmatic updates)
- `'background'` — setTimeout (analytics, telemetry)

### Grid Lifecycle

```typescript
// Full lifecycle (browser)
const grid = createGrid(config);

// Split lifecycle (worker-safe)
const prepared = prepareGrid(config);  // Pure, no DOM
const grid = activateGrid(prepared);   // Needs main thread
```

### Views

```typescript
// ViewsManager is a peer to StateManager
const view = grid.saveView('My View');
grid.loadView(view.id);  // Returns LoadViewResult
grid.deleteView(view.id);
grid.setDefaultView(view.id);

// GridPresentation — unified visual config
const presentation = mergePresentation(base, overrides);
```

### Filter Expressions

```typescript
import { evaluateFilterExpression, normalizeFiltersToExpression } from '@phozart/phz-core';

// AST-based filter (AND/OR/NOT)
const expr = {
  type: 'and',
  children: [
    { type: 'condition', field: 'region', operator: 'equals', value: 'US' },
    { type: 'condition', field: 'revenue', operator: 'greaterThan', value: 50000 },
  ],
};

const filtered = data.filter(row => evaluateFilterExpression(expr, row));

// Backward compat: convert legacy filters to expression
const expr = normalizeFiltersToExpression(legacyFilters);
```

### Query Planner

```typescript
// Determines optimal engine for each pipeline stage
const plan = buildQueryPlan(capabilities);
// capabilities: { canFilter, canSort, canAggregate, canGroup }
// Returns: QueryPlan with engine selection per stage (js/duckdb/server)
```

### Controller Architecture (Grid Package)

17 Lit Reactive Controllers extracted from God Object decomposition:

| Controller | Responsibility |
|-----------|----------------|
| GridCoreController | GridApi lifecycle, state binding |
| VirtualScrollController | Row virtualization, scroll position |
| SelectionController | Row/cell selection, range select |
| ClipboardController | Copy/paste operations |
| ExportController | CSV/Excel export |
| GroupController | Row grouping, expand/collapse |
| ColumnChooserController | Column visibility picker |
| ConditionalFormattingController | Cell styling rules |
| ContextMenuController | Right-click command bus |
| FilterPopoverController | Column filter UI |
| ColumnResizeController | Drag-to-resize columns |
| SortController | Header click sorting |
| EditController | Cell editing |
| KeyboardController | Keyboard navigation |
| A11yController | ARIA attributes, live regions |
| ThemeController | Theme/density application |
| ToolbarController | Toolbar actions |

---

## BI Engine Reference

### BIEngine Facade

```typescript
import { createBIEngine } from '@phozart/phz-engine';

const engine = createBIEngine({
  initialDataProducts: [...],
  initialKPIs: [...],
  initialMetrics: [...],
  initialReports: [...],
  initialDashboards: [...],
  computeBackend: myDuckDBBackend,  // optional, default: JSComputeBackend
  enableMetrics: true,              // optional: performance monitoring
});
```

**Sub-systems accessible via engine:**
- `engine.dataProducts` — DataProductRegistry
- `engine.kpis` — KPIRegistry
- `engine.metrics` — MetricCatalog
- `engine.reports` — ReportConfigStore
- `engine.dashboards` — DashboardConfigStore
- `engine.criteria` — CriteriaEngine
- `engine.status` — { compute(), computeDelta(), classify() }
- `engine.computeBackend` — ComputeBackend

### KPI System

```typescript
// Register
engine.kpis.register({
  id: kpiId('total-revenue'),
  name: 'Total Revenue',
  target: 1000000,
  unit: 'currency',           // percent | count | duration | currency | custom
  direction: 'higher_is_better', // or 'lower_is_better'
  thresholds: { ok: 90, warn: 70 },
  deltaComparison: 'previous_period',
  breakdowns: [
    { id: 'us', label: 'United States', targetOverride: 500000 },
  ],
  dataSource: { scoreEndpoint: '/api/kpi/revenue/score' },
});

// Compute
const status = engine.status.compute(850000, kpi);
// → { status: 'ok'|'warn'|'crit'|'unknown', value, threshold, percentage }

const delta = engine.status.computeDelta(850000, 780000, kpi);
// → { value: 70000, percentage: 8.97, direction: 'improving' }
```

### Metrics

```typescript
// Simple
engine.metrics.register({
  id: metricId('avg-deal'),
  formula: { type: 'simple', field: 'deal_value', aggregation: 'avg' },
});

// Conditional
{ type: 'conditional', field: 'revenue', condition: 'region === "US"', aggregation: 'sum' }

// Composite (references other metrics)
{ type: 'composite', expression: '{total-revenue} / {rep-count}', fields: [...] }

// Expression (full AST)
{ type: 'expression', expression: myExpressionNode }
```

### Reports

```typescript
const report = engine.reports.createBlank('Sales Report');
report.dataProductId = dataProductId('sales');
report.columns = [
  { field: 'region', header: 'Region', visible: true },
  { field: 'revenue', header: 'Revenue', width: 150 },
];
report.sort = { field: 'revenue', direction: 'desc' };
report.aggregation = { fields: [{ field: 'revenue', functions: ['sum', 'avg'] }] };
engine.reports.save(report);

// Convert to grid config
const gridConfig = engine.reports.toGridConfig(report);
// → { columns, sort, filter, presentation }
```

### Dashboards

```typescript
const dashboard = {
  id: dashboardId('sales-ops'),
  name: 'Sales Operations',
  layout: { columns: 12, rowHeight: 80, gap: 16 },
  widgets: [
    { id: widgetId('kpi'), type: 'kpi-card', position: { row: 0, col: 0 },
      size: { colSpan: 3, rowSpan: 2 }, kpiId: kpiId('revenue') },
    { id: widgetId('chart'), type: 'bar-chart', position: { row: 0, col: 3 },
      size: { colSpan: 9, rowSpan: 4 }, dataProductId: dataProductId('sales'),
      metricField: 'revenue', dimension: 'region' },
  ],
};
engine.dashboards.save(dashboard);
```

### 5-Layer Expression DAG

```
Fields → Parameters → Calculated Fields → Metrics → KPIs
```

- **ExpressionNode** AST: field_ref, param_ref, metric_ref, calc_ref, literal, unary, binary, conditional, function call
- **Functions**: ABS, ROUND, FLOOR, CEIL, UPPER, LOWER, TRIM, LEN, YEAR, MONTH, DAY, COALESCE, IF, CLAMP
- **Compiler** (closure-based, 5-10x faster than tree-walk):
  ```typescript
  const fn = compileRowExpression(ast);
  const result = fn({ row, params, calculatedValues });
  ```

### Aggregation & Pivot

```typescript
// Aggregation
const result = engine.aggregate(rows, {
  fields: [{ field: 'revenue', functions: ['sum', 'avg', 'max'] }],
});

// Pivot
const pivot = engine.pivot(rows, {
  rowFields: ['region'],
  columnFields: ['quarter'],
  valueField: 'revenue',
  aggregation: 'sum',
});
// → { rowHeaders, columnHeaders, cells, grandTotals }
```

### Compute Backend

```typescript
interface ComputeBackend {
  aggregate(data, config): Promise<AggregationResult>;
  pivot(data, config): Promise<PivotResult>;
  filter(data, criteria): Promise<data>;
  computeCalculatedFields(data, fields): Promise<data>;
}
```

Default: `JSComputeBackend` (pure JS). Replace with DuckDB or server backend.

### Window Functions

The engine provides 9 window functions in `packages/engine/src/window-functions.ts`. All functions
accept an optional `partitionBy` parameter for grouped calculations, and most accept `orderField`
for deterministic ordering.

| Function | Output Field | Description |
|----------|-------------|-------------|
| `runningSum` | `_runningSum` | Cumulative sum over ordered rows |
| `runningAvg` | `_runningAvg` | Cumulative average over ordered rows |
| `movingAverage` | `_movingAvg` | Sliding window average (configurable `windowSize`) |
| `movingSum` | `_movingSum` | Sliding window sum (configurable `windowSize`) |
| `rank` | `_rank` | Dense rank (supports `'asc'` or `'desc'` order) |
| `percentRank` | `_percentRank` | Percent rank (0 to 1) |
| `lag` | `_lag` | Value from a previous row (configurable `offset`, optional `defaultValue`) |
| `lead` | `_lead` | Value from a subsequent row (configurable `offset`, optional `defaultValue`) |
| `rowNumber` | `_rowNumber` | 1-based sequential row number |

```typescript
import { runningSum, movingAverage, rank } from '@phozart/phz-engine';

// Running total of revenue, ordered by date
const withRunning = runningSum(rows, 'revenue', 'date');
// → each row gains _runningSum field

// 3-period moving average, partitioned by region
const withMA = movingAverage(rows, 'revenue', 3, 'date', 'region');
// → each row gains _movingAvg, calculated within its region partition

// Rank by revenue (highest first)
const ranked = rank(rows, 'revenue', 'desc');
// → each row gains _rank (1 = highest revenue)
```

### Filter System (CriteriaEngine)

Two entry points, one unified system:

| Mode | How | When |
|------|-----|------|
| **Inline** | `reportConfig.criteriaConfig` | Simple, code-first |
| **Registry** | `FilterRegistry` + `FilterBindingStore` | Admin-managed, reusable |
| **Auto-Hydration** | Inline → registry on load | Backward compat (automatic) |

```typescript
// Report service manages filter state
const service = createReportService(engine, reportId);
service.getFields();         // SelectionFieldDef[]
service.setValue('region', ['US']);
service.subscribe((params) => { /* re-filter */ });
service.getFilterParams();   // { fields, values, criteria, isComplete, source }
```

### Widget Resolver

```typescript
// Transforms widget config → render-ready props
const props = resolveWidgetProps(widgetConfig, {
  engine, data, scoreProvider, schema, dataModel, paramValues,
});

// Data processing pipeline
const processed = processWidgetData(rows, {
  filters, groupBy, aggregations, sort, limit,
});
// → { rows: ProcessedRow[], totals }
```

### Drill-Through

```typescript
const action = engine.resolveDrill({
  source: 'chart',  // chart | kpi | scorecard | grid | pivot
  sourceField: 'region',
  sourceValue: 'US',
});
// → { targetReportId, filters: { region: 'US' } }
```

---

## Widget Components

### Available Widgets

The widgets package contains **22 component files** in `packages/widgets/src/components/`.
Of these, **13 widget types** are available in the authoring library's drag-and-drop UI palette
(via `getWidgetLibrary()` in `widget-library.ts`). The remaining types are available for
programmatic use: scatter-chart, heatmap, waterfall-chart, funnel-chart, bottom-n, status-table,
alert-panel, query-builder, selection-bar, and view-manager. To add any of these to the
editor palette, register them via `ManifestRegistry` (see [Extending the Workspace](#extending-the-workspace)).

| Type | Component | Config Fields |
|------|-----------|---------------|
| kpi-card | `<phz-kpi-card>` | kpiDefinition, value, previousValue, trendData, cardStyle |
| kpi-scorecard | `<phz-kpi-scorecard>` | kpiDefinitions[], scores[], breakdowns |
| gauge | `<phz-gauge>` | value, min, max, thresholds[], label, unit |
| bar-chart | `<phz-bar-chart>` | data, rankOrder, maxBars, mode (simple/grouped/stacked) |
| line-chart | `<phz-line-chart>` | series[], xAxisType, showGrid, showLegend |
| area-chart | `<phz-area-chart>` | series[], stacked, colors[] |
| pie-chart | `<phz-pie-chart>` | data[], donut, innerRadius, outerRadius |
| scatter-chart | `<phz-scatter-chart>` | data[], bubbleMode, minSize, maxSize |
| heatmap | `<phz-heatmap>` | data[], colorScale, showLabels |
| waterfall | `<phz-waterfall-chart>` | data[], showConnectors |
| funnel | `<phz-funnel-chart>` | data[], showPercentages, showConversions |
| trend-line | `<phz-trend-line>` | data, target, periods, kpiDefinition |
| bottom-n | `<phz-bottom-n>` | data[], metricField, dimensionField, n, direction |
| status-table | `<phz-status-table>` | data[], entityField, kpiDefinitions[] |
| drill-link | `<phz-drill-link>` | targetReportId, filterMapping |
| dashboard | `<phz-dashboard>` | config, engine, data, scoreProvider, filterAdapter |
| widget | `<phz-widget>` | config, data, engine (standalone widget router) |

### Widget Usage

```typescript
// Dashboard (renders all widgets)
<phz-dashboard .config=${dashboardConfig} .engine=${engine} .data=${data}>
</phz-dashboard>

// Individual widget
<phz-kpi-card
  .kpiDefinition=${{ id: 'rev', name: 'Revenue', unit: 'currency', target: 100000 }}
  .value=${85000}
  .previousValue=${80000}
  .trendData=${[75000, 78000, 82000, 85000]}
  .cardStyle=${'expanded'}
></phz-kpi-card>
```

### Theming

```typescript
import { applyTheme, darkTheme, lightTheme, highContrastTheme } from '@phozart/phz-widgets';

applyTheme(dashboardElement, darkTheme);
// Sets: --phz-surface, --phz-text, --phz-border, --phz-accent,
//       --phz-success, --phz-warning, --phz-critical,
//       --phz-chart-0 through --phz-chart-7
```

### Widget Export

```typescript
import { exportToCSV, exportToClipboard, exportToImage } from '@phozart/phz-widgets';

exportToCSV(data, columns, 'report.csv');
await exportToClipboard(data, columns);
await exportToImage(chartElement, 'chart.png');
```

### Pure Logic Exports (for testing)

Every widget exports its computation as pure functions:
- `computeStackedSegments()`, `computeGroupedBars()` (bar chart)
- `valueToAngle()`, `detectThresholdZone()`, `describeArc()` (gauge)
- `computeHeatmapCells()`, `interpolateColor()` (heatmap)
- `computeWaterfallBars()` (waterfall)
- `computeFunnelStages()` (funnel)
- `scalePoints()`, `buildAreaPath()` (area chart)

---

## Criteria & Filters

### UI Components

| Component | Tag | Use Case |
|-----------|-----|----------|
| SelectionCriteria | `<phz-selection-criteria>` | Full bar + drawer (recommended) |
| CriteriaPanel | `<phz-criteria-panel>` | Simple inline panel |
| CriteriaBar | `<phz-criteria-bar>` | Horizontal summary bar |
| FilterDrawer | `<phz-filter-drawer>` | Right-side slide-out (520px) |
| FilterDesigner | `<phz-filter-designer>` | Admin: definition + rule + preset CRUD |
| FilterConfigurator | `<phz-filter-configurator>` | Admin: bind filters to artefacts |

### Field Types

| Type | Component | Features |
|------|-----------|----------|
| date_range | `<phz-date-range-picker>` | Calendar, quick presets, fiscal support, granularity tabs |
| tree_select | `<phz-tree-select>` | Hierarchical, tri-state checkboxes, search, expand-to-modal |
| chip_group | `<phz-chip-select>` | Pill-based toggleable options |
| single_select | Native `<select>` | Dropdown |
| numeric_range | `<phz-numeric-range-input>` | Min/max + slider, unit display |
| search | `<phz-searchable-dropdown>` | Type-ahead, debounced, keyboard nav |
| field_presence | `<phz-field-presence-filter>` | has_value / empty / any cycling |
| text | Native `<input>` | Free-text |

### Usage

```typescript
<phz-selection-criteria
  .config=${criteriaConfig}
  .data=${rawData}
  .presets=${savedPresets}
  @criteria-apply=${(e) => {
    const context = e.detail.context; // SelectionContext
    reportService.setValues(context);
  }}
  @criteria-reset=${() => reportService.reset()}
></phz-selection-criteria>
```

---

## Definitions & Serialization

### GridDefinition (root type)

```typescript
interface GridDefinition extends DefinitionIdentity {
  dataSource: LocalDataSource | UrlDataSource | DataProductDataSource | DuckDBQueryDataSource;
  columns: DefinitionColumnSpec[];
  defaults?: DefinitionDefaults;     // sort, filters, groupBy, column state
  formatting?: DefinitionFormatting; // conditional rules
  behavior?: DefinitionBehavior;     // density, editMode, selectionMode
  views?: ViewCollection;            // saved named views
  access?: DefinitionAccess;         // public/private/role-restricted
  metadata?: Record<string, unknown>;
}
```

### Round-Trip Serialization

```typescript
import { gridConfigToDefinition, definitionToGridConfig,
  exportDefinition, importDefinition } from '@phozart/phz-definitions';

// Capture live config → definition
const def = gridConfigToDefinition(gridConfig, { name: 'My Report' });

// Export as JSON (with versioned envelope)
const json = exportDefinition(def);

// Import (auto-migrate + validate)
const restored = importDefinition(json);

// Inflate back to live config
const config = definitionToGridConfig(restored);
```

### Stores

```typescript
import { createInMemoryStore, createLocalStorageStore } from '@phozart/phz-definitions';

const store = createLocalStorageStore({ prefix: 'phz-def:' });
store.save(def);
store.load(def.id);
store.list();        // DefinitionMeta[] (fast listing)
store.duplicate(def.id, { name: 'Copy' });
store.delete(def.id);
```

### Validation

```typescript
import { validateDefinition } from '@phozart/phz-definitions';

const result = validateDefinition(def);
if (!result.valid) {
  result.errors.forEach(e => console.error(`${e.path}: ${e.message}`));
}
```

### Definition Migrations

The `definitions` package includes a schema migration system for upgrading saved definitions
across versions. The migration logic lives in `packages/definitions/src/migration/migrate.ts`.

- **`CURRENT_SCHEMA_VERSION`** — currently `'1.0.0'` (from `migration/versions.ts`)
- **`MIGRATIONS`** record — currently empty, ready for future schema changes. Each entry maps
  a version string to a `(def: GridDefinition) => GridDefinition` migrator function.
- **`migrateDefinition(def)`** — pure function that takes a `GridDefinition` and returns a
  migrated copy at `CURRENT_SCHEMA_VERSION`. Applies all registered migrations in version order.
  If the definition has no `schemaVersion`, it is assumed to be current.

Consumers should always call `migrateDefinition()` when loading saved definitions to ensure
forward compatibility:

```typescript
import { migrateDefinition } from '@phozart/phz-definitions';

const raw = JSON.parse(savedJson);
const migrated = migrateDefinition(raw);
// migrated.schemaVersion === '1.0.0'
```

---

## Admin Panels

### PhzGridAdmin

```typescript
<phz-grid-admin
  .open=${showAdmin}
  .reportId=${'my-report'}
  .columns=${myColumns}
  @settings-auto-save=${(e) => persist(e.detail.settings)}
  @admin-close=${() => setShowAdmin(false)}
></phz-grid-admin>

// Programmatic access
const settings = admin.getSettings();  // ReportPresentation
admin.setSettings(savedPresentation);
```

**Tabs**: Table Settings | Columns | Formatting | Filters | Export | Theme | Views | Data Source | Criteria

### PhzEngineAdmin

**Designers**: ReportDesigner (6-step) | KPIDesigner (6-step) | DashboardBuilder (3-panel) | MetricBuilder | PivotDesigner | FilterStudio

**Events**: `report-save`, `kpi-save`, `dashboard-save`, `metric-save`

### SaveController

```typescript
import { SaveController } from '@phozart/phz-engine-admin';

// States: idle → saving → saved (auto-dismiss 3s) → idle
//                       → error (manual dismiss/retry)

class MyAdmin extends LitElement {
  private save = new SaveController(this);
  async handleSave() {
    await this.save.save(async () => { await api.persist(this.config); });
  }
}
```

### Grid Creator Wizard

```
Step 0: Report Identity (name, description) — required
Step 1: Data Source (data product picker) — required
Step 2: Column Selection — required
Step 3: Configuration — optional
Step 4: Review & Create — required
```

```typescript
<phz-grid-creator
  .open=${true}
  @grid-definition-create=${(e) => {
    const payload = e.detail; // { name, description, dataProductId, columns, config }
  }}
></phz-grid-creator>
```

---

## Authoring Module Architecture

The authoring module lives at `packages/workspace/src/authoring/` and is
exported via `@phozart/phz-workspace/authoring`. It implements a "Tableau
meets AG Grid" authoring experience for building reports and dashboards.

### Architecture Pattern

All business logic is pure functions with immutable state. Lit Web Components
are thin view layers that call pure functions and re-render. This makes all
logic testable in Node without DOM.

```
┌──────────────────────────────────────────────────────────┐
│  Lit Components        phz-artifact-catalog,              │
│  (thin views)          phz-report-editor,                 │
│                        phz-dashboard-editor, etc.          │
├──────────────────────────────────────────────────────────┤
│  Pure State Functions  State machines, undo managers,     │
│  (no side effects)     context menus, drag-drop, filters  │
└──────────────────────────────────────────────────────────┘
```

### State Machines

Four pure state machines govern authoring flow. All transitions are immutable
functions returning a new state object.

**AuthoringState** (`authoring-state.ts`) — top-level mode machine:

```typescript
import {
  initialAuthoringState,
  startCreation,
  openArtifact,
  markDirty,
  markSaved,
  returnHome,
  canTransitionTo,
} from '@phozart/phz-workspace/authoring';

// Start at home
let state = initialAuthoringState();
// → { mode: 'home', dirty: false, publishStatus: 'draft' }

// Begin creating a report
state = startCreation(state, 'report');
// → { mode: 'creating', artifactType: 'report', dirty: false, ... }

// Open an existing dashboard for editing
state = openArtifact(state, 'dash-123', 'dashboard');
// → { mode: 'editing-dashboard', artifactId: 'dash-123', ... }

// Guard transitions — warns if dirty
state = markDirty(state);
canTransitionTo(state, 'home');  // → false (unsaved changes)

state = markSaved(state);
canTransitionTo(state, 'home');  // → true
state = returnHome(state);
```

**CatalogState** (`catalog-state.ts`) — search, tag filtering, type filter,
sorting for the home/catalog view.

**CreationFlowState** (`creation-flow.ts`) — 5-step wizard:
choose-type, choose-source, choose-template, configure, done. Reports
auto-skip the choose-template step.

**PublishState** (`publish-workflow.ts`) — enforces draft → review →
published transitions with history tracking:

```typescript
import { initialPublishState, submitForReview, approve, reject } from '@phozart/phz-workspace/authoring';

let pub = initialPublishState();  // → { status: 'draft', history: [] }
pub = submitForReview(pub, 'alice');  // → { status: 'review', ... }
pub = approve(pub, 'bob');           // → { status: 'published', ... }
// pub.history has 2 entries with from/to/at/by fields
```

### Report Authoring

**ReportEditorState** (`report-editor-state.ts`) — manages columns, filters,
sorting, grouping, conditional formatting, and density for a configured
`<phz-grid>`:

| Function | Purpose |
|----------|---------|
| `addColumn(state, field, label?)` | Add a column (no duplicates) |
| `removeColumn(state, field)` | Remove by field name |
| `reorderColumns(state, from, to)` | Drag-reorder |
| `updateColumn(state, field, updates)` | Partial update (width, format, etc.) |
| `toggleColumnVisibility(state, field)` | Show/hide |
| `pinColumn(state, field, side?)` | Pin left/right or unpin |
| `setSorting(state, sorting)` | Multi-column sort |
| `setGrouping(state, fields)` | Group-by fields |
| `addConditionalFormat(state, rule)` | Add formatting rule |
| `toGridConfig(state)` | Convert to phz-grid compatible config |

**Context Menus** (`report-context-menu.ts`) — pure functions that generate
`ContextMenuItem[]` based on editor state and click target:

```typescript
import { getColumnHeaderMenu, getCellMenu, getSelectionMenu } from '@phozart/phz-workspace/authoring';

const items = getColumnHeaderMenu(editorState, 'revenue');
// → Sort Asc/Desc, Group By, Pin Left/Right, Hide, Add Filter, Conditional Formatting...

const cellItems = getCellMenu(editorState, { type: 'cell', field: 'region', rowIndex: 0, value: 'US' });
// → Copy Value, Filter by "US", Exclude "US", View Data
```

**Labeled Undo/Redo** (`report-undo.ts`) — wraps UndoManager with
human-readable action labels:

```typescript
import { createReportUndoManager, initialReportEditorState, addColumn } from '@phozart/phz-workspace/authoring';

let state = initialReportEditorState('Sales Report', 'ds-sales');
const undo = createReportUndoManager(state, { maxHistory: 50 });

// Every mutation is labeled
state = addColumn(state, 'revenue', 'Revenue');
undo.execute(state, 'Add column: Revenue');

state = addColumn(state, 'region', 'Region');
undo.execute(state, 'Add column: Region');

// Undo returns previous state
const prev = undo.undo();  // → state with only 'revenue' column
undo.canUndo;    // → true
undo.canRedo;    // → true
undo.history;    // → [{ label: 'Add column: Revenue', timestamp }, ...]
```

**Auto-Save** (`auto-save.ts`) — debounced save with status tracking
(idle/dirty/saving/saved/error):

```typescript
import { createAutoSave } from '@phozart/phz-workspace/authoring';

const autoSave = createAutoSave({
  debounceMs: 2000,
  getState: () => currentEditorState,
});

autoSave.onSave(async (state) => {
  await api.saveReport(state);
});

// Call on every state change — auto-debounces
autoSave.markDirty();
autoSave.status;       // → 'dirty', then 'saving', then 'saved'
autoSave.lastSavedAt;  // → timestamp after save completes

// Pause during bulk operations
autoSave.pause();
autoSave.resume();
autoSave.dispose();
```

### Dashboard Authoring

**DashboardEditorState** (`dashboard-editor-state.ts`) — canvas-based
dashboard building with widget CRUD, morph groups, and positioning:

| Function | Purpose |
|----------|---------|
| `addWidget(state, type, position?)` | Add widget to canvas |
| `removeWidget(state, widgetId)` | Remove widget |
| `moveWidget(state, widgetId, position)` | Reposition on grid |
| `resizeWidget(state, widgetId, span)` | Change colSpan/rowSpan |
| `morphWidget(state, widgetId, newType)` | Change type within morph group |
| `duplicateWidget(state, widgetId)` | Clone with offset position |
| `selectWidget(state, widgetId)` | Select + open config panel |
| `deselectWidget(state)` | Deselect + close config panel |
| `updateWidgetConfig(state, id, updates)` | Partial config update |
| `updateWidgetData(state, id, dataConfig)` | Update dimensions/measures/filters |

**Morph Groups** — widgets in the same group can be converted without losing
data configuration:

| Group | Widget Types |
|-------|-------------|
| `category-chart` | bar-chart, line-chart, area-chart, pie-chart |
| `single-value` | kpi-card, gauge, kpi-scorecard, trend-line |
| `tabular` | data-table, pivot-table |
| `text` | text-block, heading |
| `navigation` | drill-link |

```typescript
import { morphWidget, addWidget, initialDashboardEditorState } from '@phozart/phz-workspace/authoring';

let state = initialDashboardEditorState('Sales Dashboard', 'ds-sales');
state = addWidget(state, 'bar-chart', { row: 0, col: 0, colSpan: 4, rowSpan: 3 });

const widgetId = state.widgets[0].id;

// Morph bar-chart → line-chart: dataConfig (dimensions/measures) survives the type change
state = morphWidget(state, widgetId, 'line-chart');
// → widget.type is now 'line-chart', widget.dataConfig is unchanged
// → widget.morphGroup is 'category-chart'

// Cross-group morph is a no-op
state = morphWidget(state, widgetId, 'kpi-card');
// → state unchanged (line-chart and kpi-card are in different morph groups)
```

**Drag-and-Drop** (`drag-drop-state.ts`) — `DragSource` and `DropTarget`
discriminated unions with pure execution:

| DragSource Type | Valid Drop Targets |
|----------------|-------------------|
| `field-palette` | canvas-cell, widget-data-zone, filter-bar |
| `widget-library` | canvas-cell |
| `existing-widget` | canvas-cell, widget-swap |
| `filter-chip` | filter-bar |

```typescript
import { computeValidTargets, executeDrop } from '@phozart/phz-workspace/authoring';

const source = { type: 'field-palette' as const, field: 'revenue', dataType: 'number' };
const targets = computeValidTargets(source, dashboardState);
// → [canvas-cell, widget-data-zone (per widget), filter-bar]

// Drop a numeric field on the canvas → auto-creates a kpi-card
const newState = executeDrop(dashboardState, source, { type: 'canvas-cell', row: 0, col: 0 });
```

**Dashboard Undo** (`dashboard-undo.ts`) — mirrors ReportUndoManager with
`createDashboardUndoManager()`.

### Config & Filters

**WidgetConfigPanelState** (`widget-config-state.ts`) — 3-tab configuration
panel (data/style/filters) with apply-back to the widget:

```typescript
import { createConfigForWidget, updateStyleConfig, applyConfigToWidget } from '@phozart/phz-workspace/authoring';

// Open config for a widget
let config = createConfigForWidget(widget);
// → { activeTab: 'data', dimensions, measures, title, colorScheme, ... }

// Update style
config = updateStyleConfig(config, { title: 'Revenue by Region', showLegend: true });

// Apply config back to widget state
const updatedWidget = applyConfigToWidget(config, widget);
```

**Filter Authoring** (`filter-authoring.ts`) — 5 `FilterEntryPoint` types
that all produce the same `FilterValue` output:

```typescript
import { inferFilterDefaults, createFilterFromEntry, finalizeFilter } from '@phozart/phz-workspace/authoring';

// Type-based defaults
inferFilterDefaults('date');
// → { operator: 'between', uiType: 'date-range' }

inferFilterDefaults('string', 'low');
// → { operator: 'in', uiType: 'select' }

inferFilterDefaults('number');
// → { operator: 'between', uiType: 'numeric-range' }

// Create from context menu → auto-uses 'equals' with prefilled value
const creation = createFilterFromEntry('context-menu-filter-by-value', 'region', 'string', 'US');
const filter = finalizeFilter(creation);
// → { filterId: '...', field: 'region', operator: 'equals', value: 'US', label: 'region: US' }
```

**Template Selection** (`template-selection.ts`) — orchestrates the schema
analysis → template matching → field auto-binding pipeline:

```typescript
import { suggestTemplatesForSource, applyTemplate } from '@phozart/phz-workspace/authoring';

// 1. Get ranked template suggestions for a data source schema
const suggestions = suggestTemplatesForSource(schema);
// → [{ template, score, rationale, previewDescription }, ...]
// sorted by score, filtered to score > 0

// 2. Apply a template → produces a ready-to-edit DashboardEditorState
const dashState = applyTemplate(suggestions[0].template, schema, 'ds-sales');
// → DashboardEditorState with widgets populated from template slots,
//   field bindings auto-resolved from schema analysis
```

The pipeline internally calls:
1. `analyzeSchema(schema)` — profiles fields into dimensions, measures,
   time-series detection
2. `matchTemplates(profile, templates)` — scores each template against
   the field profile using `matchRules`
3. `autoBindFields(slots, profile)` — maps template field placeholders
   to actual schema fields
4. `resolveBindings(slots, bindings)` — produces final field assignments
   per widget slot

### Cross-Cutting Utilities

**Keyboard Shortcuts** (`keyboard-shortcuts.ts`) — platform-aware shortcut
matching (Cmd on macOS, Ctrl elsewhere) with 9 default bindings:

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z | Redo |
| Ctrl/Cmd+Y | Redo |
| Ctrl/Cmd+S | Save |
| Ctrl/Cmd+D | Duplicate Widget |
| Delete / Backspace | Delete Widget |
| Escape | Deselect / Close Panel |
| Ctrl/Cmd+A | Select All Widgets |

```typescript
import { matchShortcut, DEFAULT_AUTHORING_SHORTCUTS, formatShortcut } from '@phozart/phz-workspace/authoring';

const action = matchShortcut(DEFAULT_AUTHORING_SHORTCUTS, keyboardEvent, 'mac');
// → 'undo' | 'save' | 'delete-widget' | ... | null

// Display shortcut labels
formatShortcut({ key: 's', ctrl: true, action: 'save', label: 'Save' }, 'mac');
// → '⌘S'
```

**Widget Library** (`widget-library.ts`) — 13 widget entries across 5
categories with morph group consistency:

```typescript
import { getWidgetLibrary, getWidgetsByCategory, getWidgetsInMorphGroup } from '@phozart/phz-workspace/authoring';

const all = getWidgetLibrary();          // 13 entries
const byCategory = getWidgetsByCategory(); // Map<WidgetCategory, WidgetLibraryEntry[]>
const charts = getWidgetsInMorphGroup('category-chart');
// → [bar-chart, line-chart, area-chart, pie-chart]
```

### Lit Components

Six Lit Web Components provide the UI layer. Each is a thin wrapper that
calls the pure state functions and re-renders:

| Component | Tag | Purpose |
|-----------|-----|---------|
| `PhzArtifactCatalog` | `<phz-artifact-catalog>` | Home screen with search, tags, type filter, sorting |
| `PhzCreationWizard` | `<phz-creation-wizard>` | Multi-step creation wizard (type, source, template, configure) |
| `PhzReportEditor` | `<phz-report-editor>` | Toolbar + grid preview + config panel for reports |
| `PhzDashboardEditor` | `<phz-dashboard-editor>` | Field palette + canvas + config panel for dashboards |
| `PhzConfigPanel` | `<phz-config-panel>` | Reusable 3-tab panel (data/style/filters) |
| `PhzContextMenu` | `<phz-context-menu>` | Positioned overlay with keyboard nav + nested submenus |

---

## Three-Shell Architecture

v15 decomposes the single `<phz-workspace>` component into three purpose-built
shells, each targeting a specific persona. The workspace shell remains the admin
experience; two new shells serve analysts and authors.

### Shell Overview

| Shell | Package | Persona | Capabilities |
|-------|---------|---------|-------------|
| **Workspace** | `@phozart/phz-workspace` | Admin | Full configuration: data sources, filters, alerts, navigation, publish, settings, API access |
| **Viewer** | `@phozart/phz-viewer` | Analyst | Read-only consumption: catalog, dashboards, reports, explore, attention, filter bar |
| **Editor** | `@phozart/phz-editor` | Author | Authoring: dashboard editing, report editing, measure palette, sharing, alert/subscription management |

All three shells depend on `@phozart/phz-shared` for adapters, types, design
system, artifact metadata, and runtime coordination. They do NOT depend on each
other.

### Deployment Patterns

| Pattern | Shells | Use Case |
|---------|--------|----------|
| **Viewer-only** | viewer | Embed read-only dashboards in a customer portal |
| **Author + Viewer** | editor + viewer | Self-service BI for business users |
| **Full admin** | workspace + editor + viewer | Complete platform for IT admins |
| **Headless** | none (engine + shared only) | Server-side rendering, API-only |

### Shared Foundation

The `@phozart/phz-shared` package contains:
- **Adapters**: `DataAdapter`, persistence SPIs, `AlertChannelAdapter`, `AttentionAdapter`, `UsageAnalyticsAdapter`, `SubscriptionAdapter`
- **Types**: All shared type definitions (alerts, subscriptions, widgets, filters, API spec, micro-widgets, impact chains, attention)
- **Design System**: tokens, responsive breakpoints, container queries, component patterns, shell layout, alert tokens
- **Artifacts**: `ArtifactVisibility`, `DefaultPresentation`, `PersonalView`, `GridArtifact`
- **Coordination**: `FilterContextManager`, `DashboardDataPipeline`, `InteractionBus`, loading states, execution strategy, async report/export/subscription tab states, expression builder, preview context, attention faceted state

### Workspace State Machines (Wave 5)

The workspace shell gained 15 new state machines for admin features:

| State Machine | Module | Purpose |
|---------------|--------|---------|
| `catalog-dense` | shell | Dense catalog view with bulk actions |
| `creation-wizard` | authoring | Multi-step artifact creation |
| `wide-report` | authoring | Full-width report editing |
| `freeform-grid` | authoring | Freeform dashboard grid layout |
| `data-config-panel` | shell | Data source configuration sidebar |
| `filter-admin` | filters | Filter definition CRUD |
| `filter-value-admin` | filters | Filter value source management |
| `alert-admin` | alerts | Alert rule + breach management |
| `enrichment-admin` | shell | Field metadata enrichment overlay |
| `settings` | govern | Theme, branding, feature flags |
| `command-palette` | shell | Ctrl+K quick search across artifacts and actions |
| `keyboard-shortcuts` | shell | Context-aware shortcut registry with customization |
| `publish-workflow` | authoring | Draft -> review -> published transitions |
| `navigation-config` | navigation | Drill-through link editor with auto-mapping |
| `api-access` | govern | API key management, roles, scopes, rate limiting |

---

## CSS Architecture

### Three-Layer Token System

```
Layer 1: Public API tokens (--phz-*)     ← Consumers override these
Layer 2: Internal computed (--_*)         ← Derived per density/theme
Layer 3: Component styles                ← Reference --_* with fallbacks
```

### Density Modes

Set via `<phz-grid density="compact|dense|comfortable">`. Cascades:
- `--_row-height`, `--_cell-padding`
- `--_cell-overflow` (hidden vs visible)
- `--_cell-white-space` (nowrap vs normal)

### Themes

Set via `<phz-grid theme="light|dark|sand|midnight|high-contrast">`.
Auto dark mode via `prefers-color-scheme: dark`.

### Widget Theming

```css
--phz-surface     /* Card background */
--phz-text         /* Text color */
--phz-border       /* Border color */
--phz-accent       /* Interactive elements */
--phz-success      /* OK status (#16A34A) */
--phz-warning      /* Warning status (#D97706) */
--phz-critical     /* Critical status (#DC2626) */
--phz-chart-0..7   /* Chart color palette */
```

---

## Development Setup

```bash
# Install
npm install

# Build all packages (respects dependency order)
npm run build

# Build single package
npm run build --workspace=packages/grid

# Run tests (5,557 tests across 363 files)
npm test

# Type-check
npm run typecheck         # tsc --noEmit
npx tsc --build           # Full build check (use this, not --noEmit)

# Coverage
npm run test:coverage     # @vitest/coverage-v8
```

### Vitest Aliases (v15)

The monorepo uses path aliases in `vitest.config.ts` so tests can import source
files directly without building first. v15 added aliases for the new packages:

```typescript
// New in v15
'@phozart/phz-shared/adapters'      → packages/shared/src/adapters/index.ts
'@phozart/phz-shared/types'         → packages/shared/src/types/index.ts
'@phozart/phz-shared/design-system' → packages/shared/src/design-system/index.ts
'@phozart/phz-shared/artifacts'     → packages/shared/src/artifacts/index.ts
'@phozart/phz-shared/coordination'  → packages/shared/src/coordination/index.ts
'@phozart/phz-shared'               → packages/shared/src/index.ts
'@phozart/phz-engine/explorer'      → packages/engine/src/explorer/index.ts
'@phozart/phz-viewer/react'         → packages/viewer/src/react/index.ts
'@phozart/phz-viewer'               → packages/viewer/src/index.ts
'@phozart/phz-editor/react'         → packages/editor/src/react/index.ts
'@phozart/phz-editor'               → packages/editor/src/index.ts
```

When adding tests for new modules, ensure sub-path aliases are declared
**before** the bare package alias (more specific patterns must come first).

### Code Conventions

- TypeScript strict mode, ESM-only
- Lit decorators: `@customElement`, `@property`, `@state`
- Vitest for unit/integration, Playwright for e2e
- Prettier for formatting, ESLint for linting

### Test Apps

- `test_app/` — Next.js 15 (integration testing)
- `test/` — Next.js 16 (Turbopack)
- Both use `resolveAlias` in next.config.ts for local packages

> **Note**: After rebuilding a package, restart the dev server. If browser shows "Internal Server Error" after switching Next.js versions, clear browser site data.

---

## Testing Patterns

### Pure Function Testing

All computation is testable without DOM:

```typescript
import { computeStackedSegments } from '@phozart/phz-widgets';
import { computeStatus } from '@phozart/phz-engine';

test('stacked segments sum correctly', () => {
  const segments = computeStackedSegments(point, ['a', 'b'], ['#f00', '#0f0']);
  expect(segments.reduce((s, seg) => s + seg.width, 0)).toBe(100);
});
```

### Coverage Thresholds

```
statements: 55%  |  branches: 70%  |  functions: 50%  |  lines: 55%
```

These thresholds are configured in `vitest.config.ts` using the `istanbul` coverage provider.
The higher branch threshold (70%) is intentional — it ensures correctness of filter expressions,
conditional logic paths, and state machine transitions, which are the most bug-prone areas
of the codebase.

### Known Gotcha

Use `tsc --build` (not `tsc --build --noEmit`) for composite projects — `--noEmit` gives TS6310 false positives.

---

## Key File Locations

| Concept | File |
|---------|------|
| BIEngine facade | `packages/engine/src/engine.ts` |
| KPI definitions | `packages/engine/src/kpi.ts` |
| Metric catalog | `packages/engine/src/metric.ts` |
| Report config | `packages/engine/src/report.ts` |
| Dashboard config | `packages/engine/src/dashboard.ts` |
| Enhanced dashboard (v2) | `packages/engine/src/dashboard-enhanced.ts` — sibling type definition with v2 dashboard format including `globalFilters`, `theme`, `placements`. Not a replacement for `dashboard.ts`; used for enhanced dashboard features |
| Widget types | `packages/engine/src/widget.ts` |
| Widget data processor | `packages/engine/src/widget-data-processor.ts` |
| Widget resolver | `packages/engine/src/widget-resolver.ts` |
| Status computation | `packages/engine/src/status.ts` |
| Aggregation | `packages/engine/src/aggregation.ts` |
| Pivot engine | `packages/engine/src/pivot.ts` |
| Chart projection | `packages/engine/src/chart-projection.ts` |
| Expression compiler | `packages/engine/src/expression-compiler.ts` |
| Expression AST types | `packages/engine/src/expression-types.ts` |
| Criteria engine | `packages/engine/src/criteria/criteria-engine.ts` |
| Filter resolution | `packages/engine/src/criteria/resolve-criteria.ts` |
| Report/Dashboard service | `packages/engine/src/report-service.ts` |
| Compute backend | `packages/engine/src/compute-backend.ts` |
| Drill-through | `packages/engine/src/drill-through.ts` |
| Config merge | `packages/engine/src/config-merge.ts` |
| Dashboard component | `packages/widgets/src/components/phz-dashboard.ts` |
| Widget router | `packages/widgets/src/components/phz-widget.ts` |
| KPI card | `packages/widgets/src/components/phz-kpi-card.ts` |
| Bar chart | `packages/widgets/src/components/phz-bar-chart.ts` |
| Themes | `packages/widgets/src/themes.ts` |
| Widget export | `packages/widgets/src/widget-export.ts` |
| Responsive layout | `packages/widgets/src/responsive-layout.ts` |
| Cross-filter | `packages/widgets/src/cross-filter.ts` |
| Selection criteria | `packages/criteria/src/components/phz-selection-criteria.ts` |
| Filter designer | `packages/criteria/src/components/phz-filter-designer.ts` |
| Grid admin | `packages/grid-admin/src/components/phz-grid-admin.ts` |
| Engine admin | `packages/engine-admin/src/components/phz-engine-admin.ts` |
| Save controller | `packages/engine-admin/src/save-controller.ts` |
| Grid definition type | `packages/definitions/src/types/grid-definition.ts` |
| Converters | `packages/definitions/src/converters/` |
| Zod validation | `packages/definitions/src/validation/schemas.ts` |
| Definition stores | `packages/definitions/src/store/` |
| Wizard state machine | `packages/grid-creator/src/wizard-state.ts` |
| Grid component | `packages/grid/src/components/phz-grid.ts` |
| Create grid | `packages/core/src/create-grid.ts` |
| State manager | `packages/core/src/state.ts` |
| Filter expressions | `packages/core/src/filter-expression.ts` |
| Query planner | `packages/core/src/query-planner.ts` |
| Views manager | `packages/core/src/views.ts` |
| Shared adapters | `packages/shared/src/adapters/index.ts` |
| Shared types | `packages/shared/src/types/index.ts` |
| Design system | `packages/shared/src/design-system/index.ts` |
| Artifact visibility | `packages/shared/src/artifacts/artifact-visibility.ts` |
| Coordination | `packages/shared/src/coordination/index.ts` |
| Micro-widget types | `packages/shared/src/types/micro-widget.ts` |
| Single-value alert | `packages/shared/src/types/single-value-alert.ts` |
| Impact chain types | `packages/shared/src/types/impact-chain.ts` |
| Attention filter | `packages/shared/src/types/attention-filter.ts` |
| Personal alert engine | `packages/engine/src/alerts/personal-alert-engine.ts` |
| Alert evaluation contract | `packages/engine/src/alerts/alert-contract.ts` |
| Subscription engine | `packages/engine/src/subscriptions/subscription-engine.ts` |
| Usage analytics collector | `packages/engine/src/analytics/usage-collector.ts` |
| OpenAPI generator | `packages/engine/src/api/openapi-generator.ts` |
| Attention system | `packages/engine/src/attention/attention-system.ts` |
| Explorer (visual query) | `packages/engine/src/explorer/index.ts` |
| Viewer shell state | `packages/viewer/src/viewer-state.ts` |
| Viewer navigation | `packages/viewer/src/viewer-navigation.ts` |
| Viewer shell config | `packages/viewer/src/viewer-config.ts` |
| Editor shell state | `packages/editor/src/editor-state.ts` |
| Editor navigation | `packages/editor/src/editor-navigation.ts` |
| Editor shell config | `packages/editor/src/editor-config.ts` |
| Command palette state | `packages/workspace/src/shell/command-palette-state.ts` |
| Keyboard shortcuts state | `packages/workspace/src/shell/keyboard-shortcuts-state.ts` |
| Settings state | `packages/workspace/src/govern/settings-state.ts` |
| API access state | `packages/workspace/src/govern/api-access-state.ts` |

---

---

## Extending the Workspace

The `@phozart/phz-workspace` package provides extension points for developers
who want to add custom widgets, data backends, notification channels,
templates, and inter-widget interactions.

### Custom WidgetManifest

> **Note**: Most consumers do not need to interact with the ManifestRegistry directly.
> The workspace ships with a full set of built-in widgets. This section is for advanced
> use cases where you need to register custom widget types.

Register a custom widget type by creating a `WidgetManifest` and registering
it with the `ManifestRegistry`:

```typescript
import { createManifestRegistry } from '@phozart/phz-workspace/registry';
import type { WidgetManifest } from '@phozart/phz-workspace';

const heatmap: WidgetManifest = {
  type: 'heatmap',
  category: 'visualization',
  name: 'Heat Map',
  description: 'Color-coded matrix visualization',
  requiredFields: [
    { name: 'x', dataType: 'string', role: 'dimension', required: true },
    { name: 'y', dataType: 'string', role: 'dimension', required: true },
    { name: 'value', dataType: 'number', role: 'measure', required: true },
  ],
  supportedAggregations: ['sum', 'avg', 'count'],
  minSize: { cols: 3, rows: 3 },
  preferredSize: { cols: 6, rows: 4 },
  maxSize: { cols: 12, rows: 8 },
  supportedInteractions: ['cross-filter', 'drill-through'],
  variants: [
    { id: 'default', name: 'Standard', description: 'Color gradient', presetConfig: {} },
    { id: 'discrete', name: 'Discrete', description: 'Binned colors', presetConfig: { binCount: 5 } },
  ],
  load: async () => ({
    render(config, container, context) { /* render heatmap into container */ },
    update(config, context) { /* update without full re-render */ },
    destroy() { /* cleanup */ },
  }),
};

const registry = createManifestRegistry();
registry.registerManifest(heatmap);
```

Key `WidgetManifest` fields:
- `type` — unique identifier (used in configs)
- `requiredFields` — what data the widget needs (role: measure/dimension/category/time)
- `variants` — named presets with different visual configurations
- `load` — async factory for lazy-loaded renderers
- `responsiveBehavior` — container-width breakpoints for responsive rendering

### Custom DataAdapter

Implement the `DataAdapter` interface to connect any data backend:

```typescript
import type { DataAdapter, DataQuery, DataResult, DataSourceSchema } from '@phozart/phz-workspace';

class PostgresDataAdapter implements DataAdapter {
  async execute(query: DataQuery, context?: { viewerContext?: unknown; signal?: AbortSignal }): Promise<DataResult> {
    const sql = this.buildSQL(query);
    const rows = await this.pool.query(sql, { signal: context?.signal });
    return {
      columns: query.fields.map(f => ({ name: f, dataType: 'string' })),
      rows: rows.map(r => query.fields.map(f => r[f])),
      metadata: { totalRows: rows.length, truncated: false, queryTimeMs: 0 },
    };
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    // Query information_schema for field metadata
  }

  async listDataSources(): Promise<{ id: string; name: string; description?: string }[]> {
    // List available tables/views
  }

  async getDistinctValues(sourceId: string, field: string, options?: { search?: string; limit?: number; filters?: unknown }) {
    // SELECT DISTINCT for filter dropdowns
    return { values: [], totalCount: 0, truncated: false };
  }

  async getFieldStats(sourceId: string, field: string, filters?: unknown) {
    // SELECT MIN, MAX, COUNT(DISTINCT) for range sliders
    return { distinctCount: 0, nullCount: 0, totalCount: 0 };
  }
}
```

The `context?.signal` (AbortSignal) enables query cancellation when filters
change mid-flight. The `context?.viewerContext` passes user attributes for
row-level security — the adapter enforces access, phz-grid never does.

### Custom AlertChannelAdapter

phz-grid defines the `AlertChannelAdapter` interface but ships **zero**
implementations. Consumers build their own notification channels:

```typescript
import type { AlertChannelAdapter, BreachRecord, AlertSubscription } from '@phozart/phz-workspace';

const slackChannel: AlertChannelAdapter = {
  async send(breach: BreachRecord, subscription: AlertSubscription): Promise<void> {
    await fetch(subscription.recipientRef, {
      method: 'POST',
      body: JSON.stringify({
        text: `Alert: ${breach.message} (severity: ${breach.severity})`,
      }),
    });
  },
  async test(): Promise<boolean> {
    // Verify webhook URL is reachable
    return true;
  },
  configSchema: { /* optional schema for auto-form generation */ },
};
```

### Custom Templates

Create reusable dashboard layouts with data binding placeholders:

```typescript
import type { TemplateDefinition, LayoutNode } from '@phozart/phz-workspace';
import { templateId } from '@phozart/phz-workspace';

const customTemplate: TemplateDefinition = {
  id: templateId('my-sales-overview'),
  name: 'Sales Overview',
  description: 'KPI row + trend chart + detail table',
  category: 'overview',
  tags: ['sales', 'kpi', 'trend'],
  builtIn: false,
  layout: {
    kind: 'sections',
    sections: [
      { title: 'Key Metrics', children: [
        { kind: 'auto-grid', minItemWidth: 200, gap: 16, children: [
          { kind: 'widget', widgetId: 'kpi-revenue' },
          { kind: 'widget', widgetId: 'kpi-orders' },
        ]},
      ]},
      { title: 'Trend', children: [
        { kind: 'widget', widgetId: 'revenue-trend' },
      ]},
    ],
  },
  widgetSlots: [
    { slotId: 'kpi-revenue', widgetType: 'kpi-card', defaultConfig: { title: 'Revenue' }, fieldBindings: {} },
    { slotId: 'kpi-orders', widgetType: 'kpi-card', defaultConfig: { title: 'Orders' }, fieldBindings: {} },
    { slotId: 'revenue-trend', widgetType: 'trend-line', defaultConfig: {}, fieldBindings: {} },
  ],
  matchRules: [
    { requiredFieldTypes: [{ type: 'number', semanticHint: 'measure', minCount: 2 }], weight: 1, rationale: 'Needs multiple measures' },
    { requiredFieldTypes: [{ type: 'date', minCount: 1 }], weight: 0.5, rationale: 'Trend needs a date field' },
  ],
};
```

### InteractionBus

Widgets communicate through the `InteractionBus` — a typed pub/sub system:

```typescript
import { createInteractionBus } from '@phozart/phz-workspace';

const bus = createInteractionBus();

// Subscribe to cross-filter events
const unsubscribe = bus.on('cross-filter', (event) => {
  console.log(`Widget ${event.sourceWidgetId} applied filters:`, event.filters);
});

// Emit from a widget
bus.emit({
  type: 'drill-through',
  sourceWidgetId: 'bar-chart-1',
  field: 'region',
  value: 'Europe',
});

// Cleanup
unsubscribe();
```

Event types: `drill-through`, `cross-filter`, `clear-cross-filter`,
`selection-change`, `time-range-change`, `navigate`, `export-request`.

### Contributing

- All code is TypeScript strict mode, ESM-only
- Tests use Vitest (run in Node, no DOM rendering)
- TDD: write test first, then implement
- CSS uses logical properties (`margin-inline-start` not `margin-left`)
- Every Lit component uses Shadow DOM with `--phz-*` CSS custom properties

---

## Web Component Event API Reference

### Grid Events (`<phz-grid>`)

All events are dispatched as `CustomEvent` with `bubbles: true, composed: true`. The full
type map is defined in `packages/grid/src/events.ts` (`PhzGridEventMap`).

| Event Name | Payload | Description |
|------------|---------|-------------|
| `grid-ready` | `{ gridInstance: GridApi }` | Grid has initialized and is ready for interaction |
| `state-change` | `StateChangeEvent` | Any state mutation (sort, filter, selection, etc.) |
| `cell-click` | `CellClickEvent` | Single click on a cell |
| `cell-dblclick` | `CellDoubleClickEvent` | Double click on a cell |
| `row-click` | `{ rowId, rowIndex, data, originalEvent }` | Click on a row |
| `selection-change` | `SelectionChangeEvent` | Row or cell selection changed |
| `sort-change` | `SortChangeEvent` | Sort order changed |
| `filter-change` | `FilterChangeEvent` | Filter criteria changed |
| `edit-start` | `CellEditStartEvent` | Cell editing began |
| `edit-commit` | `CellEditCommitEvent` | Cell edit committed |
| `edit-cancel` | `CellEditCancelEvent` | Cell edit cancelled |
| `scroll` | `ScrollEvent` | Scroll position changed |
| `resize` | `{ width, height }` | Grid container resized |
| `copy` | `{ text, rowCount, colCount, source }` | Data copied to clipboard |
| `drill-through` | `{ source, config, field, value }` | Drill-through action triggered |
| `row-action` | `{ actionId, rowId, rowData, href, isBulk, rowIds }` | Custom row action invoked |
| `generate-dashboard` | `{ dataMode, reportId, currentFilters, currentSort, visibleColumns }` | Dashboard generation requested |
| `virtual-scroll` | `{ startIndex, endIndex, totalCount }` | Virtual scroll viewport changed |
| `remote-data-load` | `{ offset, count, totalCount }` | Remote data page loaded |
| `remote-data-error` | `{ error, offset }` | Remote data fetch failed |
| `bulk-delete` | `{ rowIds }` | Bulk row deletion requested |
| `admin-settings` | `{}` | Admin settings panel opened |

### Workspace Events (`<phz-workspace>` and child components)

| Event Name | Payload | Emitted By | Description |
|------------|---------|------------|-------------|
| `panel-change` | `{ panelId: string }` | `<phz-workspace>`, `<phz-workspace-shell>` | Active panel changed via sidebar navigation |
| `artifact-select` | `{ artifact }` | `<phz-catalog-browser>` | User selected an artifact from the catalog |
| `grid-definition-create` | `{ name, description, dataProductId, columns, config }` | `<phz-grid-creator>` | Grid definition wizard completed |
| `save-report` | `{ report }` | `<phz-report-editor>` | Report saved |
| `publish-report` | `{ report }` | `<phz-report-editor>` | Report published |
| `save-dashboard` | `{ dashboard }` | `<phz-dashboard-editor>` | Dashboard saved |
| `publish-dashboard` | `{ dashboard }` | `<phz-dashboard-editor>` | Dashboard published |
| `config-changed` | `{ config }` | `<phz-config-panel>` | Widget configuration changed in config panel |
| `menu-action` | `{ actionId }` | `<phz-context-menu>` | Context menu action selected |
| `filter-change` | `{ filters }` | `<phz-global-filter-bar>` | Global filter values changed |

---

*Generated 2026-03-08 | phz-grid v0.1.0 | 5,023 tests passing | 19 packages*
