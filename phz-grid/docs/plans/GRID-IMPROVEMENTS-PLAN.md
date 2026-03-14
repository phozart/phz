# phz-grid Improvements Plan

**Date**: 2026-03-05
**Scope**: 5 work items across 3 new packages + enhancements to 3 existing packages
**Methodology**: Strict TDD (Red-Green-Refactor) via `/tdd` skill for all implementation
**Companion**: `FEATURE-ROADMAP.md` (Work Items 6-50: feature gaps, DuckDB, server-side, metrics)

---

## Overview

Five interconnected improvements that take phz-grid from "developer configures everything in code" to "zero-config instant grid with full runtime customization":

| # | Work Item | New/Modify | Package(s) | Depends On |
|---|-----------|-----------|------------|------------|
| 1 | Column Auto-Inference | Modify | `phz-core`, `phz-grid` | — |
| 2 | GridDefinition Package | **New** | `packages/definitions/` | — |
| 3 | Saved Views | Modify | `phz-core`, `phz-grid`, `phz-grid-admin` | — |
| 4 | Grid-Admin Separation | Modify + **New** | `phz-grid-admin`, `phz-definitions` (UI), `phz-criteria` | #2 |
| 5 | Creation Wizard | **New** | `packages/grid-creator/` | #2, #4 |

### New Packages

| Package | Description | Dependencies |
|---------|-------------|-------------|
| `@phozart/definitions` | Serializable grid blueprints, stores, converters, validation | `phz-core`, `zod`, `phz-engine` (optional peer) |
| `@phozart/grid-creator` | Stepped wizard for creating new grids/reports | `phz-definitions`, `phz-grid-admin`, `phz-criteria` |

### Dependency Graph (After All Changes)

```
@phozart/core  (foundation — no deps)
       |
       +------------------+------------------+
       |                  |                  |
  phz-engine        phz-definitions     phz-criteria
  (BI engine)       (blueprints,        (filter binding
                     stores, Zod)        UI components)
       |                  |                  |
       +--------+---------+--------+---------+
                |                  |
         phz-grid-admin      phz-grid
         (visual config      (rendering,
          only: columns,      virtualization,
          formatting,         view-switcher)
          table settings,
          export, theme)
                |
         phz-grid-creator
         (stepped wizard,
          composes all above)
```

---

## Work Item 1: Column Auto-Inference

**Goal**: `createGrid({ data })` works without explicit columns. Auto-detect column names, types, and headers from data shape.

### Files to Create

| File | Description |
|------|-------------|
| `packages/core/src/infer-columns.ts` | Pure inference module: `inferColumns()`, `detectColumnType()`, `formatFieldAsHeader()` |
| `packages/core/src/__tests__/infer-columns.test.ts` | Unit tests for all inference logic |

### Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/types/config.ts` | Add `autoColumns?: boolean` and `inferColumnsOptions?: InferColumnsOptions` to `GridConfig` |
| `packages/core/src/create-grid.ts` | Line 37: when `columns` empty and `autoColumns !== false`, call `inferColumns(data)` |
| `packages/core/src/index.ts` | Export `inferColumns`, `formatFieldAsHeader`, `detectColumnType`, `InferColumnsOptions` |
| `packages/grid/src/components/phz-grid.ts` | Add `auto-columns` attribute; store `_resolvedColumns` after `createGrid`; remove old `inferColumnsFromData()` |

### Key Design Decisions

- **Inference runs once at `createGrid()` time** — not on every render. Column definitions are schema declarations, not dynamically re-derived.
- **Sample first 100 rows** (configurable via `sampleSize`) for type detection.
- **Type detection priority**: boolean > number > date (ISO strings + Date objects) > string. Mixed types fall back to string.
- **Header generation**: `camelCase` -> "Camel Case", `snake_case` -> "Snake Case". Fields starting with `__` or `_` are skipped.
- **`autoColumns` defaults to `true`** when columns omitted. Explicit `autoColumns: false` suppresses inference.
- **Existing `inferDataSetColumns()`** in `dataset.ts` is a separate function (returns `DataSetColumn[]` for BI). Not merged — different type systems.

### Algorithm: `inferColumns(data, options?)`

1. Return `[]` if data is empty or `data[0]` is not a plain object
2. Extract keys from `data[0]` (preserves insertion order)
3. Filter out internal fields (`__*`, `_*`)
4. For each key, sample first N rows (skip null/undefined)
5. `detectColumnType(values)` -> `'string' | 'number' | 'boolean' | 'date'`
6. `formatFieldAsHeader(key)` -> human-readable label
7. Return `ColumnDefinition[]` with `sortable: true`, `filterable: true`

