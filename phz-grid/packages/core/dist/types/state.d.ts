/**
 * @phozart/core — State Types
 */
import type { RowId } from './row.js';
import type { CellPosition } from './cell.js';
import type { EnterpriseState } from './enterprise-state.js';
export interface SortState {
    columns: Array<{
        field: string;
        direction: SortDirection;
    }>;
}
export type SortDirection = 'asc' | 'desc';
export interface SortModel {
    field: string;
    direction: SortDirection;
}
export interface FilterState {
    filters: Array<{
        field: string;
        operator: FilterOperator;
        value: unknown;
    }>;
    presets: Record<string, FilterPreset>;
    activePreset?: string;
}
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'between' | 'in' | 'notIn' | 'isNull' | 'isNotNull' | 'isEmpty' | 'isNotEmpty' | 'dateDayOfWeek' | 'dateMonth' | 'dateYear' | 'dateWeekNumber';
export type FilterValue = unknown;
export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'select';
export type FilterLogic = 'and' | 'or';
export interface FilterPreset {
    name: string;
    filters: Array<{
        field: string;
        operator: FilterOperator;
        value: unknown;
    }>;
}
export interface FilterModel {
    field: string;
    operator: FilterOperator;
    value: unknown;
}
export interface SelectionState {
    mode: SelectionMode;
    selectedRows: Set<RowId>;
    selectedCells: Set<string>;
    anchorCell?: CellPosition;
}
export type SelectionMode = 'none' | 'single' | 'multi' | 'range';
export type EditState = EditStateIdle | EditStateEditing | EditStateValidating | EditStateCommitting | EditStateError;
export interface EditStateIdle {
    status: 'idle';
}
export interface EditStateEditing {
    status: 'editing';
    position: CellPosition;
    value: unknown;
    originalValue: unknown;
}
export interface EditStateValidating {
    status: 'validating';
    position: CellPosition;
    value: unknown;
}
export interface EditStateCommitting {
    status: 'committing';
    position: CellPosition;
    value: unknown;
}
export interface EditStateError {
    status: 'error';
    position: CellPosition;
    value: unknown;
    error: string;
}
export interface PendingEdits {
    cells: Map<string, unknown>;
    dirtyRows: Set<RowId>;
}
export interface VirtualizationState {
    enabled: boolean;
    overscan: number;
    estimatedRowHeight: number;
    totalHeight: number;
    visibleRange: [number, number];
}
export interface ScrollState {
    scrollTop: number;
    scrollLeft: number;
    direction: ScrollDirection;
}
export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | 'none';
export interface ColumnState {
    order: string[];
    widths: Record<string, number>;
    visibility: Record<string, boolean>;
    pinOverrides: Record<string, 'left' | 'right' | null>;
}
export interface FocusState {
    activeCell: CellPosition | null;
    mode: FocusMode;
    region: FocusRegion;
}
export type FocusMode = 'cell' | 'row' | 'none';
export type FocusRegion = 'header' | 'body' | 'footer' | 'filter' | 'toolbar';
export interface StatusState {
    loading: boolean;
    error: GridError | null;
    rowCount: number;
    filteredRowCount: number;
    progressivePhase?: import('../progressive-load.js').ProgressivePhase;
    loadedRowCount?: number;
    estimatedTotalCount?: number;
}
export interface GridError {
    code: string;
    message: string;
    details?: unknown;
}
export interface HistoryState {
    canUndo: boolean;
    canRedo: boolean;
    undoStack: number;
    redoStack: number;
    lastActionLabel?: string;
}
export interface ResponsiveState {
    breakpoint: Breakpoint;
    layoutMode: LayoutMode;
    containerWidth: number;
    containerHeight: number;
}
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LayoutMode = 'full' | 'compact' | 'stacked' | 'card';
export interface BreakpointConfig {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
}
export declare const DEFAULT_BREAKPOINTS: BreakpointConfig;
export interface ThemeState {
    name: string;
    colorScheme: ColorScheme;
    tokens: ThemeTokens;
}
export type ColorScheme = 'light' | 'dark' | 'auto';
export interface ThemeTokens {
    primitive: PrimitiveTokens;
    semantic: SemanticTokens;
    component: ComponentTokens;
}
export interface PrimitiveTokens {
    [key: string]: string;
}
export interface SemanticTokens {
    [key: string]: string;
}
export interface ComponentTokens {
    [key: string]: string;
}
export interface ThemeConfig {
    name: string;
    colorScheme?: ColorScheme;
    tokens?: Partial<ThemeTokens>;
}
export interface GroupingState {
    groupBy: string[];
    expandedGroups: Set<string>;
}
export interface ViewportState {
    scrollTop: number;
    scrollLeft: number;
    visibleRowRange: [number, number];
    visibleColumnRange: [number, number];
}
export * from './enterprise-state.js';
export interface GridState<TData = any> {
    sort: SortState;
    filter: FilterState;
    selection: SelectionState;
    edit: EditState;
    columns: ColumnState;
    viewport: ViewportState;
    grouping: GroupingState;
    focus: FocusState;
    status: StatusState;
    history: HistoryState;
    responsive: ResponsiveState;
    theme: ThemeState;
    scroll: ScrollState;
    virtualization: VirtualizationState;
    enterprise?: EnterpriseState;
}
export interface SerializedGridState {
    version: string;
    sort: SortState;
    filter: FilterState;
    selection: {
        selectedRows: RowId[];
        selectedCells: CellPosition[];
    };
    columns: ColumnState;
    grouping: {
        groupBy: string[];
        expandedGroups: string[];
    };
}
//# sourceMappingURL=state.d.ts.map