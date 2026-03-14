# Consumer Guide

For app developers embedding phz-grid dashboards into their applications.

---

## Overview: Three-Shell Architecture

phz-grid v15 introduces three distinct shells, each available as a separate
package. Choose the package(s) that match your deployment needs:

| Package | Shell | Purpose | Install |
|---------|-------|---------|---------|
| `@phozart/viewer` | Viewer | Read-only consumption of dashboards and reports | `npm install @phozart/viewer` |
| `@phozart/editor` | Editor | Constrained authoring with curated measures and sharing | `npm install @phozart/editor` |
| `@phozart/workspace` | Workspace | Full admin authoring, governance, and configuration | `npm install @phozart/workspace` |
| `@phozart/shared` | (shared) | Types, interfaces, and infrastructure shared across shells | `npm install @phozart/shared` |

**Deployment patterns:**

- **Read-only embed**: Install `@phozart/viewer` only. Users see published
  dashboards and reports but cannot create or edit anything.
- **Self-service authoring**: Install `@phozart/viewer` + `@phozart/editor`.
  Analysts consume, authors create within admin-defined constraints.
- **Full platform**: Install all three packages. Admins configure everything,
  authors create, analysts consume.

All shells share the same `DataAdapter` interface and theming system. Artifacts
created in one shell are readable by the others.

---

## Consumer Rendering Pipeline

When you embed a dashboard, the rendering pipeline flows as follows:

```
Your App
  └── DataAdapter        — fetches rows, schema, distinct values
  └── ManifestRegistry   — describes available widget types
  └── CellRendererRegistry — maps micro-widget types to cell renderers
  └── FilterContextManager — centralized filter state
  └── WorkspaceClient    — loads artifact definitions
        └── per-widget
              └── DataQuery → DataAdapter.execute()
              └── RenderContext (data + theme + locale + breaches)
              └── WidgetRenderer.render()
```

Each widget renders independently. A failure in one widget does not affect
others (see Error Handling below).

---

## DataAdapter Interface

`DataAdapter` is the single contract between the workspace rendering engine
and your data backend. Implement this interface to connect any data source.

```typescript
import type { DataAdapter, DataQuery, DataResult, DataSourceSchema, DataSourceSummary } from '@phozart/workspace';

interface DataAdapter {
  // Execute a structured query against a named source
  execute(
    query: DataQuery,
    context?: { viewerContext?: ViewerContext; signal?: AbortSignal },
  ): Promise<DataResult>;

  // Return field metadata for a named source (or the default source)
  getSchema(sourceId?: string): Promise<DataSourceSchema>;

  // List all available data sources
  listDataSources(): Promise<DataSourceSummary[]>;

  // Return distinct values for a field, with optional search and limit
  getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }>;

  // Return numeric stats for a field (used by range filter UI)
  getFieldStats(
    sourceId: string,
    field: string,
    filters?: unknown,
  ): Promise<{
    min?: number;
    max?: number;
    distinctCount: number;
    nullCount: number;
    totalCount: number;
  }>;
}
```

### DataQuery shape

```typescript
interface DataQuery {
  source: string;               // data source ID
  fields: string[];             // field names to select, or ['*'] for all
  filters?: unknown;            // FilterExpression (opaque to the adapter)
  groupBy?: string[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
  aggregations?: AggregationSpec[];
  pivotBy?: FieldReference[];
  windows?: WindowSpec[];
}
```

### DataResult shape

```typescript
interface DataResult {
  columns: ColumnDescriptor[];  // [{ name, dataType }]
  rows: unknown[][];            // columnar: rows[i][j] is row i, column j
  metadata: {
    totalRows: number;
    truncated: boolean;
    queryTimeMs: number;
    quality?: DataQualityInfo;
  };
}
```

### FieldMetadata

`getSchema()` returns a `DataSourceSchema` with a `fields` array:

```typescript
interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  cardinality?: 'low' | 'medium' | 'high';
  semanticHint?: 'measure' | 'dimension' | 'identifier' | 'timestamp'
                | 'category' | 'currency' | 'percentage';
  unit?: UnitSpec;
}
```

