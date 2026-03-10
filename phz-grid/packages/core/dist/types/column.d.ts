/**
 * @phozart/phz-core — Column Types
 */
import type { RowData } from './row.js';
import type { CSSProperties, UserRole } from './common.js';
export interface ColumnDefinition<TData = any, TValue = any> {
    field: string;
    header?: string;
    type?: ColumnType;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    resizable?: boolean;
    hidden?: boolean;
    frozen?: 'left' | 'right' | null;
    priority?: 1 | 2 | 3;
    sortComparator?: SortComparator<TValue>;
    valueGetter?: ValueGetter<TData, TValue>;
    valueSetter?: ValueSetter<TData, TValue>;
    valueFormatter?: ValueFormatter<TValue>;
    validator?: CellValidator<TValue>;
    editor?: CellEditor<TData, TValue>;
    renderer?: CellRenderer<TData, TValue>;
    headerRenderer?: HeaderRenderer;
    footerRenderer?: FooterRenderer;
    cellClass?: string | string[] | CellClassFn<TData, TValue>;
    cellStyle?: CSSProperties | CellStyleFn<TData, TValue>;
    access?: ColumnAccessConfig<TValue>;
}
export interface ColumnAccessConfig<TValue = any> {
    requiredRoles?: UserRole[];
    mask?: string | ((value: TValue) => string);
}
export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'custom';
export type CellRenderer<TData = any, TValue = any> = (context: CellRenderContext<TData, TValue>) => unknown;
export interface CellRenderContext<TData = any, TValue = any> {
    value: TValue;
    row: RowData<TData>;
    column: ColumnDefinition<TData, TValue>;
    rowIndex: number;
    isSelected: boolean;
    isEditing: boolean;
}
export type CellEditor<TData = any, TValue = any> = (context: CellEditorContext<TData, TValue>) => CellEditorInstance;
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
export type CellValidator<TValue = any> = (context: CellValidationContext<TValue>) => CellValidationResult | Promise<CellValidationResult>;
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
export type ValueSetter<TData = any, TValue = any> = (row: RowData<TData>, value: TValue) => RowData<TData>;
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
export type CellClassFn<TData = any, TValue = any> = (value: TValue, row: RowData<TData>, column: ColumnDefinition<TData, TValue>) => string | string[];
export type CellStyleFn<TData = any, TValue = any> = (value: TValue, row: RowData<TData>, column: ColumnDefinition<TData, TValue>) => CSSProperties;
//# sourceMappingURL=column.d.ts.map