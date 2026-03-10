# @phozart/phz-viewer

Read-only consumption shell for the phz-grid SDK. Provides headless state machines and Lit Web Components for analysts to browse catalogs, view dashboards, run reports, explore data, and monitor attention items.

## Installation

```bash
npm install @phozart/phz-viewer
```

**Dependencies:** `@phozart/phz-shared`, `@phozart/phz-core`, `@phozart/phz-engine`, `@phozart/phz-grid`, `@phozart/phz-widgets`, `lit`

**Optional peer dependencies (for React):** `@lit/react`, `react`

> **Note:** For read-only deployment. Pair with `@phozart/phz-editor` to enable authoring capabilities.

## Sub-path Exports

| Import path | Description |
|-------------|-------------|
| `@phozart/phz-viewer` | All headless state machines + Lit components |
| `@phozart/phz-viewer/react` | React wrappers for all viewer components |

## Quick Start (Lit)

```ts
import '@phozart/phz-viewer';
```

```html
<phz-viewer-shell
  .config=${viewerConfig}
  .viewerContext=${{ userId: 'analyst-1', roles: ['viewer'] }}
  theme="light"
>
</phz-viewer-shell>
```

## Quick Start (React)

```tsx
import { ViewerShellReact, ViewerCatalogReact } from '@phozart/phz-viewer/react';
import type { ViewerShellConfig } from '@phozart/phz-viewer';

function App() {
  return (
    <ViewerShellReact
      config={viewerConfig}
      viewerContext={{ userId: 'analyst-1', roles: ['viewer'] }}
      theme="light"
      onViewerNavigate={(e) => console.log('Navigate:', e.detail)}
    />
  );
}
```

## Custom Elements

| Element | Description |
|---------|-------------|
| `<phz-viewer-shell>` | Top-level shell with navigation, attention badge, filter bar |
| `<phz-viewer-catalog>` | Artifact catalog with search, type filter, favorites, pagination |
| `<phz-viewer-dashboard>` | Dashboard viewer with cross-filtering and widget expansion |
| `<phz-viewer-report>` | Tabular report with sorting, pagination, search, and export |
| `<phz-viewer-explorer>` | Visual data explorer with field selection and chart suggestion |
| `<phz-attention-dropdown>` | Attention/notification dropdown with type filtering |
| `<phz-filter-bar>` | Dashboard-level filter bar with presets |
| `<phz-viewer-error>` | Contextual error display with recovery actions |
| `<phz-viewer-empty>` | Empty state display with scenario-specific messaging |

## Headless State Machines

All state management is provided as pure functions (no DOM dependency) for maximum flexibility:

### Shell State

```ts
import { createViewerShellState, navigateTo } from '@phozart/phz-viewer';

let state = createViewerShellState();
state = navigateTo(state, { screen: 'catalog' });
state = navigateTo(state, { screen: 'dashboard', artifactId: 'dash-1' });
```

### Catalog State

```ts
import { createCatalogState, setCatalogArtifacts, setSearchQuery } from '@phozart/phz-viewer';

let catalog = createCatalogState();
catalog = setCatalogArtifacts(catalog, artifacts);
catalog = setSearchQuery(catalog, 'revenue');
```

### Dashboard State

```ts
import { createDashboardViewState, loadDashboard, applyCrossFilter } from '@phozart/phz-viewer';

let dashboard = createDashboardViewState();
dashboard = loadDashboard(dashboard, { id: 'dash-1', title: 'Sales', widgets: [...] });
dashboard = applyCrossFilter(dashboard, { widgetId: 'w1', field: 'region', value: 'EMEA' });
```

### Report State

```ts
import { createReportViewState, loadReport, setReportSort } from '@phozart/phz-viewer';

let report = createReportViewState();
report = loadReport(report, { id: 'rpt-1', title: 'Monthly Sales', columns: [...] });
report = setReportSort(report, { field: 'revenue', direction: 'desc' });
```

### Explorer State

```ts
import { createExplorerScreenState, selectDataSource, setFields } from '@phozart/phz-viewer';

let explorer = createExplorerScreenState();
explorer = selectDataSource(explorer, 'source-1');
explorer = setFields(explorer, fieldList);
```

### Attention State

```ts
import { createAttentionDropdownState, setAttentionItems, markAllAsRead } from '@phozart/phz-viewer';

let attention = createAttentionDropdownState();
attention = setAttentionItems(attention, items);
attention = markAllAsRead(attention);
```

### Filter Bar State

```ts
import { createFilterBarState, setFilterDefs, setFilterValue } from '@phozart/phz-viewer';

let filters = createFilterBarState();
filters = setFilterDefs(filters, definitions);
filters = setFilterValue(filters, 'region', { operator: 'eq', value: 'EMEA' });
```

## React Wrappers

All Lit components have corresponding React wrappers with typed props:

| React Component | Wraps |
|----------------|-------|
| `ViewerShellReact` | `<phz-viewer-shell>` |
| `ViewerCatalogReact` | `<phz-viewer-catalog>` |
| `ViewerDashboardReact` | `<phz-viewer-dashboard>` |
| `ViewerReportReact` | `<phz-viewer-report>` |
| `ViewerExplorerReact` | `<phz-viewer-explorer>` |
| `AttentionDropdownReact` | `<phz-attention-dropdown>` |
| `FilterBarReact` | `<phz-filter-bar>` |
| `ViewerErrorReact` | `<phz-viewer-error>` |
| `ViewerEmptyReact` | `<phz-viewer-empty>` |

## Configuration

```ts
import { createViewerShellConfig, createDefaultFeatureFlags } from '@phozart/phz-viewer';

const config = createViewerShellConfig({
  features: {
    ...createDefaultFeatureFlags(),
    explorer: true,
    attention: true,
  },
  branding: {
    appName: 'Analytics Hub',
    logoUrl: '/logo.svg',
  },
});
```

## License

MIT