Setting `semanticHint` on fields improves template matching and filter UI
auto-selection. For example, fields with `semanticHint: 'measure'` are
automatically suggested as KPI values.

### MemoryDataAdapter — for testing

```typescript
import { MemoryDataAdapter } from '@phozart/workspace/adapters/memory-data-adapter';

const adapter = new MemoryDataAdapter();
adapter.addSource('orders', [
  { status: 'shipped', amount: 1200, region: 'North' },
  { status: 'pending', amount:  840, region: 'South' },
]);

const schema = await adapter.getSchema('orders');
// schema.fields → [{ name: 'status', dataType: 'string', nullable: false, cardinality: 'low' }, ...]
```

`addSource(id, rows)` and `removeSource(id)` are the only non-interface methods.
Queries support sort, limit/offset, groupBy + aggregations (sum, avg, count,
countDistinct, min, max, median, stddev, variance, first, last).

### DuckDB adapter — for production

For production use with large datasets, use `@phozart/duckdb`:

```typescript
import { DuckDBDataSource } from '@phozart/duckdb';

// DuckDBDataSource implements DataAdapter backed by DuckDB-WASM in the browser
// or native DuckDB (via @phozart/local) in Node.js
const adapter = new DuckDBDataSource({ /* config */ });
```

The workspace package ships SQL generation utilities
(`buildDataAdapterQuery`, `buildAggregationSelectSQL`, `buildWindowFunctionSQL`)
for adapters that need to translate `DataQuery` to SQL.

### Custom adapter implementation

```typescript
import type { DataAdapter, DataQuery, DataResult, DataSourceSchema, DataSourceSummary } from '@phozart/workspace';

class MyPostgresAdapter implements DataAdapter {
  async execute(query: DataQuery, context?): Promise<DataResult> {
    // Build SQL from query, run against your DB, return columnar DataResult
    const rows = await runQuery(query);
    return {
      columns: [{ name: 'revenue', dataType: 'number' }],
      rows: rows.map(r => [r.revenue]),
      metadata: { totalRows: rows.length, truncated: false, queryTimeMs: 12 },
    };
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    return {
      id: sourceId ?? 'default',
      name: sourceId ?? 'default',
      fields: [
        { name: 'revenue', dataType: 'number', nullable: false, semanticHint: 'measure' },
        { name: 'region',  dataType: 'string', nullable: false, cardinality: 'low' },
      ],
    };
  }

  async listDataSources(): Promise<DataSourceSummary[]> {
    return [{ id: 'sales', name: 'Sales', fieldCount: 6 }];
  }

  async getDistinctValues(sourceId, field, options?) {
    const values = await fetchDistinct(sourceId, field, options?.search, options?.limit);
    return { values, totalCount: values.length, truncated: false };
  }

  async getFieldStats(sourceId, field) {
    const stats = await fetchStats(sourceId, field);
    return { min: stats.min, max: stats.max, distinctCount: stats.n, nullCount: 0, totalCount: stats.total };
  }
}
```

---

## Widget Registry

The widget registry maps widget type strings to `WidgetManifest` metadata and
lazy-loadable renderers.

### Creating and populating a registry

```typescript
import { createManifestRegistry } from '@phozart/workspace/registry/widget-registry';
import { registerDefaultManifests } from '@phozart/workspace/registry/default-manifests';

const registry = createManifestRegistry();
registerDefaultManifests(registry);

// Query the registry
const manifest = registry.getManifest('bar-chart');
const charts   = registry.listByCategory('charts');
const allTypes = registry.list(); // string[]
```

`registerDefaultManifests` registers all 13 built-in widget types:

| Type | Category | Required fields |
|------|----------|-----------------|
| `kpi-card` | kpis | `value` (number/measure) |
| `kpi-scorecard` | kpis | `value` (number), `label` (string) |
| `bar-chart` | charts | `value` (number), `category` (string) |
| `pie-chart` | charts | `value` (number), `category` (string/category) |
| `trend-line` | charts | `value` (number), `date` (date/time) |
| `bottom-n` | charts | `value` (number), `label` (string) |
| `gauge` | charts | `value` (number/measure) |
| `line-chart` | charts | `value` (number), `date` (date/time) |
| `area-chart` | charts | `value` (number), `date` (date/time) |
| `data-table` | tables | `columns` (string) |
| `pivot-table` | tables | `value` (number), `rowGroup` (string) |
| `status-table` | tables | `label` (string), `status` (string/category) |
| `drill-link` | navigation | none required |

### WidgetManifest anatomy

```typescript
interface WidgetManifest {
  type: string;                        // unique type identifier
  category: string;                    // 'kpis' | 'charts' | 'tables' | 'navigation'
  name: string;
  description: string;
  requiredFields: FieldRequirement[];  // field role declarations
  supportedAggregations: string[];     // e.g. ['sum', 'avg', 'count']
  minSize: WidgetSizeBounds;           // { cols, rows }
  preferredSize: WidgetSizeBounds;
  maxSize: WidgetSizeBounds;
  supportedInteractions: InteractionType[];
  variants: WidgetVariant[];
  load?: () => Promise<WidgetRenderer>; // lazy-load function
  responsiveBehavior?: WidgetResponsiveBehavior;
}

interface FieldRequirement {
  name: string;         // binding slot name (e.g. 'value', 'category')
  dataType: 'string' | 'number' | 'date' | 'boolean';
  role: 'measure' | 'dimension' | 'category' | 'time';
  required: boolean;
}
```

### ConsumerCapabilities — controlling available widgets

Declare `ConsumerCapabilities` when creating a `WorkspaceClient` to restrict
what widget types and interactions are available in your embedding context:

```typescript
import { createWorkspaceClient } from '@phozart/workspace/client/workspace-client';

const client = await createWorkspaceClient({
  adapter: workspaceAdapter,
  capabilities: {
    widgetTypes: ['kpi-card', 'bar-chart', 'data-table'],
    interactions: ['cross-filter', 'export-csv'],
    maxNestingDepth: 1,
    supportedLayoutTypes: ['auto-grid'],
  },
});
```

Capabilities are advisory — the authoring UI uses them to filter the widget
picker. The renderer itself does not enforce them at runtime.

### Finding widgets by capability

```typescript
// Find all widgets that support cross-filter and have a 'time' field role
const widgets = registry.findByCapabilities({
  interactions: ['cross-filter'],
  fieldRoles: ['time'],
});

// Get all variants for a widget type
const variants = registry.getVariants('bar-chart');
// [{ id: 'standard', name: 'Standard', ... }, { id: 'stacked', ... }, ...]

// Resolve a specific variant
const stacked = registry.resolveVariant('bar-chart', 'stacked');
```

---

## Filter Bar (Consumer-Side)

`createFilterContext` creates a centralized `FilterContextManager` that merges
four filter layers: dashboard defaults → cross-filters → user filters (highest
priority).

```typescript
import { createFilterContext } from '@phozart/workspace/filters/filter-context';
import type { FilterValue } from '@phozart/workspace';

const filterCtx = createFilterContext({
  // Optional: pre-declare filter definitions with defaults
  dashboardFilters: [
    {
      id: 'region-filter',
      field: 'region',
      dataSourceId: 'sales',
      label: 'Region',
      filterType: 'multi-select',
      defaultValue: 'North',
      required: false,
      appliesTo: ['widget-1', 'widget-2'],
    },
  ],
  // Optional: field name mappings for multi-source dashboards
  fieldMappings: [],
});

// Apply a user filter
filterCtx.setFilter({
  filterId: 'my-region',
  field: 'region',
  operator: 'in',
  value: ['North', 'East'],
  label: 'Region: North, East',
});

// Subscribe to changes
const unsubscribe = filterCtx.subscribe(() => {
  const activeFilters = filterCtx.resolveFilters();
  // Re-query widgets with activeFilters
});

// Apply a cross-filter (from a widget click)
filterCtx.applyCrossFilter({
  sourceWidgetId: 'bar-chart-1',
  field: 'region',
  value: 'North',
  timestamp: Date.now(),
});

// Resolve filters for a specific widget (excludes that widget's own cross-filters)
const filtersForWidget = filterCtx.resolveFilters('bar-chart-1');

// Resolve filters remapped to a specific data source's field names
const filtersForSource = filterCtx.resolveFiltersForSource('orders', 'bar-chart-1');

// Clear everything
filterCtx.clearAll();
```

