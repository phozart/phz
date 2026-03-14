/**
 * @phozart/core — Column Types
 */

import type { RowData } from './row.js';
import type { CSSProperties, UserRole } from './common.js';

/**
 * Defines a single column in the grid. At minimum, supply a `field` that
 * maps to a property name on each row object. All other properties are
 * optional and have sensible defaults.
 *
 * @typeParam TData - Row data shape.
 * @typeParam TValue - Cell value type for this column.
 *
 * @example
 * ```ts
 * const columns: ColumnDefinition[] = [
 *   { field: 'name', header: 'Name', type: 'string', sortable: true },
 *   { field: 'revenue', header: 'Revenue', type: 'number', width: 120 },
 *   { field: 'date', header: 'Date', type: 'date', frozen: 'left' },
 * ];
 * ```
 */
export interface ColumnDefinition<TData = any, TValue = any> {
  /** Property name on each row object. Used as the column identifier. */
  field: string;
  /** Display text for the column header. Defaults to `field` if omitted. */
  header?: string;
  /** Data type hint used for sorting, filtering, and formatting. Defaults to `'string'`. */
  type?: ColumnType;
  /** Initial column width in pixels. */
  width?: number;
  /** Minimum column width in pixels (enforced during resize). */
  minWidth?: number;
  /** Maximum column width in pixels (enforced during resize). */
  maxWidth?: number;
  /** Whether this column can be sorted. */
  sortable?: boolean;
  /** Whether this column can be filtered. */
  filterable?: boolean;
  /** Whether cells in this column can be edited inline. */
  editable?: boolean;
  /** Whether the column width can be resized by dragging. */
  resizable?: boolean;
  /** When `true`, the column is not rendered but remains in the column model. */
  hidden?: boolean;
  /** Pin the column to the left or right edge of the grid. */
  frozen?: 'left' | 'right' | null;
  /** Responsive priority (1 = always visible, 3 = hidden first on narrow viewports). */
  priority?: 1 | 2 | 3;
  /** Custom sort comparator. Overrides the default type-based sort. */
  sortComparator?: SortComparator<TValue>;
  /** Derive the cell value from the row (instead of reading `row[field]`). */
  valueGetter?: ValueGetter<TData, TValue>;
  /** Write a cell value back to the row object after editing. */
  valueSetter?: ValueSetter<TData, TValue>;
  /** Format the cell value for display (e.g. currency, date formatting). */
  valueFormatter?: ValueFormatter<TValue>;
  /** Validate a cell value before committing an edit. */
  validator?: CellValidator<TValue>;
  /** Custom cell editor factory. */
  editor?: CellEditor<TData, TValue>;
  /** Custom cell renderer. */
  renderer?: CellRenderer<TData, TValue>;
  /** Custom header renderer. */
  headerRenderer?: HeaderRenderer;
  /** Custom footer renderer. */
  footerRenderer?: FooterRenderer;
  /** CSS class(es) applied to cells in this column. */
  cellClass?: string | string[] | CellClassFn<TData, TValue>;
  /** Inline styles applied to cells in this column. */
  cellStyle?: CSSProperties | CellStyleFn<TData, TValue>;
  /** Role-based access control and value masking for this column. */
  access?: ColumnAccessConfig<TValue>;
}

export interface ColumnAccessConfig<TValue = any> {
  requiredRoles?: UserRole[];
  mask?: string | ((value: TValue) => string);
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'custom';

export type CellRenderer<TData = any, TValue = any> = (
  context: CellRenderContext<TData, TValue>,
) => unknown;

export interface CellRenderContext<TData = any, TValue = any> {
  value: TValue;
  row: RowData<TData>;
  column: ColumnDefinition<TData, TValue>;
  rowIndex: number;
  isSelected: boolean;
  isEditing: boolean;
}

export type CellEditor<TData = any, TValue = any> = (
  context: CellEditorContext<TData, TValue>,
) => CellEditorInstance;

export interface CellEditorContext<TData = any, TValue = any> {
  value: TValue;
  row: RowData<TData>;
  column: ColumnDefinition<TData, TValue>;
  rowIndex: number;
}

export interface CellEditorInstance {
  getValue(): unknown;
  focus(): void;
  destroy?(): void;
}

export type CellValidator<TValue = any> = (
  context: CellValidationContext<TValue>,
) => CellValidationResult | Promise<CellValidationResult>;

export interface CellValidationContext<TValue = any> {
  value: TValue;
  oldValue: TValue;
  field: string;
  rowId: string | number;
}

export type CellValidationResult = true | string;

export type SortComparator<TValue = any> = (a: TValue, b: TValue) => number;

export type ValueFormatter<TValue = any> = (value: TValue) => string;

export type ValueGetter<TData = any, TValue = any> = (row: RowData<TData>) => TValue;

export type ValueSetter<TData = any, TValue = any> = (
  row: RowData<TData>,
  value: TValue,
) => RowData<TData>;

export type HeaderRenderer = (context: HeaderRenderContext) => unknown;

export interface HeaderRenderContext {
  column: ColumnDefinition;
  sortDirection: 'asc' | 'desc' | null;
  filterActive: boolean;
}

export type FooterRenderer = (context: FooterRenderContext) => unknown;

export interface FooterRenderContext {
  column: ColumnDefinition;
  rows: RowData[];
}

export type CellClassFn<TData = any, TValue = any> = (
  value: TValue,
  row: RowData<TData>,
  column: ColumnDefinition<TData, TValue>,
) => string | string[];

export type CellStyleFn<TData = any, TValue = any> = (
  value: TValue,
  row: RowData<TData>,
  column: ColumnDefinition<TData, TValue>,
) => CSSProperties;
