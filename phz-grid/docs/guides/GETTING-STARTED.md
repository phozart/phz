# Getting Started

Five minutes to your first dashboard.

## Packages Overview (22 packages)

phz-grid is a monorepo with 22 packages. You only need to install the ones
relevant to your use case.

### Shell Packages (pick one or more based on your deployment)

| Package | Purpose |
|---------|---------|
| `@phozart/phz-workspace` | Full admin shell — authoring, governance, configuration |
| `@phozart/phz-editor` | Author shell — constrained authoring with curated measures |
| `@phozart/phz-viewer` | Analyst shell — read-only dashboards, reports, explorer |
| `@phozart/phz-shared` | Shared types and infrastructure used by all shells |

### Core Infrastructure

| Package | Purpose |
|---------|---------|
| `@phozart/phz-core` | Headless grid engine (data model, state, events) |
| `@phozart/phz-engine` | BI engine (reports, dashboards, KPIs, filters, pivots) |
| `@phozart/phz-definitions` | Serializable grid blueprints, stores, converters |
| `@phozart/phz-duckdb` | DuckDB-WASM data source adapter |
| `@phozart/phz-ai` | AI toolkit (schema-as-contract, NL query) |
| `@phozart/phz-collab` | Real-time collaboration (Yjs CRDTs) |
| `@phozart/phz-local` | Tier 2 local server (native DuckDB, filesystem) |

### UI Packages

| Package | Purpose |
|---------|---------|
| `@phozart/phz-grid` | Web Components grid (Lit rendering, virtualization, a11y) |
| `@phozart/phz-criteria` | Selection criteria and filter UI components |
| `@phozart/phz-widgets` | Dashboard widgets (bar-chart, KPI card, trend-line, etc.) |

### Framework Adapters

| Package | Purpose |
|---------|---------|
| `@phozart/phz-react` | React wrappers for grid, viewer, editor, and criteria |
| `@phozart/phz-vue` | Vue wrappers |
| `@phozart/phz-angular` | Angular wrappers |

### Shim Packages (backward compatibility)

| Package | Purpose |
|---------|---------|
| `@phozart/phz-grid-admin` | Re-exports from workspace/grid-admin |
| `@phozart/phz-engine-admin` | Re-exports from workspace/engine-admin |
| `@phozart/phz-grid-creator` | Re-exports from workspace/grid-creator |

### Additional

| Package | Purpose |
|---------|---------|
| `@phozart/phz-python` | Python package (pip install) for Jupyter/Panel/Streamlit |
| `@phozart/phz-demo` | Standalone demo app with sample datasets |

## Installation

Choose the installation that matches your use case:

### Viewer only (read-only dashboards)

```bash
npm install @phozart/phz-viewer @phozart/phz-shared
```

### Author + Viewer (self-service authoring)

```bash
npm install @phozart/phz-viewer @phozart/phz-editor @phozart/phz-shared
```

### Full platform (admin + author + viewer)

```bash
npm install @phozart/phz-workspace @phozart/phz-core @phozart/phz-engine
```

---

## Quick Start — Viewer Shell

The fastest way to display a published dashboard in your app:

```typescript
import { createViewerClient } from '@phozart/phz-viewer';
import { MemoryDataAdapter } from '@phozart/phz-shared/adapters/memory-data-adapter';

// 1. Set up your data adapter
const dataAdapter = new MemoryDataAdapter();
dataAdapter.addSource('sales', [
  { region: 'North', revenue: 42000 },
  { region: 'South', revenue: 31000 },
]);

// 2. Create the viewer client
const viewer = await createViewerClient({
  adapter: dataAdapter,
  viewerContext: { userId: 'analyst-1', roles: ['viewer'] },
});

// 3. Open a dashboard
viewer.openDashboard('dash-001');
```

The Viewer shell provides read-only consumption with filter bar, attention
sidebar, and drill-through navigation.

---

## Quick Start — Editor Shell

For authoring environments where users create dashboards with curated measures:

```typescript
import { createEditorClient } from '@phozart/phz-editor';
import { MemoryDataAdapter } from '@phozart/phz-shared/adapters/memory-data-adapter';

const dataAdapter = new MemoryDataAdapter();
dataAdapter.addSource('sales', [
  { region: 'North', product: 'Widget A', revenue: 42000, units: 210 },
  { region: 'South', product: 'Widget B', revenue: 31000, units: 155 },
]);

const editor = await createEditorClient({
  adapter: dataAdapter,
  viewerContext: { userId: 'author-1', roles: ['author'] },
  measureRegistry: [
    { id: 'total-revenue', name: 'Total Revenue', field: 'revenue', aggregation: 'sum', format: 'currency' },
    { id: 'total-units', name: 'Units Sold', field: 'units', aggregation: 'sum', format: 'integer' },
  ],
});

// Open the dashboard editor for a new or existing dashboard
editor.openDashboardEditor('new');
```

The Editor shell provides constrained authoring with the measure palette,
widget config panel, freeform grid layout, and the publish workflow.

---

## Quick Start — Workspace Shell (Full Platform)

For admin environments with full control over configuration and governance:

```typescript
import { createWorkspaceClient } from '@phozart/phz-workspace/client/workspace-client';
import { MemoryWorkspaceAdapter } from '@phozart/phz-workspace/adapters/memory-adapter';

const adapter = new MemoryWorkspaceAdapter();
await adapter.initialize();

const client = await createWorkspaceClient({
  adapter,
  capabilities: {
    widgetTypes: ['kpi-card', 'bar-chart', 'line-chart', 'data-table'],
    interactions: ['drill-through', 'cross-filter', 'export-csv'],
    maxNestingDepth: 2,
    supportedLayoutTypes: ['auto-grid', 'sections', 'tabs'],
  },
});

const artifacts = await client.listArtifacts({ type: 'dashboard' });
```

---

## Quick Start — Tier 1: Browser Only

Use `MemoryDataAdapter` and `MemoryWorkspaceAdapter` for prototyping, testing,
and small datasets. Everything runs in the browser with no server required.

### 1. Load your data

```typescript
import { MemoryDataAdapter } from '@phozart/phz-workspace/adapters/memory-data-adapter';

const dataAdapter = new MemoryDataAdapter();

dataAdapter.addSource('sales', [
  { region: 'North', product: 'Widget A', revenue: 42000, units: 210 },
  { region: 'South', product: 'Widget B', revenue: 31000, units: 155 },
  { region: 'East',  product: 'Widget A', revenue: 58000, units: 290 },
  { region: 'West',  product: 'Widget C', revenue: 27000, units: 135 },
]);
```

`addSource(id, rows)` stores an array of plain objects. Field types and
cardinality are inferred automatically when `getSchema()` is called.

### 2. Analyze the schema

```typescript
import { analyzeSchema } from '@phozart/phz-workspace/templates/schema-analyzer';

const schema = await dataAdapter.getSchema('sales');
const profile = analyzeSchema(schema);

console.log(profile.suggestedMeasures);    // ['revenue', 'units']
console.log(profile.suggestedDimensions);  // ['region', 'product']
console.log(profile.hasTimeSeries);        // false
```

`analyzeSchema` returns a `FieldProfile` describing which fields are measures,
dimensions, date fields, and identifiers. This drives template matching.

### 3. Match templates to your data shape

```typescript
import { matchTemplates } from '@phozart/phz-workspace/templates/template-matcher';
import { DEFAULT_TEMPLATES } from '@phozart/phz-workspace/templates/default-templates';

const suggestions = matchTemplates(profile, DEFAULT_TEMPLATES);

// suggestions is sorted best-match first
const best = suggestions[0];
console.log(best.template.name);           // e.g. 'KPI Overview'
console.log(best.score);                   // 0.0–1.0
console.log(best.matchedRationales);       // ['Has numeric data for KPIs']
```

`matchTemplates` scores each of the 9 built-in templates against your field
profile using weighted match rules and returns them sorted by score descending.

**Built-in templates:**

