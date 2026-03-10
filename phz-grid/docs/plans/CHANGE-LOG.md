# Workspace BI Workbench — Change Log

> Every code change with task ID, files modified, test count, and verification status.

## Format

```
### Task X.Y — [Description]
- **Phase**: P[N]
- **Issues resolved**: WB-NNN, WB-NNN
- **Files modified**: [list]
- **Files created**: [list]
- **Tests added**: [count]
- **Tests total after**: [count]
- **Build status**: PASS/FAIL
- **Verification**: [manual trace description]
```

## Changes

### Archive shim packages — grid-admin, engine-admin, grid-creator
- **Phase**: Post-release cleanup
- **Issues resolved**: N/A (maintenance)
- **Rationale**: After workspace consolidation (Sprints A-G), these 3 packages became one-line re-export shims (`export * from '@phozart/phz-workspace/<sub-path>'`). All actual code lives in `packages/workspace/src/{grid-admin,engine-admin,grid-creator}/`. Archiving removes them from the active build/test graph while preserving them for reference.
- **Files moved to `archive/`**:
  - `packages/grid-admin/` → `archive/grid-admin/`
  - `packages/engine-admin/` → `archive/engine-admin/`
  - `packages/grid-creator/` → `archive/grid-creator/`
- **Files modified**:
  - `tsconfig.json` — removed 3 project references
  - `package.json` — removed 3 packages from `build:ordered` script
  - `vitest.config.ts` — added clarifying comments (aliases already pointed to workspace)
  - `vitest.integration.config.ts` — redirected 3 aliases from `archive/*/dist/` to `workspace/src/`
  - `packages/react/tsconfig.json` — removed `../grid-admin` reference
  - `packages/react/package.json` — removed `@phozart/phz-grid-admin` peer dependency (workspace covers it)
  - `packages/criteria/package.json` — changed peer dep from `@phozart/phz-engine-admin` to `@phozart/phz-workspace`
  - `packages/criteria/src/components/phz-filter-designer.ts` — import `@phozart/phz-workspace/engine-admin`
  - `packages/criteria/src/components/phz-filter-configurator.ts` — import `@phozart/phz-workspace/engine-admin`
  - `packages/grid/vite.cdn-all.config.ts` — added clarifying comments
  - `packages/grid/vite.cdn-iife.config.ts` — added clarifying comments
- **Package count**: 22 → 19 active (3 archived)
- **Tests after**: 9605 passing (526 files) — 0 regressions
- **Build status**: PASS

### Tasks 1.1 + 1.4 — Wire data source panel into report editor + field→column binding
- **Phase**: P1
- **Issues resolved**: WB-002, WB-003
- **Files modified**: `packages/workspace/src/authoring/phz-report-editor.ts`
- **Files created**: `packages/workspace/src/authoring/report-editor-wiring.ts`
- **Tests added**: 7 (`packages/workspace/src/__tests__/report-editor-wiring.test.ts`)
- **Tests total after**: 2211 (workspace), all passing
- **Build status**: PASS
- **Verification**: Report editor renders `<phz-data-source-panel>` when `adapter` prop is set, with field-add/field-remove event handlers that call `handleFieldAdd`/`handleFieldRemove` pure functions to add/remove columns from ReportEditorState.

### Tasks 1.2 + 1.5 — Wire data source panel into dashboard editor + field→widget binding
- **Phase**: P1
- **Issues resolved**: WB-004
- **Files modified**: `packages/workspace/src/authoring/phz-dashboard-editor.ts`
- **Files created**: `packages/workspace/src/authoring/dashboard-editor-wiring.ts`
- **Tests added**: 11 (`packages/workspace/src/__tests__/dashboard-editor-wiring.test.ts`)
- **Tests total after**: 2211 (workspace), all passing
- **Build status**: PASS
- **Verification**: Dashboard editor field palette renders `<phz-data-source-panel>` when `adapter` prop is set (falls back to static schema list otherwise). `_onFieldAdd` auto-creates a widget (kpi-card for numbers, data-table for strings) when no widget is selected, then routes field to selected widget's dimensions/measures via `handleDashboardFieldAdd`.

### Task 1.6 — DataAdapter propagation through workspace shell
- **Phase**: P1
- **Issues resolved**: WB-001
- **Files modified**: `packages/workspace/src/phz-workspace.ts`
- **Files created**: `packages/workspace/src/shell/adapter-forwarding.ts`
- **Tests added**: 16 (`packages/workspace/src/__tests__/adapter-forwarding.test.ts`)
- **Tests total after**: 2211 (workspace), all passing
- **Build status**: PASS
- **Verification**: PhzWorkspace creates panel elements with `document.createElement(tag)`, caches them in `_panelCache`, and forwards `dataAdapter`/`workspaceAdapter` via `forwardAdaptersToElement()`. Panel lookup tables (`PANELS_NEEDING_DATA_ADAPTER`, `PANELS_NEEDING_WORKSPACE_ADAPTER`) determine which adapters each panel receives.

