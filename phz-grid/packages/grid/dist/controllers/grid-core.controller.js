import { createGrid, toColumnDefinitions, getProgressMessage, } from '@phozart/phz-core';
import { AriaManager } from '../a11y/aria-manager.js';
export class GridCoreController {
    constructor(host) {
        this.unsubscribers = [];
        this._columnDefs = [];
        /** Tracks the data version after the controller's last setData() push.
         *  Used to detect when external code (DuckDB bridge) has pushed data. */
        this._lastPushedDataVersion = -1;
        /** Tracks the host data length at the time of the last controller push.
         *  A length change signals genuinely new data from the consumer. */
        this._lastHostDataLength = -1;
        this.gridApi = null;
        this.ariaManager = null;
        this.isInitialized = false;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() {
        this.destroyGrid();
    }
    initializeGrid() {
        this._columnDefs = this.resolveColumnDefs();
        const config = {
            columns: this._columnDefs,
            data: this.resolveData(),
            enableSelection: this.host.selectionMode !== 'none',
            enableEditing: this.host.editMode !== 'none',
            accessibility: { ariaLabels: this.host.ariaLabels },
            queryBackend: this.host.queryBackend,
            progressiveLoad: this.host.progressiveLoad,
        };
        this.gridApi = createGrid(config);
        this._lastPushedDataVersion = this.gridApi.getDataVersion();
        this._lastHostDataLength = this.resolveData().length;
        this.ariaManager = new AriaManager(this.gridApi);
        const unsub = this.gridApi.subscribe(() => {
            const api = this.gridApi;
            const visibleRows = api.getSortedRowModel().rows;
            const sortState = api.getSortState();
            const selectedIds = api.getSelection().rows;
            const filters = api.getFilterState().filters ?? [];
            this.host.onStateSync({
                visibleRows,
                sortColumns: sortState.columns ?? [],
                totalRowCount: visibleRows.length,
                selectedRowIds: selectedIds,
                filters,
                columnDefs: this._columnDefs,
            });
        });
        this.unsubscribers.push(unsub);
        // Subscribe to data:progress for progressive loading updates
        const progressUnsub = this.gridApi.on('data:progress', () => {
            const progState = this.gridApi?.getProgressiveState();
            if (progState) {
                this.host.onProgressUpdate(progState.phase, getProgressMessage({
                    phase: progState.phase,
                    loadedRowCount: progState.loadedRowCount,
                    estimatedTotalCount: progState.estimatedTotalCount,
                    currentOffset: 0,
                    chunkSize: 0,
                    refreshIntervalMs: 0,
                    queryId: 0,
                    lastRefreshAt: 0,
                }));
            }
        });
        this.unsubscribers.push(progressUnsub);
        if (this.host.defaultSortField) {
            this.gridApi.sort(this.host.defaultSortField, this.host.defaultSortDirection);
        }
        // Perform initial state sync so visibleRows is populated immediately.
        // Without this, the subscriber only fires on future state changes,
        // leaving visibleRows empty until the first user interaction.
        const initialRows = this.gridApi.getSortedRowModel().rows;
        const initialSort = this.gridApi.getSortState();
        const initialSelection = this.gridApi.getSelection().rows;
        const initialFilters = this.gridApi.getFilterState().filters ?? [];
        this.host.onStateSync({
            visibleRows: initialRows,
            sortColumns: initialSort.columns ?? [],
            totalRowCount: initialRows.length,
            selectedRowIds: initialSelection,
            filters: initialFilters,
            columnDefs: this._columnDefs,
        });
        this.isInitialized = true;
        this.host.onInitialized();
        this.host.requestUpdate();
    }
    destroyGrid() {
        this.unsubscribers.forEach(u => u());
        this.unsubscribers = [];
        this.gridApi = null;
        this.ariaManager = null;
        this.isInitialized = false;
        this._lastPushedDataVersion = -1;
        this._lastHostDataLength = -1;
    }
    resolveColumnDefs() {
        if (this.host.dataSet) {
            const schema = this.host.dataSet.columns ?? [];
            this._dataSetMeta = this.host.dataSet.meta;
            this._dataSetSchema = schema;
            return toColumnDefinitions(schema);
        }
        if (this.host.columns.length > 0)
            return this.host.columns;
        const firstRow = this.resolveData()[0];
        if (firstRow)
            return toColumnDefinitions(Object.keys(firstRow).map(k => ({ field: k, type: 'string' })));
        return [];
    }
    resolveData() {
        if (this.host.dataSet)
            return this.host.dataSet.rows ?? [];
        return this.host.data ?? [];
    }
    onDataOrColumnsChanged(dataChanged = true) {
        if (!this.gridApi)
            return;
        if (dataChanged && !this.host.queryBackend) {
            const hostData = this.resolveData();
            const currentVersion = this.gridApi.getDataVersion();
            const hostLengthChanged = hostData.length !== this._lastHostDataLength;
            // Push host data when:
            //   a) No external code has called setData() since our last push
            //      (dataVersion matches — normal prop-driven data flow), OR
            //   b) Host data length changed (consumer provided genuinely new data,
            //      e.g. switched data sources), OR
            //   c) First push (lastPushedDataVersion is -1 after init — though
            //      initializeGrid sets it, this guards against edge cases)
            const externalDataSet = currentVersion > this._lastPushedDataVersion
                && this._lastPushedDataVersion >= 0;
            if (!externalDataSet || hostLengthChanged) {
                this.gridApi.setData(hostData);
                this._lastPushedDataVersion = this.gridApi.getDataVersion();
                this._lastHostDataLength = hostData.length;
            }
            // Otherwise: external data management detected (e.g. DuckDB bridge),
            // host data hasn't meaningfully changed — skip prop-driven overwrite
        }
        this._columnDefs = this.resolveColumnDefs();
        this.gridApi.resetColumns();
    }
}
//# sourceMappingURL=grid-core.controller.js.map