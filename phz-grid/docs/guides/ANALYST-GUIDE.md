# Analyst Guide — phz-grid Viewer

This guide is written for data analysts who consume dashboards and reports,
explore data with the Visual Query Explorer, and manage personal subscriptions
in the phz-grid Viewer shell.

---

## 1. The Viewer Shell

The **Viewer** is the analyst's dedicated environment for read-only consumption,
exploration, and personal subscriptions. It is one of three shells in phz-grid
v15:

| Shell | Audience | Purpose |
|-------|----------|---------|
| **Workspace** | Admins | Full authoring, configuration, and governance |
| **Editor** | Authors | Constrained authoring with curated measures and sharing |
| **Viewer** | Analysts | Read-only consumption, dashboards, reports, explorer |

When you sign in, the Viewer shell opens automatically if your role is
**analyst** or **viewer**. You see:

- **Catalog** — browse and open published dashboards, reports, and grids.
- **Explorer** — build ad-hoc pivot tables and charts without SQL (see
  Section 2 below).
- **Attention sidebar** — a faceted notification panel that surfaces alerts,
  data-quality warnings, and changes relevant to you (see Section 1.1).
- **Filter bar** — a persistent bar at the top of every dashboard for slicing
  data (see Section 7).
- **Command palette** — press **Ctrl+K** (Cmd+K on Mac) to quickly search for
  and navigate to any artifact, filter, or action.

Install the Viewer package in your app:

```bash
npm install @phozart/viewer
```

---

### 1.1 Faceted Attention Sidebar

The attention sidebar (bell icon in the header) aggregates notifications from
across the workspace. In v15, it supports **faceted filtering** so you can
zero in on what matters:

| Facet | What it filters |
|-------|-----------------|
| **Priority** | Critical, Warning, Info — show only the severity levels you care about |
| **Source** | Alerts, Data Quality, System — narrow by notification origin |
| **Artifact** | Dashboard name, Report name — see notifications for a specific artifact only |

Each notification card shows the severity badge, a plain-language summary, the
artifact it relates to, and when it was detected. Click a notification to jump
directly to the affected widget or report.

Unread counts appear on the bell icon. Marking a notification as read (click or
swipe on mobile) clears it from the count without deleting it.

---

### 1.2 Alert-Aware Widgets

KPI cards and other widgets can now display **alert state visually**. When an
alert rule is bound to a widget, the widget shows its health status using one of
three visual modes:

| Visual Mode | How it looks |
|-------------|-------------|
| **Indicator** | A small colored dot (green / amber / red) next to the KPI value |
| **Background** | The entire card background tints green, amber, or red |
| **Border** | A colored left border stripe indicates health status |

Alert states map to three health levels:

- **Healthy** (green) — the metric is within normal range.
- **Warning** (amber) — the metric has crossed a warning threshold.
- **Critical** (red) — the metric has breached a critical threshold.

You do not need to configure anything — alert bindings are set up by admins or
authors. As an analyst, you simply see the visual indicator and can click it to
view breach details.

---

### 1.3 Micro-Widget Cell Renderers

Reports and data grids can now embed **micro-widgets inside table cells**. These
are small inline visualizations that provide at-a-glance context without leaving
the table view:

| Micro-Widget | What it shows |
|-------------|--------------|
| **Sparkline** | A tiny line chart showing a trend over time within a single cell |
| **Gauge** | A miniature circular indicator showing a value relative to a target |
| **Delta** | An up/down arrow with a percentage change value, color-coded green (positive) or red (negative) |

Micro-widgets appear automatically when the report author has configured them
for specific columns. They are read-only — you cannot edit them, but you can
sort and filter the column as usual.

---

### 1.4 Impact Chain View

The **Impact Chain** is a horizontal causal-flow widget for root cause analysis.
It displays a chain of nodes (metrics or events) connected by directional arrows
that show how one factor causes or influences another.

Use cases:
- Trace why a KPI dropped — follow the chain from the outcome back to root
  causes.
- Understand dependencies between business metrics.
- Explore "what if" scenarios by examining which upstream factors are in warning
  or critical state.

Each node in the chain shows:
- The metric name and current value.
- A health indicator (healthy / warning / critical) if an alert rule is bound.
- A hypothesis state label (confirmed / suspected / ruled-out) when the author
  has annotated the chain.

Click any node to drill through to its detail view.

---

## 2. Visual Query Explorer Overview

The Visual Query Explorer is a headless drag-and-drop interface for slicing and
pivoting data without writing SQL. It is orchestrated by `createDataExplorer()`
from `@phozart/workspace`.

