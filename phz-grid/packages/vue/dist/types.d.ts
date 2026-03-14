/**
 * @phozart/vue — Type definitions
 */
import type { GridApi, ColumnDefinition, GridState, RowId, CellPosition, SortState, FilterState, FilterOperator, EditState, SerializedGridState, ConditionalFormattingRule, SelectionChangeEvent, SortChangeEvent, FilterChangeEvent, CellEditCommitEvent, CellClickEvent } from '@phozart/core';
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
    modelValue?: RowId[];
    density?: 'comfortable' | 'compact' | 'dense';
    gridTitle?: string;
    gridSubtitle?: string;
    scrollMode?: 'paginate' | 'virtual';
    pageSize?: number;
    pageSizeOptions?: number[];
    showToolbar?: boolean;
    showDensityToggle?: boolean;
    showColumnEditor?: boolean;
    showAdminSettings?: boolean;
    showPagination?: boolean;
    showCheckboxes?: boolean;
    showRowActions?: boolean;
    showSelectionActions?: boolean;
    showEditActions?: boolean;
    showCopyActions?: boolean;
    rowBanding?: boolean;
    statusColors?: Record<string, {
        bg: string;
        color: string;
        dot: string;
    }>;
    barThresholds?: Array<{
        min: number;
        color: string;
    }>;
    dateFormats?: Record<string, string>;
    numberFormats?: Record<string, {
        decimals?: number;
        display?: string;
        prefix?: string;
        suffix?: string;
    }>;
    columnStyles?: Record<string, string>;
    gridLines?: 'none' | 'horizontal' | 'vertical' | 'both';
    gridLineColor?: string;
    gridLineWidth?: 'thin' | 'medium';
    bandingColor?: string;
    hoverHighlight?: boolean;
    cellTextOverflow?: 'ellipsis' | 'clip' | 'wrap';
    compactNumbers?: boolean;
    autoSizeColumns?: boolean;
    aggregation?: boolean;
    aggregationFn?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'none';
    aggregationPosition?: 'top' | 'bottom' | 'both';
    groupBy?: string[];
    groupByLevels?: string[][];
    groupTotals?: boolean;
    groupTotalsFn?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    conditionalFormattingRules?: ConditionalFormattingRule[];
    columnGroups?: Array<{
        header: string;
        children: string[];
    }>;
    userRole?: 'viewer' | 'user' | 'editor' | 'admin';
    copyHeaders?: boolean;
    copyFormatted?: boolean;
    loadingMode?: 'paginate' | 'lazy';
    virtualScrollThreshold?: number;
    fetchPageSize?: number;
    prefetchPages?: number;
}
export interface PhzGridEmits {
    (event: 'update:modelValue', value: RowId[]): void;
    (event: 'grid-ready', gridInstance: GridApi): void;
    (event: 'selection-change', evt: SelectionChangeEvent): void;
    (event: 'sort-change', evt: SortChangeEvent): void;
    (event: 'filter-change', evt: FilterChangeEvent): void;
    (event: 'edit-commit', evt: CellEditCommitEvent): void;
    (event: 'cell-click', evt: CellClickEvent): void;
}
export interface UseGridReturn {
    gridInstance: {
        value: GridApi | null;
    };
    state: {
        value: GridState | null;
    };
    exportState: () => SerializedGridState | null;
    importState: (state: SerializedGridState) => void;
}
export interface UseGridSelectionReturn {
    selectedRows: {
        value: RowId[];
    };
    selectedCells: {
        value: CellPosition[];
    };
    select: (rowIds: RowId | RowId[]) => void;
    deselect: (rowIds: RowId | RowId[]) => void;
    selectAll: () => void;
    deselectAll: () => void;
    selectRange: (start: CellPosition, end: CellPosition) => void;
}
export interface UseGridSortReturn {
    sortState: {
        value: SortState | null;
    };
    sort: (field: string, direction: 'asc' | 'desc' | null) => void;
    multiSort: (sorts: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>) => void;
    clearSort: () => void;
}
export interface UseGridFilterReturn {
    filterState: {
        value: FilterState | null;
    };
    addFilter: (field: string, operator: FilterOperator, value: unknown) => void;
    removeFilter: (field: string) => void;
    clearFilters: () => void;
    savePreset: (name: string) => void;
    loadPreset: (name: string) => void;
}
export interface UseGridEditReturn {
    editState: {
        value: EditState | null;
    };
    startEdit: (position: CellPosition) => void;
    commitEdit: (position: CellPosition, value: unknown) => Promise<boolean>;
    cancelEdit: (position: CellPosition) => void;
    isDirty: {
        value: boolean;
    };
    dirtyRows: {
        value: RowId[];
    };
}
//# sourceMappingURL=types.d.ts.map