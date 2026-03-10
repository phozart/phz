# Type Contracts — phz-grid

**Generated**: 2026-02-24
**Version**: 1.0
**Status**: BINDING — Implementation MUST match these exact type exports

---

## Table of Contents

1. [Overview](#overview)
2. [Package Export Map](#package-export-map)
3. [Reconciliation Notes](#reconciliation-notes)
4. [Cross-Package Type Dependencies](#cross-package-type-dependencies)
5. [Type Contract Governance](#type-contract-governance)

---

## Overview

This document defines the **complete, binding TypeScript type export contracts** for all packages in the phz-grid monorepo (22 packages, 15 documented here). Every type, interface, class, function, and constant listed here MUST be exported exactly as specified.

### Purpose

- **Single Source of Truth**: All implementation agents reference this document for export signatures
- **Type Safety Guarantee**: Consumers can import these types with full confidence in their stability
- **Reconciliation Authority**: When the Data Model (DATA-MODEL.md) and API Contracts (API-CONTRACTS.md) differ, this document specifies the resolution

### Reconciliation Strategy

The Data Model uses strict, generic types (`GridConfig<TData>`, `GridState<TData>`) optimized for internal correctness. The API Contracts use simplified signatures (`data: unknown[]`) for ease of use. This document:

1. **Prefers generics from DATA-MODEL** for core types (GridConfig, GridState, RowData)
2. **Simplifies public API surfaces** for factory functions (createGrid, Grid component props)
3. **Unifies naming conflicts** (e.g., RowId is `string | number` for flexibility)
4. **Exports utility types** for advanced consumers who need full generic control

---

## Package Export Map

### 1. @phozart/phz-core

**Description**: Headless grid engine with zero DOM dependencies. All types originate here.

#### Types (Core Data Model)

```typescript
// Configuration
export interface GridConfig<TData = any>
export interface FeatureFlags
export interface AccessibilityConfig
export interface AriaLabels
export interface PerformanceConfig
export interface Plugin
export interface PluginHooks

// State
export interface GridState<TData = any>
export interface ColumnState
export interface FocusState
export type FocusMode
export type FocusRegion
export interface StatusState
export interface GridError
export interface HistoryState
export interface EnterpriseState

// Columns
export interface ColumnDefinition<TData = any, TValue = any>
export type ColumnType
export type CellRenderer<TData = any, TValue = any>
export interface CellRenderContext<TData = any, TValue = any>
export type CellEditor<TData = any, TValue = any>
export interface CellEditorContext<TData = any, TValue = any>
export interface CellEditorInstance
export type CellValidator<TValue = any>
export interface CellValidationContext
export type CellValidationResult
export type SortComparator<TValue = any>
export type ValueFormatter<TValue = any>
export type ValueGetter<TData = any, TValue = any>
export type ValueSetter<TData = any, TValue = any>
export type HeaderRenderer
export interface HeaderRenderContext
export type FooterRenderer
export interface FooterRenderContext
export type CellClassFn<TData = any, TValue = any>
export type CellStyleFn<TData = any, TValue = any>
export interface CSSProperties

// Rows
export interface RowData<TData = any>
export type RowId // Reconciled as: string | number
export interface RowMetadata
export interface RowValidationError
export interface RowModelState<TData = any>

// Cells
export interface CellPosition
export interface CellRange
export type CellValue

// Data Sources
export type DataSource<TData = any>
export interface LocalDataSource<TData = any>
export interface AsyncDataSource<TData = any>
export interface DataFetchRequest
export interface DataFetchResponse<TData = any>
export interface DuckDBDataSource
export interface DuckDBConnection

// Sort
export interface SortState
export interface SortModel
export type SortDirection

// Filter
export interface FilterState
export interface FilterModel
export type FilterOperator
export type FilterValue
export type FilterType
export type FilterLogic
export interface FilterPreset

// Selection
export interface SelectionState
export type SelectionMode

// Edit
export type EditState
export interface EditStateIdle
export interface EditStateEditing
export interface EditStateValidating
export interface EditStateCommitting
export interface EditStateError
export interface PendingEdits

// Virtualization
export interface VirtualizationState

// Scroll
export interface ScrollState
export type ScrollDirection

// Responsive
export interface ResponsiveState
export type Breakpoint
export type LayoutMode
export interface BreakpointConfig
export const DEFAULT_BREAKPOINTS: BreakpointConfig

// Theme
export interface ThemeState
export type ColorScheme
export interface ThemeTokens
export interface PrimitiveTokens
export interface SemanticTokens
export interface ComponentTokens
export interface ThemeConfig

// DuckDB States
export interface DuckDBState
export interface DuckDBConnectionState
export interface DuckDBQuery
export interface DuckDBQueryResult
export interface DuckDBColumn
export interface DuckDBSchemaCache
export interface DuckDBTableSchema
export interface DuckDBQueryHistoryEntry

export interface AIState
export interface AIProviderConfig
export interface AIChatMessage
export interface AIGeneratedQuery
export interface AIInferredSchema
export interface AIInferredColumn
export interface AIAnomaly
export type AIAnomalyType
export interface AIStatus

export interface CollaborationState
export interface CollaborationSession
export interface CollaborationUser
export interface SyncStatus
export interface ChangeOperation
export type ChangeOperationType
export interface ConflictResolution

export interface AnalyticsState
export interface GroupingConfig
export interface PivotConfig
export interface PivotValueField
export interface AggregationConfig
export type AggregationFunction
export interface ConditionalFormattingRule
export type ConditionalFormattingType
export interface ConditionalFormattingCondition
export interface CellStyleConfig
export interface ChartConfig
export type ChartType
export interface ChartOptions
export interface ChartAxisConfig

// Events
export interface GridEvent
export type EventSource
export interface StateChangeEvent<TData = any>
export interface StateChangeDelta<TData = any>
export interface CellEvent
export interface CellClickEvent
export interface CellDoubleClickEvent
export interface CellContextMenuEvent
export interface CellEditStartEvent
export interface CellEditCommitEvent
export interface CellEditCancelEvent
export interface CellValidateEvent
export interface SelectionChangeEvent
export interface SortChangeEvent
export interface FilterChangeEvent
export interface ScrollEvent
export interface RowEvent
export interface RowClickEvent
export interface RowDoubleClickEvent
export interface ColumnEvent
export interface ColumnResizeEvent
export interface ColumnMoveEvent
export interface ColumnVisibilityChangeEvent
export interface DataLoadEvent
export interface DataErrorEvent

// Row Model Pipeline
export interface RowModelPipeline<TData = any>
export interface CoreRowModel<TData = any>
export interface FilteredRowModel<TData = any>
export interface SortedRowModel<TData = any>
export interface GroupedRowModel<TData = any>
export interface RowGroup<TData = any>
export interface FlattenedRowModel<TData = any>
export interface VirtualizedRowModel<TData = any>
export interface RowModelStage<TInput, TOutput>

// Grid API
export interface GridApi<TData = any>
export type StateChangeListener<TData = any>
export interface ExportCsvOptions
export interface ExportExcelOptions
export interface SerializedGridState
```

#### Functions

```typescript
export function createGrid<TData = any>(config: GridConfig<TData>): GridApi<TData>
export function serializeCellPosition(pos: CellPosition): string
export function deserializeCellPosition(key: string): CellPosition
```

#### Type Guards

```typescript
export function isEditStateIdle(state: EditState): state is EditStateIdle
export function isEditStateEditing(state: EditState): state is EditStateEditing
export function isEditStateValidating(state: EditState): state is EditStateValidating
export function isEditStateCommitting(state: EditState): state is EditStateCommitting
export function isEditStateError(state: EditState): state is EditStateError
export function isLocalDataSource<T>(ds: DataSource<T>): ds is LocalDataSource<T>
export function isAsyncDataSource<T>(ds: DataSource<T>): ds is AsyncDataSource<T>
export function isDuckDBDataSource(ds: DataSource): ds is DuckDBDataSource
```

#### Utility Types

```typescript
export type DeepReadonly<T>
export type ExtractRowData<T>
export type PartialDeep<T>
```

#### Utility Functions

```typescript
export function immutableUpdate<T>(obj: T, updates: Partial<T>): T
export function immutableArrayUpdate<T>(arr: ReadonlyArray<T>, index: number, update: Partial<T>): ReadonlyArray<T>
export function immutableArrayInsert<T>(arr: ReadonlyArray<T>, index: number, item: T): ReadonlyArray<T>
export function immutableArrayRemove<T>(arr: ReadonlyArray<T>, index: number): ReadonlyArray<T>
export function immutableMapUpdate<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): ReadonlyMap<K, V>
export function immutableMapDelete<K, V>(map: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V>
export function immutableSetAdd<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T>
export function immutableSetDelete<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T>
```

---

### 2. @phozart/phz-grid

**Description**: Lit Web Components rendering layer. Depends on @phozart/phz-core.

#### Custom Elements (Lit)

```typescript
export class PhzGrid extends LitElement {
  // Properties
  data: unknown[]
  columns: ColumnDefinition[]
  theme: string
  locale: string
  responsive: boolean
  virtualization: boolean
  selectionMode: 'none' | 'single' | 'multi' | 'range'
  editMode: 'none' | 'click' | 'dblclick' | 'manual'
  loading: boolean
  height: string | number
  width: string | number

  // Methods
  getGridInstance(): GridApi
  refresh(): void
  invalidate(): void

  // Static
  static readonly slots: Record<string, string>
}

export class PhzColumn extends LitElement {
  // Properties (same as ColumnDefinition fields)
  field: string
  header: string
  width: number
  minWidth: number
  maxWidth: number
  sortable: boolean
  filterable: boolean
  editable: boolean
  resizable: boolean
  type: ColumnType
  priority: 1 | 2 | 3
  frozen: 'left' | 'right' | null

  // Static
  static readonly slots: Record<string, string>
}
```

#### Base Classes for Custom Components

```typescript
export abstract class PhzCellRenderer extends LitElement {
  abstract render(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult
}

export abstract class PhzCellEditor extends LitElement {
  abstract render(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult
  abstract getValue(): unknown
  abstract focus(): void
}
```

#### Built-in Cell Renderers

```typescript
export class TextCellRenderer extends PhzCellRenderer {}
export class NumberCellRenderer extends PhzCellRenderer {}
export class DateCellRenderer extends PhzCellRenderer {}
export class BooleanCellRenderer extends PhzCellRenderer {}
export class LinkCellRenderer extends PhzCellRenderer {}
export class ImageCellRenderer extends PhzCellRenderer {}
export class ProgressCellRenderer extends PhzCellRenderer {}
```

#### Built-in Cell Editors

```typescript
export class TextCellEditor extends PhzCellEditor {}
export class NumberCellEditor extends PhzCellEditor {}
export class SelectCellEditor extends PhzCellEditor {}
export class DateCellEditor extends PhzCellEditor {}
export class CheckboxCellEditor extends PhzCellEditor {}
```

#### CSS Token Constants

```typescript
export const BrandTokens: Record<string, string>
export const SemanticTokens: Record<string, string>
export const ComponentTokens: Record<string, string>
```

#### Event Map (DOM Custom Events)

```typescript
export interface PhzGridEventMap {
  'grid-ready': CustomEvent<{ gridInstance: GridApi }>
  'state-change': CustomEvent<StateChangeEvent>
  'cell-click': CustomEvent<CellClickEvent>
  'cell-dblclick': CustomEvent<CellDoubleClickEvent>
  'row-click': CustomEvent<RowClickEvent>
  'selection-change': CustomEvent<SelectionChangeEvent>
  'sort-change': CustomEvent<SortChangeEvent>
  'filter-change': CustomEvent<FilterChangeEvent>
  'edit-start': CustomEvent<EditStartEvent>
  'edit-commit': CustomEvent<EditCommitEvent>
  'edit-cancel': CustomEvent<EditCancelEvent>
  'scroll': CustomEvent<ScrollEvent>
  'resize': CustomEvent<{ width: number; height: number }>
}
```

#### Accessibility Utilities

```typescript
export class AriaManager {
  constructor(grid: GridApi)
  updateGridRole(rowCount: number, columnCount: number): void
  updateCellRole(position: CellPosition, role: string): void
  announceChange(message: string): void
}

export class KeyboardNavigator {
  constructor(grid: GridApi)
  handleKeyDown(event: KeyboardEvent): void
  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void
  moveFocusToFirstCell(): void
  moveFocusToLastCell(): void
}

export class ForcedColorsAdapter {
  static detect(): boolean
  static applyForcedColorsStyles(element: HTMLElement): void
  static removeForcedColorsStyles(element: HTMLElement): void
}
```

#### Re-exports from @phozart/phz-core

```typescript
// All types from @phozart/phz-core are re-exported for convenience
export * from '@phozart/phz-core'
```

---

### 3. @phozart/phz-react

**Description**: React wrapper with hooks. Depends on @phozart/phz-core, @phozart/phz-grid.

#### Components

```typescript
import type { GridApi, ColumnDefinition, GridState } from '@phozart/phz-core'
import type { ReactNode, RefObject } from 'react'

export interface PhzGridProps {
  data: unknown[]
  columns: ColumnDefinition[]
  theme?: string
  locale?: string
  responsive?: boolean
  virtualization?: boolean
  selectionMode?: 'none' | 'single' | 'multi' | 'range'
  editMode?: 'none' | 'click' | 'dblclick' | 'manual'
  loading?: boolean
  height?: string | number
  width?: string | number

  // Event handlers
  onGridReady?: (gridInstance: GridApi) => void
  onStateChange?: (state: GridState) => void
  onCellClick?: (event: CellClickEvent) => void
  onCellDoubleClick?: (event: CellDoubleClickEvent) => void
  onRowClick?: (event: RowClickEvent) => void
  onSelectionChange?: (event: SelectionChangeEvent) => void
  onSortChange?: (event: SortChangeEvent) => void
  onFilterChange?: (event: FilterChangeEvent) => void
  onEditStart?: (event: EditStartEvent) => void
  onEditCommit?: (event: EditCommitEvent) => void
  onEditCancel?: (event: EditCancelEvent) => void
  onScroll?: (event: ScrollEvent) => void

  // Slots as children
  children?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  emptyState?: ReactNode
  loadingIndicator?: ReactNode
  toolbar?: ReactNode

  // Ref to access GridApi
  ref?: RefObject<GridApi>
}

export const PhzGrid: React.ForwardRefExoticComponent<PhzGridProps>
```

#### React Hooks

```typescript
export function useGridState(gridRef: RefObject<GridApi>): {
  state: GridState | null
  setState: (state: Partial<GridState>) => void
  exportState: () => SerializedGridState | null
  importState: (state: SerializedGridState) => void
}

export function useGridSelection(gridRef: RefObject<GridApi>): {
  selectedRows: RowId[]
  selectedCells: CellPosition[]
  select: (rowIds: RowId | RowId[]) => void
  deselect: (rowIds: RowId | RowId[]) => void
  selectAll: () => void
  deselectAll: () => void
  selectRange: (start: CellPosition, end: CellPosition) => void
}

export function useGridSort(gridRef: RefObject<GridApi>): {
  sortState: SortState | null
  sort: (field: string, direction: 'asc' | 'desc' | null) => void
  multiSort: (sorts: Array<{ field: string; direction: 'asc' | 'desc' }>) => void
  clearSort: () => void
}

export function useGridFilter(gridRef: RefObject<GridApi>): {
  filterState: FilterState | null
  addFilter: (field: string, operator: FilterOperator, value: unknown) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  savePreset: (name: string) => void
  loadPreset: (name: string) => void
}

export function useGridEdit(gridRef: RefObject<GridApi>): {
  editState: EditState | null
  startEdit: (position: CellPosition) => void
  commitEdit: (position: CellPosition, value: unknown) => Promise<boolean>
  cancelEdit: (position: CellPosition) => void
  isDirty: boolean
  dirtyRows: RowId[]
}

export function useGridData(gridRef: RefObject<GridApi>): {
  data: RowData[]
  setData: (data: unknown[]) => void
  addRow: (data: Record<string, unknown>, position?: number) => RowId
  updateRow: (id: RowId, data: Partial<Record<string, unknown>>) => void
  deleteRow: (id: RowId) => void
}
```

#### Re-exports from @phozart/phz-core

```typescript
export * from '@phozart/phz-core'
```

---

### 4. @phozart/phz-vue

**Description**: Vue 3 wrapper with Composition API. Depends on @phozart/phz-core, @phozart/phz-grid.

#### Components

```typescript
import type { GridApi, ColumnDefinition } from '@phozart/phz-core'
import type { Component, Ref } from 'vue'

export interface PhzGridProps {
  data: unknown[]
  columns: ColumnDefinition[]
  theme?: string
  locale?: string
  responsive?: boolean
  virtualization?: boolean
  selectionMode?: 'none' | 'single' | 'multi' | 'range'
  editMode?: 'none' | 'click' | 'dblclick' | 'manual'
  loading?: boolean
  height?: string | number
  width?: string | number

  // v-model support
  modelValue?: RowId[]
}

export interface PhzGridEmits {
  'update:modelValue': (value: RowId[]) => void
  'grid-ready': (gridInstance: GridApi) => void
  'selection-change': (event: SelectionChangeEvent) => void
  'sort-change': (event: SortChangeEvent) => void
  'filter-change': (event: FilterChangeEvent) => void
  'edit-commit': (event: EditCommitEvent) => void
  'cell-click': (event: CellClickEvent) => void
  'row-click': (event: RowClickEvent) => void
}

export const PhzGrid: Component<PhzGridProps, PhzGridEmits>
```

#### Vue Composables

```typescript
export function useGrid(): {
  gridInstance: Ref<GridApi | null>
  state: Ref<GridState | null>
  exportState: () => SerializedGridState | null
  importState: (state: SerializedGridState) => void
}

export function useGridSelection(gridInstance?: Ref<GridApi | null>): {
  selectedRows: Ref<RowId[]>
  selectedCells: Ref<CellPosition[]>
  select: (rowIds: RowId | RowId[]) => void
  deselect: (rowIds: RowId | RowId[]) => void
  selectAll: () => void
  deselectAll: () => void
  selectRange: (start: CellPosition, end: CellPosition) => void
}

export function useGridSort(gridInstance?: Ref<GridApi | null>): {
  sortState: Ref<SortState | null>
  sort: (field: string, direction: 'asc' | 'desc' | null) => void
  multiSort: (sorts: Array<{ field: string; direction: 'asc' | 'desc' }>) => void
  clearSort: () => void
}

export function useGridFilter(gridInstance?: Ref<GridApi | null>): {
  filterState: Ref<FilterState | null>
  addFilter: (field: string, operator: FilterOperator, value: unknown) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  savePreset: (name: string) => void
  loadPreset: (name: string) => void
}

export function useGridEdit(gridInstance?: Ref<GridApi | null>): {
  editState: Ref<EditState | null>
  startEdit: (position: CellPosition) => void
  commitEdit: (position: CellPosition, value: unknown) => Promise<boolean>
  cancelEdit: (position: CellPosition) => void
  isDirty: Ref<boolean>
  dirtyRows: Ref<RowId[]>
}
```

#### Re-exports from @phozart/phz-core

```typescript
export * from '@phozart/phz-core'
```

---

### 5. @phozart/phz-angular

**Description**: Angular standalone component with RxJS. Depends on @phozart/phz-core, @phozart/phz-grid.

#### Components

```typescript
import { Component, Input, Output, EventEmitter, Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import type { GridApi, ColumnDefinition, GridState } from '@phozart/phz-core'

@Component({
  selector: 'phz-grid',
  standalone: true
})
export class PhzGridComponent {
  @Input() data: unknown[]
  @Input() columns: ColumnDefinition[]
  @Input() theme: string
  @Input() locale: string
  @Input() responsive: boolean
  @Input() virtualization: boolean
  @Input() selectionMode: 'none' | 'single' | 'multi' | 'range'
  @Input() editMode: 'none' | 'click' | 'dblclick' | 'manual'
  @Input() loading: boolean
  @Input() height?: string | number
  @Input() width?: string | number

  @Output() gridReady: EventEmitter<GridApi>
  @Output() selectionChange: EventEmitter<SelectionChangeEvent>
  @Output() sortChange: EventEmitter<SortChangeEvent>
  @Output() filterChange: EventEmitter<FilterChangeEvent>
  @Output() editCommit: EventEmitter<EditCommitEvent>
  @Output() cellClick: EventEmitter<CellClickEvent>
  @Output() rowClick: EventEmitter<RowClickEvent>

  getGridInstance(): GridApi | null
}
```

#### Services

```typescript
@Injectable({ providedIn: 'root' })
export class GridService {
  registerGrid(id: string, instance: GridApi): void
  unregisterGrid(id: string): void
  getGrid(id: string): GridApi | undefined

  // Observable state streams
  getSelectionState$(gridId: string): Observable<SelectionState>
  getSortState$(gridId: string): Observable<SortState>
  getFilterState$(gridId: string): Observable<FilterState>
  getEditState$(gridId: string): Observable<EditState>
}
```

#### Module (for non-standalone)

```typescript
import { NgModule } from '@angular/core'

@NgModule({
  imports: [PhzGridComponent],
  exports: [PhzGridComponent]
})
export class PhzGridModule {}
```

#### Re-exports from @phozart/phz-core

```typescript
export * from '@phozart/phz-core'
```

---

### 6. @phozart/phz-duckdb

**Description**: DuckDB-WASM data source adapter. Depends on @phozart/phz-core.

#### Factory Function

```typescript
export function createDuckDBDataSource(config: DuckDBConfig): DuckDBDataSource
```

#### Types

```typescript
export interface DuckDBConfig {
  workerUrl?: string
  wasmUrl?: string
  enableStreaming?: boolean
  enableProgress?: boolean
  memoryLimit?: number
  threads?: number
}

export interface DuckDBDataSource {
  // Connection
  initialize(): Promise<void>
  connect(): Promise<AsyncDuckDBConnection>
  disconnect(): Promise<void>
  isConnected(): boolean

  // Data Loading
  loadFile(file: File | URL | string, options?: LoadFileOptions): Promise<string>
  loadMultipleFiles(files: Array<{ name: string; file: File | URL | string }>): Promise<string[]>

  // Schema
  getSchema(tableName?: string): Promise<TableSchema>
  getTables(): Promise<string[]>
  getTableInfo(tableName: string): Promise<TableInfo>

  // Query
  query(sql: string, params?: Record<string, unknown>): Promise<QueryResult>
  queryStream(sql: string, params?: Record<string, unknown>): AsyncIterable<QueryChunk>
  executeSQL(sql: string): Promise<void>
  cancelQuery(): void
  onProgress(handler: (progress: QueryProgress) => void): Unsubscribe

  // Arrow Integration
  toArrowTable(tableName?: string): Promise<ArrowTable>
  fromArrowTable(table: ArrowTable, tableName: string): Promise<void>

  // Worker
  getDatabase(): AsyncDuckDB
  terminateWorker(): Promise<void>

  // Grid Integration
  attachToGrid(grid: GridApi): void
  detachFromGrid(): void
}

export interface LoadFileOptions {
  format?: 'csv' | 'parquet' | 'json' | 'arrow' | 'auto'
  tableName?: string
  schema?: Record<string, string>
  header?: boolean
  delimiter?: string
  compression?: 'gzip' | 'zstd' | 'snappy' | 'none' | 'auto'
}

export interface TableSchema {
  name: string
  columns: ColumnSchema[]
  rowCount: number
}

export interface ColumnSchema {
  name: string
  type: string
  nullable: boolean
}

export interface TableInfo {
  name: string
  schema: TableSchema
  sizeBytes: number
  rowCount: number
  columnCount: number
}

export interface QueryResult {
  data: unknown[]
  schema: ColumnSchema[]
  rowCount: number
  executionTime: number
  fromCache: boolean
}

export interface QueryChunk {
  data: unknown[]
  index: number
  total: number
  progress: number
}

export interface QueryProgress {
  state: 'preparing' | 'executing' | 'streaming' | 'complete' | 'error'
  progress: number
  rowsProcessed: number
  totalRows?: number
  message?: string
}

export type Unsubscribe = () => void
```

#### Advanced Features

```typescript
export interface ParquetMetadata {
  version: string
  rowGroups: RowGroupMetadata[]
  schema: ParquetSchema
  totalRows: number
}

export interface RowGroupMetadata {
  id: number
  rowCount: number
  columns: ColumnChunkMetadata[]
  totalByteSize: number
}

export interface ColumnChunkMetadata {
  name: string
  type: string
  encoding: string
  compression: string
  statistics?: ColumnStatistics
}

export interface ColumnStatistics {
  min?: unknown
  max?: unknown
  nullCount: number
  distinctCount?: number
}

export interface ParquetSchema {
  fields: Array<{ name: string; type: string; nullable: boolean }>
}

export interface QueryPlan {
  sql: string
  plan: QueryPlanNode[]
  estimatedCost: number
  estimatedRows: number
}

export interface QueryPlanNode {
  id: number
  type: string
  table?: string
  filter?: string
  estimatedRows: number
  children: QueryPlanNode[]
}

export function getQueryPlan(dataSource: DuckDBDataSource, sql: string): Promise<QueryPlan>
```

#### Re-exports from @phozart/phz-core

```typescript
export * from '@phozart/phz-core'
```

---

### 7. @phozart/phz-ai

**Description**: AI toolkit for schema inference and NL queries. Depends on @phozart/phz-core.

#### Factory Function

```typescript
export function createAIToolkit(config: AIConfig): AIToolkit
```

#### Types

```typescript
import type { JSONSchema7 } from 'json-schema'

export interface AIConfig {
  provider: AIProvider
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
  enableCaching?: boolean
  enableLogging?: boolean
}

export interface AIProvider {
  name: string
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>
}

export interface AIToolkit {
  // Schema
  getStructuredSchema(): JSONSchema7
  inferSchema(sampleData: unknown[], options?: InferSchemaOptions): Promise<ColumnDefinition[]>
  validateSchema(schema: ColumnDefinition[], data: unknown[]): Promise<SchemaValidationResult>

  // Natural Language
  executeNaturalLanguageQuery(query: string, options?: NLQueryOptions): Promise<AIQueryResult>
  explainQuery(sql: string): Promise<string>
  suggestQueries(context?: string): Promise<string[]>

  // Data Quality
  detectAnomalies(column: string, options?: AnomalyDetectionOptions): Promise<AnomalyResult[]>
  suggestDataTypes(sampleData: unknown[]): Promise<DataTypeSuggestion[]>
  detectDuplicates(columns?: string[]): Promise<DuplicateResult[]>

  // Summarization
  summarize(options?: SummarizeOptions): Promise<string>
  generateInsights(columns?: string[]): Promise<Insight[]>

  // Filtering & Search
  suggestFilters(input: string): Promise<FilterSuggestion[]>
  autoCompleteValue(column: string, partial: string): Promise<string[]>

  // Grid Integration
  attachToGrid(grid: GridApi): void
  detachFromGrid(): void
}

export interface CompletionOptions {
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
  systemPrompt?: string
}

export interface CompletionResult {
  text: string
  model: string
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  finishReason: 'stop' | 'length' | 'content_filter'
}

export interface CompletionChunk {
  text: string
  index: number
  finishReason?: 'stop' | 'length' | 'content_filter'
}

export interface InferSchemaOptions {
  sampleSize?: number
  confidence?: number
  detectDates?: boolean
  detectEnums?: boolean
  maxEnumValues?: number
}

export interface SchemaValidationResult {
  valid: boolean
  errors: Array<{ row: number; column: string; error: string }>
  warnings: Array<{ row: number; column: string; warning: string }>
  coverage: number
}

export interface NLQueryOptions {
  schema?: ColumnDefinition[]
  sampleData?: unknown[]
  dialect?: 'duckdb' | 'sqlite' | 'postgres' | 'mysql'
  explainSQL?: boolean
  dryRun?: boolean
}

export interface AIQueryResult {
  sql: string
  explanation?: string
  data?: unknown[]
  error?: string
  confidence: number
}

export interface AnomalyDetectionOptions {
  method?: 'zscore' | 'iqr' | 'isolation_forest' | 'auto'
  threshold?: number
  sensitivity?: 'low' | 'medium' | 'high'
}

export interface AnomalyResult {
  rowId: string
  column: string
  value: unknown
  score: number
  reason: string
  severity: 'low' | 'medium' | 'high'
}

export interface DataTypeSuggestion {
  column: string
  currentType: string
  suggestedType: string
  confidence: number
  reason: string
  examples: Array<{ value: unknown; parsedValue: unknown }>
}

export interface DuplicateResult {
  rowIds: string[]
  columns: string[]
  values: Record<string, unknown>
  count: number
}

export interface SummarizeOptions {
  maxLength?: number
  style?: 'technical' | 'business' | 'casual'
  includeStats?: boolean
  includeTrends?: boolean
  columns?: string[]
}

export interface Insight {
  type: 'trend' | 'correlation' | 'outlier' | 'pattern' | 'distribution'
  title: string
  description: string
  columns: string[]
  confidence: number
  visualization?: {
    type: 'line' | 'bar' | 'scatter' | 'heatmap'
    data: unknown[]
  }
}

export interface FilterSuggestion {
  field: string
  operator: FilterOperator
  value: unknown
  displayText: string
  confidence: number
}
```

#### Built-in Providers

```typescript
export class OpenAIProvider implements AIProvider {
  constructor(config: { apiKey: string; model?: string; baseURL?: string })
  name: 'openai'
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>
}

export class AnthropicProvider implements AIProvider {
  constructor(config: { apiKey: string; model?: string; baseURL?: string })
  name: 'anthropic'
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>
}

export class GoogleProvider implements AIProvider {
  constructor(config: { apiKey: string; model?: string; baseURL?: string })
  name: 'google'
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>
}
```

#### Re-exports from @phozart/phz-core

```typescript
export * from '@phozart/phz-core'
```

---

### 8. @phozart/phz-collab

**Description**: Real-time collaboration with CRDTs. Depends on @phozart/phz-core.

#### Factory Function

```typescript
export function createCollabSession(config: CollabConfig): CollabSession
```

#### Types

```typescript
import type { Doc as YDoc } from 'yjs'

export interface CollabConfig {
  sessionId?: string
  userId: string
  userName: string
  userColor?: string
  conflictResolution?: ConflictStrategy
  enablePresence?: boolean
  enableHistory?: boolean
  historyLimit?: number
}

export type ConflictStrategy = 'last-write-wins' | 'manual' | 'custom'

export interface CollabSession {
  // Connection
  connect(provider: SyncProvider): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  getConnectionState(): ConnectionState

  // Presence
  getPresence(): ReadonlyMap<UserId, UserPresence>
  updatePresence(data: Partial<UserPresence>): void
  onPresenceChange(handler: (presenceMap: Map<UserId, UserPresence>) => void): Unsubscribe

  // Change Tracking
  onRemoteChange(handler: (change: RemoteChange) => void): Unsubscribe
  onLocalChange(handler: (change: LocalChange) => void): Unsubscribe
  getChangeHistory(options?: HistoryOptions): ChangeEntry[]

  // Session Info
  getSessionInfo(): SessionInfo
  getUserInfo(userId: UserId): UserInfo | undefined

  // Conflict Resolution
  onConflict(handler: (conflict: Conflict) => ConflictResolution): Unsubscribe
  resolveConflict(conflictId: string, resolution: ConflictResolution): void

  // Yjs Document
  getYDoc(): YDoc

  // Grid Integration
  attachToGrid(grid: GridApi): void
  detachFromGrid(): void

  // Lifecycle
  destroy(): void
}

export type UserId = string

export interface UserPresence {
  userId: UserId
  userName: string
  userColor: string
  cursor?: CellPosition
  selection?: CellPosition[]
  editing?: CellPosition
  lastActivity: number
  online: boolean
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface RemoteChange {
  type: 'cell' | 'row' | 'column' | 'state'
  userId: UserId
  timestamp: number
  change: CellChange | RowChange | ColumnChange | StateChange
}

export interface LocalChange {
  type: 'cell' | 'row' | 'column' | 'state'
  timestamp: number
  change: CellChange | RowChange | ColumnChange | StateChange
}

export interface CellChange {
  position: CellPosition
  oldValue: unknown
  newValue: unknown
}

export interface RowChange {
  action: 'add' | 'update' | 'delete'
  rowId: RowId
  data?: RowData
}

export interface ColumnChange {
  action: 'add' | 'update' | 'delete' | 'reorder'
  field: string
  data?: ColumnDefinition
  newIndex?: number
}

export interface StateChange {
  field: keyof GridState
  oldValue: unknown
  newValue: unknown
}

export interface HistoryOptions {
  limit?: number
  since?: number
  userId?: UserId
  type?: 'cell' | 'row' | 'column' | 'state'
}

export interface ChangeEntry {
  id: string
  userId: UserId
  timestamp: number
  type: 'cell' | 'row' | 'column' | 'state'
  change: CellChange | RowChange | ColumnChange | StateChange
}

export interface SessionInfo {
  sessionId: string
  createdAt: number
  connectedUsers: number
  totalChanges: number
}

export interface UserInfo {
  userId: UserId
  userName: string
  userColor: string
  joinedAt: number
  changeCount: number
}

export interface Conflict {
  id: string
  type: 'cell' | 'row' | 'column'
  position?: CellPosition
  rowId?: RowId
  field?: string
  localValue: unknown
  remoteValue: unknown
  localUserId: UserId
  remoteUserId: UserId
  timestamp: number
}

export interface ConflictResolution {
  conflictId: string
  resolution: 'local' | 'remote' | 'merge' | 'custom'
  customValue?: unknown
}

export type Unsubscribe = () => void
```

#### Sync Providers

```typescript
export interface SyncProvider {
  name: string
  connect(doc: YDoc, sessionId: string): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe
}

export class WebSocketSyncProvider implements SyncProvider {
  constructor(config: WebSocketSyncConfig)
  name: 'websocket'
  connect(doc: YDoc, sessionId: string): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe
}

export interface WebSocketSyncConfig {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  auth?: {
    token?: string
    headers?: Record<string, string>
  }
}

export class WebRTCSyncProvider implements SyncProvider {
  constructor(config: WebRTCSyncConfig)
  name: 'webrtc'
  connect(doc: YDoc, sessionId: string): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe
}

export interface WebRTCSyncConfig {
  signalingServer: string
  iceServers?: RTCIceServer[]
  enableDataChannelOptimization?: boolean
}
```

#### Yjs Document Mapping

```typescript
export interface YGridDocument {
  rows: Y.Array<Y.Map<unknown>>
  columns: Y.Array<Y.Map<unknown>>
  state: Y.Map<unknown>
  presence: Y.Map<UserPresence>
}

export function getYGridDocument(doc: YDoc): YGridDocument
```

#### Re-exports from @phozart/phz-core

```typescript
export * from '@phozart/phz-core'
```

---

### 9. @phozart/phz-docs (Internal)

**Description**: Documentation site. No public API exports.

**Purpose**: Contains VitePress documentation site source, interactive examples, and API reference auto-generated from the TypeScript definitions in this document.

---

### 10. @phozart/phz-python

**Description**: Python package distributed on PyPI as `phz-grid`. Wraps JavaScript core with anywidget.

**Note**: Python types are defined in stub files (`.pyi`) and not included in this TypeScript TYPE-CONTRACTS document. See `PYTHON-API-CONTRACTS.md` for the complete Python type signatures.

---

### 11. @phozart/phz-shared

**Description**: Shared infrastructure — adapter interfaces, design system, artifact types, runtime coordination. Foundation layer with no Lit or DOM dependencies.

#### Adapter Interfaces (`./adapters`)

```typescript
// Data adapter SPI
export interface DataAdapter
export interface DataQuery
export interface DataResult
export interface ColumnDescriptor
export interface ViewerContext

// Persistence
export interface PersistenceAdapter
export interface FilterPreset

// Measure registry
export interface MeasureRegistryAdapter
export type SemanticHint
export type UnitSpec

// Alert channel
export interface AlertChannelAdapter

// Attention
export interface AttentionAdapter
export interface AttentionItem

// Usage analytics
export interface UsageAnalyticsAdapter

// Subscription delivery
export interface SubscriptionAdapter

// Help configuration
export interface HelpConfig
export type ExportFormat
```

#### Type Definitions (`./types`)

```typescript
// Share targets
export type ShareTarget
export type ShareTargetUser
export type ShareTargetRole
export type ShareTargetTeam
export type ShareTargetEveryone
export function isUserTarget(target: ShareTarget): target is ShareTargetUser
export function isRoleTarget(target: ShareTarget): target is ShareTargetRole
export function isTeamTarget(target: ShareTarget): target is ShareTargetTeam
export function isEveryoneTarget(target: ShareTarget): target is ShareTargetEveryone
export function matchesShareTarget(target: ShareTarget, context: ViewerContext): boolean
export function matchesAnyShareTarget(targets: ShareTarget[], context: ViewerContext): boolean
export function isSharedWith(targets: ShareTarget[], context: ViewerContext): boolean

// Field enrichment
export interface FieldEnrichment
export interface EnrichedFieldMetadata
export function createFieldEnrichment(overrides?: Partial<FieldEnrichment>): FieldEnrichment
export function mergeFieldMetadata(base: ColumnDescriptor, enrichment: FieldEnrichment): EnrichedFieldMetadata

// Filter value handling
export type FilterValueSource
export type FilterValueTransform
export interface FilterDefault
export interface FilterValueHandling
export function createDefaultFilterValueHandling(): FilterValueHandling
export function resolveStaticDefault(handling: FilterValueHandling): unknown

// Filter value match rules
export type MatchOperator
export type ExpressionFunction
export interface FilterValueMatchRule
export function applyExpression(fn: ExpressionFunction, value: unknown, params: unknown[]): unknown
export function evaluateMatchRule(rule: FilterValueMatchRule, value: unknown): boolean

// Personal alerts
export type AlertSeverity
export type AlertNotificationChannel
export interface AlertGracePeriodConfig
export interface PersonalAlertPreference
export interface PersonalAlertSummary
export interface PersonalAlert
export function createEmptyAlertSummary(): PersonalAlertSummary
export function createDefaultGracePeriodConfig(): AlertGracePeriodConfig
export function isGracePeriodValid(config: AlertGracePeriodConfig): boolean
export function clampGracePeriod(config: AlertGracePeriodConfig): AlertGracePeriodConfig

// Async report
export type AsyncReportStatus
export interface AsyncReportJob
export interface AsyncReportRequest
export function isTerminalStatus(status: AsyncReportStatus): boolean
export function createAsyncReportJob(request: AsyncReportRequest): AsyncReportJob
export function isAsyncReportExpired(job: AsyncReportJob): boolean
export function hasAsyncSupport(adapter: DataAdapter): boolean

// Subscriptions
export type SubscriptionFrequency
export type SubscriptionFormat
export interface SubscriptionSchedule
export interface ReportSubscription
export interface Subscription
export function createSubscription(overrides?: Partial<Subscription>): Subscription
export function describeSchedule(schedule: SubscriptionSchedule): string
export function buildSubscriptionDeepLink(sub: Subscription): string

// Error states
export type ErrorSeverity
export type ErrorScenario
export interface ErrorDetails
export interface ErrorState
export type ErrorRecoveryAction
export interface ErrorStateConfig
export function createErrorState(scenario: ErrorScenario, message: string): ErrorState
export function isRetryableError(state: ErrorState): boolean
export function createDefaultErrorStateConfig(): ErrorStateConfig

// Empty states
export type EmptyScenario
export interface EmptyStateConfig
export type EmptyStateReason
export interface EmptyState
export function createEmptyState(scenario: EmptyScenario): EmptyState
export function createDefaultEmptyStateConfig(): EmptyStateConfig
export const DEFAULT_EMPTY_STATES: Record<EmptyScenario, EmptyState>

// Widgets
export interface WidgetPosition
export interface DashboardWidget
export type ViewSwitchingMode
export interface WidgetView
export interface WidgetViewGroup
export function getViewSwitchingMode(views: WidgetView[]): ViewSwitchingMode
export interface ExpandableWidgetConfig
export function createDefaultExpandableConfig(): ExpandableWidgetConfig
export interface ContainerBoxConfig
export function createDefaultContainerBoxConfig(): ContainerBoxConfig
export type NodeStatus
export interface DecisionTreeNode
export function evaluateNodeStatus(node: DecisionTreeNode): NodeStatus

// API spec
export type HttpMethod
export interface ApiEndpoint
export interface ApiParam
export interface ApiSchemaRef
export interface ApiSpec
export type APIRoleAccess
export interface APISpecConfig
export function createApiEndpoint(overrides?: Partial<ApiEndpoint>): ApiEndpoint

// Message pools (C-2.13)
export type MessageTone
export interface MessagePool
export const ERROR_MESSAGE_POOLS: MessagePool[]
export const EMPTY_STATE_MESSAGE_POOLS: MessagePool[]
export function getRandomMessage(scenario: string, tone: MessageTone, pools: MessagePool[]): string
export function getAllMessages(scenario: string, pools: MessagePool[]): Record<MessageTone, string[]>
export function getScenarios(pools: MessagePool[]): string[]
export function countMessages(pools: MessagePool[]): number

// Single-value alert (7A-A)
export type AlertVisualMode    // 'none' | 'indicator' | 'background' | 'border'
export type WidgetAlertSeverity    // 'healthy' | 'warning' | 'critical'
export interface SingleValueAlertConfig
export interface AlertVisualState
export type AlertContainerSize    // 'full' | 'compact' | 'minimal'
export interface DegradedAlertParams
export interface AlertTokenSet
export function resolveAlertVisualState(config: SingleValueAlertConfig, alertEvents: Map<string, WidgetAlertSeverity>): AlertVisualState
export function getAlertTokens(severity: WidgetAlertSeverity, mode: AlertVisualMode): AlertTokenSet
export function degradeAlertMode(mode: AlertVisualMode, containerSize: AlertContainerSize): DegradedAlertParams
export function createDefaultAlertConfig(): SingleValueAlertConfig

// Micro-widget cells (7A-B)
export type MicroWidgetDisplayMode    // 'value-only' | 'sparkline' | 'delta' | 'gauge-arc'
export type MicroWidgetType    // 'trend-line' | 'gauge' | 'kpi-card' | 'scorecard'
export interface MicroWidgetCellConfig
export interface SparklineDataBinding
export interface MicroWidgetRenderResult
export interface MicroWidgetRenderer
export interface CellRendererRegistry
export function createCellRendererRegistry(): CellRendererRegistry

// Impact chain (7A-C)
export type ImpactNodeRole    // 'root-cause' | 'failure' | 'impact' | 'hypothesis'
export type HypothesisState    // 'validated' | 'inconclusive' | 'invalidated' | 'pending'
export interface ImpactMetric
export interface ImpactChainNode    // extends DecisionTreeNode
export type ChainLayoutDirection
export interface ChainLayout
export type DecisionTreeRenderVariant
export interface DecisionTreeVariantConfig

// Attention filter (7A-D)
export type AttentionPriority    // 'critical' | 'warning' | 'info'
export type AttentionSource    // 'alert' | 'system' | 'external' | 'stale' | 'review' | 'broken-query'
export interface AttentionFacetValue
export interface AttentionFacet
export interface AttentionFilterState
export interface FilterableAttentionItem
export function filterAttentionItems(items: FilterableAttentionItem[], filters: AttentionFilterState): FilterableAttentionItem[]
export function computeAttentionFacets(items: FilterableAttentionItem[], currentFilters: AttentionFilterState): AttentionFacet[]
```

#### Filter preset value

```typescript
export interface FilterPresetValue
export function createDefaultFilterPresetValue(): FilterPresetValue
```

#### Artifact Metadata (`./artifacts`)

```typescript
export type ArtifactType
export type ArtifactVisibility
export interface VisibilityMeta
export type VisibilityGroup
export function isVisibleToViewer(meta: VisibilityMeta, context: ViewerContext): boolean
export function groupByVisibility(artifacts: VisibilityMeta[]): Map<VisibilityGroup, VisibilityMeta[]>
export function canTransition(from: ArtifactVisibility, to: ArtifactVisibility): boolean
export function transitionVisibility(meta: VisibilityMeta, to: ArtifactVisibility): VisibilityMeta
export function duplicateWithVisibility(meta: VisibilityMeta, visibility: ArtifactVisibility): VisibilityMeta

export interface DefaultPresentation
export function createDefaultPresentation(): DefaultPresentation
export function mergePresentation(admin: DefaultPresentation, preset: DefaultPresentation, session: DefaultPresentation): DefaultPresentation

export interface PersonalView
export function createPersonalView(overrides?: Partial<PersonalView>): PersonalView
export function applyPersonalView(base: DefaultPresentation, view: PersonalView): DefaultPresentation

export interface ArtifactMeta
export interface GridColumnConfig
export interface GridArtifact
export function isGridArtifact(artifact: unknown): artifact is GridArtifact
export function createGridArtifact(overrides?: Partial<GridArtifact>): GridArtifact
export function gridArtifactToMeta(artifact: GridArtifact): ArtifactMeta
```

#### Design System (`./design-system`)

```typescript
export const DESIGN_TOKENS: { headerBg: string; bgBase: string; /* ... 40+ tokens */ }

// Responsive breakpoints
export type BreakpointName    // 'desktop' | 'laptop' | 'tablet' | 'mobile'
export interface Breakpoint
export const BREAKPOINTS: Record<BreakpointName, Breakpoint>
export function getCurrentBreakpoint(width: number): BreakpointName

// Container queries
export interface ContainerQueryConfig
export function getContainerQueryCSS(config: ContainerQueryConfig): string

// Shell layout
export interface ShellLayoutConfig
export function getShellLayoutCSS(config: ShellLayoutConfig): string

// Alert tokens (7A-A)
export const ALERT_WIDGET_TOKENS: Record<string, string>
export type AlertWidgetTokenKey
export function generateAlertTokenCSS(): string
export function resolveAlertTokenVar(key: AlertWidgetTokenKey): string

// Impact chain tokens (7A-C)
export const IMPACT_CHAIN_TOKENS: Record<string, string>
export type ImpactChainTokenKey
export function generateChainTokenCSS(): string
export function resolveChainTokenVar(key: ImpactChainTokenKey): string
```

#### Runtime Coordination (`./coordination`)

```typescript
// Filter context
export type FilterOperator
export type FilterValue
export interface CrossFilterEntry
export interface FilterContextState
export type FilterUIType
export interface DashboardFilterDef
export interface FieldMapping
export function resolveFieldForSource(mapping: FieldMapping, sourceId: string): string
export interface FilterContextManager
export function createFilterContext(options?: FilterContextOptions): FilterContextManager
export function createDebouncedFilterDispatch(dispatch: Function, delay: number): DebouncedDispatch

// Dashboard data pipeline
export interface DashboardLoadingState
export interface PreloadConfig
export interface FullLoadConfig
export interface FieldMappingEntry
export type DetailTrigger
export interface DetailSourceConfig
export interface DashboardDataConfig
export interface DashboardDataPipeline
export function isDashboardDataConfig(config: unknown): config is DashboardDataConfig
export function isDetailSourceConfig(config: unknown): config is DetailSourceConfig
export interface DataSourceConfig
export function migrateLegacyDataConfig(legacy: DashboardDataConfig): DataSourceConfig[]

// Query coordinator
export interface QueryCoordinatorConfig
export const defaultQueryCoordinatorConfig: QueryCoordinatorConfig
export interface CoordinatorQuery
export interface CoordinatorResult
export interface QueryCoordinatorInstance
export function isQueryCoordinatorConfig(config: unknown): config is QueryCoordinatorConfig

// Interaction bus
export interface WidgetEvent
export interface InteractionBus
export function createInteractionBus(): InteractionBus

// Navigation events
export interface NavigationFilterMapping
export interface NavigationFilter
export interface NavigationEvent
export function resolveNavigationFilters(mappings: NavigationFilterMapping[], context: Record<string, unknown>): NavigationFilter[]
export function buildNavigationEvent(target: string, filters: NavigationFilter[]): NavigationEvent
export function emitNavigationEvent(bus: InteractionBus, event: NavigationEvent): void

// Loading state
export type LoadingPhase
export interface LoadingState
export function createInitialLoadingState(): LoadingState
export function updateLoadingProgress(state: LoadingState, phase: LoadingPhase, progress: number): LoadingState
export function isLoadingComplete(state: LoadingState): boolean
export function isLoadingError(state: LoadingState): boolean
export function isLoading(state: LoadingState): boolean
export function getLoadingDurationMs(state: LoadingState): number

// Multi-source loading (A-2.05)
export interface MultiSourceLoadingState
export function createMultiSourceLoadingState(): MultiSourceLoadingState
export function updateSourceProgress(state: MultiSourceLoadingState, sourceId: string, progress: number): MultiSourceLoadingState
export function computeOverallProgress(state: MultiSourceLoadingState): number

// Execution strategy (A-2.06)
export type ExecutionEngine
export interface ExecutionStrategyConfig
export interface ExecutionContext
export function createDefaultExecutionStrategy(): ExecutionStrategyConfig
export function selectExecutionEngine(config: ExecutionStrategyConfig, context: ExecutionContext): ExecutionEngine
export function selectEngineForFeature(config: ExecutionStrategyConfig, feature: string): ExecutionEngine

// Server mode (A-2.07)
export interface ServerGridConfig
export function createDefaultServerGridConfig(): ServerGridConfig
export function isServerMode(config: ServerGridConfig): boolean
export function hasServerCapability(config: ServerGridConfig, capability: string): boolean

// Export config (A-2.08)
export interface GridExportConfig
export function createDefaultExportConfig(): GridExportConfig
export function shouldUseAsyncExport(config: GridExportConfig, rowCount: number): boolean
export function isFormatEnabled(config: GridExportConfig, format: ExportFormat): boolean

// Filter auto-save (A-2.10)
export interface FilterAutoSaveConfig
export interface FilterStateSnapshot
export function createDefaultAutoSaveConfig(): FilterAutoSaveConfig
export function createFilterSnapshot(state: FilterContextState): FilterStateSnapshot
export function shouldAutoSave(config: FilterAutoSaveConfig, snapshot: FilterStateSnapshot): boolean
export function pruneHistory(snapshots: FilterStateSnapshot[], max: number): FilterStateSnapshot[]

// Async report UI state (C-2.01)
export interface AsyncReportUIState
export function createAsyncReportUIState(): AsyncReportUIState
export function addJob(state: AsyncReportUIState, job: AsyncReportJob): AsyncReportUIState
export function updateJobStatus(state: AsyncReportUIState, jobId: string, status: AsyncReportStatus): AsyncReportUIState
export function removeJob(state: AsyncReportUIState, jobId: string): AsyncReportUIState
export function getCompletedJobs(state: AsyncReportUIState): AsyncReportJob[]
export function getActiveJobs(state: AsyncReportUIState): AsyncReportJob[]

// Exports tab state (C-2.02)
export interface ExportEntry
export type ExportSortField
export interface ExportsTabState
export function createExportsTabState(): ExportsTabState
export function addExport(state: ExportsTabState, entry: ExportEntry): ExportsTabState
export function updateExport(state: ExportsTabState, id: string, updates: Partial<ExportEntry>): ExportsTabState
export function removeExport(state: ExportsTabState, id: string): ExportsTabState
export function setSort(state: ExportsTabState, field: ExportSortField): ExportsTabState
export function setFilterStatus(state: ExportsTabState, status: string | null): ExportsTabState
export function getVisibleExports(state: ExportsTabState): ExportEntry[]

// Subscriptions tab state (C-2.06)
export type SubscriptionTabFilter
export interface SubscriptionsTabState
export function createSubscriptionsTabState(): SubscriptionsTabState
export function setSubscriptions(state: SubscriptionsTabState, subs: Subscription[]): SubscriptionsTabState
export function setActiveTab(state: SubscriptionsTabState, tab: string): SubscriptionsTabState
export function setSearchQuery(state: SubscriptionsTabState, query: string): SubscriptionsTabState
export function setCreateDialogOpen(state: SubscriptionsTabState, open: boolean): SubscriptionsTabState
export function getFilteredSubscriptions(state: SubscriptionsTabState): Subscription[]
export function countByStatus(state: SubscriptionsTabState): Record<string, number>

// Expression builder state (C-2.10)
export type ExpressionNodeType
export interface ExpressionNode
export interface ExpressionBuilderState
export function createExpressionBuilderState(): ExpressionBuilderState
export function addNode(state: ExpressionBuilderState, parentId: string, type: ExpressionNodeType): ExpressionBuilderState
export function removeNode(state: ExpressionBuilderState, nodeId: string): ExpressionBuilderState
export function updateNode(state: ExpressionBuilderState, nodeId: string, updates: Partial<ExpressionNode>): ExpressionBuilderState
export function buildExpression(state: ExpressionBuilderState): string
export function validateBuilderExpression(state: ExpressionBuilderState): boolean

// Preview context state (C-2.11)
export interface PreviewContextState
export function createPreviewContextState(): PreviewContextState
export function enablePreview(state: PreviewContextState): PreviewContextState
export function disablePreview(state: PreviewContextState): PreviewContextState
export function selectRole(state: PreviewContextState, role: string): PreviewContextState
export function setCustomUserId(state: PreviewContextState, userId: string): PreviewContextState
export function setAvailableRoles(state: PreviewContextState, roles: string[]): PreviewContextState
export function getEffectiveContext(state: PreviewContextState): ViewerContext

// Attention faceted state (7A-D)
export type AttentionSortOrder
export interface AttentionFacetedState
export const initialAttentionFacetedState: AttentionFacetedState
export function toggleFacetValue(state: AttentionFacetedState, facet: string, value: string): AttentionFacetedState
export function clearFacet(state: AttentionFacetedState, facet: string): AttentionFacetedState
export function clearAllFilters(state: AttentionFacetedState): AttentionFacetedState
export function acknowledgeItem(state: AttentionFacetedState, itemId: string): AttentionFacetedState
export function acknowledgeAllVisible(state: AttentionFacetedState): AttentionFacetedState
export function setAttentionSort(state: AttentionFacetedState, order: AttentionSortOrder): AttentionFacetedState
export function loadMore(state: AttentionFacetedState): AttentionFacetedState
export function getVisibleItems(state: AttentionFacetedState): FilterableAttentionItem[]
```

---

### 12. @phozart/phz-viewer

**Description**: Read-only consumption shell for the analyst persona. Provides catalog, dashboard, report, explorer, and attention screens.

#### Shell State Machine

```typescript
export type ViewerScreen    // 'catalog' | 'dashboard' | 'report' | 'explorer' | 'attention'
export interface NavigationEntry
export interface ViewerShellState
export function createViewerShellState(): ViewerShellState
export function navigateTo(state: ViewerShellState, screen: ViewerScreen, artifactId?: string): ViewerShellState
export function navigateBack(state: ViewerShellState): ViewerShellState
export function navigateForward(state: ViewerShellState): ViewerShellState
export function canGoBack(state: ViewerShellState): boolean
export function canGoForward(state: ViewerShellState): boolean
export function setError(state: ViewerShellState, error: string): ViewerShellState
export function setEmpty(state: ViewerShellState, reason: string): ViewerShellState
export function setLoading(state: ViewerShellState, loading: boolean): ViewerShellState
export function setAttentionCount(state: ViewerShellState, count: number): ViewerShellState
export function setViewerContext(state: ViewerShellState, context: ViewerContext): ViewerShellState
export function setFilterContext(state: ViewerShellState, context: FilterContextState): ViewerShellState
export function setMobileLayout(state: ViewerShellState, mobile: boolean): ViewerShellState
```

#### Navigation

```typescript
export interface ViewerRoute
export function parseRoute(path: string): ViewerRoute
export function buildRoutePath(route: ViewerRoute): string
export function entryToRoute(entry: NavigationEntry): ViewerRoute
export function routeToEntry(route: ViewerRoute): NavigationEntry
export function routesEqual(a: ViewerRoute, b: ViewerRoute): boolean
export function screenForArtifactType(type: string): ViewerScreen
```

#### Configuration

```typescript
export interface ViewerFeatureFlags
export interface ViewerBranding
export interface ViewerShellConfig
export function createViewerShellConfig(overrides?: Partial<ViewerShellConfig>): ViewerShellConfig
export function createDefaultFeatureFlags(): ViewerFeatureFlags
```

#### Screen State Machines

```typescript
// Catalog
export type CatalogSortField
export type CatalogSortDirection
export interface CatalogSort
export interface CatalogState
export function createCatalogState(): CatalogState
export function setCatalogArtifacts(state: CatalogState, artifacts: ArtifactMeta[]): CatalogState
export function setSearchQuery(state: CatalogState, query: string): CatalogState
export function setTypeFilter(state: CatalogState, type: ArtifactType | null): CatalogState
export function setCatalogSort(state: CatalogState, sort: CatalogSort): CatalogState
export function setCatalogPage(state: CatalogState, page: number): CatalogState
export function toggleFavorite(state: CatalogState, artifactId: string): CatalogState
export function toggleViewMode(state: CatalogState): CatalogState
export function getCurrentPage(state: CatalogState): ArtifactMeta[]
export function getTotalPages(state: CatalogState): number

// Dashboard
export interface DashboardWidgetView
export interface DashboardViewState
export function createDashboardViewState(): DashboardViewState
export function loadDashboard(state: DashboardViewState, id: string, title: string, widgets: DashboardWidgetView[]): DashboardViewState
export function setWidgetLoading(state: DashboardViewState, widgetId: string, loading: boolean): DashboardViewState
export function setWidgetError(state: DashboardViewState, widgetId: string, error: string | null): DashboardViewState
export function applyCrossFilter(state: DashboardViewState, filter: CrossFilterEntry): DashboardViewState
export function clearCrossFilter(state: DashboardViewState, sourceWidgetId: string): DashboardViewState
export function clearAllCrossFilters(state: DashboardViewState): DashboardViewState
export function toggleFullscreen(state: DashboardViewState): DashboardViewState
export function toggleWidgetExpanded(state: DashboardViewState, widgetId: string): DashboardViewState
export function refreshDashboard(state: DashboardViewState): DashboardViewState

// Report
export interface ReportColumnView
export interface ReportSort
export interface ReportViewState
export function createReportViewState(): ReportViewState
export function loadReport(state: ReportViewState, id: string, title: string, columns: ReportColumnView[]): ReportViewState
export function setReportData(state: ReportViewState, data: unknown[], totalRows: number): ReportViewState
export function setReportSort(state: ReportViewState, sort: ReportSort): ReportViewState
export function toggleReportSort(state: ReportViewState, field: string): ReportViewState
export function setReportPage(state: ReportViewState, page: number): ReportViewState
export function setReportPageSize(state: ReportViewState, size: number): ReportViewState
export function setReportSearch(state: ReportViewState, query: string): ReportViewState
export function toggleColumnVisibility(state: ReportViewState, field: string): ReportViewState
export function setExporting(state: ReportViewState, exporting: boolean): ReportViewState
export function getReportTotalPages(state: ReportViewState): number
export function getVisibleColumns(state: ReportViewState): ReportColumnView[]

// Explorer
export type ExplorerPreviewMode
export interface ExplorerScreenState
export function createExplorerScreenState(): ExplorerScreenState
export function setDataSources(state: ExplorerScreenState, sources: string[]): ExplorerScreenState
export function selectDataSource(state: ExplorerScreenState, source: string): ExplorerScreenState
export function setFields(state: ExplorerScreenState, fields: ColumnDescriptor[]): ExplorerScreenState
export function setPreviewMode(state: ExplorerScreenState, mode: ExplorerPreviewMode): ExplorerScreenState
export function setSuggestedChartType(state: ExplorerScreenState, type: string): ExplorerScreenState
export function setFieldSearch(state: ExplorerScreenState, query: string): ExplorerScreenState
export function getExplorerSnapshot(state: ExplorerScreenState): Record<string, unknown>
export function getFilteredFields(state: ExplorerScreenState): ColumnDescriptor[]

// Attention dropdown
export interface AttentionDropdownState
export function createAttentionDropdownState(): AttentionDropdownState
export function setAttentionItems(state: AttentionDropdownState, items: AttentionItem[]): AttentionDropdownState
export function toggleAttentionDropdown(state: AttentionDropdownState): AttentionDropdownState
export function openAttentionDropdown(state: AttentionDropdownState): AttentionDropdownState
export function closeAttentionDropdown(state: AttentionDropdownState): AttentionDropdownState
export function markItemsAsRead(state: AttentionDropdownState, ids: string[]): AttentionDropdownState
export function markAllAsRead(state: AttentionDropdownState): AttentionDropdownState
export function dismissItem(state: AttentionDropdownState, id: string): AttentionDropdownState
export function setAttentionTypeFilter(state: AttentionDropdownState, type: string | null): AttentionDropdownState
export function getFilteredItems(state: AttentionDropdownState): AttentionItem[]

// Filter bar
export interface FilterBarState
export function createFilterBarState(): FilterBarState
export function setFilterDefs(state: FilterBarState, defs: DashboardFilterDef[]): FilterBarState
export function openFilter(state: FilterBarState, filterId: string): FilterBarState
export function closeFilter(state: FilterBarState): FilterBarState
export function setFilterValue(state: FilterBarState, filterId: string, value: FilterValue): FilterBarState
export function clearFilterValue(state: FilterBarState, filterId: string): FilterBarState
export function clearAllFilters(state: FilterBarState): FilterBarState
export function setPresets(state: FilterBarState, presets: FilterPreset[]): FilterBarState
export function applyPreset(state: FilterBarState, presetId: string): FilterBarState
export function toggleFilterBarCollapsed(state: FilterBarState): FilterBarState
export function getActiveFilterCount(state: FilterBarState): number
export function hasFilterValue(state: FilterBarState, filterId: string): boolean
```

#### Lit Components

```typescript
export class PhzViewerShell extends LitElement
export class PhzViewerCatalog extends LitElement
export class PhzViewerDashboard extends LitElement
export class PhzViewerReport extends LitElement
export class PhzViewerExplorer extends LitElement
export class PhzAttentionDropdown extends LitElement
export class PhzFilterBar extends LitElement
export class PhzViewerError extends LitElement
export class PhzViewerEmpty extends LitElement
```

---

### 13. @phozart/phz-editor

**Description**: Authoring shell for the author persona. Supports creating and editing dashboards, reports, explorer queries, alerts, and subscriptions.

#### Shell State Machine

```typescript
export type EditorScreen    // 'catalog' | 'dashboard-view' | 'dashboard-edit' | 'report' | 'explorer' | 'alerts'
export interface NavigationEntry
export interface EditorShellState
export function createEditorShellState(): EditorShellState
export function navigateTo(state: EditorShellState, screen: EditorScreen, artifactId?: string): EditorShellState
export function navigateBack(state: EditorShellState): EditorShellState
export function navigateForward(state: EditorShellState): EditorShellState
export function toggleEditMode(state: EditorShellState): EditorShellState
export function setEditMode(state: EditorShellState, editing: boolean): EditorShellState
export function markUnsavedChanges(state: EditorShellState): EditorShellState
export function markSaved(state: EditorShellState): EditorShellState
export function pushUndo(state: EditorShellState, snapshot: unknown): EditorShellState
export function undo(state: EditorShellState): EditorShellState
export function redo(state: EditorShellState): EditorShellState
export function setLoading(state: EditorShellState, loading: boolean): EditorShellState
export function setError(state: EditorShellState, error: string): EditorShellState
export function clearError(state: EditorShellState): EditorShellState
export function setMeasures(state: EditorShellState, measures: string[]): EditorShellState
export function toggleAutoSave(state: EditorShellState): EditorShellState
export function setAutoSaveDebounce(state: EditorShellState, ms: number): EditorShellState
export function canUndo(state: EditorShellState): boolean
export function canRedo(state: EditorShellState): boolean
export function canGoBack(state: EditorShellState): boolean
export function canGoForward(state: EditorShellState): boolean
```

#### Navigation

```typescript
export interface EditorRoute
export interface Breadcrumb
export function parseRoute(path: string): EditorRoute
export function buildRoutePath(route: EditorRoute): string
export function buildBreadcrumbs(route: EditorRoute): Breadcrumb[]
export function getScreenLabel(screen: EditorScreen): string
export function buildEditorDeepLink(screen: EditorScreen, artifactId?: string): string
```

#### Configuration

```typescript
export interface EditorFeatureFlags
export interface EditorShellConfig
export interface ConfigValidationResult
export function createEditorShellConfig(overrides?: Partial<EditorShellConfig>): EditorShellConfig
export function validateEditorConfig(config: EditorShellConfig): ConfigValidationResult
```

#### Screen State Machines

```typescript
// Catalog
export type CatalogSortField
export type CatalogSortOrder
export interface CatalogItem
export interface CatalogState
export function createCatalogState(): CatalogState
export function setCatalogItems(state: CatalogState, items: CatalogItem[]): CatalogState
export function searchCatalog(state: CatalogState, query: string): CatalogState
export function filterCatalogByType(state: CatalogState, type: ArtifactType | null): CatalogState
export function filterCatalogByVisibility(state: CatalogState, visibility: ArtifactVisibility | null): CatalogState
export function sortCatalog(state: CatalogState, field: CatalogSortField, order?: CatalogSortOrder): CatalogState
export function openCreateDialog(state: CatalogState): CatalogState
export function closeCreateDialog(state: CatalogState): CatalogState
export function setCatalogLoading(state: CatalogState, loading: boolean): CatalogState
export function setCatalogError(state: CatalogState, error: string | null): CatalogState

// Dashboard view
export interface DashboardViewState
export function createDashboardViewState(): DashboardViewState
export function setDashboardData(state: DashboardViewState, data: Record<string, unknown>): DashboardViewState
export function setPermissions(state: DashboardViewState, permissions: Record<string, boolean>): DashboardViewState
export function expandWidget(state: DashboardViewState, widgetId: string): DashboardViewState
export function collapseWidget(state: DashboardViewState): DashboardViewState
export function setDashboardViewLoading(state: DashboardViewState, loading: boolean): DashboardViewState
export function setDashboardViewError(state: DashboardViewState, error: string | null): DashboardViewState

// Dashboard edit
export interface GridLayout
export interface DragState
export interface DashboardEditState
export function createDashboardEditState(): DashboardEditState
export function addWidget(state: DashboardEditState, widget: Record<string, unknown>): DashboardEditState
export function removeWidget(state: DashboardEditState, widgetId: string): DashboardEditState
export function updateWidgetConfig(state: DashboardEditState, widgetId: string, config: Record<string, unknown>): DashboardEditState
export function moveWidget(state: DashboardEditState, widgetId: string, position: { col: number; row: number }): DashboardEditState
export function resizeWidget(state: DashboardEditState, widgetId: string, size: { colSpan: number; rowSpan: number }): DashboardEditState
export function selectWidget(state: DashboardEditState, widgetId: string): DashboardEditState
export function deselectWidget(state: DashboardEditState): DashboardEditState
export function startDrag(state: DashboardEditState, widgetId: string): DashboardEditState
export function updateDragTarget(state: DashboardEditState, target: { col: number; row: number }): DashboardEditState
export function endDrag(state: DashboardEditState): DashboardEditState
export function cancelDrag(state: DashboardEditState): DashboardEditState
export function toggleConfigPanel(state: DashboardEditState): DashboardEditState
export function toggleMeasurePalette(state: DashboardEditState): DashboardEditState
export function setGridLayout(state: DashboardEditState, layout: GridLayout): DashboardEditState
export function setDashboardTitle(state: DashboardEditState, title: string): DashboardEditState
export function setDashboardDescription(state: DashboardEditState, description: string): DashboardEditState
export function markDashboardSaved(state: DashboardEditState): DashboardEditState

// Report edit
export interface ReportColumnConfig
export interface ReportFilterConfig
export interface ReportSortConfig
export interface ReportEditState
export function createReportEditState(): ReportEditState
export function addReportColumn(state: ReportEditState, column: ReportColumnConfig): ReportEditState
export function removeReportColumn(state: ReportEditState, field: string): ReportEditState
export function updateReportColumn(state: ReportEditState, field: string, updates: Partial<ReportColumnConfig>): ReportEditState
export function reorderReportColumns(state: ReportEditState, fields: string[]): ReportEditState
export function addReportFilter(state: ReportEditState, filter: ReportFilterConfig): ReportEditState
export function removeReportFilter(state: ReportEditState, index: number): ReportEditState
export function updateReportFilter(state: ReportEditState, index: number, updates: Partial<ReportFilterConfig>): ReportEditState
export function setReportSorts(state: ReportEditState, sorts: ReportSortConfig[]): ReportEditState
export function toggleReportPreview(state: ReportEditState): ReportEditState
export function setReportPreviewData(state: ReportEditState, data: unknown[]): ReportEditState
export function clearReportPreview(state: ReportEditState): ReportEditState
export function setReportTitle(state: ReportEditState, title: string): ReportEditState
export function setReportDescription(state: ReportEditState, description: string): ReportEditState
export function setReportDataSource(state: ReportEditState, dataSourceId: string): ReportEditState
export function markReportSaved(state: ReportEditState): ReportEditState
export function setReportLoading(state: ReportEditState, loading: boolean): ReportEditState
export function setReportError(state: ReportEditState, error: string | null): ReportEditState

// Explorer
export type SaveTargetType
export interface SaveTarget
export interface ExplorerState
export function createExplorerState(): ExplorerState
export function addDimension(state: ExplorerState, field: string): ExplorerState
export function removeDimension(state: ExplorerState, field: string): ExplorerState
export function addMeasure(state: ExplorerState, field: string, aggregation: string): ExplorerState
export function removeMeasure(state: ExplorerState, field: string): ExplorerState
export function addExplorerFilter(state: ExplorerState, filter: Record<string, unknown>): ExplorerState
export function removeExplorerFilter(state: ExplorerState, index: number): ExplorerState
export function setExplorerSort(state: ExplorerState, field: string, direction: 'asc' | 'desc'): ExplorerState
export function setExplorerLimit(state: ExplorerState, limit: number): ExplorerState
export function setExplorerExecuting(state: ExplorerState, executing: boolean): ExplorerState
export function setExplorerResults(state: ExplorerState, results: unknown[]): ExplorerState
export function setSuggestedChartType(state: ExplorerState, type: string): ExplorerState
export function openSaveDialog(state: ExplorerState): ExplorerState
export function updateSaveTarget(state: ExplorerState, target: SaveTarget): ExplorerState
export function closeSaveDialog(state: ExplorerState): ExplorerState
export function setExplorerDataSource(state: ExplorerState, dataSourceId: string): ExplorerState
export function setExplorerError(state: ExplorerState, error: string | null): ExplorerState
```

#### Authoring State Machines

```typescript
// Measure palette
export interface MeasurePaletteState
export function createMeasurePaletteState(): MeasurePaletteState
export function searchMeasures(state: MeasurePaletteState, query: string): MeasurePaletteState
export function filterByCategory(state: MeasurePaletteState, category: string | null): MeasurePaletteState
export function setActiveTab(state: MeasurePaletteState, tab: string): MeasurePaletteState
export function selectPaletteItem(state: MeasurePaletteState, itemId: string): MeasurePaletteState
export function deselectPaletteItem(state: MeasurePaletteState): MeasurePaletteState
export function refreshPaletteData(state: MeasurePaletteState, items: unknown[]): MeasurePaletteState

// Config panel
export interface ValidationError
export interface FieldConstraint
export interface ConfigPanelState
export function createConfigPanelState(): ConfigPanelState
export function setConfigValue(state: ConfigPanelState, key: string, value: unknown): ConfigPanelState
export function removeConfigValue(state: ConfigPanelState, key: string): ConfigPanelState
export function setFullConfig(state: ConfigPanelState, config: Record<string, unknown>): ConfigPanelState
export function setAllowedFields(state: ConfigPanelState, fields: FieldConstraint[]): ConfigPanelState
export function validateConfig(state: ConfigPanelState): ConfigPanelState
export function isConfigValid(state: ConfigPanelState): boolean
export function setExpandedSection(state: ConfigPanelState, section: string | null): ConfigPanelState
export function setConfigPanelLoading(state: ConfigPanelState, loading: boolean): ConfigPanelState
export function markConfigSaved(state: ConfigPanelState): ConfigPanelState

// Sharing flow
export interface SharingFlowState
export function createSharingFlowState(): SharingFlowState
export function setTargetVisibility(state: SharingFlowState, visibility: ArtifactVisibility): SharingFlowState
export function addShareTarget(state: SharingFlowState, target: ShareTarget): SharingFlowState
export function removeShareTarget(state: SharingFlowState, targetId: string): SharingFlowState
export function clearShareTargets(state: SharingFlowState): SharingFlowState
export function setShareSearchQuery(state: SharingFlowState, query: string): SharingFlowState
export function setShareSearchResults(state: SharingFlowState, results: ShareTarget[]): SharingFlowState
export function setSharingSaving(state: SharingFlowState, saving: boolean): SharingFlowState
export function markSharingSaved(state: SharingFlowState): SharingFlowState
export function setSharingError(state: SharingFlowState, error: string | null): SharingFlowState
export function setCanPublish(state: SharingFlowState, canPublish: boolean): SharingFlowState
export function hasVisibilityChanged(state: SharingFlowState): boolean
export function canSaveSharing(state: SharingFlowState): boolean

// Alert & subscription
export interface AlertSubscriptionState
export function createAlertSubscriptionState(): AlertSubscriptionState
export function setAlertSubTab(state: AlertSubscriptionState, tab: string): AlertSubscriptionState
export function searchAlertsSubs(state: AlertSubscriptionState, query: string): AlertSubscriptionState
export function setAlerts(state: AlertSubscriptionState, alerts: PersonalAlert[]): AlertSubscriptionState
export function addAlert(state: AlertSubscriptionState, alert: PersonalAlert): AlertSubscriptionState
export function updateAlert(state: AlertSubscriptionState, id: string, updates: Partial<PersonalAlert>): AlertSubscriptionState
export function removeAlert(state: AlertSubscriptionState, id: string): AlertSubscriptionState
export function toggleAlertEnabled(state: AlertSubscriptionState, id: string): AlertSubscriptionState
export function setSubscriptions(state: AlertSubscriptionState, subs: Subscription[]): AlertSubscriptionState
export function addSubscription(state: AlertSubscriptionState, sub: Subscription): AlertSubscriptionState
export function updateSubscription(state: AlertSubscriptionState, id: string, updates: Partial<Subscription>): AlertSubscriptionState
export function removeSubscription(state: AlertSubscriptionState, id: string): AlertSubscriptionState
export function toggleSubscriptionEnabled(state: AlertSubscriptionState, id: string): AlertSubscriptionState
export function openCreateAlert(state: AlertSubscriptionState): AlertSubscriptionState
export function closeCreateAlert(state: AlertSubscriptionState): AlertSubscriptionState
export function openCreateSubscription(state: AlertSubscriptionState): AlertSubscriptionState
export function closeCreateSubscription(state: AlertSubscriptionState): AlertSubscriptionState
export function startEditingAlert(state: AlertSubscriptionState, alertId: string): AlertSubscriptionState
export function startEditingSubscription(state: AlertSubscriptionState, subId: string): AlertSubscriptionState
export function cancelEditing(state: AlertSubscriptionState): AlertSubscriptionState
export function setAlertSubLoading(state: AlertSubscriptionState, loading: boolean): AlertSubscriptionState
export function setAlertSubError(state: AlertSubscriptionState, error: string | null): AlertSubscriptionState
```

#### Lit Components

```typescript
export class PhzEditorShell extends LitElement
export class PhzEditorCatalog extends LitElement
export class PhzEditorDashboard extends LitElement
export class PhzEditorReport extends LitElement
export class PhzEditorExplorer extends LitElement
export class PhzMeasurePalette extends LitElement
export class PhzConfigPanel extends LitElement
export class PhzSharingFlow extends LitElement
export class PhzAlertSubscription extends LitElement
```

---

### 14. @phozart/phz-engine (v15 Additions)

**Description**: New subsystems added to the BI engine in v15.

#### Personal Alert Engine (C-2.03)

```typescript
export interface AlertEvaluationResult
export function evaluateAlert(alert: PersonalAlert, values: Map<string, number>): AlertEvaluationResult
export function evaluateAlertBatch(alerts: PersonalAlert[], values: Map<string, number>): AlertEvaluationResult[]
export function isWithinGracePeriod(alert: PersonalAlert, config: AlertGracePeriodConfig): boolean
```

#### Alert Evaluation Contract (C-2.04)

```typescript
export interface AlertEvaluationContract
export function createInMemoryAlertContract(): AlertEvaluationContract
```

#### Subscription Engine (C-2.05)

```typescript
export interface SubscriptionEngineState
export function createSubscriptionEngineState(overrides?: Partial<SubscriptionEngineState>): SubscriptionEngineState
export function addSubscription(state: SubscriptionEngineState, sub: Subscription): SubscriptionEngineState
export function updateSubscription(state: SubscriptionEngineState, id: string, updates: Partial<Subscription>): SubscriptionEngineState
export function removeSubscription(state: SubscriptionEngineState, id: string): SubscriptionEngineState
export function getNextScheduledRun(schedule: SubscriptionSchedule, now?: Date): Date
export function isDueForExecution(sub: Subscription, now?: Date): boolean
```

#### Usage Collector (C-2.08)

```typescript
export interface BufferedEvent
export interface UsageCollectorState
export interface UsageCollectorConfig
export function createUsageCollector(config?: UsageCollectorConfig): UsageCollectorState
export function trackEvent(state: UsageCollectorState, type: string, data?: Record<string, unknown>): UsageCollectorState
export function shouldFlush(state: UsageCollectorState): boolean
export function flush(state: UsageCollectorState): { flushed: UsageCollectorState; events: BufferedEvent[] }
export function setCollecting(state: UsageCollectorState, collecting: boolean): UsageCollectorState
export function getBufferedCount(state: UsageCollectorState): number
```

#### OpenAPI Generator (C-2.09)

```typescript
export interface OpenAPIDocument
export function generateOpenAPISpec(spec: ApiSpec, config?: APISpecConfig): OpenAPIDocument
```

#### Attention System (C-2.12)

```typescript
export interface AttentionSystemState
export function createAttentionSystemState(overrides?: Partial<AttentionSystemState>): AttentionSystemState
export function addItems(state: AttentionSystemState, items: AttentionItem[]): AttentionSystemState
export function markRead(state: AttentionSystemState, itemIds: string[]): AttentionSystemState
export function markAllRead(state: AttentionSystemState): AttentionSystemState
export function dismissItem(state: AttentionSystemState, itemId: string): AttentionSystemState
export function filterByCategory(state: AttentionSystemState, category: string | null): AttentionItem[]
export function getUnreadItems(state: AttentionSystemState): AttentionItem[]
export function filterBySeverity(state: AttentionSystemState, severity: string): AttentionItem[]
```

---

### 15. @phozart/phz-workspace (v15 Additions — Wave 5)

**Description**: New authoring, governance, and shell state machines added to workspace in v15.

#### Catalog

```typescript
export type DenseSortField
export interface DenseSortConfig
export type InlineAction
export type BulkAction
export interface CatalogDenseState
export function initialCatalogDenseState(): CatalogDenseState
```

#### Authoring

```typescript
// Creation wizard
export type WizardStep
export interface TemplateOption
export interface CreationWizardState
export interface CreationWizardResult
export interface QuickCreatePreset

// Wide report
export interface WideColumnConfig
export interface ColumnGroup
export interface WideReportState
export function initialWideReportState(columns?: WideColumnConfig[], groups?: ColumnGroup[]): WideReportState

// Freeform grid
export interface FreeformGridConfig
export interface WidgetPlacement
export type ResizeHandle
export interface ResizeOperation
export interface FreeformGridState

// Data config panel
export interface DataConfigPanelState

// Publish workflow
export type PublishPhase
export interface ValidationCheck
export interface PublishVersion
export interface PublishWorkflowState
export const DEFAULT_CHECKS: Omit<ValidationCheck, 'status'>[]
```

#### Filters

```typescript
export interface FilterAdminState
export interface FilterValueAdminState
```

#### Alerts

```typescript
export interface AlertAdminState
```

#### Data Source

```typescript
export interface EnrichmentAdminState
```

#### Shell

```typescript
// Command palette
export type ActionCategory
export interface CommandAction
export interface CommandResult
export interface CommandPaletteState
export function initialCommandPaletteState(actions?: CommandAction[]): CommandPaletteState

// Keyboard shortcuts
export interface KeyboardShortcutsState
```

#### Governance

```typescript
export interface SettingsState
export interface NavigationConfigState
export interface ApiAccessState
```

---

## Reconciliation Notes

This section documents where the Data Model (DATA-MODEL.md) and API Contracts (API-CONTRACTS.md) diverged, and how conflicts were resolved.

### 1. RowId Type

- **DATA-MODEL.md**: `type RowId = string | number`
- **API-CONTRACTS.md**: `type RowId = string`
- **RESOLUTION**: `type RowId = string | number` (prioritize flexibility)
- **RATIONALE**: Users may have numeric IDs in their source data. Supporting both avoids forcing a toString() conversion at the boundary.

### 2. Generic vs Simplified Types

- **DATA-MODEL.md**: Uses full generics everywhere: `GridConfig<TData>`, `GridState<TData>`, `RowData<TData>`
- **API-CONTRACTS.md**: Simplified public APIs: `data: unknown[]`, `createGrid(config: GridConfig)`
- **RESOLUTION**:
  - Core types exported WITH generics for advanced users: `export interface GridConfig<TData = any>`
  - Factory functions use simplified signatures: `export function createGrid<TData = any>(config: GridConfig<TData>): GridApi<TData>`
  - Default generic parameter `TData = any` allows both approaches
- **RATIONALE**: Advanced TypeScript users can opt into full type safety with generics. Casual users can use `any` defaults without friction.

### 3. Event Handler Signatures

- **DATA-MODEL.md**: Events are typed with full generic context: `StateChangeEvent<TData>`
- **API-CONTRACTS.md**: Events simplified: `StateChangeEvent` (no generic)
- **RESOLUTION**: Keep generics in type definitions, but make them optional:
  ```typescript
  export interface StateChangeEvent<TData = any> extends GridEvent {
    readonly type: 'stateChange';
    readonly delta: StateChangeDelta<TData>;
    readonly oldState: GridState<TData>;
    readonly newState: GridState<TData>;
  }
  ```
- **RATIONALE**: Default `TData = any` allows omitting the generic in most use cases while preserving type safety when needed.

### 4. CellValue Type

- **DATA-MODEL.md**: `type CellValue = string | number | boolean | Date | null | undefined`
- **API-CONTRACTS.md**: Not explicitly defined, uses `unknown` in many places
- **RESOLUTION**: Export both:
  ```typescript
  export type CellValue = string | number | boolean | Date | null | undefined
  ```
  But allow `unknown` in function parameters for flexibility.
- **RATIONALE**: CellValue is a helpful constraint for internal logic, but forcing it at API boundaries is too restrictive.

### 5. Plugin Hooks Return Types

- **DATA-MODEL.md**: Hooks return `GridConfig | false`, `StateChangeDelta | false` (false = cancel)
- **API-CONTRACTS.md**: Hooks return `GridConfig | void`, `boolean` (boolean = cancel)
- **RESOLUTION**: Standardize on `T | false` where T is the modified value:
  ```typescript
  beforeDataChange?(data: unknown[]): unknown[] | false
  beforeSort?(state: SortState): SortState | false
  ```
- **RATIONALE**: Returning false is more explicit than void for "cancel this operation."

### 6. Event Names

- **DATA-MODEL.md**: Uses colon separators: `'grid:ready'`, `'cell:click'`
- **API-CONTRACTS.md**: Uses hyphen separators for DOM events: `'grid-ready'`, `'cell-click'`
- **RESOLUTION**:
  - Internal event system (@phozart/phz-core): Use colon: `'grid:ready'`
  - DOM custom events (@phozart/phz-grid): Use hyphen: `'grid-ready'`
- **RATIONALE**: Colons are idiomatic for EventEmitter-style APIs. Hyphens are standard for DOM custom events.

### 7. FilterOperator Type

- **DATA-MODEL.md**: Full set including regex: `'equals' | 'notEquals' | 'contains' | ... | 'isEmpty' | 'isNotEmpty'`
- **API-CONTRACTS.md**: Simpler set with symbols: `'=' | '!=' | '>' | ... | 'in' | 'isNull'`
- **RESOLUTION**: Use DATA-MODEL.md's full set of named operators:
  ```typescript
  export type FilterOperator =
    | 'equals' | 'notEquals'
    | 'contains' | 'notContains'
    | 'startsWith' | 'endsWith'
    | 'lessThan' | 'lessThanOrEqual'
    | 'greaterThan' | 'greaterThanOrEqual'
    | 'between' | 'in' | 'notIn'
    | 'isNull' | 'isNotNull'
    | 'isEmpty' | 'isNotEmpty'
  ```
- **RATIONALE**: Named operators are more self-documenting and avoid confusion with comparison operators.

---

## Cross-Package Type Dependencies

This diagram shows which packages import types from which packages. All arrows point FROM dependent TO dependency.

```
@phozart/phz-shared (Foundation — adapters, types, design system, coordination)
    ↑
    ├─ @phozart/phz-core
    │   ↑
    │   ├─ @phozart/phz-grid
    │   │   ↑
    │   │   ├─ @phozart/phz-react
    │   │   ├─ @phozart/phz-vue
    │   │   └─ @phozart/phz-angular
    │   │
    │   ├─ @phozart/phz-duckdb
    │   ├─ @phozart/phz-ai
    │   └─ @phozart/phz-collab
    │
    ├─ @phozart/phz-engine (also depends on core)
    │   ↑
    │   └─ @phozart/phz-widgets
    │
    ├─ @phozart/phz-workspace (also depends on core, engine, criteria, definitions)
    │
    ├─ @phozart/phz-viewer (read-only shell)
    │
    └─ @phozart/phz-editor (authoring shell)

@phozart/phz-definitions (no internal deps)
@phozart/phz-python (JavaScript bundle includes core + grid)
```

### Dependency Rules

1. **@phozart/phz-shared** has ZERO internal dependencies (foundation package)
2. **@phozart/phz-core** depends on @phozart/phz-shared and @phozart/phz-definitions
3. **@phozart/phz-grid** depends ONLY on @phozart/phz-core
4. **Framework adapters** (@phozart/phz-react, @phozart/phz-vue, @phozart/phz-angular) depend on @phozart/phz-core AND @phozart/phz-grid
5. **Extension packages** (@phozart/phz-duckdb, @phozart/phz-ai, @phozart/phz-collab) depend ONLY on @phozart/phz-core
6. **@phozart/phz-engine** depends on @phozart/phz-core AND @phozart/phz-shared
7. **@phozart/phz-viewer** depends ONLY on @phozart/phz-shared (no workspace dependency)
8. **@phozart/phz-editor** depends ONLY on @phozart/phz-shared (no workspace dependency)
9. **@phozart/phz-workspace** depends on @phozart/phz-shared, core, engine, criteria, definitions
10. **@phozart/phz-python** bundles @phozart/phz-core + @phozart/phz-grid (no direct TypeScript imports)

### Re-export Strategy

- All packages re-export `@phozart/phz-core` types via `export * from '@phozart/phz-core'`
- This allows consumers to import types from any package without worrying about the source:
  ```typescript
  // All valid:
  import { GridApi, ColumnDefinition } from '@phozart/phz-core'
  import { GridApi, ColumnDefinition } from '@phozart/phz-grid'
  import { GridApi, ColumnDefinition } from '@phozart/phz-react'
  ```
- This simplifies imports and prevents "imported from two different modules" TypeScript errors

---

## Type Contract Governance

### Change Process

1. **All type changes MUST be proposed to the solution-architect**
   - Open an issue with title: `[TYPE-CONTRACT] Change Request: <description>`
   - Include rationale, affected packages, and migration plan

2. **Type changes are categorized by impact:**
   - **MAJOR (breaking)**: Removing exports, changing signatures, removing optional properties
   - **MINOR (non-breaking)**: Adding exports, adding optional properties, widening types
   - **PATCH (internal)**: Renaming internal types (not exported), fixing comments

3. **Breaking changes require:**
   - Semver MAJOR version bump (e.g., 1.0.0 → 2.0.0)
   - Migration guide in `docs/migrations/`
   - Deprecation warnings for 2 major versions before removal
   - Example:
     ```typescript
     /** @deprecated Use newMethod() instead. Will be removed in v3.0.0 */
     export function oldMethod(): void
     ```

4. **Non-breaking changes require:**
   - Semver MINOR version bump (e.g., 1.0.0 → 1.1.0)
   - Update to CHANGELOG.md
   - Update to this TYPE-CONTRACTS.md document
   - Re-generate API docs

### Deprecation Policy

1. Mark deprecated exports with `@deprecated` JSDoc tag
2. Console warnings MUST appear for 2 major versions
3. Removal ONLY in major version releases
4. Provide migration path in deprecation message

Example:
```typescript
/**
 * @deprecated since v2.0.0, use `createGrid()` instead.
 * Will be removed in v4.0.0.
 *
 * Migration:
 * ```typescript
 * // Before
 * const grid = new Grid(config)
 *
 * // After
 * const grid = createGrid(config)
 * ```
 */
export class Grid { ... }
```

### Versioning Strategy

All packages follow **strict semantic versioning**:

- **MAJOR**: Breaking type changes, removed exports
- **MINOR**: New exports, new optional properties
- **PATCH**: Bug fixes, internal refactors, comment updates

### Type Compatibility Matrix

| Version | @phozart/phz-core | @phozart/phz-grid | @phozart/phz-react | @phozart/phz-vue | @phozart/phz-angular | @phozart/phz-duckdb | @phozart/phz-ai | @phozart/phz-collab |
|---------|---------------|---------------|----------------|--------------|------------------|-----------------|-------------|-----------------|
| 1.0.0   | 1.0.0         | 1.0.0         | 1.0.0          | 1.0.0        | 1.0.0            | 1.0.0           | 1.0.0       | 1.0.0           |

All packages MUST stay in sync for major and minor versions. Patches can diverge.

### Review Process

1. **Type changes reviewed by**: solution-architect + data-architect
2. **Review SLA**: 2 business days
3. **Approval required before merge**
4. **CI checks**:
   - `npm run typecheck` passes
   - `npm run build` produces valid .d.ts files
   - `npm run test:types` passes (type-only tests)
   - API docs generation succeeds

---

## Document Metadata

**Generated**: 2026-02-24
**Version**: 1.1
**Owner**: Solution Architect
**Reviewers**: Data Architect, API Architect
**Status**: BINDING — Ready for Implementation
**Last Updated**: 2026-03-08
**Next Review**: On any contract change request

**Changelog**:
- v1.1 (2026-03-08): Added @phozart/phz-shared (#11), @phozart/phz-viewer (#12), @phozart/phz-editor (#13), engine v15 additions (#14), workspace Wave 5 additions (#15)
- v1.0 (2026-02-24): Initial type contracts (packages #1-#10)

---

**END OF TYPE CONTRACTS**