```typescript
import { createDataExplorer } from '@phozart/workspace';
import type { FieldMetadata } from '@phozart/workspace';

const explorer = createDataExplorer();

// Connect a data source
explorer.setDataSource('sales', fields);

// Subscribe to state changes
const unsubscribe = explorer.subscribe(() => {
  const state = explorer.getState();
  // re-render your UI
});
```

The explorer exposes:

| Method | Description |
|---|---|
| `setDataSource(id, fields)` | Load a data source; resets all zones and undo history |
| `getState()` | Returns a snapshot: `{ dataSourceId, fields, dropZones }` |
| `autoPlaceField(field)` | Double-click placement using type heuristics |
| `addToZone(zone, field)` | Explicit zone assignment |
| `removeFromZone(zone, fieldName)` | Remove a field from a zone |
| `toQuery()` | Returns the current `ExploreQuery` |
| `suggestChart()` | Returns a suggested chart type string |
| `subscribe(listener)` | Subscribe to state changes; returns unsubscribe function |
| `undo()` / `redo()` | Navigate zone history |
| `canUndo()` / `canRedo()` | Check undo/redo availability |

Undo/redo snapshots cover the `DropZoneState` only. Calling `setDataSource()`
resets all undo history.

---

## 3. Field Palette

The field palette is built by `createFieldPalette()` and exposes enriched
`PaletteField` objects with type icons and cardinality badges.

```typescript
import {
  createFieldPalette,
  groupFieldsByType,
  searchFields,
} from '@phozart/workspace';

const palette = createFieldPalette(fields);

// Group by data type for UI sections
const grouped: Map<string, FieldMetadata[]> = groupFieldsByType(fields);
// Map keys: 'number', 'string', 'date', 'boolean'

// Search/filter
const matches = searchFields(fields, 'rev'); // case-insensitive substring match
```

### PaletteField

```typescript
interface PaletteField {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  typeIcon: string;              // same as dataType — map to your icon set
  cardinalityBadge?: 'low' | 'medium' | 'high';
  semanticHint?: SemanticHint;  // 'measure' | 'dimension' | 'currency' | etc.
  draggable: boolean;
}
```

### autoPlaceField() Heuristics

Double-clicking a field in the palette calls `autoPlaceField()`, which routes it
to a drop zone based on data type:

| Data type | Auto-placed zone |
|---|---|
| `number` | Values |
| `date` | Columns |
| `boolean` | Filters |
| `string` (default) | Rows |

```typescript
import { autoPlaceField } from '@phozart/workspace';

// Returns: 'rows' | 'columns' | 'values' | 'filters'
const zone = autoPlaceField({ name: 'revenue', dataType: 'number', nullable: false });
// => 'values'
```

---

## 4. Drop Zones

Four zones define the query shape:

| Zone | SQL equivalent | Typical content |
|---|---|---|
| **Rows** | `GROUP BY` dimensions | String fields — category, region, product |
| **Columns** | Pivot headers | Date fields — month, quarter |
| **Values** | Aggregated measures | Numeric fields — revenue, count, avg |
| **Filters** | `WHERE` clause | Any field used as a filter |

### addFieldToZone / removeFieldFromZone / moveFieldBetweenZones

These are pure immutable functions used internally by the explorer, and also
exported for custom UI integrations:

```typescript
import {
  createDropZoneState,
  addFieldToZone,
  removeFieldFromZone,
  moveFieldBetweenZones,
} from '@phozart/workspace';

let state = createDropZoneState();

// Add a numeric field to Values — gets default aggregation automatically
state = addFieldToZone(state, 'values', {
  name: 'revenue',
  dataType: 'number',
  nullable: false,
});

// Add a string field to Rows
state = addFieldToZone(state, 'rows', {
  name: 'region',
  dataType: 'string',
  nullable: false,
});

// Move a field from Rows to Filters
state = moveFieldBetweenZones(state, 'rows', 'filters', 'region');

// Remove a field
state = removeFieldFromZone(state, 'values', 'revenue');
```

Duplicate fields in the same zone are silently ignored. Fields carry their
`dataType` through moves so the correct default aggregation is preserved.

### Aggregation Defaults

When a field is added to the **Values** zone, a default aggregation is assigned
automatically:

| Field data type | Default aggregation |
|---|---|
| `number` | `sum` |
| `string`, `date`, `boolean` | `count` |

