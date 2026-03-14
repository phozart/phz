import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/core';
import type { FilterInfo } from '../types.js';
import type { FilterValueEntry, FilterApplyEvent } from '../components/phz-filter-popover.js';
import type { AriaManager } from '../a11y/aria-manager.js';
export interface FilterHost extends ReactiveControllerHost {
    gridApi: GridApi | null;
    ariaManager: AriaManager | null;
    columnDefs: ColumnDefinition[];
    visibleRows: RowData[];
    renderRoot: Element | ShadowRoot | DocumentFragment;
}
export declare class FilterController implements ReactiveController {
    private host;
    private searchDebounceTimer;
    private _cachedFilteredRows;
    private _filterCacheKey;
    filterOpen: boolean;
    filterField: string;
    filterAnchorRect: DOMRect | null;
    filterValues: FilterValueEntry[];
    filterColumnType: string;
    activeFilters: Map<string, FilterInfo>;
    searchQuery: string;
    onSearchChange?: (query: string) => void;
    constructor(host: FilterHost);
    hostConnected(): void;
    hostDisconnected(): void;
    handleSearchInput(value: string): void;
    get filteredRows(): RowData[];
    invalidateCache(): void;
    openFilterPopover(field: string, e?: MouseEvent): void;
    handleFilterApply(detail: FilterApplyEvent, onPageReset?: () => void): void;
    syncFromGridState(filters: Array<{
        field: string;
        operator: any;
        value: unknown;
    }>): void;
}
//# sourceMappingURL=filter.controller.d.ts.map