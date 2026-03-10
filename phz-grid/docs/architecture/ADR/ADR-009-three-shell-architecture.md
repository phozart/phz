# ADR-009: Three-Shell Architecture (Shared + Viewer + Editor)

## Status
Accepted

## Context

The workspace package (`@phozart/phz-workspace`) had become monolithic. It
contained admin UI, authoring capabilities, and viewing logic in a single
package. This created several problems:

1. **Bundle size**: Consumers who only needed a read-only dashboard viewer had
   to ship the entire workspace package, including all admin Lit components,
   authoring state machines, and configuration panels.

2. **Persona mismatch**: Three distinct personas use the system — analysts
   (read-only), authors (constrained editing via measure palette), and admins
   (full configuration). The monolithic workspace exposed admin capabilities to
   all consumers, requiring runtime gating rather than package-level separation.

3. **Circular dependency risk**: The workspace depended on engine, grid,
   criteria, definitions, and widgets. Adding micro-widget cell rendering
   inside the grid required the grid to reference widget types, which risked a
   circular dependency chain: `grid -> widgets -> engine -> workspace -> grid`.

4. **Shared types scattered**: Adapter interfaces (`DataAdapter`), artifact
   metadata (`ArtifactVisibility`), design tokens, and runtime coordination
   types were defined in various packages and duplicated across modules.

## Decision

We will split the architecture into three shells and a shared foundation:

### 1. `@phozart/phz-shared` — Shared Infrastructure

Contains all types, adapter SPIs, artifact metadata, design system tokens,
and runtime coordination modules that are needed by multiple shells.

**Sub-path exports:**
- `@phozart/phz-shared/adapters` — Consumer-implemented SPIs (DataAdapter,
  PersistenceAdapter, MeasureRegistryAdapter, AlertChannelAdapter,
  AttentionAdapter, UsageAnalyticsAdapter, SubscriptionAdapter)
- `@phozart/phz-shared/types` — Shared type definitions (SingleValueAlertConfig,
  MicroWidgetCellConfig, ImpactChainNode, AttentionFilterState, AsyncReportRequest,
  Subscription, PersonalAlert, ErrorState, EmptyState, etc.)
- `@phozart/phz-shared/design-system` — Design tokens (ALERT_WIDGET_TOKENS,
  IMPACT_CHAIN_TOKENS), responsive utilities, container queries, component
  patterns, shell layout, mobile utilities
- `@phozart/phz-shared/artifacts` — Artifact lifecycle (ArtifactVisibility,
  DefaultPresentation, PersonalView, GridArtifact)
- `@phozart/phz-shared/coordination` — Runtime state (FilterContextManager,
  DashboardDataPipeline, AsyncReportUIState, ExportsTabState,
  SubscriptionsTabState, ExpressionBuilderState, PreviewContextState,
  AttentionFacetedState)

### 2. `@phozart/phz-viewer` — Read-Only Consumption Shell

For the analyst persona. Headless state machines plus Lit Web Components.
Provides catalog browsing, dashboard viewing, report viewing, ad-hoc explorer,
attention notifications, and filter bar.

**Screens:** catalog, dashboard, report, explorer, attention, filter-bar

**Key property:** No editing capabilities. No undo/redo. No config panels.
Smallest possible bundle for read-only deployments.

### 3. `@phozart/phz-editor` — Authoring Shell

For the author persona. Constrained editing through a measure palette — authors
pick from curated measures rather than writing raw field expressions.

**Screens:** catalog, dashboard-view, dashboard-edit, report, explorer, sharing, alerts

**Authoring modules:** measure-palette, config-panel, sharing-flow,
alert-subscription

**Key property:** Undo/redo, auto-save, unsaved change tracking. Does NOT
include the full admin Lit components (those remain in workspace).

### 4. `@phozart/phz-workspace` — Full Admin (Unchanged)

Retains all existing workspace functionality: grid-admin, engine-admin,
grid-creator, criteria-admin, definition-ui, and the 15 workspace state
machines. This is the admin shell for full system configuration.

### Dependency Rule

**No shell imports another shell.** All inter-shell communication goes through
shared types:

```
@phozart/phz-shared  <--  @phozart/phz-viewer
@phozart/phz-shared  <--  @phozart/phz-editor
@phozart/phz-shared  <--  @phozart/phz-workspace
@phozart/phz-shared  <--  @phozart/phz-core
@phozart/phz-shared  <--  @phozart/phz-engine
@phozart/phz-shared  <--  @phozart/phz-grid
@phozart/phz-shared  <--  @phozart/phz-widgets
```

### CellRendererRegistry Pattern

The `CellRendererRegistry` interface is defined in `@phozart/phz-shared/types`
and uses **runtime registration** rather than build-time imports:

1. `@phozart/phz-shared` defines the `CellRendererRegistry` interface and
   `createCellRendererRegistry()` factory
2. `@phozart/phz-grid` imports the interface and calls `resolveCellRenderer()`
   during cell formatting — no import of widget code
3. `@phozart/phz-widgets` implements four SVG renderers and exports
   `registerAllMicroWidgetRenderers(registry)`
4. The consuming application (or shell) creates a registry, registers widget
   renderers, and passes it to the grid

This avoids the circular dependency: grid does NOT import widgets at build time.

### Build Order

```
shared -> core -> definitions -> engine -> duckdb -> criteria -> widgets -> grid
  -> workspace -> viewer -> editor -> (shims) -> ai -> collab -> react -> vue -> angular
```

## Consequences

### Positive

- **Smallest possible viewer bundle**: Consumers deploying read-only dashboards
  ship only shared + viewer (no workspace, no admin Lit components)
- **Persona-appropriate capabilities**: Authors get the measure palette and
  constrained editing. Analysts get read-only views. Admins get full config.
- **No circular dependencies**: The CellRendererRegistry runtime pattern
  eliminates the grid -> widgets circular dependency
- **Shared types as single source of truth**: Adapter interfaces, artifact
  metadata, and design tokens are defined once in shared
- **Independent shell evolution**: Viewer, editor, and workspace can be
  versioned and released independently (within semver constraints of shared)

### Negative

- **More packages to manage**: 3 new packages (shared, viewer, editor) increase
  monorepo maintenance burden
- **Runtime registration overhead**: CellRendererRegistry requires the consumer
  to call `registerAllMicroWidgetRenderers()` at application startup — this is
  an extra step compared to automatic build-time resolution
- **Potential type duplication risk**: If a type is needed by both viewer and
  editor, it MUST go in shared — discipline required to avoid drift
- **Build order complexity**: The build chain is longer (shared must build
  before everything else)

### Neutral

- **Workspace unchanged**: Existing workspace consumers see no breaking changes.
  The workspace package retains all its functionality and Lit components.
- **Framework adapters unaffected**: React, Vue, and Angular wrappers continue
  to wrap grid and criteria components as before.