### FilterUIType — auto-selecting filter controls

The `filterType` on a `DashboardFilterDef` controls which UI control is
rendered. It is typically auto-selected from the field's `cardinality` and
`dataType`:

| `filterType` | Best for |
|-------------|----------|
| `select` | Low-cardinality string field, single value |
| `multi-select` | Low-cardinality string field, multiple values |
| `chip-select` | Very low cardinality (≤8 options) |
| `tree-select` | Hierarchical categories |
| `date-range` | Date field, custom range |
| `date-preset` | Date field, relative periods (Last 7 days, This Month…) |
| `numeric-range` | Numeric field, between filter |
| `search` | High-cardinality string, full-text |
| `boolean-toggle` | Boolean field |
| `field-presence` | Null/non-null filter |

---

## Breach Indicators (Opt-In)

Breach indicators surface active alert threshold violations inside widget
renders. They are opt-in: if your `WorkspaceAdapter` does not implement
`BreachStoreExtension`, no breach data is loaded and widgets render normally.

### Loading active breaches

`MemoryWorkspaceAdapter` implements `BreachStoreExtension`:

```typescript
// Load all active breaches for a dashboard
const breachRecords = await adapter.loadActiveBreaches('dashboard-id');

// Each BreachRecord
interface BreachRecord {
  id: BreachId;
  ruleId: AlertRuleId;
  artifactId: string;
  widgetId?: string;            // undefined = applies to whole dashboard
  status: 'active' | 'acknowledged' | 'resolved';
  detectedAt: number;
  currentValue: number;
  thresholdValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}
```

### ActiveBreach[] in RenderContext

```typescript
import { createRenderContext, filterBreachesForWidget } from '@phozart/workspace/alerts/render-context-ext';

// Build the extended render context for a widget
const ctx = createRenderContext({
  data: queryResult.rows.map(/* map to objects */),
  theme: { '--phz-accent': '#2563eb' },
  locale: 'en-US',
  breaches: allActiveBreaches,   // optional; defaults to []
});

// In the widget renderer, filter to only this widget's breaches
const myBreaches = filterBreachesForWidget(ctx.breaches, 'widget-123');
// Returns breaches where widgetId === 'widget-123' OR widgetId === undefined
```

`ActiveBreach` pairs a `BreachRecord` with its `AlertRule` for display context:

```typescript
interface ActiveBreach {
  breach: BreachRecord;
  rule: AlertRule;     // name, description, severity, condition
}
```

---

## ViewerContext — Row-Level Filtering

Pass user identity and attributes into queries via `ViewerContext`. Your
`DataAdapter` receives it in `execute()` and can use it to apply row-level
access logic.

```typescript
interface ViewerContext {
  userId?: string;
  roles?: string[];
  attributes?: Record<string, unknown>;
}
```

```typescript
const client = await createWorkspaceClient({
  adapter: workspaceAdapter,
  viewerContext: {
    userId: 'user-42',
    roles: ['analyst', 'emea-reader'],
    attributes: { region: 'EMEA', tier: 'premium' },
  },
});
```

The `viewerContext` is forwarded as `context.viewerContext` in every
`DataAdapter.execute()` call. **phz-grid never enforces access control** — your
adapter is responsible for applying any row-level restrictions based on the
context it receives.

```typescript
async execute(query, context) {
  const vc = context?.viewerContext as ViewerContext | undefined;
  const region = vc?.attributes?.['region'];
  // Apply region filter to your SQL or data before returning
}
```

