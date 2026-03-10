# API Contracts v1.0

**Generated**: 2026-02-24
**Project**: phz-grid
**Status**: BINDING CONTRACT — DO NOT MODIFY without solution-architect approval

---

## Table of Contents

1. [@phozart/phz-core](#1-phozartcore) — MIT
2. [@phozart/phz-grid](#2-phozartgrid) — MIT
3. [@phozart/phz-react](#3-phozartreact) — MIT
4. [@phozart/phz-vue](#4-phozartvue) — MIT
5. [@phozart/phz-angular](#5-phozartangular) — MIT
6. [@phozart/phz-duckdb](#6-phozartduckdb) — MIT
7. [@phozart/phz-ai](#7-phozartai) — MIT
8. [@phozart/phz-collab](#8-phozartcollab) — MIT
9. [@phozart/phz-docs](#9-phozartdocs) — Internal (Documentation Site)
10. [@phozart/phz-shared](#10-phozartphz-shared) — MIT (v15)
11. [@phozart/phz-viewer](#11-phozartphz-viewer) — MIT (v15)
12. [@phozart/phz-editor](#12-phozartphz-editor) — MIT (v15)
13. [@phozart/phz-engine (v15 Additions)](#13-phozartphz-engine-v15-additions) — MIT
14. [@phozart/phz-widgets (v15 Additions)](#14-phozartphz-widgets-v15-additions) — MIT
15. [@phozart/phz-grid (v15 Additions)](#15-phozartphz-grid-v15-additions) — MIT

---

## 1. @phozart/phz-core

**Description**: Headless grid engine with zero DOM dependencies. Foundation for all rendering layers.
**Dependencies**: None

### Exports

#### Factory Function

```typescript
export function createGrid(config: GridConfig): GridInstance;
```

### Core Interfaces

```typescript
export interface GridConfig {
  data: unknown[];
  columns?: ColumnDefinition[];
  rowIdField?: string; // Default: auto-generated UUID
  initialState?: Partial<GridState>;
  plugins?: Plugin[];
  enableVirtualization?: boolean; // Default: true
  enableSelection?: boolean; // Default: true
  enableEditing?: boolean; // Default: false
  enableSorting?: boolean; // Default: true
  enableFiltering?: boolean; // Default: true
}

export interface ColumnDefinition {
  field: string;
  header?: string;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'custom';
  width?: number; // pixels or flex
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean; // Default: true
  filterable?: boolean; // Default: true
  editable?: boolean; // Default: false
  resizable?: boolean; // Default: true
  frozen?: 'left' | 'right' | null;
  priority?: 1 | 2 | 3; // Responsive priority (1=highest)
  sortComparator?: (a: unknown, b: unknown) => number;
  valueGetter?: (row: RowData) => unknown;
  valueSetter?: (row: RowData, value: unknown) => RowData;
  validator?: (value: unknown) => boolean | Promise<boolean>;
  editor?: CellEditorType;
  renderer?: CellRendererType;
}

export type CellEditorType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'custom';
export type CellRendererType = 'text' | 'number' | 'date' | 'boolean' | 'custom';

export type RowId = string;

export interface RowData {
  __id: RowId; // Internal stable ID
  [key: string]: unknown;
}

export interface GridState {
  sort: SortState;
  filter: FilterState;
  selection: SelectionState;
  edit: EditState;
  columns: ColumnState;
  viewport: ViewportState;
  grouping: GroupingState;
}

export interface SortState {
  columns: Array<{ field: string; direction: 'asc' | 'desc' }>;
}

export interface FilterState {
  filters: Array<{ field: string; operator: FilterOperator; value: unknown }>;
  presets: Record<string, FilterPreset>;
  activePreset?: string;
}

export type FilterOperator =
  | '=' | '!=' | '>' | '>=' | '<' | '<='
  | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'notIn' | 'between' | 'isNull' | 'isNotNull';

export interface FilterPreset {
  name: string;
  filters: Array<{ field: string; operator: FilterOperator; value: unknown }>;
}

export interface SelectionState {
  mode: 'none' | 'single' | 'multi' | 'range';
  selectedRows: Set<RowId>;
  selectedCells: Set<CellPosition>;
  anchorCell?: CellPosition;
}

export interface CellPosition {
  rowId: RowId;
  field: string;
}

export interface EditState {
  activeCell?: CellPosition;
  editingCells: Map<string, unknown>; // cellKey -> value
  dirtyRows: Set<RowId>;
}

export interface ColumnState {
  order: string[]; // Array of field names
  widths: Record<string, number>;
  visibility: Record<string, boolean>;
}

export interface ViewportState {
  scrollTop: number;
  scrollLeft: number;
  visibleRowRange: [number, number];
  visibleColumnRange: [number, number];
}

export interface GroupingState {
  groupBy: string[];
  expandedGroups: Set<string>;
}

export interface SerializedGridState {
  version: string;
  sort: SortState;
  filter: FilterState;
  selection: { selectedRows: RowId[]; selectedCells: CellPosition[] };
  columns: ColumnState;
  grouping: GroupingState;
}
```

### GridInstance API

```typescript
export interface GridInstance {
  // Data Operations
  getData(): ReadonlyArray<RowData>;
  setData(data: unknown[]): void;
  updateRow(id: RowId, data: Partial<Record<string, unknown>>): void;
  updateRows(updates: Array<{ id: RowId; data: Partial<Record<string, unknown>> }>): void;
  deleteRow(id: RowId): void;
  deleteRows(ids: RowId[]): void;
  addRow(data: Record<string, unknown>, position?: number): RowId;
  addRows(data: Array<Record<string, unknown>>, position?: number): RowId[];

  // State Management
  getState(): Readonly<GridState>;
  exportState(): SerializedGridState;
  importState(state: SerializedGridState): void;

  // Sorting
  sort(field: string, direction: 'asc' | 'desc' | null): void;
  multiSort(sorts: Array<{ field: string; direction: 'asc' | 'desc' }>): void;
  clearSort(): void;
  getSortState(): SortState;

  // Filtering
  filter(field: string, operator: FilterOperator, value: unknown): void;
  addFilter(field: string, operator: FilterOperator, value: unknown): void;
  removeFilter(field: string): void;
  clearFilters(): void;
  getFilterState(): FilterState;
  saveFilterPreset(name: string): void;
  loadFilterPreset(name: string): void;
  deleteFilterPreset(name: string): void;

  // Selection
  select(rowIds: RowId | RowId[]): void;
  deselect(rowIds: RowId | RowId[]): void;
  selectAll(): void;
  deselectAll(): void;
  getSelection(): { rows: RowId[]; cells: CellPosition[] };
  selectRange(start: CellPosition, end: CellPosition): void;
  selectRow(id: RowId): void;
  selectRows(ids: RowId[]): void;

  // Editing
  startEdit(position: CellPosition): void;
  commitEdit(position: CellPosition, value: unknown): Promise<boolean>;
  cancelEdit(position: CellPosition): void;
  getEditState(): EditState;
  isDirty(): boolean;
  getDirtyRows(): RowId[];

  // Column Management
  setColumnOrder(fields: string[]): void;
  setColumnWidth(field: string, width: number): void;
  setColumnVisibility(field: string, visible: boolean): void;
  getColumnState(): ColumnState;
  resetColumns(): void;

  // Grouping
  groupBy(fields: string | string[]): void;
  ungroupBy(fields?: string | string[]): void;
  expandGroup(groupKey: string): void;
  collapseGroup(groupKey: string): void;
  expandAllGroups(): void;
  collapseAllGroups(): void;

  // Row Model Pipeline
  getCoreRowModel(): RowModel;
  getFilteredRowModel(): RowModel;
  getSortedRowModel(): RowModel;
  getGroupedRowModel(): RowModel;
  getFlattenedRowModel(): RowModel;
  getVirtualRowModel(config?: VirtualizerConfig): RowModel;

  // Viewport Control
  scrollToRow(id: RowId, options?: ScrollOptions): void;
  scrollToColumn(field: string, options?: ScrollOptions): void;
  scrollToCell(position: CellPosition, options?: ScrollOptions): void;

  // Event System
  on<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
  once<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): Unsubscribe;
  off<K extends keyof GridEventMap>(event: K, handler: GridEventHandler<K>): void;

  // Plugin System
  registerPlugin(plugin: Plugin): void;
  unregisterPlugin(id: string): void;
  getPlugin(id: string): Plugin | undefined;

  // Lifecycle
  destroy(): void;
}

export interface RowModel {
  rows: RowData[];
  rowsById: Map<RowId, RowData>;
  flatRows: RowData[];
  rowCount: number;
}

export interface VirtualizerConfig {
  overscan?: number; // Default: 5
  estimateRowHeight?: (index: number) => number;
  enableDynamicRowHeight?: boolean; // Default: false
  enableColumnVirtualization?: boolean; // Default: false
}

export interface ScrollOptions {
  behavior?: 'auto' | 'smooth';
  block?: 'start' | 'center' | 'end';
  inline?: 'start' | 'center' | 'end';
}

export type Unsubscribe = () => void;
```

### Event System

```typescript
export interface GridEventMap {
  // Lifecycle
  'grid:ready': GridReadyEvent;
  'grid:destroy': GridDestroyEvent;

  // Data
  'data:change': DataChangeEvent;
  'row:add': RowAddEvent;
  'row:update': RowUpdateEvent;
  'row:delete': RowDeleteEvent;

  // State
  'state:change': StateChangeEvent;

  // Sort
  'sort:change': SortChangeEvent;
  'sort:clear': SortClearEvent;

  // Filter
  'filter:change': FilterChangeEvent;
  'filter:clear': FilterClearEvent;
  'filter:preset:save': FilterPresetSaveEvent;
  'filter:preset:load': FilterPresetLoadEvent;

  // Selection
  'selection:change': SelectionChangeEvent;
  'row:select': RowSelectEvent;
  'row:deselect': RowDeselectEvent;
  'cell:select': CellSelectEvent;

  // Editing
  'edit:start': EditStartEvent;
  'edit:commit': EditCommitEvent;
  'edit:cancel': EditCancelEvent;
  'edit:validation:error': EditValidationErrorEvent;

  // Columns
  'column:resize': ColumnResizeEvent;
  'column:reorder': ColumnReorderEvent;
  'column:visibility:change': ColumnVisibilityChangeEvent;

  // Viewport
  'viewport:scroll': ViewportScrollEvent;
  'viewport:change': ViewportChangeEvent;

  // Grouping
  'group:expand': GroupExpandEvent;
  'group:collapse': GroupCollapseEvent;

  // Interaction
  'cell:click': CellClickEvent;
  'cell:dblclick': CellDoubleClickEvent;
  'row:click': RowClickEvent;
  'row:dblclick': RowDoubleClickEvent;
}

export type GridEventHandler<K extends keyof GridEventMap> = (event: GridEventMap[K]) => void | boolean;

export interface BaseGridEvent {
  type: string;
  timestamp: number;
}

export interface GridReadyEvent extends BaseGridEvent {
  type: 'grid:ready';
  rowCount: number;
  columnCount: number;
}

export interface GridDestroyEvent extends BaseGridEvent {
  type: 'grid:destroy';
}

export interface DataChangeEvent extends BaseGridEvent {
  type: 'data:change';
  rowCount: number;
}

export interface RowAddEvent extends BaseGridEvent {
  type: 'row:add';
  rowId: RowId;
  data: RowData;
  position: number;
}

export interface RowUpdateEvent extends BaseGridEvent {
  type: 'row:update';
  rowId: RowId;
  changes: Partial<Record<string, unknown>>;
  oldData: RowData;
  newData: RowData;
}

export interface RowDeleteEvent extends BaseGridEvent {
  type: 'row:delete';
  rowId: RowId;
  data: RowData;
}

export interface StateChangeEvent extends BaseGridEvent {
  type: 'state:change';
  delta: Partial<GridState>;
}

export interface SortChangeEvent extends BaseGridEvent {
  type: 'sort:change';
  sort: SortState;
}

export interface SortClearEvent extends BaseGridEvent {
  type: 'sort:clear';
}

export interface FilterChangeEvent extends BaseGridEvent {
  type: 'filter:change';
  filter: FilterState;
}

export interface FilterClearEvent extends BaseGridEvent {
  type: 'filter:clear';
}

export interface FilterPresetSaveEvent extends BaseGridEvent {
  type: 'filter:preset:save';
  presetName: string;
  preset: FilterPreset;
}

export interface FilterPresetLoadEvent extends BaseGridEvent {
  type: 'filter:preset:load';
  presetName: string;
  preset: FilterPreset;
}

export interface SelectionChangeEvent extends BaseGridEvent {
  type: 'selection:change';
  selectedRows: RowId[];
  selectedCells: CellPosition[];
  delta: {
    addedRows: RowId[];
    removedRows: RowId[];
    addedCells: CellPosition[];
    removedCells: CellPosition[];
  };
}

export interface RowSelectEvent extends BaseGridEvent {
  type: 'row:select';
  rowId: RowId;
}

export interface RowDeselectEvent extends BaseGridEvent {
  type: 'row:deselect';
  rowId: RowId;
}

export interface CellSelectEvent extends BaseGridEvent {
  type: 'cell:select';
  position: CellPosition;
}

export interface EditStartEvent extends BaseGridEvent {
  type: 'edit:start';
  position: CellPosition;
  currentValue: unknown;
}

export interface EditCommitEvent extends BaseGridEvent {
  type: 'edit:commit';
  position: CellPosition;
  oldValue: unknown;
  newValue: unknown;
}

export interface EditCancelEvent extends BaseGridEvent {
  type: 'edit:cancel';
  position: CellPosition;
}

export interface EditValidationErrorEvent extends BaseGridEvent {
  type: 'edit:validation:error';
  position: CellPosition;
  value: unknown;
  error: string;
}

export interface ColumnResizeEvent extends BaseGridEvent {
  type: 'column:resize';
  field: string;
  oldWidth: number;
  newWidth: number;
}

export interface ColumnReorderEvent extends BaseGridEvent {
  type: 'column:reorder';
  field: string;
  oldIndex: number;
  newIndex: number;
}

export interface ColumnVisibilityChangeEvent extends BaseGridEvent {
  type: 'column:visibility:change';
  field: string;
  visible: boolean;
}

export interface ViewportScrollEvent extends BaseGridEvent {
  type: 'viewport:scroll';
  scrollTop: number;
  scrollLeft: number;
}

export interface ViewportChangeEvent extends BaseGridEvent {
  type: 'viewport:change';
  visibleRowRange: [number, number];
  visibleColumnRange: [number, number];
}

export interface GroupExpandEvent extends BaseGridEvent {
  type: 'group:expand';
  groupKey: string;
}

export interface GroupCollapseEvent extends BaseGridEvent {
  type: 'group:collapse';
  groupKey: string;
}

export interface CellClickEvent extends BaseGridEvent {
  type: 'cell:click';
  position: CellPosition;
  data: unknown;
  nativeEvent: MouseEvent;
}

export interface CellDoubleClickEvent extends BaseGridEvent {
  type: 'cell:dblclick';
  position: CellPosition;
  data: unknown;
  nativeEvent: MouseEvent;
}

export interface RowClickEvent extends BaseGridEvent {
  type: 'row:click';
  rowId: RowId;
  data: RowData;
  nativeEvent: MouseEvent;
}

export interface RowDoubleClickEvent extends BaseGridEvent {
  type: 'row:dblclick';
  rowId: RowId;
  data: RowData;
  nativeEvent: MouseEvent;
}
```

### Plugin System

```typescript
export interface Plugin {
  id: string;
  name: string;
  version: string;
  hooks?: PluginHooks;
  initialize?(grid: GridInstance): void;
  destroy?(): void;
}

export interface PluginHooks {
  // Data Hooks
  beforeDataChange?(data: unknown[]): unknown[] | void;
  afterDataChange?(data: RowData[]): void;

  // Sort Hooks
  beforeSort?(state: SortState): SortState | false;
  afterSort?(state: SortState): void;

  // Filter Hooks
  beforeFilter?(state: FilterState): FilterState | false;
  afterFilter?(state: FilterState): void;

  // Edit Hooks
  beforeEdit?(position: CellPosition, value: unknown): unknown | false;
  afterEdit?(position: CellPosition, value: unknown): void;

  // Selection Hooks
  beforeSelect?(rowIds: RowId[]): RowId[] | false;
  afterSelect?(rowIds: RowId[]): void;

  // Render Hooks
  beforeRender?(model: RowModel): RowModel | void;
  afterRender?(model: RowModel): void;

  // Row Model Hooks
  beforeGetRowModel?(model: RowModel): RowModel | void;
  afterGetRowModel?(model: RowModel): void;
}
```

### Usage Example

```typescript
import { createGrid } from '@phozart/phz-core';

const grid = createGrid({
  data: [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 }
  ],
  columns: [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'age', header: 'Age', type: 'number' }
  ],
  enableSelection: true
});

grid.on('selection:change', (event) => {
  console.log('Selected rows:', event.selectedRows);
});

grid.sort('name', 'asc');
grid.select(['row-1', 'row-2']);

const state = grid.exportState();
localStorage.setItem('gridState', JSON.stringify(state));
```

---

## 2. @phozart/phz-grid

**Description**: Lit Web Components rendering layer with DOM virtualization and accessibility.
**Dependencies**: `@phozart/phz-core`, `lit@^5.0.0`

### Exports

#### Custom Elements

```typescript
// Auto-registered custom elements
export class PhzGrid extends LitElement {
  // Properties
  data: unknown[];
  columns: ColumnDefinition[];
  theme: string; // 'auto' | 'light' | 'dark' | custom theme name
  locale: string; // BCP 47 language tag
  responsive: boolean; // Default: true
  virtualization: boolean; // Default: true
  selectionMode: 'none' | 'single' | 'multi' | 'range'; // Default: 'single'
  editMode: 'none' | 'click' | 'dblclick' | 'manual'; // Default: 'dblclick'
  loading: boolean; // Default: false
  height: string | number; // CSS height or pixels
  width: string | number; // CSS width or pixels

  // Methods
  getGridInstance(): GridInstance;
  refresh(): void;
  invalidate(): void;

  // Slots
  static readonly slots: {
    header: 'Custom header content';
    footer: 'Custom footer content';
    'empty-state': 'Content shown when no data';
    loading: 'Custom loading indicator';
    'cell-renderer': 'Custom cell renderer template';
    'cell-editor': 'Custom cell editor template';
    'filter-panel': 'Custom filter panel';
    toolbar: 'Custom toolbar';
  };
}

export class PhzColumn extends LitElement {
  // Properties (same as ColumnDefinition)
  field: string;
  header: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  sortable: boolean;
  filterable: boolean;
  editable: boolean;
  resizable: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'custom';
  priority: 1 | 2 | 3;
  frozen: 'left' | 'right' | null;

  // Slots
  static readonly slots: {
    header: 'Custom column header';
    cell: 'Custom cell template';
    editor: 'Custom cell editor';
    filter: 'Custom filter UI';
  };
}
```

#### Base Classes for Custom Components

```typescript
export abstract class PhzCellRenderer extends LitElement {
  abstract render(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult;
}

export abstract class PhzCellEditor extends LitElement {
  abstract render(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult;
  abstract getValue(): unknown;
  abstract focus(): void;
}
```

#### Built-in Cell Renderers

```typescript
export class TextCellRenderer extends PhzCellRenderer { }
export class NumberCellRenderer extends PhzCellRenderer { }
export class DateCellRenderer extends PhzCellRenderer { }
export class BooleanCellRenderer extends PhzCellRenderer { }
export class LinkCellRenderer extends PhzCellRenderer { }
export class ImageCellRenderer extends PhzCellRenderer { }
export class ProgressCellRenderer extends PhzCellRenderer { }
```

#### Built-in Cell Editors

```typescript
export class TextCellEditor extends PhzCellEditor { }
export class NumberCellEditor extends PhzCellEditor { }
export class SelectCellEditor extends PhzCellEditor { }
export class DateCellEditor extends PhzCellEditor { }
export class CheckboxCellEditor extends PhzCellEditor { }
```

### CSS Custom Properties (Three-Layer Token System)

```typescript
// Layer 1: Brand Tokens (Primitive)
export const BrandTokens = {
  '--phz-color-primary': 'hsl(210, 100%, 50%)',
  '--phz-color-secondary': 'hsl(270, 100%, 50%)',
  '--phz-color-success': 'hsl(120, 60%, 50%)',
  '--phz-color-warning': 'hsl(40, 100%, 50%)',
  '--phz-color-danger': 'hsl(0, 80%, 50%)',
  '--phz-color-neutral-50': 'hsl(0, 0%, 98%)',
  '--phz-color-neutral-100': 'hsl(0, 0%, 95%)',
  '--phz-color-neutral-200': 'hsl(0, 0%, 90%)',
  '--phz-color-neutral-300': 'hsl(0, 0%, 80%)',
  '--phz-color-neutral-400': 'hsl(0, 0%, 60%)',
  '--phz-color-neutral-500': 'hsl(0, 0%, 50%)',
  '--phz-color-neutral-600': 'hsl(0, 0%, 40%)',
  '--phz-color-neutral-700': 'hsl(0, 0%, 30%)',
  '--phz-color-neutral-800': 'hsl(0, 0%, 20%)',
  '--phz-color-neutral-900': 'hsl(0, 0%, 10%)',

  '--phz-font-family-base': 'system-ui, -apple-system, sans-serif',
  '--phz-font-family-mono': 'ui-monospace, monospace',

  '--phz-font-size-xs': '0.75rem',
  '--phz-font-size-sm': '0.875rem',
  '--phz-font-size-base': '1rem',
  '--phz-font-size-lg': '1.125rem',
  '--phz-font-size-xl': '1.25rem',

  '--phz-spacing-xs': '0.25rem',
  '--phz-spacing-sm': '0.5rem',
  '--phz-spacing-md': '1rem',
  '--phz-spacing-lg': '1.5rem',
  '--phz-spacing-xl': '2rem',

  '--phz-border-radius-sm': '0.25rem',
  '--phz-border-radius-md': '0.5rem',
  '--phz-border-radius-lg': '1rem',

  '--phz-shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
  '--phz-shadow-md': '0 4px 6px rgba(0,0,0,0.1)',
  '--phz-shadow-lg': '0 10px 15px rgba(0,0,0,0.15)',
} as const;

// Layer 2: Semantic Tokens (Theme)
export const SemanticTokens = {
  '--phz-grid-bg': 'var(--phz-color-neutral-50)',
  '--phz-grid-text': 'var(--phz-color-neutral-900)',
  '--phz-grid-border': 'var(--phz-color-neutral-300)',

  '--phz-header-bg': 'var(--phz-color-neutral-100)',
  '--phz-header-text': 'var(--phz-color-neutral-900)',
  '--phz-header-border': 'var(--phz-color-neutral-400)',

  '--phz-row-bg': 'transparent',
  '--phz-row-bg-hover': 'var(--phz-color-neutral-100)',
  '--phz-row-bg-selected': 'var(--phz-color-primary)',
  '--phz-row-text-selected': 'white',
  '--phz-row-border': 'var(--phz-color-neutral-200)',

  '--phz-cell-bg': 'transparent',
  '--phz-cell-text': 'inherit',
  '--phz-cell-border': 'var(--phz-color-neutral-200)',
  '--phz-cell-bg-editing': 'white',
  '--phz-cell-border-editing': 'var(--phz-color-primary)',

  '--phz-focus-ring-color': 'var(--phz-color-primary)',
  '--phz-focus-ring-width': '2px',
  '--phz-focus-ring-offset': '2px',
} as const;

// Layer 3: Component Tokens (Specific)
export const ComponentTokens = {
  '--phz-cell-padding': 'var(--phz-spacing-sm) var(--phz-spacing-md)',
  '--phz-cell-font-size': 'var(--phz-font-size-sm)',
  '--phz-cell-line-height': '1.5',

  '--phz-header-padding': 'var(--phz-spacing-md)',
  '--phz-header-font-size': 'var(--phz-font-size-sm)',
  '--phz-header-font-weight': '600',

  '--phz-row-height': '40px',
  '--phz-row-height-compact': '32px',
  '--phz-row-height-comfortable': '48px',

  '--phz-scrollbar-width': '8px',
  '--phz-scrollbar-thumb-bg': 'var(--phz-color-neutral-400)',
  '--phz-scrollbar-track-bg': 'var(--phz-color-neutral-200)',

  '--phz-resize-handle-width': '4px',
  '--phz-resize-handle-bg': 'transparent',
  '--phz-resize-handle-bg-hover': 'var(--phz-color-primary)',
} as const;
```

### Events

```typescript
// DOM events dispatched by <phz-grid>
export interface PhzGridEventMap {
  'grid-ready': CustomEvent<{ gridInstance: GridInstance }>;
  'state-change': CustomEvent<StateChangeEvent>;
  'cell-click': CustomEvent<CellClickEvent>;
  'cell-dblclick': CustomEvent<CellDoubleClickEvent>;
  'row-click': CustomEvent<RowClickEvent>;
  'selection-change': CustomEvent<SelectionChangeEvent>;
  'sort-change': CustomEvent<SortChangeEvent>;
  'filter-change': CustomEvent<FilterChangeEvent>;
  'edit-start': CustomEvent<EditStartEvent>;
  'edit-commit': CustomEvent<EditCommitEvent>;
  'edit-cancel': CustomEvent<EditCancelEvent>;
  'scroll': CustomEvent<ViewportScrollEvent>;
  'resize': CustomEvent<{ width: number; height: number }>;
}
```

### Accessibility Exports

```typescript
export class AriaManager {
  constructor(grid: GridInstance);
  updateGridRole(rowCount: number, columnCount: number): void;
  updateCellRole(position: CellPosition, role: string): void;
  announceChange(message: string): void;
}

export class KeyboardNavigator {
  constructor(grid: GridInstance);
  handleKeyDown(event: KeyboardEvent): void;
  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void;
  moveFocusToFirstCell(): void;
  moveFocusToLastCell(): void;
}

export class ForcedColorsAdapter {
  static detect(): boolean;
  static applyForcedColorsStyles(element: HTMLElement): void;
  static removeForcedColorsStyles(element: HTMLElement): void;
}
```

### Usage Example

```typescript
import '@phozart/phz-grid';
import type { SelectionChangeEvent } from '@phozart/phz-grid';

// HTML
<phz-grid
  .data="${this.data}"
  .columns="${this.columns}"
  theme="auto"
  selection-mode="multi"
  @selection-change="${this.handleSelectionChange}"
>
  <div slot="toolbar">
    <button>Export</button>
  </div>
</phz-grid>

// TypeScript
handleSelectionChange(event: CustomEvent<SelectionChangeEvent>) {
  console.log('Selected:', event.detail.selectedRows);
}
```

---

## 3. @phozart/phz-react

**Description**: React wrapper with hooks and idiomatic event handling.
**Dependencies**: `@phozart/phz-core`, `@phozart/phz-grid`, `react@^18.0.0`

### Exports

```typescript
import type { GridInstance, ColumnDefinition, GridState } from '@phozart/phz-core';
import type { ReactNode, RefObject } from 'react';

export interface PhzGridProps {
  data: unknown[];
  columns: ColumnDefinition[];
  theme?: string;
  locale?: string;
  responsive?: boolean;
  virtualization?: boolean;
  selectionMode?: 'none' | 'single' | 'multi' | 'range';
  editMode?: 'none' | 'click' | 'dblclick' | 'manual';
  loading?: boolean;
  height?: string | number;
  width?: string | number;

  // Event handlers
  onGridReady?: (gridInstance: GridInstance) => void;
  onStateChange?: (state: GridState) => void;
  onCellClick?: (event: CellClickEvent) => void;
  onCellDoubleClick?: (event: CellDoubleClickEvent) => void;
  onRowClick?: (event: RowClickEvent) => void;
  onSelectionChange?: (event: SelectionChangeEvent) => void;
  onSortChange?: (event: SortChangeEvent) => void;
  onFilterChange?: (event: FilterChangeEvent) => void;
  onEditStart?: (event: EditStartEvent) => void;
  onEditCommit?: (event: EditCommitEvent) => void;
  onEditCancel?: (event: EditCancelEvent) => void;
  onScroll?: (event: ViewportScrollEvent) => void;

  // Slots as children
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  toolbar?: ReactNode;

  // Ref to access GridInstance
  ref?: RefObject<GridInstance>;
}

export const PhzGrid: React.ForwardRefExoticComponent<PhzGridProps>;
```

### React Hooks

```typescript
export function useGridState(gridRef: RefObject<GridInstance>): {
  state: GridState | null;
  setState: (state: Partial<GridState>) => void;
  exportState: () => SerializedGridState | null;
  importState: (state: SerializedGridState) => void;
};

export function useGridSelection(gridRef: RefObject<GridInstance>): {
  selectedRows: RowId[];
  selectedCells: CellPosition[];
  select: (rowIds: RowId | RowId[]) => void;
  deselect: (rowIds: RowId | RowId[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (start: CellPosition, end: CellPosition) => void;
};

export function useGridSort(gridRef: RefObject<GridInstance>): {
  sortState: SortState | null;
  sort: (field: string, direction: 'asc' | 'desc' | null) => void;
  multiSort: (sorts: Array<{ field: string; direction: 'asc' | 'desc' }>) => void;
  clearSort: () => void;
};

export function useGridFilter(gridRef: RefObject<GridInstance>): {
  filterState: FilterState | null;
  addFilter: (field: string, operator: FilterOperator, value: unknown) => void;
  removeFilter: (field: string) => void;
  clearFilters: () => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
};

export function useGridEdit(gridRef: RefObject<GridInstance>): {
  editState: EditState | null;
  startEdit: (position: CellPosition) => void;
  commitEdit: (position: CellPosition, value: unknown) => Promise<boolean>;
  cancelEdit: (position: CellPosition) => void;
  isDirty: boolean;
  dirtyRows: RowId[];
};

export function useGridData(gridRef: RefObject<GridInstance>): {
  data: RowData[];
  setData: (data: unknown[]) => void;
  addRow: (data: Record<string, unknown>, position?: number) => RowId;
  updateRow: (id: RowId, data: Partial<Record<string, unknown>>) => void;
  deleteRow: (id: RowId) => void;
};
```

### Usage Example

```typescript
import { PhzGrid, useGridSelection } from '@phozart/phz-react';
import { useRef } from 'react';

function MyComponent() {
  const gridRef = useRef<GridInstance>(null);
  const { selectedRows, selectAll } = useGridSelection(gridRef);

  return (
    <>
      <button onClick={selectAll}>Select All</button>
      <PhzGrid
        ref={gridRef}
        data={data}
        columns={columns}
        onSelectionChange={(e) => console.log(e.selectedRows)}
      />
      <p>Selected: {selectedRows.length} rows</p>
    </>
  );
}
```

---

## 4. @phozart/phz-vue

**Description**: Vue 3 wrapper with Composition API composables and v-model support.
**Dependencies**: `@phozart/phz-core`, `@phozart/phz-grid`, `vue@^3.0.0`

### Exports

```typescript
import type { GridInstance, ColumnDefinition } from '@phozart/phz-core';
import type { Component, Ref } from 'vue';

export interface PhzGridProps {
  data: unknown[];
  columns: ColumnDefinition[];
  theme?: string;
  locale?: string;
  responsive?: boolean;
  virtualization?: boolean;
  selectionMode?: 'none' | 'single' | 'multi' | 'range';
  editMode?: 'none' | 'click' | 'dblclick' | 'manual';
  loading?: boolean;
  height?: string | number;
  width?: string | number;

  // v-model support
  modelValue?: RowId[]; // Selected row IDs
}

export interface PhzGridEmits {
  'update:modelValue': (value: RowId[]) => void;
  'grid-ready': (gridInstance: GridInstance) => void;
  'selection-change': (event: SelectionChangeEvent) => void;
  'sort-change': (event: SortChangeEvent) => void;
  'filter-change': (event: FilterChangeEvent) => void;
  'edit-commit': (event: EditCommitEvent) => void;
  'cell-click': (event: CellClickEvent) => void;
  'row-click': (event: RowClickEvent) => void;
}

export const PhzGrid: Component<PhzGridProps, PhzGridEmits>;
```

### Vue Composables

```typescript
export function useGrid(): {
  gridInstance: Ref<GridInstance | null>;
  state: Ref<GridState | null>;
  exportState: () => SerializedGridState | null;
  importState: (state: SerializedGridState) => void;
};

export function useGridSelection(gridInstance?: Ref<GridInstance | null>): {
  selectedRows: Ref<RowId[]>;
  selectedCells: Ref<CellPosition[]>;
  select: (rowIds: RowId | RowId[]) => void;
  deselect: (rowIds: RowId | RowId[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (start: CellPosition, end: CellPosition) => void;
};

export function useGridSort(gridInstance?: Ref<GridInstance | null>): {
  sortState: Ref<SortState | null>;
  sort: (field: string, direction: 'asc' | 'desc' | null) => void;
  multiSort: (sorts: Array<{ field: string; direction: 'asc' | 'desc' }>) => void;
  clearSort: () => void;
};

export function useGridFilter(gridInstance?: Ref<GridInstance | null>): {
  filterState: Ref<FilterState | null>;
  addFilter: (field: string, operator: FilterOperator, value: unknown) => void;
  removeFilter: (field: string) => void;
  clearFilters: () => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
};

export function useGridEdit(gridInstance?: Ref<GridInstance | null>): {
  editState: Ref<EditState | null>;
  startEdit: (position: CellPosition) => void;
  commitEdit: (position: CellPosition, value: unknown) => Promise<boolean>;
  cancelEdit: (position: CellPosition) => void;
  isDirty: Ref<boolean>;
  dirtyRows: Ref<RowId[]>;
};
```

### Usage Example

```vue
<template>
  <div>
    <button @click="selectAll">Select All</button>
    <PhzGrid
      v-model="selectedRowIds"
      :data="data"
      :columns="columns"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <button>Export</button>
      </template>
    </PhzGrid>
    <p>Selected: {{ selectedRows.length }} rows</p>
  </div>
</template>

<script setup lang="ts">
import { PhzGrid, useGridSelection } from '@phozart/phz-vue';
import { ref } from 'vue';

const selectedRowIds = ref<string[]>([]);
const { selectedRows, selectAll } = useGridSelection();

function handleSelectionChange(event) {
  console.log('Selection changed:', event.selectedRows);
}
</script>
```

---

## 5. @phozart/phz-angular

**Description**: Angular standalone component with RxJS observables and dependency injection.
**Dependencies**: `@phozart/phz-core`, `@phozart/phz-grid`, `@angular/core@^19.0.0`, `rxjs@^7.0.0`

### Exports

```typescript
import { Component, Input, Output, EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { GridInstance, ColumnDefinition, GridState } from '@phozart/phz-core';

@Component({
  selector: 'phz-grid',
  standalone: true,
  template: '...',
})
export class PhzGridComponent {
  @Input() data: unknown[] = [];
  @Input() columns: ColumnDefinition[] = [];
  @Input() theme: string = 'auto';
  @Input() locale: string = 'en-US';
  @Input() responsive: boolean = true;
  @Input() virtualization: boolean = true;
  @Input() selectionMode: 'none' | 'single' | 'multi' | 'range' = 'single';
  @Input() editMode: 'none' | 'click' | 'dblclick' | 'manual' = 'dblclick';
  @Input() loading: boolean = false;
  @Input() height?: string | number;
  @Input() width?: string | number;

  @Output() gridReady = new EventEmitter<GridInstance>();
  @Output() selectionChange = new EventEmitter<SelectionChangeEvent>();
  @Output() sortChange = new EventEmitter<SortChangeEvent>();
  @Output() filterChange = new EventEmitter<FilterChangeEvent>();
  @Output() editCommit = new EventEmitter<EditCommitEvent>();
  @Output() cellClick = new EventEmitter<CellClickEvent>();
  @Output() rowClick = new EventEmitter<RowClickEvent>();

  getGridInstance(): GridInstance | null;
}

@Injectable({ providedIn: 'root' })
export class GridService {
  private instances = new Map<string, GridInstance>();

  registerGrid(id: string, instance: GridInstance): void;
  unregisterGrid(id: string): void;
  getGrid(id: string): GridInstance | undefined;

  // Observable state streams
  getSelectionState$(gridId: string): Observable<SelectionState>;
  getSortState$(gridId: string): Observable<SortState>;
  getFilterState$(gridId: string): Observable<FilterState>;
  getEditState$(gridId: string): Observable<EditState>;
}
```

### Angular Module (for non-standalone)

```typescript
import { NgModule } from '@angular/core';

@NgModule({
  imports: [PhzGridComponent],
  exports: [PhzGridComponent],
})
export class PhzGridModule { }
```

### Usage Example

```typescript
import { Component } from '@angular/core';
import { PhzGridComponent } from '@phozart/phz-angular';

@Component({
  selector: 'app-my-grid',
  standalone: true,
  imports: [PhzGridComponent],
  template: `
    <button (click)="selectAll()">Select All</button>
    <phz-grid
      [data]="data"
      [columns]="columns"
      (selectionChange)="handleSelectionChange($event)"
    >
      <ng-container toolbar>
        <button>Export</button>
      </ng-container>
    </phz-grid>
  `
})
export class MyGridComponent {
  data = [...];
  columns = [...];

  handleSelectionChange(event: SelectionChangeEvent) {
    console.log('Selected:', event.selectedRows);
  }

  selectAll() {
    // Implementation
  }
}
```

---

## 6. @phozart/phz-duckdb

**Description**: DuckDB-WASM data source adapter for in-browser SQL analytics on large files.
**Dependencies**: `@phozart/phz-core`, `@duckdb/duckdb-wasm@^1.0.0`, `apache-arrow@^16.0.0`

### Exports

```typescript
import type { GridInstance } from '@phozart/phz-core';
import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import type { Table as ArrowTable } from 'apache-arrow';

export function createDuckDBDataSource(config: DuckDBConfig): DuckDBDataSource;

export interface DuckDBConfig {
  workerUrl?: string; // Path to DuckDB WASM worker
  wasmUrl?: string; // Path to DuckDB WASM binary
  enableStreaming?: boolean; // Default: true
  enableProgress?: boolean; // Default: true
  memoryLimit?: number; // MB, default: 1024
  threads?: number; // Default: navigator.hardwareConcurrency
}

export interface DuckDBDataSource {
  // Connection Management
  initialize(): Promise<void>;
  connect(): Promise<AsyncDuckDBConnection>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Data Loading
  loadFile(file: File | URL | string, options?: LoadFileOptions): Promise<string>;
  loadMultipleFiles(files: Array<{ name: string; file: File | URL | string }>): Promise<string[]>;

  // Schema Operations
  getSchema(tableName?: string): Promise<TableSchema>;
  getTables(): Promise<string[]>;
  getTableInfo(tableName: string): Promise<TableInfo>;

  // Query Execution
  query(sql: string, params?: Record<string, unknown>): Promise<QueryResult>;
  queryStream(sql: string, params?: Record<string, unknown>): AsyncIterable<QueryChunk>;
  executeSQL(sql: string): Promise<void>;

  // Query Management
  cancelQuery(): void;
  onProgress(handler: (progress: QueryProgress) => void): Unsubscribe;

  // Apache Arrow Integration
  toArrowTable(tableName?: string): Promise<ArrowTable>;
  fromArrowTable(table: ArrowTable, tableName: string): Promise<void>;

  // Worker Management
  getDatabase(): AsyncDuckDB;
  terminateWorker(): Promise<void>;

  // Grid Integration
  attachToGrid(grid: GridInstance): void;
  detachFromGrid(): void;
}

export interface LoadFileOptions {
  format?: 'csv' | 'parquet' | 'json' | 'arrow' | 'auto';
  tableName?: string; // Default: derived from filename
  schema?: Record<string, string>; // Column name -> SQL type
  header?: boolean; // CSV only, default: true
  delimiter?: string; // CSV only, default: ','
  compression?: 'gzip' | 'zstd' | 'snappy' | 'none' | 'auto';
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  rowCount: number;
}

export interface ColumnSchema {
  name: string;
  type: string; // SQL type
  nullable: boolean;
}

export interface TableInfo {
  name: string;
  schema: TableSchema;
  sizeBytes: number;
  rowCount: number;
  columnCount: number;
}

export interface QueryResult {
  data: unknown[];
  schema: ColumnSchema[];
  rowCount: number;
  executionTime: number; // milliseconds
  fromCache: boolean;
}

export interface QueryChunk {
  data: unknown[];
  index: number;
  total: number;
  progress: number; // 0-1
}

export interface QueryProgress {
  state: 'preparing' | 'executing' | 'streaming' | 'complete' | 'error';
  progress: number; // 0-1
  rowsProcessed: number;
  totalRows?: number;
  message?: string;
}

export type Unsubscribe = () => void;
```

### Advanced Features

```typescript
// Export for custom optimizations
export interface ParquetMetadata {
  version: string;
  rowGroups: RowGroupMetadata[];
  schema: ParquetSchema;
  totalRows: number;
}

export interface RowGroupMetadata {
  id: number;
  rowCount: number;
  columns: ColumnChunkMetadata[];
  totalByteSize: number;
}

export interface ColumnChunkMetadata {
  name: string;
  type: string;
  encoding: string;
  compression: string;
  statistics?: ColumnStatistics;
}

export interface ColumnStatistics {
  min?: unknown;
  max?: unknown;
  nullCount: number;
  distinctCount?: number;
}

export interface ParquetSchema {
  fields: Array<{ name: string; type: string; nullable: boolean }>;
}

// Query plan visualization
export interface QueryPlan {
  sql: string;
  plan: QueryPlanNode[];
  estimatedCost: number;
  estimatedRows: number;
}

export interface QueryPlanNode {
  id: number;
  type: string; // 'SEQ_SCAN', 'FILTER', 'PROJECTION', 'AGGREGATE', etc.
  table?: string;
  filter?: string;
  estimatedRows: number;
  children: QueryPlanNode[];
}

export function getQueryPlan(dataSource: DuckDBDataSource, sql: string): Promise<QueryPlan>;
```

### Usage Example

```typescript
import { createDuckDBDataSource } from '@phozart/phz-duckdb';
import { createGrid } from '@phozart/phz-core';

const dataSource = await createDuckDBDataSource({
  enableStreaming: true,
  enableProgress: true
});

await dataSource.initialize();

// Load a large Parquet file
const tableName = await dataSource.loadFile(
  'sales_data.parquet',
  { format: 'parquet' }
);

// Execute SQL query
const result = await dataSource.query(
  'SELECT region, SUM(sales) as total FROM sales_data GROUP BY region'
);

// Attach to grid
const grid = createGrid({ data: result.data, columns: [...] });
dataSource.attachToGrid(grid);

// Stream results for incremental display
for await (const chunk of dataSource.queryStream('SELECT * FROM sales_data')) {
  console.log(`Received ${chunk.data.length} rows (${chunk.progress * 100}%)`);
}
```

---

## 7. @phozart/phz-ai

**Description**: AI toolkit for schema inference, natural language queries, and anomaly detection.
**Dependencies**: `@phozart/phz-core`

### Exports

```typescript
import type { GridInstance, ColumnDefinition } from '@phozart/phz-core';
import type { JSONSchema7 } from 'json-schema';

export function createAIToolkit(config: AIConfig): AIToolkit;

export interface AIConfig {
  provider: AIProvider;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number; // 0-1, default: 0.3
  maxTokens?: number;
  enableCaching?: boolean; // Default: true
  enableLogging?: boolean; // Default: false
}

export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}
```

### AIToolkit Interface

```typescript
export interface AIToolkit {
  // Schema Operations
  getStructuredSchema(): JSONSchema7;
  inferSchema(sampleData: unknown[], options?: InferSchemaOptions): Promise<ColumnDefinition[]>;
  validateSchema(schema: ColumnDefinition[], data: unknown[]): Promise<SchemaValidationResult>;

  // Natural Language Query
  executeNaturalLanguageQuery(query: string, options?: NLQueryOptions): Promise<AIQueryResult>;
  explainQuery(sql: string): Promise<string>;
  suggestQueries(context?: string): Promise<string[]>;

  // Data Quality
  detectAnomalies(column: string, options?: AnomalyDetectionOptions): Promise<AnomalyResult[]>;
  suggestDataTypes(sampleData: unknown[]): Promise<DataTypeSuggestion[]>;
  detectDuplicates(columns?: string[]): Promise<DuplicateResult[]>;

  // Summarization
  summarize(options?: SummarizeOptions): Promise<string>;
  generateInsights(columns?: string[]): Promise<Insight[]>;

  // Filtering & Search
  suggestFilters(input: string): Promise<FilterSuggestion[]>;
  autoCompleteValue(column: string, partial: string): Promise<string[]>;

  // Grid Integration
  attachToGrid(grid: GridInstance): void;
  detachFromGrid(): void;
}
```

### Types and Interfaces

```typescript
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export interface CompletionResult {
  text: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: 'stop' | 'length' | 'content_filter';
}

export interface CompletionChunk {
  text: string;
  index: number;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface InferSchemaOptions {
  sampleSize?: number; // Number of rows to analyze, default: 100
  confidence?: number; // 0-1, minimum confidence for type inference, default: 0.8
  detectDates?: boolean; // Default: true
  detectEnums?: boolean; // Default: true
  maxEnumValues?: number; // Default: 10
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: Array<{ row: number; column: string; error: string }>;
  warnings: Array<{ row: number; column: string; warning: string }>;
  coverage: number; // 0-1, percentage of data that matches schema
}

export interface NLQueryOptions {
  schema?: ColumnDefinition[];
  sampleData?: unknown[];
  dialect?: 'duckdb' | 'sqlite' | 'postgres' | 'mysql';
  explainSQL?: boolean; // Return explanation with SQL, default: false
  dryRun?: boolean; // Don't execute, just generate SQL, default: false
}

export interface AIQueryResult {
  sql: string;
  explanation?: string;
  data?: unknown[];
  error?: string;
  confidence: number; // 0-1
}

export interface AnomalyDetectionOptions {
  method?: 'zscore' | 'iqr' | 'isolation_forest' | 'auto';
  threshold?: number; // Standard deviations for zscore, default: 3
  sensitivity?: 'low' | 'medium' | 'high'; // Default: 'medium'
}

export interface AnomalyResult {
  rowId: string;
  column: string;
  value: unknown;
  score: number; // 0-1, higher = more anomalous
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DataTypeSuggestion {
  column: string;
  currentType: string;
  suggestedType: string;
  confidence: number; // 0-1
  reason: string;
  examples: Array<{ value: unknown; parsedValue: unknown }>;
}

export interface DuplicateResult {
  rowIds: string[];
  columns: string[];
  values: Record<string, unknown>;
  count: number;
}

export interface SummarizeOptions {
  maxLength?: number; // Words, default: 150
  style?: 'technical' | 'business' | 'casual'; // Default: 'business'
  includeStats?: boolean; // Default: true
  includeTrends?: boolean; // Default: false (requires time-series data)
  columns?: string[]; // Specific columns to summarize
}

export interface Insight {
  type: 'trend' | 'correlation' | 'outlier' | 'pattern' | 'distribution';
  title: string;
  description: string;
  columns: string[];
  confidence: number; // 0-1
  visualization?: {
    type: 'line' | 'bar' | 'scatter' | 'heatmap';
    data: unknown[];
  };
}

export interface FilterSuggestion {
  field: string;
  operator: FilterOperator;
  value: unknown;
  displayText: string;
  confidence: number; // 0-1
}
```

### Built-in Providers

```typescript
export class OpenAIProvider implements AIProvider {
  constructor(config: { apiKey: string; model?: string; baseURL?: string });
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}

export class AnthropicProvider implements AIProvider {
  constructor(config: { apiKey: string; model?: string; baseURL?: string });
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}

export class GoogleProvider implements AIProvider {
  constructor(config: { apiKey: string; model?: string; baseURL?: string });
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
  streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}
```

### Usage Example

```typescript
import { createAIToolkit, OpenAIProvider } from '@phozart/phz-ai';
import { createGrid } from '@phozart/phz-core';

const aiToolkit = createAIToolkit({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  model: 'gpt-4',
  temperature: 0.3
});

const grid = createGrid({ data, columns });
aiToolkit.attachToGrid(grid);

// Infer schema from CSV with no headers
const inferredColumns = await aiToolkit.inferSchema(rawData, {
  sampleSize: 200,
  detectEnums: true
});

// Natural language query
const result = await aiToolkit.executeNaturalLanguageQuery(
  'Show me all customers in California with orders over $1000'
);
console.log('Generated SQL:', result.sql);

// Detect anomalies
const anomalies = await aiToolkit.detectAnomalies('age', {
  method: 'zscore',
  sensitivity: 'high'
});

// Summarize data
const summary = await aiToolkit.summarize({
  style: 'business',
  includeStats: true,
  maxLength: 200
});
```

---

## 8. @phozart/phz-collab

**Description**: Real-time collaboration with CRDTs (Yjs) and sync providers.
**Dependencies**: `@phozart/phz-core`, `yjs@^13.0.0`

### Exports

```typescript
import type { GridInstance } from '@phozart/phz-core';
import type { Doc as YDoc } from 'yjs';

export function createCollabSession(config: CollabConfig): CollabSession;

export interface CollabConfig {
  sessionId?: string; // Auto-generated if not provided
  userId: string;
  userName: string;
  userColor?: string; // Hex color for presence indicator
  conflictResolution?: ConflictStrategy; // Default: 'last-write-wins'
  enablePresence?: boolean; // Default: true
  enableHistory?: boolean; // Default: true
  historyLimit?: number; // Max changes to store, default: 1000
}

export type ConflictStrategy = 'last-write-wins' | 'manual' | 'custom';
```

### CollabSession Interface

```typescript
export interface CollabSession {
  // Connection Management
  connect(provider: SyncProvider): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionState(): ConnectionState;

  // Presence
  getPresence(): ReadonlyMap<UserId, UserPresence>;
  updatePresence(data: Partial<UserPresence>): void;
  onPresenceChange(handler: (presenceMap: Map<UserId, UserPresence>) => void): Unsubscribe;

  // Change Tracking
  onRemoteChange(handler: (change: RemoteChange) => void): Unsubscribe;
  onLocalChange(handler: (change: LocalChange) => void): Unsubscribe;
  getChangeHistory(options?: HistoryOptions): ChangeEntry[];

  // Session Info
  getSessionInfo(): SessionInfo;
  getUserInfo(userId: UserId): UserInfo | undefined;

  // Conflict Resolution
  onConflict(handler: (conflict: Conflict) => ConflictResolution): Unsubscribe;
  resolveConflict(conflictId: string, resolution: ConflictResolution): void;

  // Yjs Document
  getYDoc(): YDoc;

  // Grid Integration
  attachToGrid(grid: GridInstance): void;
  detachFromGrid(): void;

  // Lifecycle
  destroy(): void;
}

export type UserId = string;

export interface UserPresence {
  userId: UserId;
  userName: string;
  userColor: string;
  cursor?: CellPosition;
  selection?: CellPosition[];
  editing?: CellPosition;
  lastActivity: number; // Unix timestamp
  online: boolean;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface RemoteChange {
  type: 'cell' | 'row' | 'column' | 'state';
  userId: UserId;
  timestamp: number;
  change: CellChange | RowChange | ColumnChange | StateChange;
}

export interface LocalChange {
  type: 'cell' | 'row' | 'column' | 'state';
  timestamp: number;
  change: CellChange | RowChange | ColumnChange | StateChange;
}

export interface CellChange {
  position: CellPosition;
  oldValue: unknown;
  newValue: unknown;
}

export interface RowChange {
  action: 'add' | 'update' | 'delete';
  rowId: RowId;
  data?: RowData;
}

export interface ColumnChange {
  action: 'add' | 'update' | 'delete' | 'reorder';
  field: string;
  data?: ColumnDefinition;
  newIndex?: number;
}

export interface StateChange {
  field: keyof GridState;
  oldValue: unknown;
  newValue: unknown;
}

export interface HistoryOptions {
  limit?: number; // Max entries to return
  since?: number; // Unix timestamp
  userId?: UserId; // Filter by user
  type?: 'cell' | 'row' | 'column' | 'state';
}

export interface ChangeEntry {
  id: string;
  userId: UserId;
  timestamp: number;
  type: 'cell' | 'row' | 'column' | 'state';
  change: CellChange | RowChange | ColumnChange | StateChange;
}

export interface SessionInfo {
  sessionId: string;
  createdAt: number;
  connectedUsers: number;
  totalChanges: number;
}

export interface UserInfo {
  userId: UserId;
  userName: string;
  userColor: string;
  joinedAt: number;
  changeCount: number;
}

export interface Conflict {
  id: string;
  type: 'cell' | 'row' | 'column';
  position?: CellPosition;
  rowId?: RowId;
  field?: string;
  localValue: unknown;
  remoteValue: unknown;
  localUserId: UserId;
  remoteUserId: UserId;
  timestamp: number;
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'local' | 'remote' | 'merge' | 'custom';
  customValue?: unknown;
}

export type Unsubscribe = () => void;
```

### Sync Providers

```typescript
export interface SyncProvider {
  name: string;
  connect(doc: YDoc, sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe;
}

export class WebSocketSyncProvider implements SyncProvider {
  constructor(config: WebSocketSyncConfig);
  name: 'websocket';
  connect(doc: YDoc, sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe;
}

export interface WebSocketSyncConfig {
  url: string; // WebSocket server URL
  protocols?: string[];
  reconnectInterval?: number; // ms, default: 3000
  maxReconnectAttempts?: number; // default: 10
  auth?: {
    token?: string;
    headers?: Record<string, string>;
  };
}

export class WebRTCSyncProvider implements SyncProvider {
  constructor(config: WebRTCSyncConfig);
  name: 'webrtc';
  connect(doc: YDoc, sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onConnectionStateChange(handler: (state: ConnectionState) => void): Unsubscribe;
}

export interface WebRTCSyncConfig {
  signalingServer: string; // WebSocket URL for signaling
  iceServers?: RTCIceServer[];
  enableDataChannelOptimization?: boolean; // Default: true
}
```

### Yjs Document Mapping

```typescript
// Internal Yjs document structure (for reference)
export interface YGridDocument {
  rows: Y.Array<Y.Map<unknown>>; // Array of row Y.Maps
  columns: Y.Array<Y.Map<unknown>>; // Array of column Y.Maps
  state: Y.Map<unknown>; // Grid state (sort, filter, etc.)
  presence: Y.Map<UserPresence>; // User presence map
}

export function getYGridDocument(doc: YDoc): YGridDocument;
```

### Usage Example

```typescript
import { createCollabSession, WebSocketSyncProvider } from '@phozart/phz-collab';
import { createGrid } from '@phozart/phz-core';

const collabSession = createCollabSession({
  userId: 'user-123',
  userName: 'Alice',
  userColor: '#FF5733',
  conflictResolution: 'last-write-wins',
  enablePresence: true
});

const syncProvider = new WebSocketSyncProvider({
  url: 'wss://collab.example.com',
  auth: { token: 'session-token' }
});

await collabSession.connect(syncProvider);

const grid = createGrid({ data, columns });
collabSession.attachToGrid(grid);

// Monitor presence
collabSession.onPresenceChange((presenceMap) => {
  presenceMap.forEach((presence, userId) => {
    console.log(`${presence.userName} is editing ${presence.editing?.field}`);
  });
});

// Monitor remote changes
collabSession.onRemoteChange((change) => {
  console.log(`${change.userId} made a change:`, change);
});

// Handle conflicts manually
collabSession.onConflict((conflict) => {
  return {
    conflictId: conflict.id,
    resolution: 'remote' // Accept remote change
  };
});
```

---

## 9. @phozart/phz-docs

**Description**: Documentation site with live interactive examples, built with VitePress.
**Dependencies**: `vitepress`, all `@phozart/*` packages

### Purpose

No public API. This package contains:
- Documentation site source files
- Interactive code examples
- API reference (auto-generated from TypeScript definitions)
- Theming guide
- Migration guides
- Performance benchmarks

### Structure

```
packages/docs/
├── .vitepress/
│   ├── config.ts
│   └── theme/
├── guide/
│   ├── getting-started.md
│   ├── core-concepts.md
│   ├── data-loading.md
│   └── ...
├── api/
│   ├── core.md
│   ├── grid.md
│   └── ...
├── examples/
│   ├── basic-grid.md
│   ├── duckdb-analytics.md
│   └── ...
└── advanced/
    ├── theming.md
    ├── custom-renderers.md
    └── ...
```

---

## 10. @phozart/phz-shared

**Description**: Shared infrastructure package. Contains adapter interfaces, type definitions, artifact metadata, design system tokens, and runtime coordination modules. This is the dependency foundation for all shells.
**Dependencies**: None

### Sub-path Exports

| Sub-path | Purpose | Key Exports |
|----------|---------|-------------|
| `@phozart/phz-shared/adapters` | Consumer-implemented SPIs | `DataAdapter`, `PersistenceAdapter`, `MeasureRegistryAdapter`, `AlertChannelAdapter`, `AttentionAdapter`, `UsageAnalyticsAdapter`, `SubscriptionAdapter`, `HelpConfig` |
| `@phozart/phz-shared/types` | Shared type definitions | `SingleValueAlertConfig`, `MicroWidgetCellConfig`, `ImpactChainNode`, `AttentionFilterState`, `AsyncReportRequest`, `Subscription`, `PersonalAlert`, `ErrorState`, `EmptyState`, `DecisionTreeNode`, `ApiSpec` |
| `@phozart/phz-shared/design-system` | Design tokens and responsive utilities | `ALERT_WIDGET_TOKENS`, `IMPACT_CHAIN_TOKENS`, `generateAlertTokenCSS`, `generateChainTokenCSS`, responsive breakpoints, container queries, component patterns, shell layout, mobile utilities, icons |
| `@phozart/phz-shared/artifacts` | Artifact lifecycle metadata | `ArtifactVisibility`, `VisibilityMeta`, `DefaultPresentation`, `PersonalView`, `GridArtifact`, `ArtifactMeta`, visibility transition functions |
| `@phozart/phz-shared/coordination` | Runtime state coordination | `FilterContextManager`, `DashboardDataPipeline`, `QueryCoordinatorInstance`, `InteractionBus`, `LoadingState`, `AsyncReportUIState`, `ExportsTabState`, `SubscriptionsTabState`, `ExpressionBuilderState`, `PreviewContextState`, `AttentionFacetedState` |

### Spec Amendment A: Alert-Aware Widget Types

```typescript
// types/single-value-alert.ts
export type AlertVisualMode = 'none' | 'indicator' | 'background' | 'border';
export type WidgetAlertSeverity = 'healthy' | 'warning' | 'critical';
export interface SingleValueAlertConfig { ... }
export interface AlertVisualState { ... }
export interface AlertTokenSet { ... }
export function resolveAlertVisualState(config, alertEvents): AlertVisualState;
export function getAlertTokens(severity, mode): AlertTokenSet;
export function degradeAlertMode(mode, containerSize): DegradedAlertParams;
export function createDefaultAlertConfig(): SingleValueAlertConfig;
```

### Spec Amendment B: Micro-Widget Cell Renderers

```typescript
// types/micro-widget.ts
export type MicroWidgetDisplayMode = 'value-only' | 'sparkline' | 'delta' | 'gauge-arc';
export type MicroWidgetType = 'trend-line' | 'gauge' | 'kpi-card' | 'scorecard';
export interface MicroWidgetCellConfig { ... }
export interface SparklineDataBinding { ... }
export interface MicroWidgetRenderResult { html: string; width: number; height: number; }
export interface MicroWidgetRenderer { render(...); canRender(...); }
export interface CellRendererRegistry { register(...); get(...); has(...); getRegisteredTypes(); }
export function createCellRendererRegistry(): CellRendererRegistry;
```

### Spec Amendment C: Impact Chain Types

```typescript
// types/impact-chain.ts
export type ImpactNodeRole = 'root-cause' | 'failure' | 'impact' | 'hypothesis';
export type HypothesisState = 'validated' | 'inconclusive' | 'invalidated' | 'pending';
export interface ImpactMetric { label: string; value: string; field: string; }
export interface ImpactChainNode extends DecisionTreeNode { nodeRole?; hypothesisState?; impactMetrics?; edgeLabel?; }
export type DecisionTreeRenderVariant = 'tree' | 'impact-chain';
export interface DecisionTreeVariantConfig { renderVariant; chainLayout?; }
```

### Spec Amendment D: Faceted Attention Filtering

```typescript
// types/attention-filter.ts
export type AttentionPriority = 'critical' | 'warning' | 'info';
export type AttentionSource = 'alert' | 'system' | 'external' | 'stale' | 'review' | 'broken-query';
export interface AttentionFilterState { priority?; source?; artifactId?; acknowledged?; dateRange?; }
export interface FilterableAttentionItem { id; priority; source; acknowledged; timestamp; title; ... }
export function filterAttentionItems(items, filters): FilterableAttentionItem[];
export function computeAttentionFacets(items, currentFilters): AttentionFacet[];
```

### Coordination State Modules

```typescript
// coordination/async-report-ui-state.ts
export interface AsyncReportUIState { jobs; activeJobId; }
export function createAsyncReportUIState(): AsyncReportUIState;
export function addJob(state, job): AsyncReportUIState;
export function updateJobStatus(state, jobId, status, progress?): AsyncReportUIState;

// coordination/exports-tab-state.ts
export interface ExportsTabState { exports; sort; filterStatus; }
export function createExportsTabState(): ExportsTabState;
export function addExport(state, entry): ExportsTabState;
export function getVisibleExports(state): ExportEntry[];

// coordination/subscriptions-tab-state.ts
export interface SubscriptionsTabState { subscriptions; activeTab; searchQuery; createDialogOpen; }
export function createSubscriptionsTabState(): SubscriptionsTabState;
export function getFilteredSubscriptions(state): Subscription[];

// coordination/expression-builder-state.ts
export interface ExpressionBuilderState { nodes; selectedNodeId; rootId; nextId; }
export function createExpressionBuilderState(): ExpressionBuilderState;
export function addNode(state, type, value, parentId?): ExpressionBuilderState;
export function buildExpression(state): string;

// coordination/preview-context-state.ts
export interface PreviewContextState { enabled; selectedRole; customUserId; availableRoles; }
export function createPreviewContextState(): PreviewContextState;
export function getEffectiveContext(state, original): ViewerContext;

// coordination/attention-faceted-state.ts
export interface AttentionFacetedState { items; filters; sortOrder; acknowledgedIds; pageSize; currentPage; }
export function toggleFacetValue(state, field, value): AttentionFacetedState;
export function getVisibleItems(state): FilterableAttentionItem[];
```

---

## 11. @phozart/phz-viewer

**Description**: Read-only consumption shell for the viewer persona. Headless state machines plus Lit Web Components. No workspace dependency.
**Dependencies**: `@phozart/phz-shared`, `lit`

### Shell State Machine

```typescript
export type ViewerScreen = 'catalog' | 'dashboard' | 'report' | 'explorer';

export interface ViewerShellState {
  currentScreen: ViewerScreen;
  activeArtifactId: string | null;
  activeArtifactType: string | null;
  navigationHistory: NavigationEntry[];
  historyIndex: number;
  filterContext: FilterContextManager | null;
  loading: boolean;
  error: ErrorState | null;
  empty: EmptyState | null;
  attentionCount: number;
  viewerContext: ViewerContext | null;
  mobileLayout: boolean;
}

export function createViewerShellState(config?): ViewerShellState;
export function navigateTo(state, screen, artifactId?, artifactType?): ViewerShellState;
export function navigateBack(state): ViewerShellState;
export function navigateForward(state): ViewerShellState;
export function canGoBack(state): boolean;
export function canGoForward(state): boolean;
export function setError(state, error): ViewerShellState;
export function setEmpty(state, empty): ViewerShellState;
export function setLoading(state, loading): ViewerShellState;
export function setAttentionCount(state, count): ViewerShellState;
export function setViewerContext(state, viewerContext): ViewerShellState;
export function setFilterContext(state, filterContext): ViewerShellState;
export function setMobileLayout(state, mobileLayout): ViewerShellState;
```

### Navigation

```typescript
export interface ViewerRoute { screen: ViewerScreen; artifactId?: string; }
export function parseRoute(path: string): ViewerRoute;
export function buildRoutePath(route: ViewerRoute): string;
export function screenForArtifactType(type: string): ViewerScreen;
```

### Configuration

```typescript
export interface ViewerFeatureFlags { showExplorer; showAttention; showFilters; showBranding; }
export interface ViewerBranding { logoUrl?; title?; accentColor?; }
export interface ViewerShellConfig { featureFlags; branding; defaultScreen; }
export function createViewerShellConfig(overrides?): ViewerShellConfig;
```

### Screen State Machines (6)

| Module | State | Factory | Key Transitions |
|--------|-------|---------|-----------------|
| `screens/catalog-state` | `CatalogState` | `createCatalogState()` | `applyFilters`, `setSearchQuery`, `setTypeFilter`, `setCatalogSort`, `setCatalogPage`, `toggleFavorite`, `toggleViewMode` |
| `screens/dashboard-state` | `DashboardViewState` | `createDashboardViewState()` | `loadDashboard`, `setWidgetLoading`, `setWidgetError`, `applyCrossFilter`, `clearCrossFilter`, `toggleFullscreen`, `toggleWidgetExpanded`, `refreshDashboard` |
| `screens/report-state` | `ReportViewState` | `createReportViewState()` | `loadReport`, `setReportData`, `setReportSort`, `toggleReportSort`, `setReportPage`, `setReportSearch`, `toggleColumnVisibility`, `setExporting` |
| `screens/explorer-state` | `ExplorerScreenState` | `createExplorerScreenState()` | `setDataSources`, `selectDataSource`, `setFields`, `setPreviewMode`, `setSuggestedChartType` |
| `screens/attention-state` | `AttentionDropdownState` | `createAttentionDropdownState()` | `setAttentionItems`, `toggleAttentionDropdown`, `markItemsAsRead`, `markAllAsRead`, `dismissItem`, `setAttentionTypeFilter` |
| `screens/filter-bar-state` | `FilterBarState` | `createFilterBarState()` | `setFilterDefs`, `openFilter`, `closeFilter`, `setFilterValue`, `clearFilterValue`, `clearAllFilters`, `applyPreset` |

### Lit Components

| Component | Custom Element |
|-----------|---------------|
| `PhzViewerShell` | `<phz-viewer-shell>` |
| `PhzViewerCatalog` | `<phz-viewer-catalog>` |
| `PhzViewerDashboard` | `<phz-viewer-dashboard>` |
| `PhzViewerReport` | `<phz-viewer-report>` |
| `PhzViewerExplorer` | `<phz-viewer-explorer>` |
| `PhzAttentionDropdown` | `<phz-attention-dropdown>` |
| `PhzFilterBar` | `<phz-filter-bar>` |
| `PhzViewerError` | `<phz-viewer-error>` |
| `PhzViewerEmpty` | `<phz-viewer-empty>` |

---

## 12. @phozart/phz-editor

**Description**: Authoring shell for the author persona. Constrained editing (measure palette, not raw fields), dashboard/report creation, sharing, alert management. Headless state machines plus Lit Web Components.
**Dependencies**: `@phozart/phz-shared`, `lit`

### Shell State Machine

```typescript
export type EditorScreen =
  | 'catalog' | 'dashboard-view' | 'dashboard-edit'
  | 'report' | 'explorer' | 'sharing' | 'alerts';

export interface EditorShellState {
  currentScreen: EditorScreen;
  activeArtifactId: string | null;
  activeArtifactType: string | null;
  editMode: boolean;
  unsavedChanges: boolean;
  autoSaveEnabled: boolean;
  autoSaveDebounceMs: number;
  undoStack: unknown[];
  redoStack: unknown[];
  navigationHistory: NavigationEntry[];
  historyIndex: number;
  loading: boolean;
  error: ErrorState | null;
  viewerContext: ViewerContext | null;
  measures: MeasureDefinition[];
}

export function createEditorShellState(config?): EditorShellState;
export function navigateTo(state, screen, artifactId?, artifactType?): EditorShellState;
export function toggleEditMode(state): EditorShellState;
export function markUnsavedChanges(state): EditorShellState;
export function markSaved(state): EditorShellState;
export function pushUndo(state, snapshot): EditorShellState;
export function undo(state): EditorShellState;
export function redo(state): EditorShellState;
export function canUndo(state): boolean;
export function canRedo(state): boolean;
```

### Navigation

```typescript
export interface EditorRoute { screen: EditorScreen; artifactId?: string; }
export interface Breadcrumb { label: string; screen: EditorScreen; artifactId?: string; }
export function parseRoute(path: string): EditorRoute;
export function buildRoutePath(route: EditorRoute): string;
export function buildBreadcrumbs(state: EditorShellState): Breadcrumb[];
export function buildEditorDeepLink(screen, artifactId?): string;
```

### Configuration

```typescript
export interface EditorFeatureFlags { allowDashboardEdit; allowReportEdit; allowExplorer; allowSharing; allowAlerts; allowSubscriptions; }
export interface EditorShellConfig { featureFlags; autoSaveEnabled; autoSaveDebounceMs; maxUndoStackSize; }
export function createEditorShellConfig(overrides?): EditorShellConfig;
export function validateEditorConfig(config): ConfigValidationResult;
```

### Screen State Machines (5)

| Module | State | Factory | Key Transitions |
|--------|-------|---------|-----------------|
| `screens/catalog-state` | `CatalogState` | `createCatalogState()` | `setCatalogItems`, `searchCatalog`, `filterCatalogByType`, `filterCatalogByVisibility`, `sortCatalog`, `openCreateDialog`, `closeCreateDialog` |
| `screens/dashboard-view-state` | `DashboardViewState` | `createDashboardViewState()` | `setDashboardData`, `setPermissions`, `expandWidget`, `collapseWidget` |
| `screens/dashboard-edit-state` | `DashboardEditState` | `createDashboardEditState()` | `addWidget`, `removeWidget`, `updateWidgetConfig`, `moveWidget`, `resizeWidget`, `selectWidget`, `startDrag`, `endDrag`, `toggleConfigPanel`, `toggleMeasurePalette`, `setGridLayout` |
| `screens/report-state` | `ReportEditState` | `createReportEditState()` | `addReportColumn`, `removeReportColumn`, `updateReportColumn`, `reorderReportColumns`, `addReportFilter`, `setReportSorts`, `toggleReportPreview`, `setReportPreviewData` |
| `screens/explorer-state` | `ExplorerState` | `createExplorerState()` | `addDimension`, `removeDimension`, `addMeasure`, `removeMeasure`, `addExplorerFilter`, `setExplorerSort`, `setExplorerResults`, `openSaveDialog` |

### Authoring State Machines (4)

| Module | State | Factory | Purpose |
|--------|-------|---------|---------|
| `authoring/measure-palette-state` | `MeasurePaletteState` | `createMeasurePaletteState()` | Search, filter, select/deselect items from curated measure registry |
| `authoring/config-panel-state` | `ConfigPanelState` | `createConfigPanelState()` | Widget config editing with field constraints and validation |
| `authoring/sharing-state` | `SharingFlowState` | `createSharingFlowState()` | Visibility transitions, share targets, publish permissions |
| `authoring/alert-subscription-state` | `AlertSubscriptionState` | `createAlertSubscriptionState()` | Manage alerts and subscriptions, enable/disable, CRUD operations |

### Lit Components

| Component | Custom Element |
|-----------|---------------|
| `PhzEditorShell` | `<phz-editor-shell>` |
| `PhzEditorCatalog` | `<phz-editor-catalog>` |
| `PhzEditorDashboard` | `<phz-editor-dashboard>` |
| `PhzEditorReport` | `<phz-editor-report>` |
| `PhzEditorExplorer` | `<phz-editor-explorer>` |
| `PhzMeasurePalette` | `<phz-measure-palette>` |
| `PhzConfigPanel` | `<phz-config-panel>` |
| `PhzSharingFlow` | `<phz-sharing-flow>` |
| `PhzAlertSubscription` | `<phz-alert-subscription>` |

---

## 13. @phozart/phz-engine (v15 Additions)

### New Engine Subsystems

v15 added five new subsystems to the engine package, each exported via sub-path
barrel files.

#### Alerts: Personal Alert Engine (C-2.03, C-2.04)

```typescript
// alerts/personal-alert-engine.ts
export interface AlertEvaluationResult {
  alertId: string; triggered: boolean; severity: AlertSeverity;
  currentValue: number; thresholdValue: number; message: string; withinGracePeriod: boolean;
}
export function evaluateAlert(alert: PersonalAlert, currentValue: number, lastTriggeredAt?: number): AlertEvaluationResult;
export function evaluateAllAlerts(alerts: PersonalAlert[], values: Record<string, number>): AlertEvaluationResult[];
export function shouldNotify(result: AlertEvaluationResult, preference: PersonalAlertPreference): boolean;
export function formatAlertMessage(result: AlertEvaluationResult): string;

// alerts/alert-contract.ts
export interface AlertEvaluationContract {
  evaluate(alertId: string, dataSourceId: string): Promise<AlertEvaluationResult>;
  subscribe(alertId: string, callback: (result: AlertEvaluationResult) => void): () => void;
  getHistory(alertId: string, limit?: number): AlertEvaluationResult[];
}
export function createInMemoryAlertContract(): AlertEvaluationContract;
```

#### Subscriptions: Subscription Engine (C-2.05)

```typescript
// subscriptions/subscription-engine.ts
export interface SubscriptionEngineState { subscriptions; activeSubscriptionId; processing; }
export function createSubscriptionEngineState(overrides?): SubscriptionEngineState;
export function addSubscription(state, sub): SubscriptionEngineState;
export function updateSubscription(state, id, updates): SubscriptionEngineState;
export function removeSubscription(state, id): SubscriptionEngineState;
export function getNextScheduledRun(schedule, now?): Date;
export function isDueForExecution(sub, now?): boolean;
```

#### Analytics: Usage Collector (C-2.08)

```typescript
// analytics/usage-collector.ts
export interface BufferedEvent { type: string; timestamp: number; data: Record<string, unknown>; }
export interface UsageCollectorState { buffer; bufferSize; flushIntervalMs; collecting; }
export function createUsageCollector(config?): UsageCollectorState;
export function trackEvent(state, type, data?): UsageCollectorState;
export function shouldFlush(state): boolean;
export function flush(state): { flushed: UsageCollectorState; events: BufferedEvent[] };
export function setCollecting(state, collecting): UsageCollectorState;
```

#### API: OpenAPI Specification Generator (C-2.09)

```typescript
// api/openapi-generator.ts
export interface OpenAPIDocument { openapi: '3.1.0'; info; servers?; paths; components?; }
export function endpointToOperation(endpoint: ApiEndpoint): Record<string, unknown>;
export function generatePathItem(endpoints: ApiEndpoint[]): Record<string, unknown>;
export function generateOpenAPISpec(config: APISpecConfig): OpenAPIDocument;
```

#### Attention: Attention System (C-2.12)

```typescript
// attention/attention-system.ts
export interface AttentionSystemState { items; unreadCount; lastFetchedAt; fetchIntervalMs; categories; }
export function createAttentionSystemState(overrides?): AttentionSystemState;
export function addItems(state, newItems): AttentionSystemState;
export function markRead(state, itemIds): AttentionSystemState;
export function markAllRead(state): AttentionSystemState;
export function dismissItem(state, itemId): AttentionSystemState;
export function filterByCategory(state, category): AttentionItem[];
export function getUnreadItems(state): AttentionItem[];
export function filterBySeverity(state, severity): AttentionItem[];
```

---

## 14. @phozart/phz-widgets (v15 Additions)

### Alert-Aware Rendering (7A-A)

Functions for rendering alert state on single-value widgets. Uses
`SingleValueAlertConfig` from shared.

### Micro-Widget Cell Renderers (7A-B)

Four SVG micro-widget renderers for grid cells, plus a bulk registration helper:

```typescript
export function createValueOnlyRenderer(): MicroWidgetRenderer;
export function createSparklineRenderer(): MicroWidgetRenderer;
export function createDeltaRenderer(): MicroWidgetRenderer;
export function createGaugeArcRenderer(): MicroWidgetRenderer;
export function registerAllMicroWidgetRenderers(registry: CellRendererRegistry): void;
```

### Impact Chain State (7A-C)

Headless state machine for impact chain rendering:

```typescript
export interface ImpactChainState { ... }
export interface ComputedChainLayout { nodes: NodePosition[]; edges: ChainEdge[]; ... }
export function initialImpactChainState(nodes: ImpactChainNode[]): ImpactChainState;
export function computeChainLayout(state): ComputedChainLayout;
export function getChainContainerVariant(width): ChainContainerVariant;
export function toggleNodeExpand(state, nodeId): ImpactChainState;
export function resolveConclusion(state): string;
export function computeChainSummary(state): ChainSummary;
```

### Decision Tree Variants (7A-C)

Variant registry for the decision tree widget (tree vs. impact-chain):

```typescript
export interface DecisionTreeVariantEntry { id: string; label: string; description: string; }
export const DECISION_TREE_VARIANTS: DecisionTreeVariantEntry[];
```

### Attention Widget State (7A-D)

Headless state machine for the attention widget:

```typescript
export interface AttentionWidgetState { ... }
export interface PrioritySummary { critical: number; warning: number; info: number; }
export function initialAttentionWidgetState(items): AttentionWidgetState;
export function computePrioritySummary(state): PrioritySummary;
export function getTopItems(state, limit): FilterableAttentionItem[];
```

---

## 15. @phozart/phz-grid (v15 Additions)

### Micro-Widget Cell Resolver (7A-B)

Grid-side resolver for micro-widget cell rendering. Uses the `CellRendererRegistry`
interface from shared, invoked by the grid's cell formatting pipeline.

```typescript
// formatters/micro-widget-cell.ts
export function resolveCellRenderer(
  config: MicroWidgetCellConfig,
  value: unknown,
  columnWidth: number,
  rowHeight: number,
  registry: CellRendererRegistry,
): MicroWidgetRenderResult | null;

export function getMicroWidgetFallbackText(
  config: MicroWidgetCellConfig,
  value: unknown,
): string;
```

---

## Version History

| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| 1.0     | 2026-02-24 | Initial API contracts for all 9 packages     |
| 1.1     | 2026-03-08 | v15: Added shared, viewer, editor packages; engine subsystems (alerts, subscriptions, analytics, api, attention); widget amendments (alert-aware, micro-widget, impact chain, attention); grid micro-widget cell resolver |

---

## Contract Governance

### Change Process

1. All API changes MUST be approved by the solution-architect
2. Breaking changes require major version bump
3. New features require minor version bump
4. Bug fixes and internal changes require patch version bump

### Deprecation Policy

1. Deprecated APIs MUST be marked with `@deprecated` JSDoc tag
2. Deprecation warnings MUST appear in console for 2 major versions
3. Deprecated APIs MUST be removed only in major version releases

### Backward Compatibility

1. All packages (MIT) prioritize stability
2. All packages follow semantic versioning strictly

---

**END OF API CONTRACTS**