```typescript
import { getDefaultAggregation } from '@phozart/workspace';

getDefaultAggregation('number'); // => 'sum'
getDefaultAggregation('string'); // => 'count'
```

Available aggregation functions: `sum`, `avg`, `count`, `countDistinct`,
`min`, `max`, `median`, `stddev`, `variance`, `first`, `last`.

### Cardinality Warning

When a field placed in Columns has many distinct values, it will produce an
extremely wide pivot table. Check before rendering:

```typescript
import { getCardinalityWarning } from '@phozart/workspace';

const warning = getCardinalityWarning('country', 180, 20);
// => 'Field "country" has 180 distinct values (threshold: 20). This may produce a wide pivot.'
```

---

## 5. Chart Suggest

`suggestChartType()` analyses the current `ExploreQuery` and returns the most
appropriate widget type based on dimension and measure counts.

```typescript
import { suggestChartType } from '@phozart/workspace';

const chartType = suggestChartType(explorer.toQuery());
// Possible values: 'table' | 'kpi' | 'bar' | 'line' | 'multi-line' |
//                  'grouped-bar' | 'stacked-bar'
```

### Suggestion Logic

| Dimensions | Measures | Has date dimension? | Suggested type |
|---|---|---|---|
| 0 | 0 | — | `table` |
| 0 | 1+ | — | `kpi` |
| 1 | 1 | Yes | `line` |
| 1 | 1 | No | `bar` |
| 1 | 2+ | Yes | `multi-line` |
| 1 | 2+ | No | `grouped-bar` |
| 2 | 1+ | — | `stacked-bar` |
| 3+ | any | — | `table` (too complex for charts) |

Date detection matches field names against patterns: `date`, `_at`, `_on`,
`timestamp`, `_time`, `month`, `year`, `quarter`, `week`, `day`.

You can also pass an explicit type override map:

```typescript
const chartType = suggestChartType(query, {
  fieldTypes: { order_placed: 'date' },
});
```

The explorer also calls this directly:

```typescript
const suggestion = explorer.suggestChart();
```

---

## 6. Saving Work

Once you have an exploration you're happy with, save it as a named report or
add it directly to a dashboard.

### exploreToReport()

Converts the current query into a `ReportArtifact` — a serializable report
configuration that can be stored, shared, and loaded.

```typescript
import { exploreToReport } from '@phozart/workspace';

const query = explorer.toQuery();

const report = exploreToReport(query, 'Q1 Sales by Region', 'sales-ds');
// report.id          — auto-generated unique ID
// report.type        — 'report'
// report.name        — 'Q1 Sales by Region'
// report.dataSource  — 'sales-ds'
// report.columns     — all dimension + measure field names
// report.groupBy     — dimension field names
// report.aggregations — [{ field, function, alias }]
// report.filters     — filter conditions from the Filters zone
// report.createdAt   — timestamp
```

### exploreToDashboardWidget()

Converts the exploration into a `DashboardWidgetArtifact` ready to be placed on
a dashboard canvas:

```typescript
import { exploreToDashboardWidget } from '@phozart/workspace';

const widget = exploreToDashboardWidget(
  query,
  'bar-chart',         // widget type
  'my-dashboard-id',   // optional: existing dashboard to add to
);
// widget.id          — auto-generated
// widget.widgetType  — 'bar-chart'
// widget.dashboardId — 'my-dashboard-id'
// widget.dataConfig  — { dimensions, measures, filters }
// widget.position    — default: { row: 0, col: 0, rowSpan: 2, colSpan: 3 }
```

### promoteFilterToDashboard()

Promotes a filter from the explore session into a persistent dashboard filter
bar definition:

```typescript
import { promoteFilterToDashboard } from '@phozart/workspace';

const state = explorer.getState();
const filterEntry = state.dropZones.filters[0];

const dashboardFilter = promoteFilterToDashboard(
  filterEntry,
  'sales-ds',        // data source ID
  ['widget-1', 'widget-2'],  // optional: restrict to these widgets
);
// dashboardFilter.filterType is inferred from the operator:
//   'in' / 'not_in'  → 'multi-select'
//   gt/gte/lt/lte/between → 'numeric-range'
//   everything else  → 'select'
```

---

## 7. Filter Architecture (Analyst View)

Filters in phz-grid form a four-level hierarchy. Higher levels take priority
over lower levels for the same field.

```
global filters
  └── dashboard defaults     (DashboardFilterDef.defaultValue)
        └── user/widget filters  (setFilter / activeFilterIds)
              └── cross-filters  (click interactions, transient)
```

