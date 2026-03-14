import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { type GridApi, type ColumnDefinition, type RowData, type RowId, type SortDirection, type DataSet, type DataSetMeta, type DataSetColumn, type QueryBackend, type ProgressiveLoadConfig, type ProgressivePhase } from '@phozart/core';
import { AriaManager } from '../a11y/aria-manager.js';
export interface StateSyncPayload {
    visibleRows: RowData[];
    sortColumns: Array<{
        field: string;
        direction: SortDirection;
    }>;
    totalRowCount: number;
    selectedRowIds: RowId[];
    filters: Array<{
        field: string;
        operator: any;
        value: unknown;
    }>;
    columnDefs: ColumnDefinition[];
}
export interface GridCoreHost extends ReactiveControllerHost {
    data: unknown[];
    columns: ColumnDefinition[];
    selectionMode: string;
    editMode: string;
    ariaLabels: import('@phozart/core').AriaLabels;
    defaultSortField: string;
    defaultSortDirection: 'asc' | 'desc';
    autoSizeColumns: boolean;
    dataSet?: DataSet;
    queryBackend?: QueryBackend;
    progressiveLoad?: ProgressiveLoadConfig;
    onStateSync(payload: StateSyncPayload): void;
    onProgressUpdate(phase: ProgressivePhase | undefined, message: string): void;
    onInitialized(): void;
}
export declare class GridCoreController implements ReactiveController {
    private host;
    private unsubscribers;
    private _columnDefs;
    /** Tracks the data version after the controller's last setData() push.
     *  Used to detect when external code (DuckDB bridge) has pushed data. */
    private _lastPushedDataVersion;
    /** Tracks the host data length at the time of the last controller push.
     *  A length change signals genuinely new data from the consumer. */
    private _lastHostDataLength;
    gridApi: GridApi | null;
    ariaManager: AriaManager | null;
    isInitialized: boolean;
    _dataSetMeta?: DataSetMeta;
    _dataSetSchema?: DataSetColumn[];
    constructor(host: GridCoreHost);
    hostConnected(): void;
    hostDisconnected(): void;
    initializeGrid(): void;
    destroyGrid(): void;
    resolveColumnDefs(): ColumnDefinition[];
    resolveData(): unknown[];
    onDataOrColumnsChanged(dataChanged?: boolean): void;
}
//# sourceMappingURL=grid-core.controller.d.ts.map