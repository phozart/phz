# Data Model - Phz Grid

**Generated:** 2026-02-24
**Version:** 1.0
**Package:** @phozart/phz-core
**Status:** Draft - Binding Contract

## Overview

This document defines the complete TypeScript data model for phz-grid. All interfaces, types, and state structures are binding contracts that MUST be followed by all implementation agents.

The data model is designed for:
- **Immutability:** All state is immutable (new object per mutation)
- **Type Safety:** Strict TypeScript mode, no `any` types
- **Performance:** Optimized for 1M+ rows with minimal re-renders
- **Extensibility:** Plugin architecture with hook system
- **Framework Agnostic:** Core state lives in headless @phozart/phz-core

---

## Table of Contents

1. [Core Configuration](#1-core-configuration)
2. [Grid State](#2-grid-state)
3. [Column Model](#3-column-model)
4. [Row Model](#4-row-model)
5. [Cell Model](#5-cell-model)
6. [Data Source](#6-data-source)
7. [Feature State - Sort](#7-feature-state---sort)
8. [Feature State - Filter](#8-feature-state---filter)
9. [Feature State - Selection](#9-feature-state---selection)
10. [Feature State - Edit](#10-feature-state---edit)
11. [Feature State - Virtualization](#11-feature-state---virtualization)
12. [Feature State - Scroll](#12-feature-state---scroll)
13. [Responsive State](#13-responsive-state)
14. [Theme State](#14-theme-state)
15. [DuckDB State](#15-duckdb-state)
16. [AI State](#16-ai-state)
17. [Collaboration State](#17-collaboration-state)
18. [Analytics State](#18-analytics-state)
19. [Event System](#19-event-system)
20. [Row Model Pipeline](#20-row-model-pipeline)
21. [Type Guards & Utilities](#21-type-guards--utilities)
22. [Shared Infrastructure Types (`@phozart/phz-shared`)](#22-shared-infrastructure-types-phozartphz-shared)
23. [Viewer State Model (`@phozart/phz-viewer`)](#23-viewer-state-model-phozartphz-viewer)
24. [Editor State Model (`@phozart/phz-editor`)](#24-editor-state-model-phozartphz-editor)
25. [Shared Coordination State Machines](#25-shared-coordination-state-machines)
26. [Relationship: Shared Types and Shell State Machines](#26-relationship-shared-types-and-shell-state-machines)

---

## 1. Core Configuration

### GridConfig

Top-level immutable configuration for grid initialization.

```typescript
/**
 * Top-level grid configuration.
 * This is the single source of truth for grid initialization.
 * All properties are immutable after initialization.
 */
export interface GridConfig<TData = any> {
  /**
   * Unique identifier for this grid instance.
   * Used for state persistence and multi-grid coordination.
   */
  readonly gridId: string;

  /**
   * Column definitions.
   * Order determines initial display order.
   */
  readonly columns: ReadonlyArray<ColumnDefinition<TData>>;

  /**
   * Data source configuration.
   * Can be local array, async callback, or DuckDB query.
   */
  readonly dataSource: DataSource<TData>;

  /**
   * Feature flags to enable/disable functionality.
   * Allows tree-shaking of unused features.
   */
  readonly features: FeatureFlags;

  /**
   * Theme configuration.
   * Can be theme name (string) or full theme object.
   */
  readonly theme?: string | ThemeConfig;

  /**
   * Locale for internationalization.
   * Defaults to browser locale.
   */
  readonly locale?: string;

  /**
   * Accessibility configuration.
   */
  readonly a11y?: AccessibilityConfig;

  /**
   * Performance tuning options.
   */
  readonly performance?: PerformanceConfig;

  /**
   * Default state values.
   * Applied when grid initializes.
   */
  readonly defaultState?: Partial<GridState<TData>>;

  /**
   * Plugin registrations.
   * Hooks and extensions that modify grid behavior.
   */
  readonly plugins?: ReadonlyArray<Plugin>;
}

/**
 * Feature flags for enabling/disabling functionality.
 * Disabled features are tree-shaken from production builds.
 */
export interface FeatureFlags {
  readonly sort?: boolean;
  readonly filter?: boolean;
  readonly selection?: boolean;
  readonly editing?: boolean;
  readonly virtualization?: boolean;
  readonly responsive?: boolean;
  readonly export?: boolean;
  readonly clipboard?: boolean;
  readonly undo?: boolean;
  readonly grouping?: boolean;
  readonly pivoting?: boolean;
  readonly aggregation?: boolean;
  readonly conditionalFormatting?: boolean;
}

/**
 * Accessibility configuration.
 */
export interface AccessibilityConfig {
  /**
   * Enable screen reader announcements.
   * @default true
   */
  readonly announcements?: boolean;

  /**
   * Enable keyboard navigation.
   * @default true
   */
  readonly keyboardNavigation?: boolean;

  /**
   * Minimum tap target size (px).
   * @default 44 (WCAG 2.1 AA)
   */
  readonly minTapTargetSize?: number;

  /**
   * Enable sticky focus for motor impairments.
   * Expands click targets by this radius (px).
   * @default 0 (disabled)
   */
  readonly stickyFocusRadius?: number;

  /**
   * Custom ARIA labels for screen readers.
   */
  readonly ariaLabels?: AriaLabels;
}

export interface AriaLabels {
  readonly gridLabel?: string;
  readonly sortAscending?: string;
  readonly sortDescending?: string;
  readonly filterActive?: string;
  readonly rowSelected?: string;
  readonly cellEditing?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Performance tuning configuration.
 */
export interface PerformanceConfig {
  /**
   * Number of rows to buffer above/below viewport.
   * Higher = smoother scrolling, more memory.
   * @default 5
   */
  readonly overscanRowCount?: number;

  /**
   * Number of columns to buffer left/right of viewport.
   * @default 2
   */
  readonly overscanColumnCount?: number;

  /**
   * Debounce delay for scroll events (ms).
   * @default 16 (~60fps)
   */
  readonly scrollDebounce?: number;

  /**
   * Throttle delay for resize events (ms).
   * @default 100
   */
  readonly resizeThrottle?: number;

  /**
   * Enable Web Worker for background processing.
   * @default false
   */
  readonly useWebWorker?: boolean;

  /**
   * Enable GPU acceleration for rendering.
   * @default true
   */
  readonly gpuAcceleration?: boolean;

  /**
   * Maximum number of DOM nodes in pool.
   * @default 100
   */
  readonly maxNodePoolSize?: number;
}

/**
 * Plugin interface for extending grid behavior.
 */
export interface Plugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly hooks?: PluginHooks;
  readonly init?: (api: GridApi) => void;
  readonly destroy?: () => void;
}

export interface PluginHooks {
  readonly onBeforeInit?: (config: GridConfig) => GridConfig | false;
  readonly onAfterInit?: (api: GridApi) => void;
  readonly onBeforeStateChange?: (delta: StateChangeDelta) => StateChangeDelta | false;
  readonly onAfterStateChange?: (delta: StateChangeDelta) => void;
  readonly onBeforeRender?: (state: GridState) => GridState | false;
  readonly onAfterRender?: (state: GridState) => void;
  readonly onBeforeCellRender?: (cell: CellRenderContext) => CellRenderContext | false;
  readonly onAfterCellRender?: (cell: CellRenderContext) => void;
  readonly onBeforeDestroy?: () => void | false;
  readonly onAfterDestroy?: () => void;
}
```

---

## 2. Grid State

### GridState

Complete immutable state tree for the entire grid.

```typescript
/**
 * Complete grid state tree.
 * Immutable - every mutation produces a new state object.
 * Designed for efficient diffing and time-travel debugging.
 */
export interface GridState<TData = any> {
  /**
   * Version counter for state changes.
   * Increments on every mutation.
   */
  readonly version: number;

  /**
   * Timestamp of last state change (ms since epoch).
   */
  readonly lastModified: number;

  /**
   * Current sort configuration.
   */
  readonly sort: SortState;

  /**
   * Current filter configuration.
   */
  readonly filter: FilterState;

  /**
   * Current selection state.
   */
  readonly selection: SelectionState;

  /**
   * Current edit state.
   */
  readonly edit: EditState;

  /**
   * Virtualization state (viewport, scroll position).
   */
  readonly virtualization: VirtualizationState;

  /**
   * Scroll state.
   */
  readonly scroll: ScrollState;

  /**
   * Responsive layout state.
   */
  readonly responsive: ResponsiveState;

  /**
   * Active theme state.
   */
  readonly theme: ThemeState;

  /**
   * Column visibility, order, and width.
   */
  readonly columns: ColumnState;

  /**
   * Row model state (filtered, sorted, grouped).
   */
  readonly rows: RowModelState<TData>;

  /**
   * Advanced features state (optional).
   */
  readonly enterprise?: EnterpriseState;

  /**
   * Undo/redo history (if enabled).
   */
  readonly history?: HistoryState;

  /**
   * Focus state (keyboard navigation).
   */
  readonly focus: FocusState;

  /**
   * Loading/error states.
   */
  readonly status: StatusState;
}

/**
 * Column state (visibility, order, width).
 */
export interface ColumnState {
  /**
   * Column visibility map.
   * Key: columnId, Value: visible (true/false)
   */
  readonly visibility: ReadonlyMap<string, boolean>;

  /**
   * Column display order (left to right).
   * Array of columnIds.
   */
  readonly order: ReadonlyArray<string>;

  /**
   * Column widths (px).
   * Key: columnId, Value: width in pixels
   */
  readonly widths: ReadonlyMap<string, number>;

  /**
   * Pinned columns (frozen left/right).
   */
  readonly pinned: {
    readonly left: ReadonlyArray<string>;
    readonly right: ReadonlyArray<string>;
  };
}

/**
 * Focus state for keyboard navigation.
 */
export interface FocusState {
  /**
   * Current focus mode.
   */
  readonly mode: FocusMode;

  /**
   * Currently focused cell position.
   * Null if no cell is focused.
   */
  readonly cell: CellPosition | null;

  /**
   * Focus region (header, body, footer).
   */
  readonly region: FocusRegion;

  /**
   * Roving tabindex position.
   */
  readonly tabindex: number;
}

export type FocusMode = 'none' | 'cell' | 'row' | 'column' | 'grid';
export type FocusRegion = 'header' | 'body' | 'footer' | 'filter' | 'pagination';

/**
 * Loading and error status.
 */
export interface StatusState {
  /**
   * Is grid currently loading data?
   */
  readonly isLoading: boolean;

  /**
   * Is grid currently scrolling?
   */
  readonly isScrolling: boolean;

  /**
   * Current error (if any).
   */
  readonly error: GridError | null;

  /**
   * Data load progress (0-100).
   */
  readonly loadProgress: number;
}

export interface GridError {
  readonly code: string;
  readonly message: string;
  readonly details?: any;
  readonly timestamp: number;
}

/**
 * Undo/redo history state.
 */
export interface HistoryState {
  /**
   * Past states (undo stack).
   */
  readonly past: ReadonlyArray<GridState>;

  /**
   * Future states (redo stack).
   */
  readonly future: ReadonlyArray<GridState>;

  /**
   * Maximum history size.
   */
  readonly maxSize: number;

  /**
   * Can undo?
   */
  readonly canUndo: boolean;

  /**
   * Can redo?
   */
  readonly canRedo: boolean;
}

/**
 * Advanced features state (optional, loaded on demand).
 */
export interface EnterpriseState {
  readonly duckdb?: DuckDBState;
  readonly ai?: AIState;
  readonly collaboration?: CollaborationState;
  readonly analytics?: AnalyticsState;
}
```

---

## 3. Column Model

### ColumnDefinition

Column configuration and metadata.

```typescript
/**
 * Column definition.
 * Immutable configuration for a single column.
 */
export interface ColumnDefinition<TData = any, TValue = any> {
  /**
   * Unique column identifier.
   * Used for state persistence and API calls.
   */
  readonly id: string;

  /**
   * Field name in data object.
   * Supports dot notation (e.g., "user.name").
   */
  readonly field: string;

  /**
   * Display name in column header.
   */
  readonly headerName: string;

  /**
   * Column data type.
   * Determines default renderer, editor, comparator.
   */
  readonly type: ColumnType;

  /**
   * Column width (px or 'auto').
   * @default 'auto'
   */
  readonly width?: number | 'auto';

  /**
   * Minimum width (px).
   * @default 50
   */
  readonly minWidth?: number;

  /**
   * Maximum width (px).
   * @default Infinity
   */
  readonly maxWidth?: number;

  /**
   * Is column resizable?
   * @default true
   */
  readonly resizable?: boolean;

  /**
   * Is column sortable?
   * @default true
   */
  readonly sortable?: boolean;

  /**
   * Is column filterable?
   * @default true
   */
  readonly filterable?: boolean;

  /**
   * Is column editable?
   * @default false
   */
  readonly editable?: boolean;

  /**
   * Column visibility priority (responsive).
   * 1 = always visible, 2 = tablet+, 3 = desktop only
   * @default 2
   */
  readonly priority?: 1 | 2 | 3;

  /**
   * Initial visibility.
   * @default true
   */
  readonly visible?: boolean;

  /**
   * Is column pinned (frozen)?
   */
  readonly pinned?: 'left' | 'right' | false;

  /**
   * Custom cell renderer.
   */
  readonly cellRenderer?: CellRenderer<TData, TValue>;

  /**
   * Custom cell editor.
   */
  readonly cellEditor?: CellEditor<TData, TValue>;

  /**
   * Cell value validator.
   */
  readonly validator?: CellValidator<TValue>;

  /**
   * Custom sort comparator.
   */
  readonly comparator?: SortComparator<TValue>;

  /**
   * Cell value formatter (display transform).
   */
  readonly valueFormatter?: ValueFormatter<TValue>;

  /**
   * Cell value getter (computed values).
   */
  readonly valueGetter?: ValueGetter<TData, TValue>;

  /**
   * Cell value setter (transform on edit).
   */
  readonly valueSetter?: ValueSetter<TData, TValue>;

  /**
   * Header renderer.
   */
  readonly headerRenderer?: HeaderRenderer;

  /**
   * Footer renderer (aggregation row).
   */
  readonly footerRenderer?: FooterRenderer;

  /**
   * Cell CSS class name (static or function).
   */
  readonly cellClass?: string | CellClassFn<TData, TValue>;

  /**
   * Cell CSS styles (static or function).
   */
  readonly cellStyle?: CSSProperties | CellStyleFn<TData, TValue>;

  /**
   * Header tooltip text.
   */
  readonly headerTooltip?: string;

  /**
   * Custom metadata (user-defined).
   */
  readonly metadata?: Record<string, any>;
}

export type ColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'url'
  | 'phone'
  | 'json'
  | 'custom';

/**
 * Cell renderer function.
 * Returns HTML string or DOM element.
 */
export type CellRenderer<TData = any, TValue = any> = (
  context: CellRenderContext<TData, TValue>
) => string | HTMLElement | null;

export interface CellRenderContext<TData = any, TValue = any> {
  readonly value: TValue;
  readonly row: RowData<TData>;
  readonly column: ColumnDefinition<TData, TValue>;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly isSelected: boolean;
  readonly isEditing: boolean;
  readonly isFocused: boolean;
  readonly api: GridApi;
}

/**
 * Cell editor component.
 */
export type CellEditor<TData = any, TValue = any> = (
  context: CellEditorContext<TData, TValue>
) => CellEditorInstance;

export interface CellEditorContext<TData = any, TValue = any> {
  readonly value: TValue;
  readonly row: RowData<TData>;
  readonly column: ColumnDefinition<TData, TValue>;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly api: GridApi;
}

export interface CellEditorInstance {
  /**
   * Get current editor value.
   */
  getValue(): any;

  /**
   * Focus the editor input.
   */
  focus(): void;

  /**
   * Is editor value valid?
   */
  isValid(): boolean;

  /**
   * Destroy editor and clean up.
   */
  destroy(): void;
}

/**
 * Cell validator function.
 */
export type CellValidator<TValue = any> = (
  value: TValue,
  context: CellValidationContext
) => CellValidationResult;

export interface CellValidationContext {
  readonly row: RowData;
  readonly column: ColumnDefinition;
  readonly rowIndex: number;
  readonly columnIndex: number;
}

export type CellValidationResult =
  | { valid: true }
  | { valid: false; message: string; code?: string };

/**
 * Sort comparator function.
 * Returns -1 (a < b), 0 (a == b), or 1 (a > b).
 */
export type SortComparator<TValue = any> = (a: TValue, b: TValue) => number;

/**
 * Value formatter (display transform).
 * Example: number to currency string.
 */
export type ValueFormatter<TValue = any> = (value: TValue) => string;

/**
 * Value getter (computed column values).
 */
export type ValueGetter<TData = any, TValue = any> = (row: TData) => TValue;

/**
 * Value setter (transform on edit).
 */
export type ValueSetter<TData = any, TValue = any> = (
  row: TData,
  value: TValue
) => TData;

/**
 * Header renderer function.
 */
export type HeaderRenderer = (context: HeaderRenderContext) => string | HTMLElement;

export interface HeaderRenderContext {
  readonly column: ColumnDefinition;
  readonly columnIndex: number;
  readonly sortState: SortState;
  readonly filterState: FilterState;
  readonly api: GridApi;
}

/**
 * Footer renderer (aggregation row).
 */
export type FooterRenderer = (context: FooterRenderContext) => string | HTMLElement;

export interface FooterRenderContext {
  readonly column: ColumnDefinition;
  readonly columnIndex: number;
  readonly rows: ReadonlyArray<RowData>;
  readonly api: GridApi;
}

/**
 * Cell CSS class function.
 */
export type CellClassFn<TData = any, TValue = any> = (
  context: CellRenderContext<TData, TValue>
) => string;

/**
 * Cell CSS style function.
 */
export type CellStyleFn<TData = any, TValue = any> = (
  context: CellRenderContext<TData, TValue>
) => CSSProperties;

export interface CSSProperties {
  [key: string]: string | number;
}
```

---

## 4. Row Model

### RowData

Row data with metadata.

```typescript
/**
 * Row data with metadata.
 * Generic over row data type.
 */
export interface RowData<TData = any> {
  /**
   * Unique row identifier.
   * Auto-generated if not provided.
   */
  readonly id: RowId;

  /**
   * Actual data record.
   */
  readonly data: TData;

  /**
   * Row metadata.
   */
  readonly metadata: RowMetadata;
}

/**
 * Row identifier type.
 * String or number for maximum compatibility.
 */
export type RowId = string | number;

/**
 * Row metadata (selection, editing, expansion state).
 */
export interface RowMetadata {
  /**
   * Is row selected?
   */
  readonly selected: boolean;

  /**
   * Is row in edit mode?
   */
  readonly editing: boolean;

  /**
   * Is row expanded (grouping)?
   */
  readonly expanded: boolean;

  /**
   * Has row been modified (dirty flag)?
   */
  readonly dirty: boolean;

  /**
   * Row validation errors.
   */
  readonly errors: ReadonlyArray<RowValidationError>;

  /**
   * Row index in original dataset.
   */
  readonly originalIndex: number;

  /**
   * Row index in current view (after filtering/sorting).
   */
  readonly viewIndex: number;

  /**
   * Group level (0 = root, 1 = first level, etc.).
   */
  readonly groupLevel: number;

  /**
   * Parent row ID (for hierarchical data).
   */
  readonly parentId: RowId | null;

  /**
   * Child row IDs (for hierarchical data).
   */
  readonly childIds: ReadonlyArray<RowId>;

  /**
   * Custom metadata (user-defined).
   */
  readonly custom?: Record<string, any>;
}

export interface RowValidationError {
  readonly columnId: string;
  readonly message: string;
  readonly code?: string;
}

/**
 * Row model state (all rows in grid).
 */
export interface RowModelState<TData = any> {
  /**
   * All rows (original order).
   */
  readonly all: ReadonlyArray<RowData<TData>>;

  /**
   * Row ID to row data map (fast lookup).
   */
  readonly byId: ReadonlyMap<RowId, RowData<TData>>;

  /**
   * Total row count (before filtering).
   */
  readonly totalCount: number;

  /**
   * Filtered row count.
   */
  readonly filteredCount: number;

  /**
   * Selected row IDs.
   */
  readonly selectedIds: ReadonlySet<RowId>;

  /**
   * Dirty row IDs (modified but not committed).
   */
  readonly dirtyIds: ReadonlySet<RowId>;
}
```

---

## 5. Cell Model

### CellPosition

Cell coordinate (row + column).

```typescript
/**
 * Cell position coordinate.
 * Uniquely identifies a cell in the grid.
 */
export interface CellPosition {
  /**
   * Row index (0-based).
   */
  readonly rowIndex: number;

  /**
   * Column index (0-based).
   */
  readonly columnIndex: number;

  /**
   * Row ID.
   */
  readonly rowId: RowId;

  /**
   * Column ID.
   */
  readonly columnId: string;
}

/**
 * Cell range (rectangular selection).
 */
export interface CellRange {
  /**
   * Top-left cell (anchor).
   */
  readonly start: CellPosition;

  /**
   * Bottom-right cell (focus).
   */
  readonly end: CellPosition;
}

/**
 * Cell value type.
 */
export type CellValue = string | number | boolean | Date | null | undefined;
```

---

## 6. Data Source

### DataSource

Pluggable data source interface.

```typescript
/**
 * Data source interface.
 * Supports local arrays, async callbacks, and DuckDB queries.
 */
export type DataSource<TData = any> =
  | LocalDataSource<TData>
  | AsyncDataSource<TData>
  | DuckDBDataSource;

/**
 * Local data source (in-memory array).
 */
export interface LocalDataSource<TData = any> {
  readonly type: 'local';
  readonly data: ReadonlyArray<TData>;
  readonly rowIdField?: keyof TData;
}

/**
 * Async data source (lazy loading).
 */
export interface AsyncDataSource<TData = any> {
  readonly type: 'async';
  readonly fetchData: (request: DataFetchRequest) => Promise<DataFetchResponse<TData>>;
  readonly rowIdField?: keyof TData;
}

export interface DataFetchRequest {
  readonly startRow: number;
  readonly endRow: number;
  readonly sort?: ReadonlyArray<SortModel>;
  readonly filter?: FilterModel;
}

export interface DataFetchResponse<TData = any> {
  readonly rows: ReadonlyArray<TData>;
  readonly totalCount: number;
}

/**
 * DuckDB data source.
 */
export interface DuckDBDataSource {
  readonly type: 'duckdb';
  readonly query: string;
  readonly connection?: DuckDBConnection;
  readonly streaming?: boolean;
}

export interface DuckDBConnection {
  readonly id: string;
  readonly status: 'connected' | 'connecting' | 'disconnected' | 'error';
  readonly database?: string;
}
```

---

## 7. Feature State - Sort

### SortState

Active sort configuration.

```typescript
/**
 * Sort state.
 * Supports single and multi-column sorting.
 */
export interface SortState {
  /**
   * Active sorts (in priority order).
   */
  readonly sorts: ReadonlyArray<SortModel>;

  /**
   * Custom comparators by column ID.
   */
  readonly comparators: ReadonlyMap<string, SortComparator>;
}

/**
 * Single sort model.
 */
export interface SortModel {
  /**
   * Column ID to sort by.
   */
  readonly columnId: string;

  /**
   * Sort direction.
   */
  readonly direction: SortDirection;

  /**
   * Sort priority (0 = highest priority).
   */
  readonly priority: number;
}

export type SortDirection = 'asc' | 'desc';
```

---

## 8. Feature State - Filter

### FilterState

Active filter configuration.

```typescript
/**
 * Filter state.
 * Supports single and multi-column filtering with AND/OR logic.
 */
export interface FilterState {
  /**
   * Active filters.
   */
  readonly filters: ReadonlyArray<FilterModel>;

  /**
   * Filter logic (AND = all must match, OR = any must match).
   */
  readonly logic: FilterLogic;

  /**
   * Saved filter presets.
   */
  readonly presets: ReadonlyArray<FilterPreset>;

  /**
   * Active preset ID (if any).
   */
  readonly activePresetId: string | null;
}

/**
 * Single filter model.
 */
export interface FilterModel {
  /**
   * Column ID to filter.
   */
  readonly columnId: string;

  /**
   * Filter operator.
   */
  readonly operator: FilterOperator;

  /**
   * Filter value(s).
   */
  readonly value: FilterValue;

  /**
   * Filter type (inferred from column type).
   */
  readonly type: FilterType;
}

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'isEmpty'
  | 'isNotEmpty';

export type FilterValue = CellValue | ReadonlyArray<CellValue>;

export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export type FilterLogic = 'AND' | 'OR';

/**
 * Saved filter preset.
 */
export interface FilterPreset {
  readonly id: string;
  readonly name: string;
  readonly filters: ReadonlyArray<FilterModel>;
  readonly logic: FilterLogic;
  readonly createdAt: number;
  readonly updatedAt: number;
}
```

---

## 9. Feature State - Selection

### SelectionState

Row and cell selection state.

```typescript
/**
 * Selection state.
 * Supports single/multi row selection and cell range selection.
 */
export interface SelectionState {
  /**
   * Selected row IDs.
   */
  readonly selectedRows: ReadonlySet<RowId>;

  /**
   * Selected cells (for range selection).
   */
  readonly selectedCells: ReadonlySet<string>; // Serialized CellPosition

  /**
   * Selection mode.
   */
  readonly mode: SelectionMode;

  /**
   * Anchor cell (for range selection).
   * Starting point of Shift+Click range.
   */
  readonly anchorCell: CellPosition | null;

  /**
   * Current selection range (if any).
   */
  readonly range: CellRange | null;

  /**
   * Is "select all" active?
   */
  readonly isAllSelected: boolean;
}

export type SelectionMode = 'none' | 'single' | 'multi' | 'range';

/**
 * Serialize cell position to string key.
 */
export function serializeCellPosition(pos: CellPosition): string {
  return `${pos.rowId}:${pos.columnId}`;
}

/**
 * Deserialize cell position from string key.
 */
export function deserializeCellPosition(key: string): CellPosition {
  const [rowId, columnId] = key.split(':');
  // Note: rowIndex and columnIndex must be resolved separately
  return { rowId, columnId, rowIndex: -1, columnIndex: -1 };
}
```

---

## 10. Feature State - Edit

### EditState

Cell editing state machine.

```typescript
/**
 * Edit state (discriminated union).
 * State machine for cell editing lifecycle.
 */
export type EditState =
  | EditStateIdle
  | EditStateEditing
  | EditStateValidating
  | EditStateCommitting
  | EditStateError;

/**
 * Idle state (no editing in progress).
 */
export interface EditStateIdle {
  readonly type: 'idle';
}

/**
 * Editing state (cell editor is active).
 */
export interface EditStateEditing {
  readonly type: 'editing';
  readonly cell: CellPosition;
  readonly originalValue: CellValue;
  readonly currentValue: CellValue;
  readonly startedAt: number;
}

/**
 * Validating state (async validation in progress).
 */
export interface EditStateValidating {
  readonly type: 'validating';
  readonly cell: CellPosition;
  readonly value: CellValue;
}

/**
 * Committing state (saving value).
 */
export interface EditStateCommitting {
  readonly type: 'committing';
  readonly cell: CellPosition;
  readonly value: CellValue;
}

/**
 * Error state (validation or commit failed).
 */
export interface EditStateError {
  readonly type: 'error';
  readonly cell: CellPosition;
  readonly value: CellValue;
  readonly error: CellValidationResult;
}

/**
 * Pending edits (batch editing).
 */
export interface PendingEdits {
  readonly edits: ReadonlyMap<string, CellValue>; // Key: serialized CellPosition
  readonly validationErrors: ReadonlyMap<string, CellValidationResult>;
}
```

---

## 11. Feature State - Virtualization

### VirtualizationState

Viewport and virtual scrolling state.

```typescript
/**
 * Virtualization state.
 * Tracks visible viewport and virtual scroll position.
 */
export interface VirtualizationState {
  /**
   * Visible row range (indices).
   */
  readonly visibleRows: {
    readonly start: number;
    readonly end: number;
  };

  /**
   * Visible column range (indices).
   */
  readonly visibleColumns: {
    readonly start: number;
    readonly end: number;
  };

  /**
   * Total virtual height (all rows, px).
   */
  readonly totalHeight: number;

  /**
   * Total virtual width (all columns, px).
   */
  readonly totalWidth: number;

  /**
   * Row height cache (for dynamic heights).
   * Key: rowIndex, Value: height in pixels
   */
  readonly rowHeights: ReadonlyMap<number, number>;

  /**
   * Default row height (px).
   */
  readonly defaultRowHeight: number;

  /**
   * Column width cache.
   * Key: columnIndex, Value: width in pixels
   */
  readonly columnWidths: ReadonlyMap<number, number>;

  /**
   * Default column width (px).
   */
  readonly defaultColumnWidth: number;

  /**
   * DOM node pool size.
   */
  readonly nodePoolSize: number;

  /**
   * Is measurement in progress?
   */
  readonly isMeasuring: boolean;
}
```

---

## 12. Feature State - Scroll

### ScrollState

Scroll position and dimensions.

```typescript
/**
 * Scroll state.
 */
export interface ScrollState {
  /**
   * Vertical scroll position (px from top).
   */
  readonly scrollTop: number;

  /**
   * Horizontal scroll position (px from left).
   */
  readonly scrollLeft: number;

  /**
   * Total scrollable height (px).
   */
  readonly scrollHeight: number;

  /**
   * Total scrollable width (px).
   */
  readonly scrollWidth: number;

  /**
   * Viewport height (visible area, px).
   */
  readonly viewportHeight: number;

  /**
   * Viewport width (visible area, px).
   */
  readonly viewportWidth: number;

  /**
   * Is currently scrolling?
   */
  readonly isScrolling: boolean;

  /**
   * Scroll direction.
   */
  readonly direction: ScrollDirection;

  /**
   * Last scroll timestamp.
   */
  readonly lastScrollTime: number;
}

export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | 'none';
```

---

## 13. Responsive State

### ResponsiveState

Responsive layout and breakpoint state.

```typescript
/**
 * Responsive state.
 * Manages layout adaptation for different screen sizes.
 */
export interface ResponsiveState {
  /**
   * Current breakpoint.
   */
  readonly currentBreakpoint: Breakpoint;

  /**
   * Layout mode.
   */
  readonly layoutMode: LayoutMode;

  /**
   * Visible column IDs (based on priority and breakpoint).
   */
  readonly visibleColumnIds: ReadonlyArray<string>;

  /**
   * Hidden column IDs.
   */
  readonly hiddenColumnIds: ReadonlyArray<string>;

  /**
   * Container width (px).
   */
  readonly containerWidth: number;

  /**
   * Container height (px).
   */
  readonly containerHeight: number;

  /**
   * Is mobile device (touch + small screen)?
   */
  readonly isMobile: boolean;

  /**
   * Is tablet device?
   */
  readonly isTablet: boolean;

  /**
   * Is desktop device?
   */
  readonly isDesktop: boolean;
}

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type LayoutMode = 'table' | 'card-stack' | 'list';

/**
 * Breakpoint configuration.
 */
export interface BreakpointConfig {
  readonly xs: number; // 0-599px
  readonly sm: number; // 600-959px
  readonly md: number; // 960-1279px
  readonly lg: number; // 1280-1919px
  readonly xl: number; // 1920px+
}

export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};
```

---

## 14. Theme State

### ThemeState

Active theme and tokens.

```typescript
/**
 * Theme state.
 */
export interface ThemeState {
  /**
   * Active theme name.
   */
  readonly themeName: string;

  /**
   * Color scheme.
   */
  readonly colorScheme: ColorScheme;

  /**
   * Theme tokens (three-layer system).
   */
  readonly tokens: ThemeTokens;

  /**
   * Custom token overrides.
   */
  readonly overrides: Partial<ThemeTokens>;
}

export type ColorScheme = 'light' | 'dark' | 'auto';

/**
 * Three-layer theme token system.
 */
export interface ThemeTokens {
  /**
   * Layer 1: Primitive tokens (brand colors, base values).
   */
  readonly primitive: PrimitiveTokens;

  /**
   * Layer 2: Semantic tokens (purpose-based).
   */
  readonly semantic: SemanticTokens;

  /**
   * Layer 3: Component tokens (grid-specific).
   */
  readonly component: ComponentTokens;
}

/**
 * Layer 1: Primitive tokens.
 */
export interface PrimitiveTokens {
  // Brand colors
  readonly colorPrimary: string;
  readonly colorSecondary: string;
  readonly colorSuccess: string;
  readonly colorWarning: string;
  readonly colorError: string;
  readonly colorInfo: string;

  // Neutral colors
  readonly colorNeutral0: string;  // White
  readonly colorNeutral10: string;
  readonly colorNeutral20: string;
  readonly colorNeutral30: string;
  readonly colorNeutral40: string;
  readonly colorNeutral50: string;
  readonly colorNeutral60: string;
  readonly colorNeutral70: string;
  readonly colorNeutral80: string;
  readonly colorNeutral90: string;
  readonly colorNeutral100: string; // Black

  // Typography
  readonly fontFamily: string;
  readonly fontSizeXs: string;
  readonly fontSizeSm: string;
  readonly fontSizeMd: string;
  readonly fontSizeLg: string;
  readonly fontSizeXl: string;
  readonly fontWeightNormal: number;
  readonly fontWeightMedium: number;
  readonly fontWeightBold: number;

  // Spacing
  readonly spaceXs: string;
  readonly spaceSm: string;
  readonly spaceMd: string;
  readonly spaceLg: string;
  readonly spaceXl: string;

  // Border radius
  readonly radiusNone: string;
  readonly radiusSm: string;
  readonly radiusMd: string;
  readonly radiusLg: string;
  readonly radiusFull: string;

  // Shadows
  readonly shadowSm: string;
  readonly shadowMd: string;
  readonly shadowLg: string;
}

/**
 * Layer 2: Semantic tokens.
 */
export interface SemanticTokens {
  readonly colorBackground: string;
  readonly colorBackgroundAlt: string;
  readonly colorForeground: string;
  readonly colorBorder: string;
  readonly colorBorderFocus: string;
  readonly colorSelection: string;
  readonly colorHover: string;
  readonly colorActive: string;
  readonly colorDisabled: string;
}

/**
 * Layer 3: Component tokens (grid-specific).
 */
export interface ComponentTokens {
  // Grid container
  readonly gridBorderColor: string;
  readonly gridBorderWidth: string;
  readonly gridBorderRadius: string;
  readonly gridBackground: string;

  // Header
  readonly headerBackground: string;
  readonly headerForeground: string;
  readonly headerBorderColor: string;
  readonly headerPadding: string;
  readonly headerHeight: string;
  readonly headerFontWeight: number;

  // Cell
  readonly cellPadding: string;
  readonly cellBorderColor: string;
  readonly cellBackground: string;
  readonly cellForeground: string;
  readonly cellHoverBackground: string;
  readonly cellSelectedBackground: string;
  readonly cellFocusBorderColor: string;
  readonly cellFocusBorderWidth: string;

  // Row
  readonly rowHeight: string;
  readonly rowBorderColor: string;
  readonly rowHoverBackground: string;
  readonly rowSelectedBackground: string;
  readonly rowAltBackground: string; // Striped rows

  // Footer
  readonly footerBackground: string;
  readonly footerForeground: string;
  readonly footerBorderColor: string;
  readonly footerPadding: string;
  readonly footerHeight: string;

  // Scrollbar
  readonly scrollbarWidth: string;
  readonly scrollbarThumbColor: string;
  readonly scrollbarTrackColor: string;

  // Loading indicator
  readonly loadingSpinnerColor: string;
  readonly loadingOverlayBackground: string;
}

/**
 * Theme configuration.
 */
export interface ThemeConfig {
  readonly name: string;
  readonly colorScheme: ColorScheme;
  readonly tokens: ThemeTokens;
}
```

---

## 15. DuckDB State

### DuckDBState

DuckDB-WASM integration state.

```typescript
/**
 * DuckDB state.
 */
export interface DuckDBState {
  /**
   * Connection status.
   */
  readonly connection: DuckDBConnectionState;

  /**
   * Active queries.
   */
  readonly activeQueries: ReadonlyArray<DuckDBQuery>;

  /**
   * Query results cache.
   */
  readonly resultsCache: ReadonlyMap<string, DuckDBQueryResult>;

  /**
   * Schema cache (table/column metadata).
   */
  readonly schemaCache: DuckDBSchemaCache;

  /**
   * Query history.
   */
  readonly queryHistory: ReadonlyArray<DuckDBQueryHistoryEntry>;
}

export interface DuckDBConnectionState {
  readonly status: 'idle' | 'connecting' | 'connected' | 'error';
  readonly database: string | null;
  readonly tables: ReadonlyArray<string>;
  readonly error: GridError | null;
}

export interface DuckDBQuery {
  readonly id: string;
  readonly sql: string;
  readonly status: 'pending' | 'running' | 'complete' | 'error';
  readonly startTime: number;
  readonly endTime: number | null;
  readonly progress: number; // 0-100
  readonly error: GridError | null;
}

export interface DuckDBQueryResult {
  readonly queryId: string;
  readonly rows: ReadonlyArray<any>;
  readonly columns: ReadonlyArray<DuckDBColumn>;
  readonly rowCount: number;
  readonly executionTime: number;
}

export interface DuckDBColumn {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
}

export interface DuckDBSchemaCache {
  readonly tables: ReadonlyMap<string, DuckDBTableSchema>;
  readonly lastUpdated: number;
}

export interface DuckDBTableSchema {
  readonly name: string;
  readonly columns: ReadonlyArray<DuckDBColumn>;
  readonly rowCount: number;
  readonly size: number; // bytes
}

export interface DuckDBQueryHistoryEntry {
  readonly id: string;
  readonly sql: string;
  readonly executedAt: number;
  readonly executionTime: number;
  readonly rowCount: number;
  readonly success: boolean;
}
```

---

## 16. AI State

### AIState

AI toolkit state.

```typescript
/**
 * AI state.
 */
export interface AIState {
  /**
   * AI provider configuration.
   */
  readonly provider: AIProviderConfig;

  /**
   * Chat history (natural language query).
   */
  readonly chatHistory: ReadonlyArray<AIChatMessage>;

  /**
   * Generated SQL queries.
   */
  readonly generatedQueries: ReadonlyArray<AIGeneratedQuery>;

  /**
   * Inferred schema (from data analysis).
   */
  readonly inferredSchema: AIInferredSchema | null;

  /**
   * Anomaly detection results.
   */
  readonly anomalies: ReadonlyArray<AIAnomaly>;

  /**
   * AI processing status.
   */
  readonly status: AIStatus;
}

export interface AIProviderConfig {
  readonly provider: 'openai' | 'anthropic' | 'google';
  readonly apiKey: string;
  readonly model: string;
  readonly endpoint?: string;
}

export interface AIChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly content: string;
  readonly timestamp: number;
}

export interface AIGeneratedQuery {
  readonly id: string;
  readonly naturalLanguage: string;
  readonly sql: string;
  readonly confidence: number; // 0-1
  readonly explanation: string;
  readonly generatedAt: number;
}

export interface AIInferredSchema {
  readonly columns: ReadonlyArray<AIInferredColumn>;
  readonly confidence: number; // 0-1
  readonly inferredAt: number;
}

export interface AIInferredColumn {
  readonly name: string;
  readonly type: ColumnType;
  readonly nullable: boolean;
  readonly constraints: ReadonlyArray<string>;
  readonly confidence: number; // 0-1
  readonly reasoning: string;
}

export interface AIAnomaly {
  readonly id: string;
  readonly rowId: RowId;
  readonly columnId: string;
  readonly value: CellValue;
  readonly anomalyType: AIAnomalyType;
  readonly severity: 'low' | 'medium' | 'high';
  readonly explanation: string;
  readonly confidence: number; // 0-1
}

export type AIAnomalyType =
  | 'outlier'
  | 'rare-value'
  | 'missing-value'
  | 'type-mismatch'
  | 'constraint-violation'
  | 'duplicate'
  | 'suspicious-pattern';

export interface AIStatus {
  readonly isProcessing: boolean;
  readonly currentTask: string | null;
  readonly progress: number; // 0-100
  readonly error: GridError | null;
}
```

---

## 17. Collaboration State

### CollaborationState

Real-time collaboration state (Yjs CRDT).

```typescript
/**
 * Collaboration state.
 */
export interface CollaborationState {
  /**
   * Session information.
   */
  readonly session: CollaborationSession;

  /**
   * Connected users.
   */
  readonly users: ReadonlyArray<CollaborationUser>;

  /**
   * User presence map.
   * Key: userId, Value: current cell position
   */
  readonly presence: ReadonlyMap<string, CellPosition | null>;

  /**
   * Sync status.
   */
  readonly syncStatus: SyncStatus;

  /**
   * Pending changes (not yet synced).
   */
  readonly pendingChanges: ReadonlyArray<ChangeOperation>;

  /**
   * Change history (CRDT operation log).
   */
  readonly changeHistory: ReadonlyArray<ChangeOperation>;

  /**
   * Conflict resolution queue.
   */
  readonly conflicts: ReadonlyArray<ConflictResolution>;
}

export interface CollaborationSession {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly createdBy: string;
  readonly shareUrl: string;
  readonly isActive: boolean;
}

export interface CollaborationUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
  readonly color: string; // Unique color for presence indicator
  readonly joinedAt: number;
  readonly isActive: boolean;
}

export interface SyncStatus {
  readonly status: 'synced' | 'syncing' | 'offline' | 'error';
  readonly lastSyncTime: number;
  readonly pendingOperations: number;
  readonly error: GridError | null;
}

export interface ChangeOperation {
  readonly id: string;
  readonly type: ChangeOperationType;
  readonly userId: string;
  readonly timestamp: number;
  readonly data: any;
}

export type ChangeOperationType =
  | 'cell-edit'
  | 'row-insert'
  | 'row-delete'
  | 'column-insert'
  | 'column-delete'
  | 'column-move'
  | 'sort'
  | 'filter';

export interface ConflictResolution {
  readonly id: string;
  readonly conflictType: 'edit' | 'delete' | 'structural';
  readonly localOperation: ChangeOperation;
  readonly remoteOperation: ChangeOperation;
  readonly resolution: 'local' | 'remote' | 'merge' | 'manual';
  readonly resolvedAt: number | null;
}
```

---

## 18. Analytics State

### AnalyticsState

Advanced analytics state.

```typescript
/**
 * Analytics state.
 */
export interface AnalyticsState {
  /**
   * Row grouping configuration.
   */
  readonly grouping: GroupingConfig | null;

  /**
   * Pivot table configuration.
   */
  readonly pivot: PivotConfig | null;

  /**
   * Aggregation functions.
   */
  readonly aggregations: ReadonlyArray<AggregationConfig>;

  /**
   * Conditional formatting rules.
   */
  readonly conditionalFormatting: ReadonlyArray<ConditionalFormattingRule>;

  /**
   * Chart configurations (integrated charts).
   */
  readonly charts: ReadonlyArray<ChartConfig>;
}

export interface GroupingConfig {
  readonly columnIds: ReadonlyArray<string>;
  readonly expandedGroupIds: ReadonlySet<string>;
  readonly showGroupFooters: boolean;
  readonly aggregations: ReadonlyArray<AggregationConfig>;
}

export interface PivotConfig {
  readonly rowFields: ReadonlyArray<string>;
  readonly columnFields: ReadonlyArray<string>;
  readonly valueFields: ReadonlyArray<PivotValueField>;
  readonly showTotals: boolean;
  readonly showSubtotals: boolean;
}

export interface PivotValueField {
  readonly columnId: string;
  readonly aggregation: AggregationFunction;
  readonly label: string;
}

export interface AggregationConfig {
  readonly columnId: string;
  readonly function: AggregationFunction;
  readonly label: string;
}

export type AggregationFunction =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'countDistinct'
  | 'median'
  | 'stddev'
  | 'variance'
  | 'first'
  | 'last'
  | 'custom';

export interface ConditionalFormattingRule {
  readonly id: string;
  readonly columnId: string;
  readonly type: ConditionalFormattingType;
  readonly condition: ConditionalFormattingCondition;
  readonly style: CellStyleConfig;
  readonly priority: number;
  readonly enabled: boolean;
}

export type ConditionalFormattingType =
  | 'color-scale'
  | 'data-bars'
  | 'icon-set'
  | 'highlight'
  | 'custom';

export interface ConditionalFormattingCondition {
  readonly operator: FilterOperator;
  readonly value: CellValue;
  readonly value2?: CellValue; // For "between" operator
}

export interface CellStyleConfig {
  readonly backgroundColor?: string;
  readonly foregroundColor?: string;
  readonly fontWeight?: number;
  readonly fontStyle?: 'normal' | 'italic';
  readonly textDecoration?: 'none' | 'underline' | 'line-through';
  readonly border?: string;
  readonly icon?: string;
}

export interface ChartConfig {
  readonly id: string;
  readonly type: ChartType;
  readonly title: string;
  readonly columnIds: ReadonlyArray<string>;
  readonly options: ChartOptions;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap';

export interface ChartOptions {
  readonly width?: number;
  readonly height?: number;
  readonly colors?: ReadonlyArray<string>;
  readonly legend?: boolean;
  readonly xAxis?: ChartAxisConfig;
  readonly yAxis?: ChartAxisConfig;
  readonly [key: string]: any; // Chart-specific options
}

export interface ChartAxisConfig {
  readonly label?: string;
  readonly min?: number;
  readonly max?: number;
  readonly scale?: 'linear' | 'log' | 'time';
}
```

---

## 19. Event System

### GridEvent

Event system for state changes and user interactions.

```typescript
/**
 * Base grid event.
 */
export interface GridEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly source: EventSource;
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
}

export type EventSource = 'user' | 'api' | 'system' | 'plugin';

/**
 * State change event.
 * Emitted whenever grid state changes.
 */
export interface StateChangeEvent<TData = any> extends GridEvent {
  readonly type: 'stateChange';
  readonly delta: StateChangeDelta<TData>;
  readonly oldState: GridState<TData>;
  readonly newState: GridState<TData>;
}

export interface StateChangeDelta<TData = any> {
  readonly path: string; // JSON path to changed property
  readonly oldValue: any;
  readonly newValue: any;
  readonly changeType: 'add' | 'update' | 'delete';
}

/**
 * Cell events.
 */
export interface CellEvent extends GridEvent {
  readonly cell: CellPosition;
  readonly value: CellValue;
  readonly row: RowData;
  readonly column: ColumnDefinition;
}

export interface CellClickEvent extends CellEvent {
  readonly type: 'cellClick';
  readonly button: number; // 0 = left, 1 = middle, 2 = right
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

export interface CellDoubleClickEvent extends CellEvent {
  readonly type: 'cellDoubleClick';
}

export interface CellContextMenuEvent extends CellEvent {
  readonly type: 'cellContextMenu';
  readonly clientX: number;
  readonly clientY: number;
}

export interface CellEditStartEvent extends CellEvent {
  readonly type: 'cellEditStart';
}

export interface CellEditCommitEvent extends CellEvent {
  readonly type: 'cellEditCommit';
  readonly oldValue: CellValue;
  readonly newValue: CellValue;
}

export interface CellEditCancelEvent extends CellEvent {
  readonly type: 'cellEditCancel';
}

export interface CellValidateEvent extends CellEvent {
  readonly type: 'cellValidate';
  readonly result: CellValidationResult;
}

/**
 * Selection events.
 */
export interface SelectionChangeEvent extends GridEvent {
  readonly type: 'selectionChange';
  readonly selectedRows: ReadonlySet<RowId>;
  readonly selectedCells: ReadonlySet<string>;
  readonly addedRows: ReadonlySet<RowId>;
  readonly removedRows: ReadonlySet<RowId>;
}

/**
 * Sort events.
 */
export interface SortChangeEvent extends GridEvent {
  readonly type: 'sortChange';
  readonly sorts: ReadonlyArray<SortModel>;
  readonly addedSorts: ReadonlyArray<SortModel>;
  readonly removedSorts: ReadonlyArray<SortModel>;
  readonly changedSorts: ReadonlyArray<SortModel>;
}

/**
 * Filter events.
 */
export interface FilterChangeEvent extends GridEvent {
  readonly type: 'filterChange';
  readonly filters: ReadonlyArray<FilterModel>;
  readonly addedFilters: ReadonlyArray<FilterModel>;
  readonly removedFilters: ReadonlyArray<FilterModel>;
  readonly changedFilters: ReadonlyArray<FilterModel>;
}

/**
 * Scroll events.
 */
export interface ScrollEvent extends GridEvent {
  readonly type: 'scroll';
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly direction: ScrollDirection;
}

/**
 * Row events.
 */
export interface RowEvent extends GridEvent {
  readonly row: RowData;
  readonly rowIndex: number;
}

export interface RowClickEvent extends RowEvent {
  readonly type: 'rowClick';
  readonly button: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
}

export interface RowDoubleClickEvent extends RowEvent {
  readonly type: 'rowDoubleClick';
}

/**
 * Column events.
 */
export interface ColumnEvent extends GridEvent {
  readonly column: ColumnDefinition;
  readonly columnIndex: number;
}

export interface ColumnResizeEvent extends ColumnEvent {
  readonly type: 'columnResize';
  readonly oldWidth: number;
  readonly newWidth: number;
}

export interface ColumnMoveEvent extends ColumnEvent {
  readonly type: 'columnMove';
  readonly oldIndex: number;
  readonly newIndex: number;
}

export interface ColumnVisibilityChangeEvent extends ColumnEvent {
  readonly type: 'columnVisibilityChange';
  readonly visible: boolean;
}

/**
 * Data events.
 */
export interface DataLoadEvent extends GridEvent {
  readonly type: 'dataLoad';
  readonly rowCount: number;
  readonly duration: number;
}

export interface DataErrorEvent extends GridEvent {
  readonly type: 'dataError';
  readonly error: GridError;
}
```

---

## 20. Row Model Pipeline

### RowModel

Row model pipeline for data transformation.

```typescript
/**
 * Row model pipeline.
 * Transforms raw data through stages: core → filtered → sorted → grouped → flattened → virtualized.
 */
export interface RowModelPipeline<TData = any> {
  /**
   * Stage 1: Core (original data).
   */
  readonly core: CoreRowModel<TData>;

  /**
   * Stage 2: Filtered.
   */
  readonly filtered: FilteredRowModel<TData>;

  /**
   * Stage 3: Sorted.
   */
  readonly sorted: SortedRowModel<TData>;

  /**
   * Stage 4: Grouped.
   */
  readonly grouped?: GroupedRowModel<TData>;

  /**
   * Stage 5: Flattened (hierarchical to flat).
   */
  readonly flattened: FlattenedRowModel<TData>;

  /**
   * Stage 6: Virtualized (viewport slice).
   */
  readonly virtualized: VirtualizedRowModel<TData>;
}

/**
 * Core row model (original data).
 */
export interface CoreRowModel<TData = any> {
  readonly rows: ReadonlyArray<RowData<TData>>;
  readonly byId: ReadonlyMap<RowId, RowData<TData>>;
  readonly totalCount: number;
}

/**
 * Filtered row model.
 */
export interface FilteredRowModel<TData = any> {
  readonly rows: ReadonlyArray<RowData<TData>>;
  readonly filteredCount: number;
  readonly filters: ReadonlyArray<FilterModel>;
}

/**
 * Sorted row model.
 */
export interface SortedRowModel<TData = any> {
  readonly rows: ReadonlyArray<RowData<TData>>;
  readonly sorts: ReadonlyArray<SortModel>;
}

/**
 * Grouped row model.
 */
export interface GroupedRowModel<TData = any> {
  readonly groups: ReadonlyArray<RowGroup<TData>>;
  readonly grouping: GroupingConfig;
}

export interface RowGroup<TData = any> {
  readonly id: string;
  readonly level: number;
  readonly parentId: string | null;
  readonly key: any;
  readonly rows: ReadonlyArray<RowData<TData>>;
  readonly childGroups: ReadonlyArray<RowGroup<TData>>;
  readonly aggregations: ReadonlyMap<string, any>;
  readonly expanded: boolean;
}

/**
 * Flattened row model (hierarchical to flat array).
 */
export interface FlattenedRowModel<TData = any> {
  readonly rows: ReadonlyArray<RowData<TData>>;
  readonly totalCount: number;
}

/**
 * Virtualized row model (viewport slice).
 */
export interface VirtualizedRowModel<TData = any> {
  readonly rows: ReadonlyArray<RowData<TData>>;
  readonly startIndex: number;
  readonly endIndex: number;
}

/**
 * Row model stage interface.
 */
export interface RowModelStage<TInput, TOutput> {
  readonly name: string;
  readonly transform: (input: TInput, state: GridState) => TOutput;
}
```

---

## 21. Type Guards & Utilities

### Type Guards

Type guards and utility types.

```typescript
/**
 * Type guard for EditState.
 */
export function isEditStateIdle(state: EditState): state is EditStateIdle {
  return state.type === 'idle';
}

export function isEditStateEditing(state: EditState): state is EditStateEditing {
  return state.type === 'editing';
}

export function isEditStateValidating(state: EditState): state is EditStateValidating {
  return state.type === 'validating';
}

export function isEditStateCommitting(state: EditState): state is EditStateCommitting {
  return state.type === 'committing';
}

export function isEditStateError(state: EditState): state is EditStateError {
  return state.type === 'error';
}

/**
 * Type guard for DataSource.
 */
export function isLocalDataSource<T>(ds: DataSource<T>): ds is LocalDataSource<T> {
  return ds.type === 'local';
}

export function isAsyncDataSource<T>(ds: DataSource<T>): ds is AsyncDataSource<T> {
  return ds.type === 'async';
}

export function isDuckDBDataSource(ds: DataSource): ds is DuckDBDataSource {
  return ds.type === 'duckdb';
}

/**
 * Utility: Deep readonly type.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

/**
 * Utility: Extract row data type from GridState.
 */
export type ExtractRowData<T> = T extends GridState<infer TData> ? TData : never;

/**
 * Utility: Partial deep (nested partial).
 */
export type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? Array<PartialDeep<U>>
    : T[P] extends object
    ? PartialDeep<T[P]>
    : T[P];
};

/**
 * Utility: Immutable update helper.
 */
export function immutableUpdate<T>(obj: T, updates: Partial<T>): T {
  return { ...obj, ...updates };
}

/**
 * Utility: Immutable array update.
 */
export function immutableArrayUpdate<T>(
  arr: ReadonlyArray<T>,
  index: number,
  update: Partial<T>
): ReadonlyArray<T> {
  return [
    ...arr.slice(0, index),
    { ...arr[index], ...update },
    ...arr.slice(index + 1),
  ];
}

/**
 * Utility: Immutable array insert.
 */
export function immutableArrayInsert<T>(
  arr: ReadonlyArray<T>,
  index: number,
  item: T
): ReadonlyArray<T> {
  return [...arr.slice(0, index), item, ...arr.slice(index)];
}

/**
 * Utility: Immutable array remove.
 */
export function immutableArrayRemove<T>(
  arr: ReadonlyArray<T>,
  index: number
): ReadonlyArray<T> {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

/**
 * Utility: Immutable Map update.
 */
export function immutableMapUpdate<K, V>(
  map: ReadonlyMap<K, V>,
  key: K,
  value: V
): ReadonlyMap<K, V> {
  const newMap = new Map(map);
  newMap.set(key, value);
  return newMap;
}

/**
 * Utility: Immutable Map delete.
 */
export function immutableMapDelete<K, V>(
  map: ReadonlyMap<K, V>,
  key: K
): ReadonlyMap<K, V> {
  const newMap = new Map(map);
  newMap.delete(key);
  return newMap;
}

/**
 * Utility: Immutable Set add.
 */
export function immutableSetAdd<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  const newSet = new Set(set);
  newSet.add(item);
  return newSet;
}

/**
 * Utility: Immutable Set delete.
 */
export function immutableSetDelete<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  const newSet = new Set(set);
  newSet.delete(item);
  return newSet;
}
```

---

## Grid API

### GridApi

External API for interacting with grid state.

```typescript
/**
 * Grid API.
 * Exposed to consumers for programmatic control.
 */
export interface GridApi<TData = any> {
  // State access
  getState(): GridState<TData>;
  setState(state: Partial<GridState<TData>>): void;
  subscribe(listener: StateChangeListener<TData>): () => void;

  // Data operations
  setData(data: ReadonlyArray<TData>): void;
  getData(): ReadonlyArray<RowData<TData>>;
  getRowById(id: RowId): RowData<TData> | undefined;
  updateRow(id: RowId, data: Partial<TData>): void;
  updateRows(updates: ReadonlyArray<{ id: RowId; data: Partial<TData> }>): void;
  deleteRow(id: RowId): void;
  deleteRows(ids: ReadonlyArray<RowId>): void;
  insertRow(data: TData, index?: number): void;
  insertRows(data: ReadonlyArray<TData>, index?: number): void;

  // Sort operations
  setSortModel(sorts: ReadonlyArray<SortModel>): void;
  getSortModel(): ReadonlyArray<SortModel>;
  clearSort(): void;

  // Filter operations
  setFilterModel(filters: ReadonlyArray<FilterModel>): void;
  getFilterModel(): ReadonlyArray<FilterModel>;
  clearFilter(): void;

  // Selection operations
  selectRow(id: RowId): void;
  selectRows(ids: ReadonlyArray<RowId>): void;
  deselectRow(id: RowId): void;
  deselectRows(ids: ReadonlyArray<RowId>): void;
  selectAll(): void;
  deselectAll(): void;
  getSelectedRows(): ReadonlyArray<RowData<TData>>;
  isRowSelected(id: RowId): boolean;

  // Edit operations
  startEditCell(cell: CellPosition): void;
  commitEditCell(cell: CellPosition, value: CellValue): Promise<void>;
  cancelEditCell(cell: CellPosition): void;
  isEditingCell(cell: CellPosition): boolean;

  // Scroll operations
  scrollToRow(rowIndex: number, align?: 'start' | 'center' | 'end'): void;
  scrollToColumn(columnIndex: number, align?: 'start' | 'center' | 'end'): void;
  scrollToCell(cell: CellPosition): void;

  // Column operations
  setColumnVisible(columnId: string, visible: boolean): void;
  setColumnWidth(columnId: string, width: number): void;
  setColumnOrder(columnIds: ReadonlyArray<string>): void;
  getColumnState(): ColumnState;

  // Export operations
  exportToCsv(options?: ExportCsvOptions): string;
  exportToExcel(options?: ExportExcelOptions): Promise<Blob>;
  exportState(): SerializedGridState;
  importState(state: SerializedGridState): void;

  // Undo/Redo (if enabled)
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;

  // Lifecycle
  destroy(): void;
  refresh(): void;
}

export type StateChangeListener<TData = any> = (
  event: StateChangeEvent<TData>
) => void;

export interface ExportCsvOptions {
  readonly separator?: string;
  readonly includeHeaders?: boolean;
  readonly selectedRowsOnly?: boolean;
  readonly visibleColumnsOnly?: boolean;
}

export interface ExportExcelOptions {
  readonly fileName?: string;
  readonly sheetName?: string;
  readonly includeHeaders?: boolean;
  readonly selectedRowsOnly?: boolean;
  readonly visibleColumnsOnly?: boolean;
  readonly formatting?: boolean;
}

export interface SerializedGridState {
  readonly version: number;
  readonly sort: SortState;
  readonly filter: FilterState;
  readonly columns: ColumnState;
  readonly selection: {
    readonly selectedRowIds: ReadonlyArray<RowId>;
  };
  readonly responsive: {
    readonly layoutMode: LayoutMode;
  };
  readonly theme: {
    readonly themeName: string;
    readonly colorScheme: ColorScheme;
  };
}
```

---

## 22. Shared Infrastructure Types (`@phozart/phz-shared`)

### Overview

v15 extracted shared types, adapters, artifacts, design system, and runtime
coordination into a new `@phozart/phz-shared` package. This package is the
dependency foundation — all shells (workspace, viewer, editor) import from it.
No shell imports another shell.

### 22.1 Alert-Aware Widget Types (Spec Amendment A)

Types for binding alert rules to single-value widgets (KPI card, gauge,
scorecard, trend-line) and controlling how alert state is visualized.

```typescript
/** How the alert state is rendered on the widget. */
export type AlertVisualMode = 'none' | 'indicator' | 'background' | 'border';

/** Widget-level severity (distinct from engine AlertSeverity). */
export type WidgetAlertSeverity = 'healthy' | 'warning' | 'critical';

/** Configuration for alert visualization on a single-value widget. */
export interface SingleValueAlertConfig {
  alertRuleBinding?: string;
  alertVisualMode: AlertVisualMode;
  alertAnimateTransition: boolean;
}

/** Resolved visual state for a widget based on current alert events. */
export interface AlertVisualState {
  severity: WidgetAlertSeverity;
  ruleId?: string;
  lastTransition?: number;
}

/** Container size for responsive degradation. */
export type AlertContainerSize = 'full' | 'compact' | 'minimal';

/** Degraded rendering parameters based on container size. */
export interface DegradedAlertParams {
  showIndicator: boolean;
  indicatorSize: number;
  borderWidth: number;
  showBackground: boolean;
}

/** Token name record for a given severity and visual mode combination. */
export interface AlertTokenSet {
  bg?: string;
  indicator?: string;
  border?: string;
}

/** Pure functions */
export function resolveAlertVisualState(
  config: SingleValueAlertConfig,
  alertEvents: Map<string, WidgetAlertSeverity>,
): AlertVisualState;

export function getAlertTokens(
  severity: WidgetAlertSeverity,
  mode: AlertVisualMode,
): AlertTokenSet;

export function degradeAlertMode(
  mode: AlertVisualMode,
  containerSize: AlertContainerSize,
): DegradedAlertParams;

export function createDefaultAlertConfig(): SingleValueAlertConfig;
```

### 22.2 Micro-Widget Cell Renderer Types (Spec Amendment B)

Types for rendering micro-widget visualizations (sparklines, gauges, deltas,
status indicators) inside grid table cells without DOM dependencies.

```typescript
/** How the micro-widget is rendered inside the cell. */
export type MicroWidgetDisplayMode = 'value-only' | 'sparkline' | 'delta' | 'gauge-arc';

/** Which full-size widget type the micro-widget corresponds to. */
export type MicroWidgetType = 'trend-line' | 'gauge' | 'kpi-card' | 'scorecard';

/** Configuration for micro-widget rendering inside a grid cell. */
export interface MicroWidgetCellConfig {
  widgetType: MicroWidgetType;
  dataBinding: {
    valueField: string;
    compareField?: string;
    sparklineField?: string;
  };
  displayMode: MicroWidgetDisplayMode;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

/** Describes how sparkline data points are sourced. */
export interface SparklineDataBinding {
  source: 'inline-array' | 'group-aggregate';
  field: string;
  aggregation?: string;
  points?: number;
}

/** Output of a micro-widget renderer. */
export interface MicroWidgetRenderResult {
  html: string;
  width: number;
  height: number;
}

/** A micro-widget renderer — pure function, no DOM APIs. */
export interface MicroWidgetRenderer {
  render(config: MicroWidgetCellConfig, value: unknown, width: number, height: number): MicroWidgetRenderResult;
  canRender(config: MicroWidgetCellConfig, columnWidth: number): boolean;
}

/**
 * Registry for micro-widget renderers. The grid defines the interface;
 * shells populate it with widget renderers at mount time.
 * This is a RUNTIME contract — avoids circular build-time dependencies.
 */
export interface CellRendererRegistry {
  register(type: string, renderer: MicroWidgetRenderer): void;
  get(type: string): MicroWidgetRenderer | null;
  has(type: string): boolean;
  getRegisteredTypes(): string[];
}

export function createCellRendererRegistry(): CellRendererRegistry;
```

### 22.3 Impact Chain Types (Spec Amendment C)

Types for the impact chain rendering variant of the decision tree widget.
An impact chain is a horizontal causal flow for root cause analysis.

```typescript
/** The functional role of a node in the impact chain. */
export type ImpactNodeRole = 'root-cause' | 'failure' | 'impact' | 'hypothesis';

/** Validation state for hypothesis nodes. */
export type HypothesisState = 'validated' | 'inconclusive' | 'invalidated' | 'pending';

/** A metric displayed alongside an impact chain node. */
export interface ImpactMetric {
  label: string;
  value: string;
  field: string;
}

/** A node in an impact chain — extends DecisionTreeNode. */
export interface ImpactChainNode extends DecisionTreeNode {
  nodeRole?: ImpactNodeRole;
  hypothesisState?: HypothesisState;
  impactMetrics?: ImpactMetric[];
  edgeLabel?: string;
}

/** Layout direction for the impact chain rendering. */
export type ChainLayoutDirection = 'horizontal' | 'vertical';

export interface ChainLayout {
  direction: ChainLayoutDirection;
  showEdgeLabels: boolean;
  collapseInvalidated: boolean;
  conclusionText?: string;
}

/** Which rendering variant the decision tree widget should use. */
export type DecisionTreeRenderVariant = 'tree' | 'impact-chain';

export interface DecisionTreeVariantConfig {
  renderVariant: DecisionTreeRenderVariant;
  chainLayout?: ChainLayout;
}
```

### 22.4 Faceted Attention Filtering Types (Spec Amendment D)

Types for faceted filtering of attention items (alerts, notifications, action
items). Uses AND across facets, OR within a facet. Lightweight in-memory
filtering, separate from the criteria engine.

```typescript
export type AttentionPriority = 'critical' | 'warning' | 'info';

export type AttentionSource =
  | 'alert' | 'system' | 'external' | 'stale' | 'review' | 'broken-query';

export interface AttentionFacetValue {
  value: string;
  count: number;
  color?: string;
}

export interface AttentionFacet {
  field: string;
  label: string;
  values: AttentionFacetValue[];
  multiSelect: boolean;
}

export interface AttentionFilterState {
  priority?: AttentionPriority[];
  source?: AttentionSource[];
  artifactId?: string[];
  acknowledged?: boolean;
  dateRange?: { from: number; to: number };
}

export interface FilterableAttentionItem {
  id: string;
  priority: AttentionPriority;
  source: AttentionSource;
  artifactId?: string;
  artifactName?: string;
  acknowledged: boolean;
  timestamp: number;
  title: string;
  description?: string;
  actionTarget?: string;
}

export function filterAttentionItems(
  items: FilterableAttentionItem[],
  filters: AttentionFilterState,
): FilterableAttentionItem[];

export function computeAttentionFacets(
  items: FilterableAttentionItem[],
  currentFilters: AttentionFilterState,
): AttentionFacet[];
```

### 22.5 Alert Design Tokens

Alert widget tokens integrate with the three-layer CSS custom property system.
Defined in `@phozart/phz-shared/design-system`.

```typescript
export const ALERT_WIDGET_TOKENS = {
  'widget.alert.healthy.bg': 'transparent',
  'widget.alert.healthy.indicator': '#22c55e',
  'widget.alert.warning.bg': 'rgba(245, 158, 11, 0.08)',
  'widget.alert.warning.indicator': '#f59e0b',
  'widget.alert.warning.border': '#f59e0b',
  'widget.alert.critical.bg': 'rgba(239, 68, 68, 0.08)',
  'widget.alert.critical.indicator': '#ef4444',
  'widget.alert.critical.border': '#ef4444',
  'widget.alert.pulse.duration': '2s',
  'widget.alert.pulse.keyframes': 'alertPulse',
} as const;

export const IMPACT_CHAIN_TOKENS = {
  'chain.rootCause.accent': '#dc2626',
  'chain.failure.accent': '#f59e0b',
  'chain.impact.accent': '#3b82f6',
  'chain.hypothesis.validated': '#22c55e',
  'chain.hypothesis.invalidated': '#ef4444',
  'chain.hypothesis.pending': '#f59e0b',
} as const;
```

### 22.6 Async Report Types

Types for asynchronous report generation (long-running queries).

```typescript
export type AsyncReportStatus =
  | 'queued' | 'running' | 'complete' | 'failed' | 'cancelled' | 'expired';

export interface AsyncReportRequest {
  reportId: string;
  query: {
    source: string;
    fields: string[];
    filters?: unknown;
    groupBy?: string[];
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
  };
  outputFormat?: 'csv' | 'xlsx' | 'json' | 'parquet' | 'pdf';
  callbackUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  resultTTLMs?: number;
}

export interface AsyncReportJob {
  id: string;
  reportId: string;
  status: AsyncReportStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  expiresAt?: number;
  error?: string;
  resultUrl?: string;
}
```

### 22.7 Subscription Types

Types for report and dashboard delivery subscriptions.

```typescript
export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly' | 'on-change';
export type SubscriptionFormat = 'csv' | 'xlsx' | 'pdf' | 'link';

export interface SubscriptionSchedule {
  frequency: SubscriptionFrequency;
  timeOfDay?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface Subscription {
  id: string;
  artifactId: string;
  artifactType: string;
  frequency: SubscriptionFrequency;
  format: SubscriptionFormat;
  schedule: SubscriptionSchedule;
  enabled: boolean;
  recipients: string[];
  lastSentAt?: number;
  nextScheduledAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

---

## 23. Viewer State Model (`@phozart/phz-viewer`)

### ViewerShellState

The viewer is a read-only consumption shell. Its state machine manages screen
navigation, artifact viewing, filter context, loading/error states, and
attention item counts.

```typescript
export type ViewerScreen = 'catalog' | 'dashboard' | 'report' | 'explorer';

export interface NavigationEntry {
  screen: ViewerScreen;
  artifactId: string | null;
  artifactType: string | null;
}

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
```

### Screen State Machines

Each viewer screen has its own headless state machine:

| Screen | State Type | Key Fields |
|--------|-----------|------------|
| Catalog | `CatalogState` | search, type filter, sort, pagination, favorites, view mode |
| Dashboard | `DashboardViewState` | widget views, cross-filters, fullscreen, loading per widget |
| Report | `ReportViewState` | columns, sort, pagination, search, exporting |
| Explorer | `ExplorerScreenState` | data sources, fields, preview mode, chart suggestions |
| Attention | `AttentionDropdownState` | items, type filter, read/unread, dismiss |
| Filter Bar | `FilterBarState` | filter defs, values, presets, collapsed state |

### Viewer Config

```typescript
export interface ViewerFeatureFlags {
  showExplorer: boolean;
  showAttention: boolean;
  showFilters: boolean;
  showBranding: boolean;
}

export interface ViewerBranding {
  logoUrl?: string;
  title?: string;
  accentColor?: string;
}

export interface ViewerShellConfig {
  featureFlags: ViewerFeatureFlags;
  branding: ViewerBranding;
  defaultScreen: ViewerScreen;
}
```

---

## 24. Editor State Model (`@phozart/phz-editor`)

### EditorShellState

The editor is an authoring shell for the author persona. It manages editing
mode, undo/redo, auto-save, measure registry integration, and unsaved change
tracking.

```typescript
export type EditorScreen =
  | 'catalog'
  | 'dashboard-view'
  | 'dashboard-edit'
  | 'report'
  | 'explorer'
  | 'sharing'
  | 'alerts';

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
```

### Screen State Machines

| Screen | State Type | Key Fields |
|--------|-----------|------------|
| Catalog | `CatalogState` | items, search, type filter, visibility filter, sort, create dialog |
| Dashboard View | `DashboardViewState` | data, permissions, widget expand/collapse |
| Dashboard Edit | `DashboardEditState` | widgets, drag state, grid layout, config panel, measure palette |
| Report | `ReportEditState` | columns, filters, sorts, preview, title, data source |
| Explorer | `ExplorerState` | dimensions, measures, filters, sort, limit, results, save dialog |

### Authoring State Machines

| Module | State Type | Purpose |
|--------|-----------|---------|
| Measure Palette | `MeasurePaletteState` | Search, filter, select/deselect items from measure registry |
| Config Panel | `ConfigPanelState` | Widget config editing with validation and field constraints |
| Sharing Flow | `SharingFlowState` | Visibility transitions, share targets, publish permissions |
| Alert & Subscription | `AlertSubscriptionState` | Manage alerts and subscriptions per artifact |

### Editor Config

```typescript
export interface EditorFeatureFlags {
  allowDashboardEdit: boolean;
  allowReportEdit: boolean;
  allowExplorer: boolean;
  allowSharing: boolean;
  allowAlerts: boolean;
  allowSubscriptions: boolean;
}

export interface EditorShellConfig {
  featureFlags: EditorFeatureFlags;
  autoSaveEnabled: boolean;
  autoSaveDebounceMs: number;
  maxUndoStackSize: number;
}
```

---

## 25. Shared Coordination State Machines

Runtime coordination modules in `@phozart/phz-shared/coordination` manage
cross-cutting state shared across shells.

### 25.1 AsyncReportUIState

UI state for tracking asynchronous report generation jobs.

```typescript
export interface AsyncReportUIState {
  jobs: AsyncReportJob[];
  activeJobId: string | null;
}
```

### 25.2 ExportsTabState

State for the exports tab showing generated report files.

```typescript
export interface ExportEntry {
  id: string;
  reportId: string;
  format: string;
  status: 'pending' | 'complete' | 'failed';
  url?: string;
  createdAt: number;
  size?: number;
}

export type ExportSortField = 'createdAt' | 'format' | 'status' | 'size';

export interface ExportsTabState {
  exports: ExportEntry[];
  sort: { field: ExportSortField; direction: 'asc' | 'desc' };
  filterStatus: string | null;
}
```

### 25.3 SubscriptionsTabState

State for the subscriptions management tab.

```typescript
export interface SubscriptionsTabState {
  subscriptions: Subscription[];
  activeTab: 'active' | 'paused' | 'all';
  searchQuery: string;
  createDialogOpen: boolean;
}
```

### 25.4 ExpressionBuilderState

State for the visual expression builder (drag-and-drop expression composition).

```typescript
export type ExpressionNodeType = 'field' | 'function' | 'operator' | 'literal' | 'group';

export interface ExpressionNode {
  id: number;
  type: ExpressionNodeType;
  value: string;
  children: number[];
  parentId: number | null;
}

export interface ExpressionBuilderState {
  nodes: ExpressionNode[];
  selectedNodeId: number | null;
  rootId: number;
  nextId: number;
}
```

### 25.5 PreviewContextState

State for previewing artifacts as a different user role.

```typescript
export interface PreviewContextState {
  enabled: boolean;
  selectedRole: string | null;
  customUserId: string | null;
  availableRoles: string[];
  originalContext: ViewerContext | null;
}
```

### 25.6 AttentionFacetedState

State for the faceted attention filtering widget.

```typescript
export type AttentionSortOrder = 'newest' | 'oldest' | 'priority';

export interface AttentionFacetedState {
  items: FilterableAttentionItem[];
  filters: AttentionFilterState;
  sortOrder: AttentionSortOrder;
  acknowledgedIds: Set<string>;
  pageSize: number;
  currentPage: number;
}
```

---

## 26. Relationship: Shared Types and Shell State Machines

The three-shell architecture creates a clear dependency hierarchy:

```
@phozart/phz-shared (foundation)
  ├── adapters/     → DataAdapter SPI, ViewerContext, MeasureDefinition
  ├── types/        → SingleValueAlertConfig, MicroWidgetCellConfig,
  │                   AttentionFilterState, ImpactChainNode, etc.
  ├── artifacts/    → ArtifactVisibility, DefaultPresentation, GridArtifact
  ├── design-system → ALERT_WIDGET_TOKENS, IMPACT_CHAIN_TOKENS, responsive
  └── coordination/ → FilterContext, LoadingState, AsyncReportUIState,
                      ExportsTabState, ExpressionBuilderState, etc.

@phozart/phz-viewer (read-only)
  ├── imports from shared only
  ├── ViewerShellState → uses ErrorState, EmptyState, FilterContextManager
  └── Screen states   → use ViewerContext, DataResult from shared/adapters

@phozart/phz-editor (authoring)
  ├── imports from shared only
  ├── EditorShellState → uses ViewerContext, MeasureDefinition
  └── Authoring states → use SingleValueAlertConfig, Subscription, etc.

@phozart/phz-workspace (admin — full Lit components)
  ├── imports from shared only
  ├── 15 admin state machines (headless)
  └── Lit Web Components for admin UI
```

The `CellRendererRegistry` interface is defined in shared but populated at
runtime by shells — this avoids a build-time dependency from grid to widgets.
The grid package defines the rendering hook (`resolveCellRenderer`); the
widgets package provides the renderers (`createSparklineRenderer`,
`createGaugeArcRenderer`, etc.); and the shell registers them at mount time.

---

## Summary

This data model defines the complete type-safe contract for phz-grid. Key design principles:

1. **Immutability:** All state is immutable (Readonly types)
2. **Type Safety:** Strict TypeScript, no `any` except in generic contexts
3. **Performance:** Optimized for 1M+ rows (ReadonlyMap, ReadonlySet for O(1) lookups)
4. **Extensibility:** Plugin system with hooks
5. **Framework Agnostic:** Core state in headless @phozart/phz-core
6. **Advanced Extensions:** DuckDB, AI, Collaboration, Analytics as optional state

All implementation agents MUST follow these type definitions exactly.

---

**Next Steps:**

1. Solution Architect: Review and align with system architecture
2. API Architect: Generate API-CONTRACTS from this data model
3. Frontend Architect: Design rendering layer to consume this state
4. Backend Architect: Design data source adapters (DuckDB, async)
5. Implementation Agents: Generate code from these type definitions

---

**Document Owner:** Data Architect
**Review Cadence:** On schema changes only
**Last Reviewed By:** [Pending]
**Status:** Ready for Implementation