### FilterContextManager

```typescript
import { createFilterContext } from '@phozart/workspace';

const ctx = createFilterContext({
  dashboardFilters: myDashboardFilterDefs, // optional defaults
  fieldMappings: myFieldMappings,          // optional multi-source mappings
});

// Set a user filter
ctx.setFilter({
  filterId: 'f-region',
  field: 'region',
  operator: 'in',
  value: ['US', 'EU'],
  label: 'Region: US, EU',
});

// Get resolved filters for a widget (respects all 4 layers)
const filters = ctx.resolveFilters('widget-1');

// Get resolved filters mapped to a specific data source
const sourceFilters = ctx.resolveFiltersForSource('sales-ds', 'widget-1');

// Apply a cross-filter (from clicking a chart element)
ctx.applyCrossFilter({
  sourceWidgetId: 'bar-chart-1',
  field: 'region',
  value: 'US',
  timestamp: Date.now(),
});

// Clear cross-filters from a specific source widget
ctx.clearCrossFilter('bar-chart-1');

// Clear all filters
ctx.clearAll();

// Subscribe to changes
const unsubscribe = ctx.subscribe(() => {
  const state = ctx.getState();
  // state.source: 'user' | 'preset' | 'url' | 'default'
  // state.crossFilters: CrossFilterEntry[]
});
```

Cross-filters appear as transient dashed pills in the filter bar. They are
excluded from `resolveFilters()` when called for the widget that originated them
(a widget does not cross-filter itself).

### Filter Presets

Named filter combinations are stored as `ArtifactMeta` entries with type
`'filter-preset'`. To apply a preset, load its stored `FilterValue[]` array
and call `ctx.setFilter()` for each entry, then `ctx.setSource('preset')`.

### URL Sharing

Filter state serializes to URL query parameters using the format
`f.{field}={operator}:{value}`.

```typescript
import {
  serializeFilterState,
  deserializeFilterState,
} from '@phozart/workspace';

// Serialize current filter state to query string
const qs = serializeFilterState(ctx.getState());
// => 'f.region=in:US,EU&f.date=between:2024-01-01,2024-03-31'

// Restore from URL on page load
const restoredState = deserializeFilterState(window.location.search.slice(1));
// restoredState.source === 'url'
```

Null-check operators (`isNull`, `isNotNull`) omit the value: `f.email=isNull`.
Array operators (`in`, `notIn`, `between`, `notBetween`) use comma separation.

---

## 8. Time Intelligence

The `TimeIntelligenceConfig` on a `DataSourceSchema` enables the date picker's
relative period presets and fiscal calendar awareness.

### DEFAULT_RELATIVE_PERIODS

14 built-in relative periods:

| ID | Label |
|---|---|
| `today` | Today |
| `yesterday` | Yesterday |
| `this-week` | This Week |
| `last-week` | Last Week |
| `this-month` | This Month |
| `last-month` | Last Month |
| `this-quarter` | This Quarter |
| `last-quarter` | Last Quarter |
| `this-year` | This Year |
| `last-year` | Last Year |
| `last-7-days` | Last 7 Days |
| `last-30-days` | Last 30 Days |
| `last-90-days` | Last 90 Days |
| `last-365-days` | Last 365 Days |

All periods that reference "week" respect `weekStartDay` (sunday/monday).
All quarter and year periods respect `fiscalYearStartMonth` (1-12).

### Configuration

```typescript
import type { TimeIntelligenceConfig } from '@phozart/workspace';
import { DEFAULT_RELATIVE_PERIODS, resolvePeriod } from '@phozart/workspace';

const config: TimeIntelligenceConfig = {
  primaryDateField: 'order_date',
  fiscalYearStartMonth: 4, // April fiscal year
  weekStartDay: 'monday',
  granularities: ['day', 'week', 'month', 'quarter', 'year'],
  relativePeriods: DEFAULT_RELATIVE_PERIODS,
};

// Resolve a period to { from: Date, to: Date }
const { from, to } = resolvePeriod('last-quarter', config);
```

### Custom Comparison Periods

To compare against a previous period or same period last year, resolve both
periods and pass them as separate filter values to your query:

```typescript
const current = resolvePeriod('this-month', config);
const previous = resolvePeriod('last-month', config);
```

---

## 9. Data Quality Indicators

Data freshness and quality are surfaced per widget via `DataQualityInfo`,
attached to the `DataResult.metadata.quality` field returned by the data adapter.