### Test Cases (24 tests)

**`formatFieldAsHeader`**: camelCase, snake_case, single char, empty string, consecutive caps (e.g. `totalRevenueUSD`)
**`detectColumnType`**: all-strings, all-numbers, all-booleans, ISO dates, Date objects, mixed types -> string, all nulls -> string, numbers-with-nulls -> number
**`inferColumns`**: empty array, non-object data, all four types, internal field filtering, custom sampleSize, column order preservation
**`createGrid` integration**: no-columns works, sort/filter/CSV work on inferred columns, `autoColumns: false` opt-out

### Build Sequence

1. Create `infer-columns.ts` + tests (pure functions, no downstream changes)
2. Wire into `createGrid()` + update `GridConfig` type
3. Update `<phz-grid>` Web Component
4. Verify all existing 1162 tests still pass

---

## Work Item 2: `@phozart/definitions` Package

**Goal**: Serializable, persistable "blueprint" that fully describes a grid instance. Separate from rendering (phz-grid) and the headless engine (phz-core).

### Package Structure

```
packages/definitions/
  src/
    types/
      identity.ts          # DefinitionId branded type, DefinitionIdentity
      data-source.ts       # DefinitionDataSource discriminated union
      column.ts            # DefinitionColumnSpec (serializable subset of ColumnDefinition)
      defaults.ts          # DefinitionDefaults (sort, filter, grouping, columnState)
      formatting.ts        # DefinitionFormatting (conditional formatting, table settings)
      behavior.ts          # DefinitionBehavior (features, density, edit mode, a11y)
      views.ts             # SavedView, ViewCollection
      access.ts            # DefinitionAccess (visibility, roles)
      grid-definition.ts   # GridDefinition root type (assembles all)
      index.ts
    store/
      definition-store.ts  # DefinitionStore + AsyncDefinitionStore interfaces
      in-memory-store.ts   # createInMemoryStore()
      local-storage-store.ts # createLocalStorageStore()
      index.ts
    converters/
      to-grid-config.ts    # definitionToGridConfig(def, options) -> GridConfig
      from-grid-config.ts  # gridConfigToDefinition(config, meta) -> GridDefinition
      export.ts            # exportDefinition() / importDefinition() with Zod validation
      index.ts
    migration/
      versions.ts          # CURRENT_SCHEMA_VERSION = '1.0.0'
      migrate.ts           # migrateDefinition() + per-version migrators
      index.ts
    validation/
      schemas.ts           # Zod schemas for all types
      validate.ts          # validateDefinition() -> DefinitionValidationResult
      index.ts
    index.ts
  src/__tests__/
    grid-definition.test.ts
    definition-store.test.ts
    converters.test.ts
    migration.test.ts
    validation.test.ts
  package.json
  tsconfig.json
```

### Core Type: `GridDefinition`

```typescript
interface GridDefinition extends DefinitionIdentity {
  dataSource: DefinitionDataSource;           // local | url | data-product | duckdb-query
  columns: DefinitionColumnSpec[];            // serializable column definitions
  defaults?: DefinitionDefaults;              // initial sort, filter, grouping
  formatting?: DefinitionFormatting;          // conditional formatting, table settings
  behavior?: DefinitionBehavior;              // features, density, edit mode, a11y
  views?: ViewCollection;                     // saved named views
  access?: DefinitionAccess;                  // role-based visibility
  metadata?: Record<string, unknown>;         // app-specific escape hatch
}
```

### Data Source Types (Discriminated Union)

| Type | Key Fields | Use Case |
|------|-----------|----------|
| `local` | `data: unknown[]` | Embedded JSON data |
| `url` | `url`, `method`, `headers`, `dataPath` | REST endpoint |
| `data-product` | `dataProductId`, `queryOverride?` | Engine data product |
| `duckdb-query` | `sql`, `parameterized?`, `connectionKey?` | DuckDB-WASM query |

### Store Interface

```typescript
interface DefinitionStore {
  save(def: GridDefinition): GridDefinition;
  load(id: DefinitionId): GridDefinition | undefined;
  list(): DefinitionMeta[];                   // lightweight summaries
  delete(id: DefinitionId): boolean;
  duplicate(id: DefinitionId, options?: { name?: string }): GridDefinition | undefined;
  clear(): void;
}
```

