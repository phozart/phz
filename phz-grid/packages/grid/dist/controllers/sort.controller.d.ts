import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { GridApi, ColumnDefinition, SortDirection } from '@phozart/core';
import type { AriaManager } from '../a11y/aria-manager.js';
export interface SortHost extends ReactiveControllerHost {
    gridApi: GridApi | null;
    ariaManager: AriaManager | null;
    sortColumns: Array<{
        field: string;
        direction: SortDirection;
    }>;
    sortDebounceMs?: number;
}
export declare class SortController implements ReactiveController {
    private host;
    private debounceTimer;
    constructor(host: SortHost);
    hostConnected(): void;
    hostDisconnected(): void;
    handleHeaderClick(col: ColumnDefinition, e: MouseEvent): void;
    private executeSortAction;
}
//# sourceMappingURL=sort.controller.d.ts.map