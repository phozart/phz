# @phozart/phz-shared

Shared infrastructure for the phz-grid ecosystem. Provides adapter interfaces (SPIs), design system tokens, artifact metadata types, and runtime coordination utilities used across all phz-grid packages.

## Installation

```bash
npm install @phozart/phz-shared
```

> **Note:** This is a foundation package. Other phz-grid packages depend on it. You typically consume it indirectly through higher-level packages like `@phozart/phz-viewer` or `@phozart/phz-editor`, but you can import directly when building custom integrations.

## Sub-path Exports

| Import path | Description |
|-------------|-------------|
| `@phozart/phz-shared` | Barrel re-export of all sub-paths |
| `@phozart/phz-shared/adapters` | Data adapter SPI, persistence, measures, alerts, attention |
| `@phozart/phz-shared/types` | Shared type definitions (filters, alerts, subscriptions, widgets, errors) |
| `@phozart/phz-shared/design-system` | Design tokens, responsive utilities, container queries, component patterns |
| `@phozart/phz-shared/artifacts` | Artifact visibility, default presentation, personal views, grid artifacts |
| `@phozart/phz-shared/coordination` | Filter context, data pipeline, interaction bus, loading state, navigation |

## Quick Start

### Adapter Interfaces

Implement `DataAdapter` to connect your data backend:

```ts
import type { DataAdapter, DataQuery, DataResult } from '@phozart/phz-shared/adapters';

const myAdapter: DataAdapter = {
  async execute(query: DataQuery): Promise<DataResult> {
    // Execute query against your data source
  },
  async getSchema(sourceId: string) {
    // Return field metadata for a data source
  },
  async listDataSources() {
    // Return available data sources
  },
};
```

### Design System

Access the design token constants for consistent styling:

```ts
import { DESIGN_TOKENS, SPACING, BREAKPOINTS } from '@phozart/phz-shared/design-system';

console.log(DESIGN_TOKENS.primary500);  // '#3B82F6'
console.log(SPACING.space4);            // '16px'
console.log(BREAKPOINTS.tablet);        // 768
```

### Artifact Visibility

Control who can see dashboards, reports, and other artifacts:

```ts
import {
  isVisibleToViewer,
  transitionVisibility,
  type VisibilityMeta,
} from '@phozart/phz-shared/artifacts';

const meta: VisibilityMeta = { visibility: 'shared', ownerId: 'user-1' };
const canSee = isVisibleToViewer(meta, { userId: 'user-2', roles: ['viewer'] });
```

### Runtime Coordination

Manage filter context across dashboards and widgets:

```ts
import { createFilterContext, type FilterContextManager } from '@phozart/phz-shared/coordination';

const ctx: FilterContextManager = createFilterContext({
  onFilterChange: (state) => console.log('Filters changed:', state),
});
```

### Types

Use shared type definitions for filters, alerts, subscriptions, and more:

```ts
import type {
  FieldEnrichment,
  PersonalAlert,
  Subscription,
  FilterValueSource,
} from '@phozart/phz-shared/types';
```

## Key Types

### Adapters

- `DataAdapter` — SPI for data query execution and schema introspection
- `ViewerContext` — User identity passed through for RLS (row-level security)
- `DataQuery` / `DataResult` — Query request and response shapes
- `DataSourceMeta` / `FieldMetadata` — Data source and field-level metadata
- `PersistenceAdapter` — Save/load artifacts (dashboards, reports, etc.)
- `MeasureRegistryAdapter` — Expose measures/dimensions for authoring
- `AttentionAdapter` — Provide attention items (alerts, notifications)

### Design System

- `DESIGN_TOKENS` — Color, spacing, typography, border radius, and shadow tokens
- `BREAKPOINTS` — Responsive breakpoint values (desktop, laptop, tablet, mobile)
- `containerQueryCSS()` — Generate container query CSS for widget sizing

### Artifacts

- `ArtifactType` — Union of all artifact kinds (dashboard, report, grid, alert, etc.)
- `ArtifactVisibility` — `'personal' | 'shared' | 'published'`
- `VisibilityMeta` — Metadata for artifact access control
- `DefaultPresentation` — Admin-defined default views (merge precedence: admin > preset > session)
- `GridArtifact` — Grid definitions as first-class artifacts

### Coordination

- `FilterContextManager` — 4-level filter hierarchy (global > dashboard > widget > cross-filter)
- `DashboardDataPipeline` — Parallel preload + full data loading
- `InteractionBus` — Widget-to-widget event communication
- `LoadingState` — 5-phase loading progress tracking

## License

MIT