Built-in implementations: `createInMemoryStore()`, `createLocalStorageStore(options?)`.
`AsyncDefinitionStore` interface for REST/IndexedDB backends.

### Converter Functions

| Function | Signature | Purpose |
|----------|----------|---------|
| `definitionToGridConfig` | `(def, options?) -> GridConfig` | Blueprint to runtime config |
| `gridConfigToDefinition` | `(config, meta, options?) -> GridDefinition` | Capture config as blueprint |
| `exportDefinition` | `(def) -> string` | JSON export with envelope |
| `importDefinition` | `(json, options?) -> GridDefinition` | Parse, validate (Zod), migrate |

### Dependencies

```json
{
  "dependencies": {
    "@phozart/core": "^0.1.0",
    "zod": "^3.22.0"
  },
  "peerDependencies": {
    "@phozart/engine": "^0.1.0"
  },
  "peerDependenciesMeta": {
    "@phozart/engine": { "optional": true }
  }
}
```

### Build Sequence

1. Package scaffold (package.json, tsconfig, vitest alias)
2. Types (bottom-up: identity -> data-source -> column -> ... -> grid-definition)
3. Zod validation schemas
4. Migration infrastructure (empty MIGRATIONS map at v1.0.0)
5. Store interfaces + InMemoryStore + LocalStorageStore
6. Converters (definitionToGridConfig, gridConfigToDefinition, export/import)
7. Package entry point (index.ts)
8. Tests (~40 tests across 5 test files)

---

## Work Item 3: Saved Views

**Goal**: Users save the current grid state (columns, sort, filters, grouping) as a named view and switch between them.

### Architecture

- **`ViewsManager`** class in `phz-core` — sibling to `StateManager`, not nested inside `GridState` (avoids recursive serialization).
- **`<phz-view-switcher>`** component in `phz-grid` — toolbar dropdown for switching views.
- **`<phz-admin-views>`** component in `phz-grid-admin` — full CRUD management tab.

### Files to Create

| File | Package | Description |
|------|---------|-------------|
| `packages/core/src/types/views.ts` | core | `SavedView`, `ViewsState`, `ViewsSummary`, `SaveViewOptions` |
| `packages/core/src/views.ts` | core | `ViewsManager` class, `sanitizeViewState()` utility |
| `packages/core/src/__tests__/views.test.ts` | core | Unit tests |
| `packages/grid/src/components/phz-view-switcher.ts` | grid | Dropdown UI for view selection |
| `packages/grid/src/__tests__/view-switcher.test.ts` | grid | Logic tests |
| `packages/grid-admin/src/components/phz-admin-views.ts` | grid-admin | Views management tab |
| `packages/grid-admin/src/__tests__/admin-views.test.ts` | grid-admin | Logic tests |

### Files to Modify

| File | Change |
|------|--------|
| `packages/core/src/types/events.ts` | Add 6 view events to `GridEventMap` |
| `packages/core/src/types/api.ts` | Add 12 view methods to `GridApi` |
| `packages/core/src/create-grid.ts` | Instantiate `ViewsManager`, wire API methods |
| `packages/core/src/index.ts` | Export new types and classes |
| `packages/grid/src/events.ts` | Add 5 DOM event types |
| `packages/grid/src/components/phz-toolbar.ts` | Add view switcher slot |
| `packages/grid/src/components/phz-grid.ts` | Add `savedViews`, `showViewsSwitcher` props; wire events |
| `packages/grid-admin/src/components/phz-grid-admin.ts` | Add 'views' tab |

### GridApi View Methods

```typescript
// on GridApi
saveView(name: string, options?: SaveViewOptions): SavedView;
saveCurrentToView(id: string): SavedView;           // overwrite existing
loadView(id: string): void;
deleteView(id: string): void;
listViews(): ViewsSummary[];
getView(id: string): SavedView | undefined;
renameView(id: string, name: string): void;
setDefaultView(id: string | null): void;
getActiveViewId(): string | null;
isViewDirty(): boolean;                             // current state !== active view's state
importViews(views: SavedView[]): void;
exportViews(): SavedView[];
```

### Key Design Decisions

- **Views are NOT part of `GridState`** — they are a catalog of snapshots OF grid state. `ViewsManager` is a peer to `StateManager` inside `createGrid`.
- **Dirty detection**: `JSON.stringify(exportState()) !== JSON.stringify(activeView.state)`. Debounced 50ms in the toolbar.
- **Column mismatch handling**: `sanitizeViewState()` strips orphaned fields, appends new columns with defaults. Silent — no errors on stale views.
- **Security**: `loadView()` goes through the `importState` path that enforces column access restrictions.
- **Persistence is consumer's responsibility** — grid emits `view:save`/`view:load`/`view:delete` events; consumer persists however they want.

