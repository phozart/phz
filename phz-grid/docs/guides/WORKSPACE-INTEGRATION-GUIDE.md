# phz-grid Workspace Integration Guide

> How to mount, configure, and integrate the `<phz-workspace>` component into
> your application. This is the single entry point for the entire
> admin/authoring/viewer experience.
>
> **Version**: 0.2.0 (v15) | **Date**: 2026-03-08

---

## Table of Contents

1. [Overview](#1-overview)
2. [Minimum Viable Integration](#2-minimum-viable-integration)
3. [Responsibility Boundary](#3-responsibility-boundary)
4. [DataAdapter — The Data Contract](#4-dataadapter--the-data-contract)
5. [Persistence — WorkspaceAdapter](#5-persistence--workspaceadapter)
6. [AlertChannelAdapter (Optional)](#6-alertchanneladapter-optional)
7. [Custom Widgets](#7-custom-widgets)
8. [Common Mistakes](#8-common-mistakes)
9. [v15: Three-Shell Deployment](#9-v15-three-shell-deployment)
10. [v15: Shared Package Foundation](#10-v15-shared-package-foundation)
11. [v15: CellRendererRegistry Wiring](#11-v15-cellrendererregistry-wiring)
12. [v15: Alert-Aware Widget Configuration](#12-v15-alert-aware-widget-configuration)
13. [v15: Micro-Widget Cell Renderers](#13-v15-micro-widget-cell-renderers)
14. [v15: Impact Chain Variant](#14-v15-impact-chain-variant)
15. [v15: Faceted Attention Filtering](#15-v15-faceted-attention-filtering)

---

## 1. Overview

`<phz-workspace>` is a **single drop-in Web Component** that renders the
entire admin, authoring, and viewer experience. It is not a collection of
separate panels you wire together — it is one component with sidebar
navigation, content routing, responsive layout, undo/redo, auto-save, i18n,
and keyboard shortcuts built in.

You provide two things:

1. **DataAdapter** — how the workspace fetches data (queries, schemas, field
   values).
2. **WorkspaceAdapter** — how the workspace persists artifacts (reports,
   dashboards, KPIs, grid definitions, placements).

Optionally, you can also provide:

3. **AlertChannelAdapter** — how breached alerts are delivered externally
   (email, Slack, webhook).

### How this guide relates to the others

| Guide                                   | Audience                                | Focus                                                           |
| --------------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| **This guide** (Workspace Integration)  | Developers embedding the workspace      | Mounting, configuring, passing adapters                         |
| [Developer Guide](./DEVELOPER-GUIDE.md) | Library contributors, extension authors | Internal architecture, package internals, testing               |
| [Admin Guide](./ADMIN-GUIDE.md)         | Technical administrators                | Using the workspace UI to configure dashboards, filters, alerts |
| [User Guide](./USER-GUIDE.md)           | End users / business analysts           | Interacting with dashboards, applying filters, drill-through    |

Read this guide first. Once the workspace is mounted and data is flowing,
hand off the Admin Guide to your configurators and the User Guide to your
end users.

---

## 2. Minimum Viable Integration

### Install

```bash
npm install @phozart/workspace
```

### Import

```typescript
// Registers <phz-workspace> and all internal sub-components
import '@phozart/workspace/all';
```

### Mount

```html
<phz-workspace
  .adapter="${workspaceAdapter}"
  .dataAdapter="${dataAdapter}"
  role="admin"
  title="My Analytics"
></phz-workspace>
```

That is the complete integration. Four properties:

| Property       | Type                              | Required | Description                                  |
| -------------- | --------------------------------- | -------- | -------------------------------------------- |
| `.adapter`     | `WorkspaceAdapter`                | Yes      | Persistence backend for all artifacts        |
| `.dataAdapter` | `DataAdapter`                     | Yes      | Data query execution engine                  |
| `role`         | `'admin' \| 'author' \| 'viewer'` | Yes      | Determines UI capabilities (see table below) |
| `title`        | `string`                          | No       | Shown in the workspace header bar            |

An optional `active-panel` string attribute lets you set the initially
visible panel programmatically (e.g. `active-panel="dashboards"`).

### Role capabilities

| Role     | Can create artifacts | Can edit shared | Can publish | Sees admin sections           |
| -------- | -------------------- | --------------- | ----------- | ----------------------------- |
| `admin`  | Yes                  | Yes             | Yes         | Yes (Content + Data + Govern) |
| `author` | Yes                  | Own only        | No          | No (Content only)             |
| `viewer` | No                   | No              | No          | No (Content only, read-only)  |

The `role` property controls which sidebar sections and navigation items
appear. Admins see three sections (Content, Data, Govern). Authors see the
Content section. Viewers see the Content section in read-only mode.

### Events

The workspace emits these `CustomEvent`s that bubble through the DOM:

| Event               | `detail`                         | When                                |
| ------------------- | -------------------------------- | ----------------------------------- |
| `panel-change`      | `{ panelId: string }`            | User navigates to a different panel |
| `save-report`       | `{ report: ReportConfig }`       | Report is saved                     |
| `save-dashboard`    | `{ dashboard: DashboardConfig }` | Dashboard is saved                  |
| `publish-report`    | `{ report: ReportConfig }`       | Report is published                 |
| `publish-dashboard` | `{ dashboard: DashboardConfig }` | Dashboard is published              |

---

## 3. Responsibility Boundary

Understanding what the workspace owns versus what you own is critical for a
clean integration.

### The workspace owns

- All UI rendering (sidebar, content panels, modals, drawers, toolbars)
- State management for open artifacts
- Undo/redo across all editors
- Publish workflow and artifact visibility lifecycle (personal/shared/published)
- Catalog browsing and search
- Drag-and-drop dashboard layout with CSS Grid rendering
- Auto-save with debounce and dirty detection
- Filter administration, filter rule engine, preset management
- Creation wizard (grid definitions)
- Dashboard template suggestions and auto-binding
- Internationalization (I18nProvider with RTL support, zero-config English)
- Responsive layout (desktop, laptop icon-only sidebar, tablet/mobile hamburger)
- Keyboard shortcuts and focus management
- Alert rule evaluation (condition trees, cooldown, breach records)

### You own

- **Data fetching** — Implement `DataAdapter` to connect to your backend.
  The workspace never fetches data directly; every query goes through your
  adapter.
- **Persistence** — Implement `WorkspaceAdapter` to store artifacts wherever
  you need them (database, REST API, localStorage, etc.).
- **Authentication and authorization** — The workspace does not manage users.
  You set the `role` property based on your auth system.
- **Alert delivery** — Optionally implement `AlertChannelAdapter` to send
  breach notifications through your channels (email, Slack, PagerDuty).
- **Custom widget registration** — Register additional widget types via the
  `ManifestRegistry` if the built-in set does not cover your needs.
- **Row-Level Security** — Pass `viewerContext` through `DataAdapter.execute()`
  to enforce RLS at the data layer.

---

## 4. DataAdapter — The Data Contract

The `DataAdapter` interface is the single contract through which all data
flows into the workspace. Every widget, every filter dropdown, every schema
inspector calls methods on this adapter.

### Interface

```typescript
interface DataAdapter {
  /** Execute a query and return tabular results. */
  execute(
    query: DataQuery,
    context?: { viewerContext?: unknown; signal?: AbortSignal },
  ): Promise<DataResult>;

  /** Return the schema (fields, types, cardinality) for a data source. */
  getSchema(sourceId?: string): Promise<DataSourceSchema>;

  /** List all available data sources (for catalog and data source picker). */
  listDataSources(): Promise<DataSourceSummary[]>;

  /** Return distinct values for a field (for filter dropdowns). */
  getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }>;

  /** Return statistical summary for a field (for numeric range filters). */
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

### Skeleton implementation

A minimal REST-backed adapter:

```typescript
import type {
  DataAdapter,
  DataQuery,
  DataResult,
  DataSourceSchema,
  DataSourceSummary,
} from '@phozart/workspace';

class MyDataAdapter implements DataAdapter {
  constructor(private baseUrl: string) {}

  async execute(
    query: DataQuery,
    context?: { viewerContext?: unknown; signal?: AbortSignal },
  ): Promise<DataResult> {
    const res = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, viewer: context?.viewerContext }),
      signal: context?.signal,
    });
    return res.json();
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    const res = await fetch(
      sourceId ? `${this.baseUrl}/schema/${sourceId}` : `${this.baseUrl}/schema`,
    );
    return res.json();
  }

  async listDataSources(): Promise<DataSourceSummary[]> {
    return (await fetch(`${this.baseUrl}/sources`)).json();
  }

  async getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ) {
    const res = await fetch(`${this.baseUrl}/sources/${sourceId}/distinct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, ...options }),
    });
    return res.json();
  }

  async getFieldStats(sourceId: string, field: string, filters?: unknown) {
    const res = await fetch(`${this.baseUrl}/sources/${sourceId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, filters }),
    });
    return res.json();
  }
}
```

### DataResult shape

Every `execute()` call returns a `DataResult` with `columns` (name + dataType),
`rows` (positional arrays matching column order), and `metadata` (totalRows,
truncated, queryTimeMs, optional quality info). An optional `arrowBuffer`
(Arrow IPC `ArrayBuffer`) enables DuckDB-WASM local query. Set
`metadata.truncated = true` when results are capped by a limit.

### Row-Level Security via ViewerContext

The workspace passes `context.viewerContext` through to your adapter on every
`execute()` call. Your backend should use this to enforce row-level security:

```typescript
interface ViewerContext {
  userId?: string;
  roles?: string[];
  attributes?: Record<string, unknown>;
}
```

The workspace itself never inspects or filters data. All security enforcement
happens in your `DataAdapter` implementation. This is by design — the
workspace is a UI layer, and security decisions belong at the data layer.

### Query strategy

Each `DataQuery` may include a `strategy` with an `execution` hint
(`'server'`, `'cache'`, or `'auto'`), plus optional `cacheKey`, `cacheTTL`,
and `estimatedRows`. Your adapter can use these to decide whether to hit the
server or return cached results. The workspace sets this based on the
dashboard's preload vs. full-load phase.

---

## 5. Persistence — WorkspaceAdapter

The `WorkspaceAdapter` is how the workspace persists everything: reports,
dashboards, KPIs, metrics, grid definitions, placements, alert rules, and
templates.

### Interface hierarchy

`WorkspaceAdapter` extends two base interfaces:

```
EngineStorageAdapter     (reports, dashboards, KPIs, metrics)
  + AsyncDefinitionStore (grid definitions)
  + Placement methods    (artifact positioning)
  + Catalog methods      (cross-type artifact listing)
  + Alert store          (optional — rules, breaches, subscriptions)
  + Template store       (optional — dashboard templates)
```

### Core methods

```typescript
interface WorkspaceAdapter extends EngineStorageAdapter, AsyncDefinitionStore {
  /** Persist a placement record (widget position on a dashboard). */
  savePlacement(placement: PlacementRecord): Promise<PlacementRecord>;

  /** Load placements, optionally filtered by artifact or type. */
  loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]>;

  /** Delete a placement by ID. */
  deletePlacement(id: PlacementId): Promise<void>;

  /** List all artifacts across all types (for catalog browsing). */
  listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]>;

  /** Initialize the adapter (create tables, open connections, etc.). */
  initialize(): Promise<void>;
}
```

### Inherited methods

From `EngineStorageAdapter` — CRUD for each artifact type (all return `Promise`):

| Artifact   | Save                       | Load all           | Delete                |
| ---------- | -------------------------- | ------------------ | --------------------- |
| Reports    | `saveReport(report)`       | `loadReports()`    | `deleteReport(id)`    |
| Dashboards | `saveDashboard(dashboard)` | `loadDashboards()` | `deleteDashboard(id)` |
| KPIs       | `saveKPI(kpi)`             | `loadKPIs()`       | `deleteKPI(id)`       |
| Metrics    | `saveMetric(metric)`       | `loadMetrics()`    | `deleteMetric(id)`    |

Plus `clear(): Promise<void>` to reset all stores.

From `AsyncDefinitionStore` — grid definition persistence:

| Method      | Signature                                                              |
| ----------- | ---------------------------------------------------------------------- |
| `save`      | `(def: GridDefinition) => Promise<GridDefinition>`                     |
| `load`      | `(id: DefinitionId) => Promise<GridDefinition \| undefined>`           |
| `list`      | `() => Promise<DefinitionMeta[]>`                                      |
| `delete`    | `(id: DefinitionId) => Promise<boolean>`                               |
| `duplicate` | `(id: DefinitionId, options?) => Promise<GridDefinition \| undefined>` |

### Optional extensions

The adapter supports three optional extension surfaces. Implement the methods
you need; omit the rest.

| Extension            | Methods                                                                                                                                                       | Effect when absent                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Alert store**      | `saveAlertRule`, `loadAlertRules`, `deleteAlertRule`, `saveBreachRecord`, `loadActiveBreaches`, `updateBreachStatus`, `saveSubscription`, `loadSubscriptions` | Alerts evaluate locally but are not persisted across sessions |
| **Template store**   | `saveTemplate`, `loadTemplates`, `deleteTemplate`                                                                                                             | Only built-in templates are available                         |
| **Artifact history** | `getArtifactHistory`, `getArtifactVersion`, `restoreArtifactVersion`                                                                                          | Version history panel is hidden                               |

The workspace detects history support at runtime via `hasHistorySupport(adapter)`.
See `packages/workspace/src/workspace-adapter.ts` for the full method
signatures.

### Two integration patterns

You can integrate persistence in two ways:

**Pattern A: Adapter methods (recommended).** Implement all the methods above.
The workspace calls them directly during auto-save, publish, and delete
operations. This is the cleanest approach.

**Pattern B: Event listeners.** Listen for `save-report`, `save-dashboard`,
`publish-report`, and `publish-dashboard` events on the `<phz-workspace>`
element. The `detail` property contains the artifact. Use this pattern when
you need to intercept saves for validation, logging, or side effects.

Both patterns work. Pattern A is sufficient for most integrations. Use
Pattern B when you need to hook into the save lifecycle.

### Reference implementation

The workspace ships with a `MemoryWorkspaceAdapter` for testing and
prototyping:

```typescript
import { MemoryWorkspaceAdapter } from '@phozart/workspace';

const adapter = new MemoryWorkspaceAdapter();
await adapter.initialize();
```

This adapter stores everything in memory and is lost on page refresh. It
implements the full interface including artifact history. Use it during
development while building your production adapter.

---

## 6. AlertChannelAdapter (Optional)

The workspace evaluates alert rules internally using pure functions (condition
trees with `AND`/`OR`/`NOT` logic, threshold operators, cooldown periods).
When a breach is detected, the workspace creates a `BreachRecord` and stores
it via the `WorkspaceAdapter`.

To deliver breach notifications externally (email, Slack, webhook, PagerDuty),
provide an `AlertChannelAdapter`:

```typescript
interface AlertChannelAdapter {
  /** Send a breach notification to a subscriber. */
  send(breach: BreachRecord, subscription: AlertSubscription): Promise<void>;

  /** Test the channel connection (used by the admin UI's "Test" button). */
  test(): Promise<boolean>;

  /** Optional JSON Schema describing channel-specific configuration. */
  configSchema?: unknown;
}
```

A `BreachRecord` contains the breach details (rule ID, artifact ID, current
and threshold values, severity, status, timestamps). An `AlertSubscription`
links a rule to a channel and recipient with a delivery format (`inline`,
`digest`, or `webhook`). See `packages/workspace/src/types.ts` for the full
type definitions.

If you do not provide an `AlertChannelAdapter`, alerts still evaluate and
breaches are still recorded — they simply have no external delivery. The
admin UI will show breach status but the "Send Test" button will be disabled.

For implementation patterns and the full alert evaluation pipeline, see the
[Developer Guide](./DEVELOPER-GUIDE.md).

---

## 7. Custom Widgets

The workspace includes built-in widgets for the most common visualization
types: bar chart, line chart, area chart, pie chart, KPI card, gauge,
trend-line, scorecard, and more.

If you need a widget type that is not built in, you can register custom
widgets through the `ManifestRegistry`.

### ManifestRegistry interface

```typescript
interface ManifestRegistry {
  registerManifest(manifest: WidgetManifest): void;
  getManifest(type: string): WidgetManifest | undefined;
  listManifests(): WidgetManifest[];
  listByCategory(category: string): WidgetManifest[];
  findByCapabilities(filter: CapabilityFilter): WidgetManifest[];
  getVariants(type: string): WidgetVariant[];
  resolveVariant(type: string, variantId: string): WidgetVariant | undefined;
}
```

### Registration example

Each widget is described by a `WidgetManifest` with type metadata, required
fields, size bounds, supported interactions, and an optional lazy `load()`
function for code-splitting. Here is a complete registration:

```typescript
import { createManifestRegistry } from '@phozart/workspace/registry';

const registry = createManifestRegistry();

registry.registerManifest({
  type: 'custom-heatmap',
  category: 'Charts',
  name: 'Heatmap',
  description: 'Color-coded matrix visualization',
  requiredFields: [
    { name: 'x', dataType: 'string', role: 'dimension', required: true },
    { name: 'y', dataType: 'string', role: 'dimension', required: true },
    { name: 'value', dataType: 'number', role: 'measure', required: true },
  ],
  supportedAggregations: ['sum', 'avg', 'count'],
  minSize: { cols: 2, rows: 2 },
  preferredSize: { cols: 4, rows: 3 },
  maxSize: { cols: 8, rows: 6 },
  supportedInteractions: ['drill-through', 'cross-filter'],
  variants: [],
  load: async () => {
    const mod = await import('./heatmap-renderer.js');
    return mod.heatmapRenderer;
  },
});
```

The `load` function enables code-splitting. The renderer is only imported when
a dashboard actually uses the widget.

For the full widget rendering lifecycle, renderer interface, and render context
shape, see the [Developer Guide](./DEVELOPER-GUIDE.md).

---

## 8. Common Mistakes

### Mistake 1: Manually wiring internal components

**Wrong:**

```html
<!-- Do NOT do this -->
<phz-dashboard-builder .adapter="${adapter}"></phz-dashboard-builder>
<phz-report-designer .adapter="${adapter}"></phz-report-designer>
<phz-grid-admin .adapter="${adapter}"></phz-grid-admin>
```

**Right:**

```html
<!-- One component, one mount point -->
<phz-workspace
  .adapter="${adapter}"
  .dataAdapter="${dataAdapter}"
  role="admin"
  title="My App"
></phz-workspace>
```

Components like `<phz-dashboard-builder>`, `<phz-report-designer>`,
`<phz-catalog-browser>`, and `<phz-alert-rule-designer>` are internal to
the workspace. They are rendered automatically based on sidebar navigation.
Mounting them directly bypasses the workspace's state management, routing,
undo/redo, auto-save, and keyboard shortcuts.

The legacy shim packages (`@phozart/grid-admin`,
`@phozart/engine-admin`, `@phozart/grid-creator`) have been archived.
All functionality lives in `@phozart/workspace` sub-path exports.
Use `<phz-workspace>` exclusively.

### Mistake 2: No `maxRows` on DataAdapter results

When your `DataAdapter.execute()` returns results, always respect the
`query.limit` parameter and set `metadata.truncated` accordingly. If your
backend returns unbounded result sets, the browser will eventually run out
of memory.

The workspace's dashboard data configuration uses a two-phase loading
strategy:

1. **Preload phase** — lightweight metadata query (small result set, no heavy
   data).
2. **Full load phase** — the complete dataset with `maxRows` set on the
   `FullLoadConfig`.

If you ignore `query.limit`, a dashboard with 10 widgets each requesting
100,000 rows will try to hold 1,000,000 rows in memory simultaneously.

**Recommendation:** Enforce a server-side maximum (e.g. 50,000 rows) even
if the query does not specify a limit. Set `metadata.truncated = true` when
this cap is applied.

### Mistake 3: Implementing RLS in the workspace instead of the DataAdapter

The workspace passes `viewerContext` through to your `DataAdapter` on every
query. It is tempting to add filtering logic in the workspace layer — do not.

**Wrong:** Adding a middleware that filters rows after `execute()` returns.
This leaks full datasets to the client before filtering, which is both a
security risk and a performance problem.

**Right:** Your `DataAdapter.execute()` implementation reads
`context.viewerContext` and applies row-level security predicates at the
database layer, before results leave the server.

```typescript
async execute(query: DataQuery, context?: { viewerContext?: unknown }) {
  const viewer = context?.viewerContext as ViewerContext;
  // Add RLS predicates to the query BEFORE executing
  const securedQuery = applyRLS(query, viewer);
  return this.runQuery(securedQuery);
}
```

### Mistake 4: Returning `arrowBuffer` on preload queries

The `DataResult` type has an optional `arrowBuffer` field for Apache Arrow
IPC buffers. This is used for DuckDB-WASM ingestion when the workspace needs
to run local analytical queries on the client.

The dashboard data pipeline uses two phases:

- **Preload** (`DashboardDataConfig.preload`): Fetches metadata and summary
  data for initial render. This should be fast and lightweight.
- **Full load** (`DashboardDataConfig.fullLoad`): Fetches the complete
  dataset, optionally with an Arrow buffer for local query.

Do not attach `arrowBuffer` to preload results. Arrow IPC buffers can be
large (megabytes), and the preload phase is meant to give users something
to look at within milliseconds. Send Arrow buffers only on the full load
phase when `query.strategy?.execution` is `'server'` or `'auto'` and the
dashboard configuration calls for it.

```typescript
async execute(query: DataQuery, context?: { viewerContext?: unknown }) {
  const result = await this.runQuery(query);

  // Only attach Arrow buffer for full-load queries, not preload
  if (query.strategy?.execution !== 'cache' && query.limit !== 100) {
    result.arrowBuffer = await this.serializeToArrow(result);
  }

  return result;
}
```

---

## 9. v15: Three-Shell Deployment

v15 introduces two new shell packages alongside the existing workspace. Each
shell targets a specific persona and can be deployed independently.

### Shell packages

| Shell         | Package                  | Persona | Install                              |
| ------------- | ------------------------ | ------- | ------------------------------------ |
| **Workspace** | `@phozart/workspace` | Admin   | `npm install @phozart/workspace` |
| **Viewer**    | `@phozart/viewer`    | Analyst | `npm install @phozart/viewer`    |
| **Editor**    | `@phozart/editor`    | Author  | `npm install @phozart/editor`    |

All three depend on `@phozart/shared` (installed automatically as a
dependency).

### Deployment patterns

**Viewer-only** — embed read-only dashboards in a customer portal:

```html
<phz-viewer-shell
  .adapter="${workspaceAdapter}"
  .dataAdapter="${dataAdapter}"
  .config="${viewerConfig}"
></phz-viewer-shell>
```

```typescript
import { createViewerShellConfig } from '@phozart/viewer';

const viewerConfig = createViewerShellConfig({
  branding: { appName: 'Customer Portal', primaryColor: '#1a73e8' },
  featureFlags: { enableExplore: true, enableExport: true },
});
```

**Author + Viewer** — self-service BI for business users:

```typescript
// Route based on user role
if (user.role === 'author') {
  // Mount <phz-editor-shell>
  import '@phozart/editor';
} else {
  // Mount <phz-viewer-shell>
  import '@phozart/viewer';
}
```

**Full admin** — complete platform:

```typescript
// Admin gets workspace, others get viewer or editor
switch (user.role) {
  case 'admin':
    import '@phozart/workspace/all';
    // Mount <phz-workspace>
    break;
  case 'author':
    import '@phozart/editor';
    // Mount <phz-editor-shell>
    break;
  default:
    import '@phozart/viewer';
    // Mount <phz-viewer-shell>
    break;
}
```

**Headless** — server-side rendering or API-only:

```typescript
// Use engine + shared directly, no shell packages
import { createBIEngine } from '@phozart/engine';
import type { DataAdapter } from '@phozart/shared/adapters';
```

### Adapters are shared

All three shells consume the same `DataAdapter` and `WorkspaceAdapter`
interfaces from `@phozart/shared`. You implement them once and pass them
to whichever shell you mount. The adapter interfaces have not changed from
v14 — existing implementations work without modification.

---

## 10. v15: Shared Package Foundation

The `@phozart/shared` package is the new foundation layer. It contains
everything that was previously duplicated across workspace, viewer, and editor:
adapter interfaces, type definitions, design system tokens, artifact metadata
types, and runtime coordination state machines.

### Import paths

| Import                              | What it gives you                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@phozart/shared/adapters`      | `DataAdapter`, `DataQuery`, `DataResult`, persistence SPIs, channel adapters                                        |
| `@phozart/shared/types`         | All shared type definitions (alerts, subscriptions, widgets, filters, API, micro-widgets, impact chains, attention) |
| `@phozart/shared/design-system` | `DESIGN_TOKENS`, responsive breakpoints, container queries, component patterns                                      |
| `@phozart/shared/artifacts`     | `ArtifactVisibility`, `DefaultPresentation`, `PersonalView`, `GridArtifact`                                         |
| `@phozart/shared/coordination`  | `FilterContextManager`, `DashboardDataPipeline`, `InteractionBus`, loading states, execution strategy               |
| `@phozart/shared`               | Barrel re-export of all sub-paths (convenience, but prefer sub-paths for tree-shaking)                              |

### Migration from v14

In v14, types like `DataAdapter`, `ViewerContext`, `FilterContextManager`, and
`DESIGN_TOKENS` were imported from `@phozart/workspace`. In v15, their
canonical source is `@phozart/shared`. The workspace re-exports them for
backward compatibility, but new code should import from shared:

```typescript
// v14 (still works but deprecated)
import type { DataAdapter } from '@phozart/workspace';

// v15 (preferred)
import type { DataAdapter } from '@phozart/shared/adapters';
```

---

## 11. v15: CellRendererRegistry Wiring

The `CellRendererRegistry` is a runtime dependency injection pattern that lets
grid columns render micro-widgets (sparklines, gauges, deltas) inside cells
without creating build-time circular dependencies between the grid and widgets
packages.

### Wiring at mount time

```typescript
import { createCellRendererRegistry } from '@phozart/shared/types';

// 1. Create the registry at app initialization
const cellRenderers = createCellRendererRegistry();

// 2. Register renderers (typically from your widgets package or custom code)
import { sparklineRenderer, gaugeArcRenderer, deltaRenderer, valueOnlyRenderer }
  from './my-cell-renderers';

cellRenderers.register('sparkline', sparklineRenderer);
cellRenderers.register('gauge-arc', gaugeArcRenderer);
cellRenderers.register('delta', deltaRenderer);
cellRenderers.register('value-only', valueOnlyRenderer);

// 3. Pass to the grid component
<phz-grid .cellRendererRegistry=${cellRenderers} ...></phz-grid>
```

### Implementing a renderer

Each renderer implements the `MicroWidgetRenderer` interface:

```typescript
import type {
  MicroWidgetRenderer,
  MicroWidgetCellConfig,
  MicroWidgetRenderResult,
} from '@phozart/shared/types';

const sparklineRenderer: MicroWidgetRenderer = {
  render(
    config: MicroWidgetCellConfig,
    value: unknown,
    width: number,
    height: number,
  ): MicroWidgetRenderResult {
    const points = Array.isArray(value) ? value : [];
    // Generate SVG polyline from points...
    return { html: svgString, width, height };
  },
  canRender(config: MicroWidgetCellConfig, columnWidth: number): boolean {
    return columnWidth >= 60; // Need at least 60px for a readable sparkline
  },
};
```

### Why runtime registration

The grid package sits lower in the dependency chain than the widgets package.
If the grid imported widget renderers at build time, it would create a circular
dependency. Runtime registration breaks this cycle: the grid defines the
interface, and the application (or shell) populates the registry at mount time.

---

## 12. v15: Alert-Aware Widget Configuration

KPI cards, gauges, scorecards, and trend-line widgets can now visually indicate
alert state using `SingleValueAlertConfig`.

### Configuration

```typescript
import { createDefaultAlertConfig } from '@phozart/shared/types';

const widgetConfig = {
  // ... other widget config ...
  alertConfig: {
    ...createDefaultAlertConfig(),
    alertRuleBinding: 'rule-revenue-threshold', // ID of the alert rule
    alertVisualMode: 'background', // 'none' | 'indicator' | 'background' | 'border'
    alertAnimateTransition: true,
  },
};
```

### Resolving visual state

```typescript
import {
  resolveAlertVisualState,
  getAlertTokens,
  degradeAlertMode,
} from '@phozart/shared/types';

// Map of ruleId -> severity from the alert evaluation engine
const alertEvents = new Map([['rule-revenue-threshold', 'warning']]);

const visualState = resolveAlertVisualState(widgetConfig.alertConfig, alertEvents);
// { severity: 'warning', ruleId: 'rule-revenue-threshold', lastTransition: 1709... }

const tokens = getAlertTokens(visualState.severity, widgetConfig.alertConfig.alertVisualMode);
// { bg: 'widget.alert.warning.bg', indicator: 'widget.alert.warning.indicator' }

// Responsive degradation for small containers
const params = degradeAlertMode('background', 'compact');
// { showIndicator: true, indicatorSize: 8, borderWidth: 0, showBackground: true }
```

---

## 13. v15: Micro-Widget Cell Renderers

Grid columns can embed miniature widget renderings inside table cells. This
brings KPI-style visuals directly into the data grid without separate widget
components.

### Configuring a column for micro-widget rendering

```typescript
const gridConfig = {
  columns: [
    {
      field: 'revenue',
      header: 'Revenue',
      microWidget: {
        widgetType: 'trend-line',
        dataBinding: {
          valueField: 'revenue',
          sparklineField: 'revenue_history', // Array field with historical values
        },
        displayMode: 'sparkline',
        thresholds: { warning: 80000, critical: 50000 },
      },
    },
    {
      field: 'margin',
      header: 'Margin',
      microWidget: {
        widgetType: 'gauge',
        dataBinding: { valueField: 'margin' },
        displayMode: 'gauge-arc',
        thresholds: { warning: 0.2, critical: 0.1 },
      },
    },
  ],
};
```

### Display modes

| Mode         | Visual                                | Best For                      |
| ------------ | ------------------------------------- | ----------------------------- |
| `value-only` | Formatted number + colored status dot | Compact KPI display           |
| `sparkline`  | SVG polyline from array data          | Trend visualization           |
| `delta`      | Value + arrow + percentage change     | Period-over-period comparison |
| `gauge-arc`  | SVG semi-circle arc with fill         | Progress/utilization metrics  |

The grid checks `renderer.canRender(config, columnWidth)` before attempting to
render. If the column is too narrow, it falls back to plain text.

---

## 14. v15: Impact Chain Variant

The decision tree widget gained a new rendering variant for root cause analysis.
The impact chain displays nodes as a horizontal causal flow.

### Configuration

```typescript
import type { ImpactChainNode, DecisionTreeVariantConfig } from '@phozart/shared/types';

const nodes: ImpactChainNode[] = [
  {
    id: 'root',
    label: 'Latency Spike',
    status: 'critical',
    nodeRole: 'root-cause',
    impactMetrics: [{ label: 'P99', value: '850ms', field: 'latency_p99' }],
    children: ['db-slow', 'cache-miss'],
  },
  {
    id: 'db-slow',
    label: 'DB Query Slow',
    status: 'warning',
    nodeRole: 'failure',
    edgeLabel: 'causes',
    impactMetrics: [{ label: 'Avg Query', value: '420ms', field: 'db_avg' }],
    children: ['hypothesis-index'],
  },
  {
    id: 'hypothesis-index',
    label: 'Missing Index',
    status: 'ok',
    nodeRole: 'hypothesis',
    hypothesisState: 'validated',
    children: [],
  },
  // ... more nodes
];

const variantConfig: DecisionTreeVariantConfig = {
  renderVariant: 'impact-chain',
  chainLayout: {
    direction: 'horizontal',
    showEdgeLabels: true,
    collapseInvalidated: true,
    conclusionText: 'Root cause: missing database index on orders.customer_id',
  },
};
```

### Node roles

| Role         | Visual                               | Purpose                               |
| ------------ | ------------------------------------ | ------------------------------------- |
| `root-cause` | Highlighted card                     | The primary source of the problem     |
| `failure`    | Standard card with severity coloring | A confirmed failure in the chain      |
| `impact`     | Downstream card                      | A consequence of the failure          |
| `hypothesis` | Dashed border with validation badge  | A suspected cause under investigation |

### Hypothesis states

`validated`, `inconclusive`, `invalidated`, `pending` — displayed as a badge
on hypothesis nodes. Invalidated nodes can be visually collapsed when
`collapseInvalidated: true` is set in the chain layout.

---

## 15. v15: Faceted Attention Filtering

The attention system now supports faceted filtering for the notification panel.
Users can filter attention items by priority, source, artifact, and
acknowledged state, with cross-facet counts updating dynamically.

### Pure function API

```typescript
import {
  filterAttentionItems,
  computeAttentionFacets,
  type AttentionFilterState,
  type FilterableAttentionItem,
} from '@phozart/shared/types';

// Filter items
const filterState: AttentionFilterState = {
  priority: ['critical', 'warning'],
  source: ['alert'],
  acknowledged: false,
};

const filtered = filterAttentionItems(allItems, filterState);

// Compute facet counts for the sidebar
const facets = computeAttentionFacets(allItems, filterState);
// → [
//   { field: 'priority', label: 'Priority', values: [{ value: 'critical', count: 3 }, ...] },
//   { field: 'source', label: 'Source', values: [{ value: 'alert', count: 5 }, ...] },
// ]
```

### Coordination state

```typescript
import {
  initialAttentionFacetedState,
  toggleFacetValue,
  clearFacet,
  acknowledgeItem,
  setAttentionSort,
  getVisibleItems,
} from '@phozart/shared/coordination';

let state = initialAttentionFacetedState();
state = toggleFacetValue(state, 'priority', 'critical');
state = setAttentionSort(state, 'newest');
const visible = getVisibleItems(state);
```

The faceted state machine manages active facet selections, sort order,
pagination (`loadMore()`), and batch acknowledge (`acknowledgeAllVisible()`).

---

## Quick Reference

### Minimal setup checklist

1. `npm install @phozart/workspace`
2. Implement `DataAdapter` (5 methods)
3. Implement `WorkspaceAdapter` (or start with `MemoryWorkspaceAdapter`)
4. Add `<phz-workspace>` to your page with `.adapter`, `.dataAdapter`, and `role`
5. Set `role` based on your authentication system

### Import paths

| Import                              | What it gives you                                              |
| ----------------------------------- | -------------------------------------------------------------- |
| `@phozart/workspace/all`        | Registers `<phz-workspace>` and all sub-components             |
| `@phozart/workspace`            | Types and adapters (no custom element registration)            |
| `@phozart/workspace/registry`   | `createManifestRegistry()`, `createWidgetRegistry()`           |
| `@phozart/shared`               | Shared types, adapters, design system, artifacts, coordination |
| `@phozart/shared/adapters`      | `DataAdapter`, persistence SPIs, channel adapters              |
| `@phozart/shared/types`         | All shared type definitions                                    |
| `@phozart/shared/design-system` | Design tokens, responsive utilities                            |
| `@phozart/shared/artifacts`     | Artifact visibility, presentation, personal views              |
| `@phozart/shared/coordination`  | Filter context, data pipeline, interaction bus, loading states |
| `@phozart/viewer`               | Viewer shell state machines and components                     |
| `@phozart/editor`               | Editor shell state machines and components                     |

### Further reading

- [Developer Guide](./DEVELOPER-GUIDE.md) — Internal architecture, widget
  rendering lifecycle, CSS token system, testing patterns
- [Admin Guide](./ADMIN-GUIDE.md) — How admins configure dashboards, filters,
  alerts, navigation links, and artifact visibility
- [User Guide](./USER-GUIDE.md) — How end users browse catalogs, apply
  filters, drill through reports, and personalize their view
- [API Reference (v15)](./API-REFERENCE-V15.md) — Type reference for new
  packages: shared, viewer, editor, and new engine subsystems
- [API Reference (core)](./API-REFERENCE.md) — Core workspace types: data
  layer, widgets, layout, templates, alerts, filters, explorer