### Task 1.3 — Connect `<phz-data-model-sidebar>` to DataAdapter
- **Phase**: P1
- **Issues resolved**: WB-005
- **Files created**: `packages/workspace/src/engine-admin/data-model-sidebar-wiring.ts`
- **Tests added**: 6 (`packages/workspace/src/__tests__/data-model-sidebar-wiring.test.ts`)
- **Tests total after**: 2217 (workspace), all passing
- **Build status**: PASS
- **Verification**: `fieldsFromSchema()` maps `FieldMetadata.dataType` → `DataModelField.type` and `label ?? name` → `label`. `buildSidebarProps()` assembles all 5 sidebar arrays, with fields from DataAdapter schema and parameters/calculatedFields/metrics/kpis passed through from engine artifacts.

### Task 2.1 — Filter-to-Query Bridge
- **Phase**: P2
- **Issues resolved**: WB-006, WB-026
- **Files created**: `packages/workspace/src/filters/filter-query-bridge.ts`
- **Tests added**: 16 (`packages/workspace/src/__tests__/filter-query-bridge.test.ts`)
- **Verification**: `filterValuesToQueryFilters()` converts FilterValue[] → DataQueryFilter[]. Handles operator mapping (before→lessThan, after→greaterThan), temporal resolution (lastN→between with date range), null-value skipping. `injectFiltersIntoQuery()` merges filters into DataQuery without mutation.

### Tasks 2.2 — Filter-aware Dashboard Data Pipeline
- **Phase**: P2
- **Issues resolved**: WB-007
- **Files created**: `packages/workspace/src/coordination/pipeline-filter-wiring.ts`
- **Tests added**: 6 (`packages/workspace/src/__tests__/pipeline-filter-wiring.test.ts`)
- **Verification**: `createFilterAwarePipeline()` injects filter context into preload/full-load queries, subscribes to filter changes with debounce, re-executes queries on filter change, cleans up on destroy.

### Tasks 2.3 + 2.4 — FilterRuleEngine activation + Cross-filter wiring
- **Phase**: P2
- **Issues resolved**: WB-008, WB-009
- **Files created**: `packages/workspace/src/filters/filter-rule-wiring.ts`
- **Tests added**: 9 (`packages/workspace/src/__tests__/filter-rule-wiring.test.ts`)
- **Verification**: `filterValuesToStateRecord()` bridges FilterValue[] → Record<string, unknown> for rule engine. `evaluateRulesFromContext()` combines context + rule evaluation. `collectRuleActions()` groups actions by target filter. `applyCrossFilterFromWidget()` applies cross-filters that exclude source widget.

### Tasks 2.5 + 2.6 + 2.7 — Filter cascade, URL sync, admin persistence
- **Phase**: P2
- **Issues resolved**: WB-010, WB-011, WB-012
- **Files created**: `packages/workspace/src/filters/filter-lifecycle-wiring.ts`
- **Tests added**: 8 (`packages/workspace/src/__tests__/filter-lifecycle-wiring.test.ts`)
- **Verification**: `createUrlFilterSync()` serializes filter state on change, restores from URL. `createCascadeWiring()` subscribes to parent filter changes, calls DataAdapter.getDistinctValues() for child values. `createFilterAdminPersistence()` wraps WorkspaceAdapter for FilterDefinition CRUD.

### Tasks 3.1-3.6 — Widget Data Wiring (Visualizations with Live Data)
- **Phase**: P3
- **Issues resolved**: WB-013, WB-014, WB-015, WB-016, WB-017, WB-027
- **Files created**: `packages/workspace/src/coordination/widget-data-wiring.ts`
- **Tests added**: 13 (`packages/workspace/src/__tests__/widget-data-wiring.test.ts`)
- **Verification**: `buildWidgetQuery()` converts widget data config (dimensions/measures/filters) → DataQuery. `fetchWidgetData()` calls DataAdapter.execute() with error handling. `resolveWidgetLoadingState()` maps loading/error/empty/ready states. `resolveKPIWithRealData()` computes delta from actual current/previous values (replaces synthetic `previousValue = value * 0.95`).

### Tasks 4.1-4.5 — Explorer Wiring (Interactive Aggregation)
- **Phase**: P4
- **Issues resolved**: WB-018, WB-019, WB-020, WB-029, WB-030
- **Files created**: `packages/workspace/src/coordination/explorer-wiring.ts`
- **Tests added**: 8 (`packages/workspace/src/__tests__/explorer-wiring.test.ts`)
- **Verification**: `exploreQueryToDataQuery()` converts ExploreQuery → DataQuery (maps explorer operators to DataAdapter operators). `fetchExplorerPreview()` executes explorer query via DataAdapter with error handling. `saveExplorerAsReport()` persists via adapter.saveReport(). `buildDrillThroughQuery()` creates pre-populated ExploreQuery from widget context (dimension + measures + filter).

### Tasks 5.1-5.5 — Persistence Wiring (Edit Options)
- **Phase**: P5
- **Issues resolved**: WB-021, WB-022, WB-023, WB-024, WB-025, WB-028
- **Files created**: `packages/workspace/src/coordination/persistence-wiring.ts`
- **Tests added**: 14 (`packages/workspace/src/__tests__/persistence-wiring.test.ts`)
- **Verification**: `createSaveEventBridge()` catches save-report/save-dashboard events → WorkspaceAdapter with success/error callbacks. `createAutoSaveWiring()` debounces state changes, only saves when dirty=true, cancels on destroy. `createUndoRedoWiring()` provides generic undo/redo stack with state restore listeners and redo-stack clearing on new push. `createConflictDetector()` compares local vs remote version numbers for concurrent edit detection.