---

## Theming

phz-grid uses a three-layer CSS custom property system:

| Layer | Prefix | Purpose |
|-------|--------|---------|
| Public API tokens | `--phz-*` | Override these in your app |
| Internal computed | `--_*` | Set per density/theme; do not override |
| Component styles | (uses `--_*`) | Consume computed values with fallbacks |

```css
/* Override global tokens in your app stylesheet */
:root {
  --phz-color-accent:       #2563eb;
  --phz-color-accent-hover: #1d4ed8;
  --phz-color-surface:      #ffffff;
  --phz-color-border:       #e2e8f0;
  --phz-font-family:        'Inter', sans-serif;
  --phz-border-radius:      6px;
}
```

Themes (`light`, `dark`, `sand`, `midnight`, `high-contrast`) are applied via
the `theme` attribute on `<phz-grid>`. A `prefers-color-scheme: dark` media
query provides automatic dark mode when no theme is set.

Density modes (`compact`, `dense`, `comfortable`) are set via the `density`
attribute. They cascade through `--_row-height`, `--_cell-padding`,
`--_cell-overflow`, and `--_cell-white-space`.

---

## Error Handling

### Per-widget error isolation

Widgets render independently. An error in one widget does not unmount others.
Use `createWidgetErrorState` to capture and classify errors:

```typescript
import {
  createWidgetErrorState,
  isRecoverable,
  formatErrorForUser,
} from '@phozart/workspace/layout/widget-error-boundary';

try {
  await renderWidget(widgetId, config);
} catch (error) {
  const errorState = createWidgetErrorState(widgetId, error, previousErrorState);
  // {
  //   widgetId: 'widget-123',
  //   message: 'Network timeout',
  //   timestamp: 1709123456789,
  //   retryCount: 1,
  //   recoverable: true,
  // }

  if (isRecoverable(error)) {
    // Show retry button; the error is not a programming bug
  } else {
    // TypeError / ReferenceError / SyntaxError / RangeError → not recoverable
  }

  // User-friendly message (redacts technical details)
  const displayMessage = formatErrorForUser(error);
  // 'Unable to load data. Please check your connection and try again.'
  // 'You do not have permission to view this data.'
  // 'Something went wrong while loading this widget. Please try again.'
}
```

### isRecoverable classification

| Error type | Recoverable | Rationale |
|-----------|-------------|-----------|
| Network / fetch / timeout | `true` | Transient; retry is meaningful |
| Generic `Error` | `true` | Unknown cause; retry may succeed |
| `TypeError` | `false` | Programming bug; retry will not help |
| `ReferenceError` | `false` | Programming bug |
| `SyntaxError` | `false` | Programming bug |
| `RangeError` | `false` | Programming bug |

### Progressive rendering

Because widgets issue their own `DataAdapter.execute()` calls independently,
a slow data source only delays the widgets bound to it. Fast widgets display
immediately. Use `AbortSignal` to cancel in-flight queries when the user
navigates away:

```typescript
const controller = new AbortController();

// Pass signal into execute()
const result = await dataAdapter.execute(query, {
  signal: controller.signal,
  viewerContext,
});

// Cancel on unmount
controller.abort();
```

---

## CellRendererRegistry — Micro-Widget Cell Renderers

v15 introduces **micro-widget cell renderers** that display sparklines, gauges,
and delta indicators inside table cells. To use them, register renderers with
the `CellRendererRegistry`.

### Setting up the registry

```typescript
import {
  createCellRendererRegistry,
  registerDefaultCellRenderers,
} from '@phozart/shared/cell-renderers';

const cellRegistry = createCellRendererRegistry();
registerDefaultCellRenderers(cellRegistry);
```

`registerDefaultCellRenderers` registers three built-in micro-widget types:

| Type | Description | Required data |
|------|------------|--------------|
| `sparkline` | Tiny line chart in a cell | Array of numbers (time series) |
| `gauge` | Miniature circular progress indicator | Numeric value + target |
| `delta` | Up/down arrow with percentage change | Numeric value |