| Template | Category | Best for |
|----------|----------|----------|
| KPI Overview | overview | Single numeric measure with optional trend |
| Comparison Board | analytics | Side-by-side bar charts across two measures |
| Time Series Dashboard | analytics | Line/area charts when a date field is present |
| Tabular Report | reports | Data table with summary KPI |
| Scorecard | overview | Multiple KPIs with thresholds |
| Executive Summary | overview | KPI headlines, pie distribution, trend |
| Detail Drill | reports | Table with drill navigation links |
| Distribution Analysis | analytics | Pie chart and Top/Bottom N rankings |
| Operational Monitor | operations | Gauges and status table |

### 4. Save a dashboard via MemoryWorkspaceAdapter

```typescript
import { MemoryWorkspaceAdapter } from '@phozart/phz-workspace/adapters/memory-adapter';

const adapter = new MemoryWorkspaceAdapter();
await adapter.initialize();

// Build a minimal DashboardConfig from the chosen template
const chosenTemplate = suggestions[0].template;

await adapter.saveDashboard({
  id: 'dash-001' as any,
  name: 'Sales Overview',
  description: 'Auto-generated from template',
  widgets: chosenTemplate.widgetSlots.map(slot => ({
    id: slot.slotId,
    type: slot.widgetType,
    config: slot.defaultConfig,
    fieldBindings: slot.fieldBindings,
  })),
  layout: chosenTemplate.layout,
});

// Retrieve it back
const dashboards = await adapter.loadDashboards();
console.log(dashboards[0].name);  // 'Sales Overview'
```

### 5. Create a workspace client (optional)

`createWorkspaceClient` wraps an adapter with `ConsumerCapabilities` and
initializes it:

```typescript
import { createWorkspaceClient } from '@phozart/phz-workspace/client/workspace-client';

const client = await createWorkspaceClient({
  adapter,
  capabilities: {
    widgetTypes: ['kpi-card', 'bar-chart', 'trend-line'],
    interactions: ['drill-through', 'cross-filter'],
    maxNestingDepth: 2,
    supportedLayoutTypes: ['auto-grid', 'sections'],
  },
});

const artifacts = await client.listArtifacts({ type: 'dashboard' });
console.log(artifacts[0].name);  // 'Sales Overview'
```

---

## Quick Start — Tier 2: Local Server

Use `@phozart/phz-local` to start a persistent local server backed by the
filesystem and native DuckDB. Drop CSV or Parquet files into a watch directory
and they are imported automatically.

### 1. Install the local package

```bash
npm install @phozart/phz-local
```

### 2. Start the server programmatically

```typescript
import { createLocalServer } from '@phozart/phz-local';

const server = await createLocalServer({
  port: 3847,           // default; omit to accept default
  watchDir: './data',   // directory to watch for CSV/Parquet files
  openBrowser: true,    // open browser automatically
});

await server.start();

console.log(`Server running on port ${server.getPort()}`);
console.log(`Data directory: ${server.getDataDir()}`);
// Defaults to ~/.phz if dataDir not specified
```

### 3. Or use the CLI

```bash
npx phz-local --watch ./data --port 3847
```

The server:
- Binds to `127.0.0.1` only (localhost, never exposed to the network)
- Watches `watchDir` for `.csv`, `.parquet`, and `.json` files
- Auto-imports files as DuckDB tables named after the filename (without extension)
- Serves a browser UI at `http://localhost:3847`
- Exposes a health endpoint at `GET /health`

### 4. Connect from the browser

```typescript
import { createWorkspaceClient } from '@phozart/phz-workspace/client/workspace-client';
// (Use an HTTP adapter that talks to the local server)
```

---

## Next Steps

| Goal | Guide |
|------|-------|
| Embed a dashboard in your React/Vue/Angular app | [Consumer Guide](CONSUMER-GUIDE.md) |
| Understand the three-shell architecture and common features | [User Guide](USER-GUIDE.md) |
| Build and publish dashboards and reports (Editor shell) | [Author Guide](AUTHOR-GUIDE.md) |
| Query and explore data as an analyst (Viewer shell) | [Analyst Guide](ANALYST-GUIDE.md) |
| Deploy for a team or organization | [Admin Guide](ADMIN-GUIDE.md) |
| Write custom widgets or data adapters | [Developer Guide](DEVELOPER-GUIDE.md) |
