# Workspace BI Workbench — Issue Log

> Every gap, bug, and disconnection found during wiring analysis.
> Format: `WB-NNN | Severity | Phase | Description | Status | Resolution`

## Issue Registry

| ID | Severity | Phase | Description | Status | Resolution |
|----|----------|-------|-------------|--------|------------|
| WB-001 | CRITICAL | P1 | `PhzWorkspace` has `@property dataAdapter` but never forwards it to child panels (`<phz-data-source-panel>`, editors) | RESOLVED | Task 1.6 |
| WB-002 | CRITICAL | P1 | `PhzDataSourcePanel` declares `@property adapter` but never calls orchestrator functions (`loadSources`, `loadSchema`, `loadFieldStats`) in lifecycle hooks | RESOLVED | Task 1.1 |
| WB-003 | CRITICAL | P1 | `PhzReportEditor` has no `DataAdapter` property — takes `availableFields` as a flat array with no way to load fields from a data source | RESOLVED | Task 1.1, 1.4 |
| WB-004 | CRITICAL | P1 | `PhzDashboardEditor` has no `DataAdapter` property — takes `schema?: DataSourceSchema` externally with no way to load it | RESOLVED | Task 1.2, 1.5 |
| WB-005 | HIGH | P1 | `PhzDataModelSidebar` takes pure arrays (fields, parameters, calculated, metrics, KPIs) — no connection to DataAdapter for live field discovery | RESOLVED | Task 1.3 |
| WB-006 | CRITICAL | P2 | FilterContextManager resolves filter state but **never feeds resolved values into DataQuery construction** — no bridge function exists | RESOLVED | Task 2.1 |
| WB-007 | CRITICAL | P2 | Dashboard filter bar renders but **filter value changes don't trigger widget refresh** — no subscription from DashboardDataPipeline to FilterContextManager | RESOLVED | Task 2.2 |
| WB-008 | HIGH | P2 | FilterRuleEngine evaluates rules but **nothing triggers it when filters change** — no event listener or subscription wires it to FilterContextManager | RESOLVED | Task 2.3 |
| WB-009 | HIGH | P2 | Cross-filter events (`bar-click`, `slice-click`, `point-click`) dispatched by widgets but **nothing catches them to update FilterContextManager** | RESOLVED | Task 2.4 |
| WB-010 | MEDIUM | P2 | Cascading resolver exists and calls `getDistinctValues()` but **no UI component triggers cascade on parent filter change** | RESOLVED | Task 2.5 |
| WB-011 | MEDIUM | P2 | URL filter sync functions (`serializeFilterState`, `deserializeFilterState`) exist but **nothing calls them on filter change or page load** | RESOLVED | Task 2.6 |
| WB-012 | HIGH | P2 | Filter authoring state machine produces `FilterValue` objects but **no persistence path to WorkspaceAdapter** | RESOLVED | Task 2.7 |
| WB-013 | CRITICAL | P3 | All widget components take pre-loaded `data[]` arrays — **never call DataAdapter.execute()** at runtime | RESOLVED | Task 3.1, 3.2 |
| WB-014 | CRITICAL | P3 | DashboardDataPipeline orchestrates loading but **no widget subscribes to its output** via `getWidgetData()` or `onStateChange()` | RESOLVED | Task 3.1 |
| WB-015 | HIGH | P3 | KPI cards use `previousValue` prop directly — **synthetic data** (`value * 0.95`) used in demos, no MetricCatalog integration | RESOLVED | Task 3.3 |
| WB-016 | MEDIUM | P3 | Widgets have `loading` and `error` properties but **nothing sets them during data fetch lifecycle** | RESOLVED | Task 3.5 |
| WB-017 | MEDIUM | P3 | No empty-state rendering when DataAdapter returns 0 rows matching current filters | RESOLVED | Task 3.6 |
| WB-018 | HIGH | P4 | Explorer drop zones produce `ExploreQuery` but **never convert to DataQuery for live preview** via DataAdapter | RESOLVED | Task 4.1 |
| WB-019 | MEDIUM | P4 | Aggregation picker defaults to SUM for numbers but **no UI for changing aggregation function** on value slots | RESOLVED | Task 4.2 |
| WB-020 | MEDIUM | P4 | `exploreToReport()` and `exploreToDashboardWidget()` create artifacts but **no persistence path** — artifacts are created but not saved | RESOLVED | Task 4.4 |
| WB-021 | CRITICAL | P5 | Components dispatch `save-report`, `save-dashboard`, `dashboard-save` events but **nothing catches them** to call `WorkspaceAdapter.saveArtifact()` | RESOLVED | Task 5.1 |
| WB-022 | HIGH | P5 | Auto-save state machine (`createAutoSave`) exists with `onSave(handler)` callback but **no handler is registered** to call WorkspaceAdapter | RESOLVED | Task 5.2 |
| WB-023 | HIGH | P5 | Undo/redo managers capture state snapshots but **undo() return value is never fed back** to component state for re-render | RESOLVED | Task 5.3 |
| WB-024 | MEDIUM | P5 | Publish workflow state machine has 8 validation checks but **no validation runner** actually executes them (all stay 'pending') | RESOLVED | Task 5.4 |
| WB-025 | LOW | P5 | Conflict detection exists as `markConflict()` in auto-save state but **no concurrent edit detection** triggers it | RESOLVED | Task 5.5 |
| WB-026 | MEDIUM | P2 | Two parallel filter systems: CriteriaEngine (packages/criteria) and FilterContextManager (workspace/filters) — no bridge between them | RESOLVED | Task 2.1 |
| WB-027 | HIGH | P3 | `widget-retry` events dispatched by all widgets on error but **nothing catches them** to re-execute DataAdapter query | RESOLVED | Task 3.4, 3.5 |
| WB-028 | MEDIUM | P1 | Catalog browser listens for `dashboard-save`, `report-save`, `artifact-delete` on `ownerDocument` but **save events bubble from workspace components, not the document** | RESOLVED | Task 5.1 |
| WB-029 | HIGH | P4 | Explorer `toQuery()` → `exploreToDataQuery()` conversion exists but **preview modes (table/chart/SQL) never receive live data** | RESOLVED | Task 4.3 |
| WB-030 | MEDIUM | P4 | `promoteFilterToDashboard()` and `buildDrillThroughPrePopulation()` exist as pure functions but **no UI flow invokes them** | RESOLVED | Task 4.5 |

## Severity Definitions

| Severity | Meaning |
|----------|---------|
| CRITICAL | Feature completely non-functional — no data flows through this path |
| HIGH | Feature partially works but key integration is missing |
| MEDIUM | Feature exists in isolation, needs connection to be useful |
| LOW | Nice-to-have wiring, not blocking core scenarios |

## Statistics

- **Total issues**: 30
- **CRITICAL**: 8 (WB-001, WB-002, WB-003, WB-004, WB-006, WB-007, WB-013, WB-014, WB-021)
- **HIGH**: 10 (WB-005, WB-008, WB-009, WB-012, WB-015, WB-018, WB-022, WB-023, WB-027, WB-029)
- **MEDIUM**: 10 (WB-010, WB-011, WB-016, WB-017, WB-019, WB-020, WB-024, WB-026, WB-028, WB-030)
- **LOW**: 1 (WB-025)