### Build Sequence

1. Core types + `ViewsManager` + tests
2. `<phz-view-switcher>` component + tests
3. Grid + toolbar integration (props, events)
4. `<phz-admin-views>` tab + tests
5. Full integration verification

---

## Work Item 4: Grid-Admin Responsibility Separation

**Goal**: Slim `phz-grid-admin` to only grid visual configuration. Move report identity and data source to `phz-definitions`. Deprecate criteria tab in favor of `phz-criteria`.

### Current State: 8 Tabs, 3 Concerns Mixed

| Tab | Concern | Decision |
|-----|---------|----------|
| **Report** (name, desc) | Definition identity | **MOVE** to `phz-definitions` |
| **Data Source** (picker) | Definition identity | **MOVE** to `phz-definitions` |
| **Criteria** (filter bindings) | Filter binding domain | **DEPRECATE** — use `PhzFilterConfigurator` from `phz-criteria` |
| Table Settings | Grid visual config | **STAYS** |
| Columns | Grid visual config | **STAYS** |
| Formatting | Grid visual config | **STAYS** |
| Filters (presets) | Grid visual config | **STAYS** |
| Export | Grid visual config | **STAYS** |

### After Split: `phz-grid-admin` = Pure Visual Config

**Tabs retained**: Table Settings, Columns, Formatting, Filters, Export, Theme, Views (new from WI#3)

**Properties removed from facade**: `reportId`, `reportName`, `reportDescription`, `reportCreated`, `reportUpdated`, `reportCreatedBy`, `selectedDataProductId`, `dataProducts`, `schemaFields`, `criteriaDefinitions`, `criteriaBindings`, `mode` (no more create mode — that's the wizard)

**Events simplified**: `settings-save` keeps `reportId` as pass-through but drops `reportName`

### Components Moving to `phz-definitions` (UI Layer)

| Old Name | New Name | New Tag |
|----------|----------|---------|
| `phz-admin-report.ts` | `phz-definition-report.ts` | `<phz-definition-report>` |
| `phz-admin-data-source.ts` | `phz-definition-data-source.ts` | `<phz-definition-data-source>` |

Plus new: `phz-definition-panel.ts` — composition component hosting both

### Criteria Migration

`PhzAdminCriteria` is **deprecated** with `console.warn` (same pattern as existing `PhzAdminOptions`).
Replacement: `PhzFilterConfigurator` from `@phozart/criteria` — already exists with richer capabilities (drag reorder, per-binding overrides, visibility toggles, data column mapping).

### Tests Moving

| From | To |
|------|----|
| `grid-admin/__tests__/admin-report.test.ts` | `definitions/__tests__/` |
| `grid-admin/__tests__/admin-data-source.test.ts` | `definitions/__tests__/` |
| `grid-admin/__tests__/admin-criteria.test.ts` | Deprecated alongside component |

### Migration Path (Phased)

**Phase 1 — Extract without breaking**: Copy components to `phz-definitions`; add deprecated re-exports in `phz-grid-admin` for backward compatibility.

**Phase 2 — Update facade**: Remove report/data-source/criteria tabs from modal. Bump to major version.

**Phase 3 — Cleanup**: Remove old files, deprecated re-exports. Extract `shared-styles.ts` to shared `@phozart/admin-styles` package.

---

## Work Item 5: Creation Wizard (`@phozart/grid-creator`)

**Goal**: Guided step-by-step flow for creating a new grid/report. Replaces `mode='create'` in grid-admin.

### Package Structure

```
packages/grid-creator/
  src/
    components/
      phz-grid-creator.ts       # Main wizard modal
      phz-creator-step.ts       # Step indicator + shell
      phz-creator-review.ts     # Review & create summary
    index.ts
  src/__tests__/
    wizard.test.ts
    wizard-review.test.ts
    wizard-integration.test.ts
  package.json
  tsconfig.json
```

### Wizard Steps

| Step | Name | Required | Component Source | Validation Gate |
|------|------|----------|-----------------|-----------------|
| 0 | Report Identity | Yes | `<phz-definition-report>` from `phz-definitions` | Name non-empty |
| 1 | Data Source | Yes | `<phz-definition-data-source>` from `phz-definitions` | Data product selected |
| 2 | Column Selection | Yes | `<phz-admin-columns>` from `phz-grid-admin` | Always valid (schema auto-populates) |
| 3 | Configuration | No (skippable) | `<phz-admin-table-settings>` from `phz-grid-admin` | Always valid |
| 4 | Review & Create | Yes | `<phz-creator-review>` (new) | Always valid |

### Key Design

- **Wizard uses slot-based rendering** — only the current step's component is in the DOM
- **Draft state lives in the wizard** — not committed until "Create" click
- **Step indicator**: horizontal numbered circles with connectors, responsive (labels hidden < 768px)
- **Animation**: 200ms `translateX(±24px)` slide between steps; `prefers-reduced-motion` honored
- **Output event**: `grid-definition-create` with `GridDefinitionCreate` payload matching `Partial<ReportConfig>`

### Dependencies

```json
{
  "dependencies": {
    "@phozart/definitions": "^0.1.0",
    "@phozart/grid-admin": "^0.1.0",
    "@phozart/criteria": "^0.1.0",
    "@phozart/engine": "^0.1.0"
  }
}
```

### Accessibility

- Step indicator: `role="list"`, `aria-current="step"` on active, completed steps have checkmark + "completed" label
- Focus management: Next button auto-focused on step transition via `requestAnimationFrame`
- Escape closes wizard (mapped to cancel)
- Skip button: labeled "Skip configuration step (optional)" for screen readers
- All targets: 44px minimum touch target
- Forced Colors Mode: step circles use `border` (not just `background`) so they're visible

### Build Sequence

1. Package scaffold
2. `phz-creator-step.ts` — step indicator + shell
3. `phz-creator-review.ts` — review panel
4. `phz-grid-creator.ts` — wizard orchestrator with draft state
5. Tests
6. Integration with `phz-definitions` and `phz-grid-admin`

---

## Implementation Order

These work items have dependencies between them. The recommended execution order:

```
Phase A (parallel, no dependencies):
  ├── WI#1: Column Auto-Inference (core + grid)
  ├── WI#2: phz-definitions package (new, types + store + converters)
  └── WI#3: Saved Views (core + grid + grid-admin)

Phase B (depends on WI#2):
  └── WI#4: Grid-Admin Separation (move components, deprecate criteria)

Phase C (depends on WI#2 + WI#4):
  └── WI#5: Creation Wizard (new phz-grid-creator package)
```

### Estimated Scope

| Work Item | New Files | Modified Files | New Tests |
|-----------|-----------|---------------|-----------|
| #1 Column Auto-Inference | 2 | 4 | ~24 |
| #2 phz-definitions | ~25 | 3 | ~40 |
| #3 Saved Views | 7 | 11 | ~50 |
| #4 Grid-Admin Separation | 4 | 5 | ~10 (moved) |
| #5 Creation Wizard | 5 | 2 | ~25 |
| **Total** | **~43** | **~25** | **~149** |

### Package Count After All Changes

Current: 15 packages
After: 17 packages (+`phz-definitions`, +`phz-grid-creator`)

---

## Cross-Cutting Concerns

### Shared Styles
Both `phz-grid-admin`, `phz-definitions` (UI), and `phz-grid-creator` share the same admin design language (`adminBaseStyles`). Short-term: copy `shared-styles.ts`. Long-term: extract to `@phozart/admin-styles` package.

### Custom Element Tag Names
Custom element names are globally registered. Moved components get new tags (`phz-definition-report`, `phz-definition-data-source`) to avoid collisions during migration. Old tags are deprecated, not removed, until next major version.

### Criteria Duplication
`PhzAdminCriteria` (simplified) and `PhzFilterConfigurator` (full-featured) both exist. The plan deprecates the former in favor of the latter. An adapter mapping `CriteriaBindingItem` -> `FilterBinding` should be documented for migrating stored data.

### No Engine Dependency for Definitions Core
`@phozart/definitions` depends only on `phz-core` + `zod`. Engine is an optional peer (only needed for `DefinitionFormatting.tableSettings`). This keeps definitions usable in the MIT community tier without the enterprise BI engine.

### Accessibility
- All new UI components (view-switcher, wizard) follow existing a11y patterns: ARIA roles, keyboard navigation, Forced Colors Mode support, 44px touch targets
- Column auto-inference generates readable headers for screen readers
- Saved views dirty indicator uses both color (dot) and text (asterisk) for Forced Colors Mode