```typescript
interface DataQualityInfo {
  lastRefreshed?: string;              // ISO timestamp
  freshnessStatus?: 'fresh' | 'stale' | 'unknown';
  freshnessThresholdMinutes?: number;
  completeness?: number;               // 0.0–1.0
  issues?: DataQualityIssue[];
}

interface DataQualityIssue {
  severity: 'info' | 'warning' | 'error';
  message: string;
  field?: string;
}
```

### computeFreshnessStatus()

Compute the freshness badge for display:

```typescript
import { computeFreshnessStatus } from '@phozart/workspace';

const status = computeFreshnessStatus(
  result.metadata.quality?.lastRefreshed ?? '',
  60, // threshold in minutes
);
// => 'fresh' | 'stale' | 'unknown'
```

- Returns `'unknown'` if `lastRefreshed` is missing or not a valid ISO date.
- Returns `'fresh'` if `now - lastRefreshed <= thresholdMinutes`.
- Returns `'stale'` otherwise.

Render freshness as a badge on the widget header:

| Status | Suggested UI |
|---|---|
| `fresh` | Green dot or no badge |
| `stale` | Amber clock icon with tooltip showing last-refreshed time |
| `unknown` | Grey question mark |

Per-field issues (from `DataQualityIssue[]`) can be surfaced as inline warning
icons on column headers in table widgets.

---

## 10. Explorer Screen for Ad-Hoc Analysis

The **Explorer** screen is a dedicated full-page environment for ad-hoc data
analysis. It combines the Visual Query Explorer (Section 2), the Field Palette
(Section 3), the Chart Suggest engine (Section 5), and the filter architecture
(Section 7) into a single integrated workspace.

To open the Explorer:

1. Click **Explore** in the sidebar or bottom tab bar (mobile).
2. Select a data source from the picker at the top.
3. Start dragging fields into drop zones, or double-click to auto-place them.

The Explorer screen has three panels:

| Panel | Position | Content |
|-------|----------|---------|
| **Field Palette** | Left | All fields from the selected data source, grouped by type, with search |
| **Canvas** | Center | A live-updating chart or table based on your current drop zone configuration |
| **Drop Zones** | Right or bottom | Rows, Columns, Values, and Filters zones where you place fields |

The canvas updates in real time as you add, remove, or rearrange fields. The
chart type is automatically suggested (Section 5), but you can override it by
clicking the chart-type picker above the canvas.

When you are satisfied with your exploration, use **Save as Report** or
**Add to Dashboard** to persist your work (see Section 6).

---

## 11. Personal Subscriptions

Personal subscriptions let you schedule delivery of reports and dashboard
snapshots to yourself. This is useful for recurring analysis where you want
the data to come to you rather than opening the workspace each time.

### Setting Up a Subscription

1. Open any published report or dashboard.
2. Click the **Subscribe** button (envelope icon) in the toolbar.
3. Configure your subscription:
   - **Frequency**: Daily, Weekly, or Monthly.
   - **Day/Time**: Which day of the week (for weekly) or day of the month, and
     what time to send.
   - **Format**: Inline (notification with summary), Digest (aggregated
     summary), or Webhook (JSON payload to an endpoint).
   - **Filters**: Optionally lock specific filter values so the delivered report
     always shows the data you care about.
4. Click **Save Subscription**.

### Managing Subscriptions

Open the **Subscriptions** panel (envelope icon in the sidebar or header) to
see all your active subscriptions. From here you can:

- **Pause / Resume** — temporarily stop delivery without deleting the
  subscription.
- **Edit** — change the frequency, format, or filters.
- **Delete** — permanently remove the subscription.

Subscriptions are personal — only you can see and manage yours. Delivery
depends on the notification channels your organization has configured (in-app
notifications are always available).

---

## 12. Filter Bar with Value Handling

The filter bar in the Viewer shell supports enhanced value handling in v15:

- **Null handling**: Filters display a clear "(Blank)" option for fields that
  contain null values. Select it to include or exclude rows with missing data.
- **Cascading filters**: When filters have parent-child dependencies (e.g.,
  Country → Region → City), selecting a parent value automatically narrows the
  available options in child filters.
- **Server-side value loading**: For high-cardinality fields, the filter control
  fetches values from the server as you type, rather than loading all options
  upfront. A search box appears automatically for fields with many distinct
  values.
- **Active filter count**: A badge on the filter bar shows how many filters are
  currently active. Click **Reset** to clear all filters at once.

---

*phz-grid Analyst Guide — updated 2026-03-08*