### Registering a custom cell renderer

```typescript
cellRegistry.register('traffic-light', {
  name: 'Traffic Light',
  render(value: unknown, config: Record<string, unknown>) {
    // Return an HTMLElement or string for the cell content
    const status = value as string;
    const color = status === 'good' ? 'green' : status === 'warn' ? 'amber' : 'red';
    const el = document.createElement('span');
    el.style.display = 'inline-block';
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    return el;
  },
});
```

### Wiring the registry into the workspace client

Pass the `CellRendererRegistry` when creating the workspace client so reports
and grids can resolve micro-widget columns:

```typescript
const client = await createWorkspaceClient({
  adapter: workspaceAdapter,
  cellRenderers: cellRegistry,
  capabilities: { /* ... */ },
});
```

---

## React Wrappers for Viewer and Editor

v15 ships React wrappers for the Viewer and Editor shells in addition to the
existing Workspace wrappers.

### Viewer components (React)

```typescript
import {
  PhzViewer,
  PhzDashboardView,
  PhzReportView,
  PhzExplorer,
  useViewerFilters,
  useAttentionSidebar,
} from '@phozart/react/viewer';

function App() {
  return (
    <PhzViewer
      adapter={dataAdapter}
      viewerContext={{ userId: 'user-42', roles: ['analyst'] }}
    >
      <PhzDashboardView dashboardId="dash-001" />
    </PhzViewer>
  );
}
```

### Editor components (React)

```typescript
import {
  PhzEditor,
  PhzDashboardEditor,
  PhzReportEditor,
  PhzMeasurePalette,
  useEditorState,
  usePublishWorkflow,
} from '@phozart/react/editor';

function AuthoringApp() {
  return (
    <PhzEditor
      adapter={workspaceAdapter}
      viewerContext={{ userId: 'author-1', roles: ['author'] }}
    >
      <PhzDashboardEditor dashboardId="dash-draft-001" />
    </PhzEditor>
  );
}
```

### Key hooks

| Hook | Shell | Purpose |
|------|-------|---------|
| `useViewerFilters()` | Viewer | Access and control the filter bar state |
| `useAttentionSidebar()` | Viewer | Read notifications, filter by facet, mark as read |
| `useEditorState()` | Editor | Access the current editor state (dashboard or report) |
| `usePublishWorkflow()` | Editor | Trigger publish checks, submit, track version |
| `useCellRenderers()` | Both | Access the CellRendererRegistry for micro-widget columns |

---

## Three-Shell Deployment Patterns

### Pattern 1: Viewer-Only Embed

Embed a read-only dashboard inside your existing application. Users see
published dashboards but have no authoring capability.

```typescript
// Install: npm install @phozart/viewer @phozart/shared
import { createViewerClient } from '@phozart/viewer';

const viewer = await createViewerClient({
  adapter: yourDataAdapter,
  viewerContext: currentUser,
});

// Render a specific dashboard
viewer.openDashboard('published-dash-001');
```

### Pattern 2: Viewer + Editor

Allow analysts to consume and authors to create within your app. The Editor
enforces admin-defined constraints (available widget types, measures, data
sources).

```typescript
// Install: npm install @phozart/viewer @phozart/editor @phozart/shared
import { createViewerClient } from '@phozart/viewer';
import { createEditorClient } from '@phozart/editor';

// Route based on user role
if (user.role === 'author') {
  const editor = await createEditorClient({ adapter, viewerContext: user });
  editor.openDashboardEditor('draft-001');
} else {
  const viewer = await createViewerClient({ adapter, viewerContext: user });
  viewer.openDashboard('published-001');
}
```

### Pattern 3: Full Platform

Deploy all three shells for a complete BI platform. Admins configure the
system, authors create content, analysts consume it.

```typescript
// Install: npm install @phozart/workspace @phozart/editor @phozart/viewer @phozart/shared
// Route to the appropriate shell based on user.workspaceRole
```
