# Workspace BI Workbench — Wiring Reference

> This document contains every interface signature, event name, function call,
> and data flow needed to wire the workspace into a functioning BI tool.
> Read the relevant section BEFORE implementing each task.

---

## Table of Contents

1. [DataAdapter SPI — Complete Method Signatures](#1-dataadapter-spi)
2. [State Machine Interfaces — All Pure Functions](#2-state-machines)
3. [Event Catalog — Every CustomEvent in the System](#3-event-catalog)
4. [Orchestrator Functions — Async Coordination Layer](#4-orchestrators)
5. [Filter Architecture — Complete Type Map](#5-filter-architecture)
6. [Widget Component Contracts — Properties and Events](#6-widget-contracts)
7. [Explorer Module — Drop Zones to Artifact](#7-explorer-module)
8. [Persistence Layer — Save/Undo/Publish](#8-persistence-layer)
9. [Phase 1 Wiring Instructions](#9-phase-1-wiring)
10. [Phase 2 Wiring Instructions](#10-phase-2-wiring)
11. [Phase 3 Wiring Instructions](#11-phase-3-wiring)
12. [Phase 4 Wiring Instructions](#12-phase-4-wiring)
13. [Phase 5 Wiring Instructions](#13-phase-5-wiring)
14. [Mock Patterns for Tests](#14-mock-patterns)
15. [Known Gotchas](#15-known-gotchas)

---

## 1. DataAdapter SPI

**Location**: `packages/shared/src/adapters/data-adapter.ts`
**Extended**: `packages/workspace/src/data-adapter.ts`

### Core Interface

```typescript
interface DataAdapter {
  execute(query: DataQuery, context?: { signal?: AbortSignal }): Promise<DataResult>
  getSchema(sourceId?: string): Promise<DataSourceSchema>
  listDataSources(): Promise<DataSourceMeta[]>
  getDistinctValues(sourceId: string, field: string, options?: {
    search?: string; limit?: number; filters?: unknown[]
  }): Promise<DistinctValuesResult>
  getFieldStats(sourceId: string, field: string, filters?: unknown[]): Promise<FieldStatsResult>
}
```

### Key Types

```typescript
// Input
interface DataQuery {
  source: string            // dataSourceId
  fields: string[]          // column names to return
  filters?: Array<{ field: string; operator: string; value: unknown }>
  groupBy?: string[]
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
  offset?: number
  aggregations?: AggregationSpec[]
}

// Output
interface DataResult {
  columns: Array<{ name: string; type: string }>
  rows: unknown[][]         // row-major 2D array
  metadata: {
    totalRows: number
    truncated: boolean
    queryTimeMs: number
  }
  arrowBuffer?: ArrayBuffer // optional Arrow IPC
}

// Schema
interface DataSourceMeta { id: string; name: string; fieldCount: number; rowCount?: number }
interface DataSourceSchema { id: string; name: string; fields: FieldMetadata[] }
interface FieldMetadata {
  name: string
  dataType: 'string' | 'number' | 'date' | 'boolean'
  nullable?: boolean
  cardinality?: 'low' | 'medium' | 'high'
  semanticHint?: SemanticHint
  unit?: UnitSpec
}
interface FieldStatsResult { min?: number; max?: number; distinctCount: number; nullCount: number; totalCount: number }
```

### Where DataAdapter Is Actually Called (Production)

| Call Site | File | Method | Result Used For |
|-----------|------|--------|-----------------|
| Dashboard preload | `workspace/src/coordination/dashboard-data-pipeline.ts:56` | `execute()` | Widget data via `getWidgetData()` |
| Dashboard full-load | `workspace/src/coordination/dashboard-data-pipeline.ts:57` | `execute()` | Widget data (higher fidelity) |
| Per-widget query | `workspace/src/coordination/query-coordinator.ts:51` | `execute()` | Individual widget data |
| Drill-through detail | `workspace/src/coordination/detail-source-loader.ts:116` | `execute()` | Detail panel data |
| Data source browsing | `workspace/src/authoring/data-source-panel-orchestrator.ts:35` | `listDataSources()` | Source picker dropdown |
| Field discovery | `workspace/src/authoring/data-source-panel-orchestrator.ts:56` | `getSchema()` | Field classification |
| Field statistics | `workspace/src/authoring/data-source-panel-orchestrator.ts:77` | `getFieldStats()` | Info tooltips (optional) |
| Cascading filter | `workspace/src/filters/cascading-resolver.ts:98` | `getDistinctValues()` | Child filter options |

### Where DataAdapter Is Declared But NOT Wired

| Component | File | Gap |
|-----------|------|-----|
| `PhzWorkspace` | `workspace/src/phz-workspace.ts:451` | Has `@property` but never forwards to children |
| `PhzDataSourcePanel` | `workspace/src/authoring/phz-data-source-panel.ts:245` | Has `@property` but never calls orchestrator |
| `PhzReportEditor` | `workspace/src/authoring/phz-report-editor.ts` | NO DataAdapter property at all |
| `PhzDashboardEditor` | `workspace/src/authoring/phz-dashboard-editor.ts` | NO DataAdapter property at all |

---

## 2. State Machines

All state machines are pure functions: `(state, input) → newState`. No side effects.

### DataSourceState

**Location**: `workspace/src/authoring/data-source-state.ts`

```typescript
// Factory
createDataSourceState(): DataSourceState

// Transitions
setSources(state, sources: DataSourceMeta[]): DataSourceState
selectSource(state, sourceId: string): DataSourceState  // resets schema
setSchema(state, schema: DataSourceSchema): DataSourceState  // auto-classifies fields
setSchemaLoading(state, loading: boolean): DataSourceState
setFieldSearch(state, query: string): DataSourceState
addField(state, fieldName: string): DataSourceState  // rejects duplicates
removeField(state, fieldName: string): DataSourceState
reorderFields(state, fromIndex: number, toIndex: number): DataSourceState
setFieldStats(state, fieldName: string, stats: FieldStatsResult): DataSourceState
setError(state, message: string): DataSourceState
clearError(state): DataSourceState

// Selectors (filter by fieldSearch)
filteredDimensions(state): FieldMetadata[]
filteredMeasures(state): FieldMetadata[]
filteredTimeFields(state): FieldMetadata[]
filteredIdentifiers(state): FieldMetadata[]
allFilteredFields(state): FieldMetadata[]  // order: time, dims, measures, identifiers
```

**Field classification logic** (in `setSchema`):
- Explicit `semanticHint` takes priority
- `date` type → time field
- `boolean` type → dimension
- `number` type → measure
- `string` type: cardinality + naming patterns → dimension or identifier

### ReportEditorState

**Location**: `workspace/src/authoring/report-editor-state.ts`

```typescript
// Factory
initialReportEditorState(name: string, dataSourceId: string): ReportEditorState

// Transitions
addColumn(state, field: string, label?: string): ReportEditorState
removeColumn(state, field: string): ReportEditorState
reorderColumns(state, fromIndex: number, toIndex: number): ReportEditorState
updateColumn(state, field: string, updates: Partial<ReportColumnConfig>): ReportEditorState
toggleColumnVisibility(state, field: string): ReportEditorState
pinColumn(state, field: string, side?: 'left' | 'right'): ReportEditorState
addFilter(state, filter: FilterValue): ReportEditorState
removeFilter(state, filterId: string): ReportEditorState
setSorting(state, sorting: Array<{field: string; direction: 'asc'|'desc'}>): ReportEditorState
setGrouping(state, fields: string[]): ReportEditorState
addConditionalFormat(state, rule: ConditionalFormatRule): ReportEditorState
removeConditionalFormat(state, ruleId: string): ReportEditorState
setDensity(state, density: 'compact'|'dense'|'comfortable'): ReportEditorState
setConfigPanelTab(state, tab: 'columns'|'filters'|'style'): ReportEditorState
selectColumn(state, field?: string): ReportEditorState

// Conversion
toGridConfig(state): GridConfig
```

### DashboardEditorState

**Location**: `workspace/src/authoring/dashboard-editor-state.ts`

```typescript
// Factory
initialDashboardEditorState(name: string, dataSourceId: string): DashboardEditorState

// Transitions
addWidget(state, widgetType: string, position?: WidgetPosition): DashboardEditorState
removeWidget(state, widgetId: string): DashboardEditorState
moveWidget(state, widgetId: string, newPosition: WidgetPosition): DashboardEditorState
resizeWidget(state, widgetId: string, size: {colSpan?: number; rowSpan?: number}): DashboardEditorState
morphWidget(state, widgetId: string, newType: string): DashboardEditorState
updateWidgetConfig(state, widgetId: string, updates: Record<string,unknown>): DashboardEditorState
updateWidgetData(state, widgetId: string, dataConfig: WidgetDataConfig): DashboardEditorState
selectWidget(state, widgetId?: string): DashboardEditorState
deselectWidget(state): DashboardEditorState

// Widget data binding shape
interface DashboardWidgetState {
  id: string
  type: string  // 'bar-chart', 'kpi-card', 'data-table', etc.
  dataConfig: {
    dimensions: ExploreFieldSlot[]
    measures: ExploreValueSlot[]
    filters: ExploreFilterSlot[]
  }
  position: { row: number; col: number; colSpan: number; rowSpan: number }
}
```

### NavigationState

**Location**: `workspace/src/shell/navigation-controller.ts`

```typescript
createNavigationState(navItems: NavItem[], initialPanel?: string): NavigationState
canNavigateTo(state, target: NavigationTarget): boolean
navigateTo(state, target: NavigationTarget): NavigationState
goBack(state): NavigationState
goForward(state): NavigationState
```

---

## 3. Event Catalog

### Save Events (dispatched, NOTHING catches them)

| Event Name | Source Component | Detail Shape | Intended Handler |
|------------|-----------------|--------------|-----------------|
| `save-report` | `phz-report-editor` | `{ state: ReportEditorState, gridConfig }` | → WorkspaceAdapter.saveArtifact() |
| `save-dashboard` | `phz-dashboard-editor` | `{ state: DashboardEditorState }` | → WorkspaceAdapter.saveArtifact() |
| `publish-report` | `phz-report-editor` | `{ state: ReportEditorState }` | → Publish workflow |
| `publish-dashboard` | `phz-dashboard-editor` | `{ state: DashboardEditorState }` | → Publish workflow |
| `dashboard-save` | `phz-dashboard`, `phz-dashboard-studio`, `phz-dashboard-builder` | `{ config }` | → WorkspaceAdapter.saveArtifact() |
| `report-save` | `phz-report-designer` | report config | → WorkspaceAdapter.saveArtifact() |
| `settings-save` | `phz-grid-admin` | settings object | → WorkspaceAdapter.saveArtifact() |
| `settings-auto-save` | `phz-grid-admin` | settings object | → Auto-save controller |
| `kpi-save` | `phz-kpi-form`, `phz-kpi-designer` | KPI config | → WorkspaceAdapter |
| `metric-save` | `phz-metric-form`, `phz-metric-builder` | metric config | → WorkspaceAdapter |
| `grid-definition-create` | `phz-grid-creator` | grid definition | → WorkspaceAdapter |

### Data Interaction Events

| Event Name | Source Component | Detail Shape | Intended Handler |
|------------|-----------------|--------------|-----------------|
| `source-change` | `phz-data-source-panel` | `{ sourceId: string }` | → Load schema for new source |
| `field-add` | `phz-data-source-panel` | `{ field: string, metadata: FieldMetadata }` | → Add column to report/widget |
| `field-remove` | `phz-data-source-panel` | `{ field: string, metadata: FieldMetadata }` | → Remove column from report/widget |
| `state-changed` | `phz-report-editor`, `phz-dashboard-editor` | `{ state, dirty: true }` | → Mark auto-save dirty |

### Filter Events

| Event Name | Source Component | Detail Shape | Intended Handler |
|------------|-----------------|--------------|-----------------|
| `filter-change` | `phz-global-filter-bar` | filter values | → FilterContextManager.setFilter() |
| `criteria-change` | `phz-criteria-panel`, `phz-selection-criteria` | `{ field, value, values }` | → FilterContextManager |
| `criteria-apply` | `phz-criteria-panel`, `phz-selection-criteria` | `{ values }` | → Apply all filters |
| `criteria-reset` | `phz-criteria-panel`, `phz-selection-criteria` | `{ values }` | → Clear all filters |
| `preset-load` | `phz-preset-manager` | preset object | → FilterContextManager.applyPreset() |

### Widget Interaction Events (for cross-filter)

| Event Name | Source Widget | Detail Shape | Intended Handler |
|------------|-------------|--------------|-----------------|
| `bar-click` | `phz-bar-chart` | `{ source, xValue, value, series?, total? }` | → FilterContextManager.applyCrossFilter() |
| `slice-click` | `phz-pie-chart` | slice data | → FilterContextManager.applyCrossFilter() |
| `point-click` | `phz-line-chart`, `phz-scatter-chart` | point data | → FilterContextManager.applyCrossFilter() |
| `cell-click` | `phz-heatmap` | cell data | → FilterContextManager.applyCrossFilter() |
| `drill-through` | `phz-bar-chart`, `phz-trend-line`, `phz-bottom-n`, `phz-drill-link` | drill payload | → NavigationController.navigateTo() |
| `widget-retry` | ALL widgets | empty | → Re-execute DataAdapter query |
| `widget-click` | `phz-dashboard` | `{ widgetId, widgetType }` | → Select widget for config |

### Navigation Events

| Event Name | Source Component | Detail Shape | Intended Handler |
|------------|-----------------|--------------|-----------------|
| `panel-change` | `phz-workspace-shell`, `phz-workspace` | panel id | → NavigationController |
| `navigate` | `phz-engine-admin` | `{ tab: string }` | → NavigationController |
| `artifact-select` | `phz-catalog-browser` | artifact object | → Open editor for artifact |
| `artifact-open` | `phz-artifact-catalog` | artifact object | → Open editor for artifact |
| `create-artifact` | `phz-artifact-catalog` | artifact type | → Open creation wizard |

### Undo/Redo Events

| Event Name | Source | Detail | Handler |
|------------|--------|--------|---------|
| `undo-action` | `phz-workspace-shell` | empty | → UndoManager.undo() |
| `redo-action` | `phz-workspace-shell` | empty | → UndoManager.redo() |

---

## 4. Orchestrators

### Data Source Panel Orchestrator

**Location**: `workspace/src/authoring/data-source-panel-orchestrator.ts`

```typescript
type SetState = (updater: (state: DataSourceState) => DataSourceState) => void

// These are the functions that wire DataAdapter → State
loadSources(adapter: DataAdapter, setState: SetState): Promise<void>
loadSchema(adapter: DataAdapter, sourceId: string, setState: SetState): Promise<void>
loadFieldStats(adapter: DataAdapter, sourceId: string, fieldName: string, setState: SetState): Promise<void>
```

**Wiring pattern**: Component calls orchestrator in lifecycle → orchestrator calls DataAdapter → orchestrator calls setState → component re-renders.

### Dashboard Data Pipeline

**Location**: `workspace/src/coordination/dashboard-data-pipeline.ts`

```typescript
interface DashboardDataPipeline {
  readonly state: DashboardLoadingState
  start(): Promise<void>
  onStateChange(cb: (state: DashboardLoadingState) => void): () => void  // returns unsubscribe
  getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined
  invalidate(): Promise<void>  // clear cache, re-query
  destroy(): void
}

// Factory
createDashboardDataPipeline(
  config: DashboardDataConfig,
  dataAdapter: DataAdapter,
  filterContext?: FilterContextManager
): DashboardDataPipeline
```

**Loading phases**: `idle → preloading → preload-complete → full-complete` (or `→ error`)

### Query Coordinator

**Location**: `workspace/src/coordination/query-coordinator.ts`

```typescript
interface QueryCoordinator {
  submit(widgetId: string, query: DataQuery): Promise<DataResult>
  cancel(widgetId: string): void
  flush(): Promise<void>
}

createQueryCoordinator(adapter: DataAdapter, options?: {
  maxConcurrent?: number;
  batchWindowMs?: number
}): QueryCoordinator
```

### Cascading Resolver

**Location**: `workspace/src/filters/cascading-resolver.ts`

```typescript
buildDependencyGraph(definitions: FilterDefinition[]): DependencyGraph
resolveCascadingDependency(
  adapter: DataAdapter,
  parentFilterId: string,
  parentValue: unknown,
  childDefinition: FilterDefinition
): Promise<DistinctValuesResult>
```

### Filter Context Manager

**Location**: `workspace/src/filters/filter-context.ts` (re-exports from shared)

```typescript
interface FilterContextManager {
  setFilter(filterId: string, value: unknown, source?: string): void
  clearFilter(filterId: string): void
  clearAll(): void
  applyCrossFilter(widgetId: string, field: string, value: unknown): void
  clearCrossFilter(widgetId: string): void
  resolveFilters(widgetId?: string): FilterExpression[]
  subscribe(listener: () => void): () => void  // returns unsubscribe
  getState(): FilterContextState
}

createFilterContext(options?: FilterContextOptions): FilterContextManager
```

---

## 5. Filter Architecture

### Filter Definition (Reusable Catalog Artifact)

```typescript
interface FilterDefinition {
  id: string
  label: string
  filterType: 'select' | 'multi-select' | 'range' | 'date-range' | 'text' | 'boolean'
  valueSource: FilterValueSource   // 'data-source' | 'lookup-table' | 'static'
  bindings: FilterBinding[]        // maps to actual fields in data sources
  securityBinding?: SecurityBinding
  dependsOn?: string[]             // cascading parent filter IDs
  defaultValue?: FilterDefault     // static | viewer-attribute | relative-date | expression
  required?: boolean
}
```

### Filter Value (Runtime User Selection)

```typescript
interface FilterValue {
  filterId: string        // auto-generated: filter_<timestamp>_<counter>
  field: string
  operator: FilterOperator
  value: unknown
  label: string           // display label (e.g., "Amount: 100 – 500")
}
```

### Filter Rule (Business Logic)

```typescript
interface FilterRule {
  id: string
  name: string
  priority: number        // lower = higher priority
  conditions: FilterRuleCondition[]
  conditionLogic?: 'and' | 'or'
  actions: FilterRuleAction[]
  enabled: boolean
}

// Condition types: 'field-value' | 'viewer-attribute' | 'compound'
// Action types: 'restrict' | 'hide' | 'disable' | 'force'
```

### Filter Contract (Dashboard-Level)

```typescript
interface ArtifactFilterContract {
  acceptedFilters: DashboardFilterRef[]   // which filters this dashboard accepts
  defaultPresetId?: string
}

interface DashboardFilterRef {
  filterDefinitionId: string
  labelOverride?: string
  defaultValueOverride?: FilterDefault
  appliesTo: string[]      // widget IDs (empty = all)
  queryLayer: 'server' | 'client' | 'auto'
}
```

### End-to-End Filter Flow (What Needs Wiring)

```
1. FilterDefinition (admin creates in catalog)
   ↓
2. ArtifactFilterContract (admin binds filters to dashboard)
   ↓
3. resolveFilterContract() → ResolvedFilter[] (at dashboard open time)
   ↓
4. FilterContextManager (holds current values, manages layers)
   ↓
5. evaluateFilterRules() → actions (hide/disable/restrict/force)
   ↓
6. resolveFilters(widgetId) → FilterExpression[]
   ↓
7. *** MISSING BRIDGE *** → DataQuery.filters construction ← Task 2.1
   ↓
8. DataAdapter.execute(query) → DataResult
   ↓
9. *** MISSING SUBSCRIPTION *** → Widget.data update ← Task 3.1
```

---

## 6. Widget Contracts

### Common Widget Properties

All widgets in `packages/widgets/src/components/` share:

```typescript
// Inputs
@property({ type: Boolean }) loading = false
@property({ type: String }) error: string | null = null

// Events
'widget-retry'  // empty detail — fired on error retry click
```

### Per-Widget Data Properties

| Widget | Data Properties | Click Events |
|--------|----------------|-------------|
| `phz-bar-chart` | `data?: ChartDataSeries`, `multiSeriesData?: MultiSeriesDataPoint[]` | `bar-click`, `drill-through` |
| `phz-line-chart` | `data?: ChartDataSeries` | `point-click` |
| `phz-pie-chart` | `data?: ChartDataSeries` | `slice-click` |
| `phz-kpi-card` | `value: number`, `previousValue?: number`, `trendData?: number[]`, `kpiDefinition?: KPIDefinition` | (none — tooltip only) |
| `phz-gauge` | `value: number`, `min: number`, `max: number` | (none) |
| `phz-trend-line` | `data?: TrendData` | `drill-through` |
| `phz-kpi-scorecard` | `kpis: KPIScoreEntry[]` | (none) |

### ChartDataSeries Shape

```typescript
interface ChartDataSeries {
  label: string
  points: Array<{ x: string | number; y: number }>
}
```

---

## 7. Explorer Module

**Location**: `packages/engine/src/explorer/`

### Drop Zone State

```typescript
interface DropZoneState {
  rows: ExploreFieldSlot[]      // GROUP BY dimensions
  columns: ExploreFieldSlot[]   // Pivot columns
  values: ExploreValueSlot[]    // Aggregated measures
  filters: ExploreFilterSlot[]  // Constraining filters
}

// Auto-placement logic (autoPlaceField):
// number → values (aggregatable)
// date → columns (temporal)
// boolean → filters
// string → rows (dimension)
```

### Data Explorer Controller

```typescript
interface DataExplorer {
  getState(): DataExplorerState
  setDataSource(id: string, fields: FieldMetadata[]): void
  autoPlaceField(field: FieldMetadata): void
  addToZone(zone: ZoneName, field: FieldMetadata): void
  removeFromZone(zone: ZoneName, fieldName: string): void
  toQuery(): ExploreQuery        // → ExploreQuery (user-facing)
  suggestChart(): string         // heuristic chart type
  subscribe(listener: () => void): () => void
  undo(): void
  redo(): void
}

createDataExplorer(): DataExplorer
```

### Explorer → Artifact Conversion

```typescript
// ExploreQuery → DataQuery (for execution)
exploreToDataQuery(query: ExploreQuery): ExploreDataQuery

// ExploreQuery → Persistable Artifacts
exploreToReport(query: ExploreQuery, name: string, dataSource: string): ReportArtifact
exploreToDashboardWidget(query: ExploreQuery, widgetType: string, dashboardId?: string): DashboardWidgetArtifact

// Chart type suggestion
suggestChartType(query: ExploreQuery, options?: ChartSuggestOptions): string
```

### Chart Suggest Heuristics

| Dimensions | Measures | Has Date | Suggestion |
|-----------|----------|----------|-----------|
| 0 | 0 | - | 'table' |
| 0 | 1+ | - | 'kpi' |
| 1 | 1 | yes | 'line' |
| 1 | 1 | no | 'bar' |
| 1 | 2+ | yes | 'multi-line' |
| 1 | 2+ | no | 'grouped-bar' |
| 2 | 1+ | - | 'stacked-bar' |
| 3+ | any | - | 'table' |

---

## 8. Persistence Layer

### Auto-Save Controller

**Location**: `workspace/src/authoring/auto-save.ts`

```typescript
interface AutoSaveController {
  markDirty(): void
  onSave(handler: (state: unknown) => Promise<void>): void  // ← REGISTER SAVE HANDLER HERE
  pause(): void
  resume(): void
  dispose(): void
  readonly status: AutoSaveStatus  // 'idle'|'dirty'|'saving'|'saved'|'error'
  readonly lastSavedAt: number | undefined
}

createAutoSave(options: { debounceMs?: number; getState: () => unknown }): AutoSaveController
```

### Undo/Redo Managers

```typescript
// Report
interface ReportUndoManager {
  execute(state: ReportEditorState, label: string): void
  undo(): ReportEditorState | null
  redo(): ReportEditorState | null
  canUndo: boolean
  canRedo: boolean
  history: ReportUndoEntry[]
}
createReportUndoManager(initial?: ReportEditorState, maxHistory?: number): ReportUndoManager

// Dashboard
interface DashboardUndoManager {
  execute(state: DashboardEditorState, label: string): void
  undo(): DashboardEditorState | null
  redo(): DashboardEditorState | null
  canUndo: boolean
  canRedo: boolean
  history: DashboardUndoEntry[]
}
createDashboardUndoManager(initial?: DashboardEditorState, maxHistory?: number): DashboardUndoManager
```

### Publish Workflow

```typescript
// Phase transitions
initialPublishWorkflowState(artifactId: string, name: string): PublishWorkflowState
startValidation(state): PublishWorkflowState         // marks all checks running
updateCheckResult(state, checkId, status, message?): PublishWorkflowState
completeValidation(state): PublishWorkflowState
canPublish(state): boolean                           // all error-severity checks passed
startPublish(state): PublishWorkflowState
completePublish(state, publishedBy?, snapshot?): PublishWorkflowState
failPublish(state, error): PublishWorkflowState
setChangelog(state, changelog): PublishWorkflowState
canRollback(state): boolean
executeRollback(state): PublishWorkflowState

// 8 default validation checks:
// data-source(error), filters-valid(error), columns-present(error), name-set(error),
// permissions(error), perf-check(warning), a11y-check(warning), mobile-check(info)
```

### Save Adapter Routing

**Location**: `workspace/src/__tests__/save-adapter-wiring.test.ts` (pattern discovered)

```typescript
// Routing: artifact type → WorkspaceAdapter method
saveToAdapter(adapter: WorkspaceAdapter, artifactType: string, artifact: unknown): Promise<void>
// 'report' → adapter.saveReport()
// 'dashboard' → adapter.saveDashboard()
// 'kpi' → adapter.saveKPI()
// 'metric' → adapter.saveMetric()
// 'grid-definition' → adapter.save() (definition store)
// 'alert-rule' → adapter.saveAlertRule()
// unknown → throw Error
```

---

## 9. Phase 1 Wiring Instructions

### Task 1.6 — DataAdapter Propagation (DO THIS FIRST)

**File**: `workspace/src/phz-workspace.ts`
**Gap**: Line 451 declares `@property dataAdapter` but `renderPanelContent()` (lines 560-571) never passes it to children.

**Wiring**:
1. Forward `.dataAdapter` to `<phz-data-source-panel>` via property binding
2. Forward to any editor component that renders inside panels
3. Also forward `workspaceAdapter` for save operations

**Test**: Verify that `<phz-data-source-panel>` receives the adapter when workspace renders.

### Task 1.1 — Wire DataSourcePanel into Report Editor

**Files**:
- `workspace/src/authoring/phz-data-source-panel.ts` — needs lifecycle wiring
- `workspace/src/authoring/phz-report-editor.ts` — needs DataAdapter prop + panel integration

**Wiring for phz-data-source-panel**:
1. In `connectedCallback()` or `firstUpdated()`: call `loadSources(this.adapter, this._setState.bind(this))`
2. In `updated(changed)`: if `adapter` changed, reload sources
3. On source selection: call `loadSchema(this.adapter, sourceId, this._setState.bind(this))`
4. The `_setState` function: `(updater) => { this._state = updater(this._state); }`

**Wiring for phz-report-editor**:
1. Add `@property({ attribute: false }) adapter?: DataAdapter`
2. Render `<phz-data-source-panel .adapter=${this.adapter}>` in the editor layout
3. Listen for `field-add` event → call `addColumn(this._state, field, label)`
4. Listen for `field-remove` event → call `removeColumn(this._state, field)`

### Task 1.2 — Wire DataSourcePanel into Dashboard Editor

**File**: `workspace/src/authoring/phz-dashboard-editor.ts`

**Wiring**:
1. Add `@property({ attribute: false }) adapter?: DataAdapter`
2. Remove dependency on external `schema` prop — load it internally via adapter
3. Render `<phz-data-source-panel>` in the field palette area
4. Listen for `field-add` → auto-place field into selected widget's dataConfig

### Task 1.3 — Connect DataModelSidebar to DataAdapter

**File**: `workspace/src/engine-admin/components/phz-data-model-sidebar.ts`

**Current**: Takes pure arrays (fields[], parameters[], calculated[], metrics[], kpis[])
**Wiring**: Add adapter prop, load fields via `getSchema()` in lifecycle, classify into sections

### Task 1.4 — Field Selection → Report Column Binding

**Files**: report-editor-state.ts, phz-report-editor.ts

**Data flow**:
```
phz-data-source-panel dispatches 'field-add' { field, metadata }
  → phz-report-editor catches event
  → calls addColumn(state, field, metadata.name)
  → state.columns updated
  → component re-renders with new column
```

### Task 1.5 — Field Selection → Dashboard Widget Binding

**Data flow**:
```
phz-data-source-panel dispatches 'field-add' { field, metadata }
  → phz-dashboard-editor catches event
  → if widget selected: updateWidgetData(state, widgetId, { ...dataConfig, new field })
  → if no widget: auto-create widget based on field type
```

---

## 10. Phase 2 Wiring Instructions

### Task 2.1 — Filter-Query Bridge (NEW FILE)

**Create**: `workspace/src/filters/filter-query-bridge.ts`

**Purpose**: Convert FilterContextManager resolved values → DataQuery.filters

```typescript
// Implementation sketch:
function buildQueryFilters(
  filterContext: FilterContextManager,
  widgetId?: string,
  fieldMappings?: FieldMapping[]
): DataQuery['filters'] {
  const resolved = filterContext.resolveFilters(widgetId);
  return resolved.map(expr => ({
    field: mapField(expr.field, fieldMappings),
    operator: expr.operator,
    value: expr.value
  }));
}
```

**Test cases**:
- Empty filter context → empty filters array
- Single filter → single filter in query
- Multiple filters → all present
- Cross-filter exclusion for source widget
- Field mapping substitution for multi-source dashboards

### Task 2.2 — Dashboard Filter Bar → Widget Refresh

**File**: `workspace/src/coordination/dashboard-data-pipeline.ts`

**Wiring**:
1. Pipeline factory already accepts `filterContext` parameter
2. Subscribe to filterContext changes: `filterContext.subscribe(() => pipeline.invalidate())`
3. On invalidate: rebuild queries with new filter values via bridge (Task 2.1)
4. Widgets receive new data through `onStateChange` callbacks

### Task 2.3 — FilterRuleEngine Activation

**Wiring**:
1. When FilterContextManager notifies subscribers of change
2. Call `evaluateFilterRules(rules, viewerContext, currentFilterState)`
3. Apply returned actions: hide/disable/restrict/force on filter UI
4. This should happen in the dashboard filter bar controller

### Task 2.4 — Cross-Filter Wiring

**Wiring**:
1. Dashboard component listens for `bar-click`, `slice-click`, `point-click` on its container
2. Extract `{ field, value }` from event detail
3. Call `filterContext.applyCrossFilter(widgetId, field, value)`
4. FilterContext notifies subscribers → pipeline invalidates → widgets refresh

### Task 2.5 — Filter Cascading

**Wiring**:
1. When parent filter value changes (FilterContext subscriber)
2. Find child FilterDefinitions where `dependsOn` includes parent filter ID
3. Call `resolveCascadingDependency(adapter, parentId, parentValue, childDef)`
4. Update child filter UI with new available options

### Task 2.6 — URL Sync

**Wiring**:
1. On filter change: `window.history.replaceState({}, '', '?' + serializeFilterState(state))`
2. On page load: `deserializeFilterState(window.location.search)` → apply to FilterContext
3. On popstate event: deserialize and apply

### Task 2.7 — Filter Admin Persistence

**Wiring**:
1. `phz-filter-designer` dispatches `definition-create`, `definition-update`
2. Catch events in workspace shell or editor
3. Call `WorkspaceAdapter.saveArtifact(definition)`

---

## 11. Phase 3 Wiring Instructions

### Task 3.1 — Widget Data Subscription

**Key insight**: Widgets don't call DataAdapter directly. Instead:
1. `DashboardDataPipeline` calls DataAdapter
2. Dashboard component subscribes to pipeline state changes
3. Dashboard distributes data to widgets via property binding

**Wiring**:
```
DashboardDataPipeline.onStateChange(state => {
  for (const widget of dashboardWidgets) {
    const data = pipeline.getWidgetData(widget.id, 'both');
    widget.data = transformToWidgetFormat(data);
    widget.loading = (state.phase === 'preloading');
    widget.error = (state.phase === 'error') ? state.error : null;
  }
})
```

### Task 3.2 — Widget Data Processor Integration

**File**: `engine/src/widget-data-processor.ts`

**Current**: `processWidgetData(rows, dataConfig)` takes raw rows
**Wiring**: DataResult.rows → processWidgetData → widget.data

```typescript
// Transform DataResult → widget props
const dataResult = pipeline.getWidgetData(widgetId, 'both');
const processed = processWidgetData(dataResult.rows, widget.dataConfig);
// processed.rows → ChartDataSeries points
```

### Task 3.3 — KPI Real Data

**Current**: `previousValue = value * 0.95` (synthetic)
**Wiring**: Execute two DataAdapter queries — current period and comparison period
**Source**: Use TimeIntelligenceConfig.relativePeriods for period calculation

### Task 3.5 — Loading/Error States

**Wiring**: Pipeline state → widget.loading / widget.error
- `'preloading'` → `widget.loading = true`
- `'preload-complete'` → `widget.loading = false` (show preload data)
- `'error'` → `widget.error = state.error`
- `widget-retry` event → `pipeline.invalidate()`

---

## 12. Phase 4 Wiring Instructions

### Task 4.1 — Explorer Live Preview

**Wiring**:
1. User drags field to zone → `DataExplorer.addToZone()`
2. `DataExplorer.subscribe()` fires listener
3. Convert: `explorer.toQuery()` → `exploreToDataQuery()` → DataQuery
4. Call: `adapter.execute(dataQuery)` → DataResult
5. Display result in preview table/chart

### Task 4.3 — Preview Modes

**Table**: DataResult.rows → render as HTML table
**Chart**: DataResult → processWidgetData → render suggested chart type
**SQL**: Show ExploreDataQuery as formatted JSON (consumer's DataAdapter can optionally return SQL)

### Task 4.4 — Save as Report / Add to Dashboard

**Wiring**:
1. User clicks "Save as Report"
2. `exploreToReport(explorer.toQuery(), name, dataSourceId)` → ReportArtifact
3. `WorkspaceAdapter.saveArtifact(report)` → persisted
4. Navigate to report editor

---

## 13. Phase 5 Wiring Instructions

### Task 5.1 — Save Event Listener

**Wiring**: In workspace shell or a new orchestrator:
```typescript
// Listen on the workspace element (events bubble with composed: true)
workspace.addEventListener('save-report', async (e) => {
  const { state, gridConfig } = e.detail;
  await workspaceAdapter.saveArtifact({ type: 'report', ...gridConfig });
  autoSave.markSaved();
});

workspace.addEventListener('save-dashboard', async (e) => {
  const { state } = e.detail;
  await workspaceAdapter.saveArtifact({ type: 'dashboard', ...state });
});

// Also: dashboard-save, kpi-save, metric-save, etc.
```

### Task 5.2 — Auto-Save Wiring

```typescript
const autoSave = createAutoSave({
  debounceMs: 30000,  // 30 seconds per spec
  getState: () => currentEditorState
});

autoSave.onSave(async (state) => {
  await workspaceAdapter.saveArtifact({ ...state, draft: true });
});

// Wire to state-changed events:
editor.addEventListener('state-changed', () => autoSave.markDirty());
```

### Task 5.3 — Undo/Redo Re-Render

**Current gap**: `undo()` returns new state but nothing applies it.
**Wiring**:
```typescript
handleUndo() {
  const previousState = this._undoManager.undo();
  if (previousState) {
    this._state = previousState;  // triggers Lit re-render
    this.requestUpdate();
  }
}
```

### Task 5.4 — Publish Validation Runner

**Wiring**: Execute each of the 8 default checks:
1. `data-source` → try `adapter.getSchema()`, pass if no error
2. `filters-valid` → `validateFilterValues()` on current filter config
3. `columns-present` → check state.columns.length > 0
4. `name-set` → check state.name is non-empty
5. `permissions` → check workspaceRole is 'admin' or 'author'
6. `perf-check` → check widget count < threshold
7. `a11y-check` → check all widgets have aria labels
8. `mobile-check` → check layout has responsive breakpoints

---

## 14. Mock Patterns for Tests

### Standard DataAdapter Mock

```typescript
function createMockAdapter(data?: { sources?: DataSourceMeta[]; schema?: DataSourceSchema; rows?: unknown[][] }): DataAdapter {
  return {
    execute: vi.fn().mockResolvedValue({
      columns: [], rows: data?.rows ?? [], metadata: { totalRows: 0, truncated: false, queryTimeMs: 1 }
    }),
    getSchema: vi.fn().mockResolvedValue(data?.schema ?? { id: 'test', name: 'Test', fields: [] }),
    listDataSources: vi.fn().mockResolvedValue(data?.sources ?? []),
    getDistinctValues: vi.fn().mockResolvedValue({ values: [], totalCount: 0 }),
    getFieldStats: vi.fn().mockResolvedValue({ distinctCount: 0, nullCount: 0, totalCount: 0 })
  };
}
```

### Standard WorkspaceAdapter Mock

```typescript
function createMockWorkspaceAdapter(): WorkspaceAdapter {
  const store = new Map<string, unknown>();
  return {
    getArtifact: vi.fn(async (id) => store.get(id)),
    listArtifacts: vi.fn(async () => [...store.values()]),
    saveArtifact: vi.fn(async (artifact) => { store.set(artifact.id, artifact); return artifact.id; }),
    deleteArtifact: vi.fn(async (id) => { store.delete(id); }),
    listTemplates: vi.fn(async () => []),
    getTemplate: vi.fn(async () => null),
    getPlacementsForRoute: vi.fn(async () => []),
    savePlacement: vi.fn(async () => {})
  };
}
```

### Standard FieldMetadata Fixtures

```typescript
const SALES_FIELDS: FieldMetadata[] = [
  { name: 'date', dataType: 'date', semanticHint: 'timestamp' },
  { name: 'region', dataType: 'string', semanticHint: 'dimension', cardinality: 'low' },
  { name: 'product', dataType: 'string', semanticHint: 'category', cardinality: 'medium' },
  { name: 'revenue', dataType: 'number', semanticHint: 'measure', unit: { type: 'currency', code: 'USD' } },
  { name: 'quantity', dataType: 'number', semanticHint: 'measure' },
  { name: 'customer_id', dataType: 'string', semanticHint: 'identifier', cardinality: 'high' }
];
```

---

## 15. Known Gotchas

1. **Lit property forwarding**: When passing DataAdapter to child components, use `.adapter=${this.adapter}` (dot prefix for property binding, not attribute binding)
2. **Event bubbling**: All events use `bubbles: true, composed: true` to cross Shadow DOM boundaries
3. **setState immutability**: State machine functions return new objects — never mutate existing state
4. **Orchestrator error handling**: `loadSources()` and `loadSchema()` catch errors internally. `loadFieldStats()` silently fails (informational only)
5. **Filter context subscription**: `subscribe()` returns an unsubscribe function — store it and call in `disconnectedCallback()` to prevent memory leaks
6. **Pipeline destroy**: Call `pipeline.destroy()` in `disconnectedCallback()` to clean up listeners
7. **Undo manager max history**: Defaults to 50 entries — beyond that, oldest entries are dropped
8. **Auto-save debounce**: Default 2000ms but spec says 30000ms (30s) — use spec value
9. **ExploreQuery vs DataQuery**: `exploreToDataQuery()` converts user-facing format to backend format — always use the converted version for DataAdapter calls
10. **Dual filter systems**: CriteriaEngine (criteria package) is the older system. FilterContextManager (workspace) is the newer one. Task 2.1 bridges them.
11. **Cross-filter source exclusion**: When widget A triggers cross-filter, widget A should NOT be filtered by its own cross-filter (prevents circular filtering)
12. **Catalog mutation listener**: `phz-catalog-browser` listens on `ownerDocument` — save events must bubble up to document level to trigger catalog refresh
