/**
 * @phozart/phz-core — createGrid Factory
 *
 * Main entry point. Creates a headless grid instance with full API.
 */
import type { GridConfig } from './types/config.js';
import type { GridApi } from './types/api.js';
import type { ColumnDefinition } from './types/column.js';
import type { RowData } from './types/row.js';
import type { GridState } from './types/state.js';
import type { Plugin } from './types/plugin.js';
import type { QueryBackend } from './types/query-backend.js';
import type { ProgressiveLoadConfig } from './progressive-load.js';
export interface PreparedGrid<TData = any> {
    columns: ColumnDefinition<TData>[];
    data: RowData<TData>[];
    initialState: GridState<TData>;
    restrictedFields: Set<string>;
    maskedFields: Set<string>;
    plugins?: Plugin[];
    rowIdField?: string;
    userRole?: string;
    queryBackend?: QueryBackend;
    progressiveLoad?: ProgressiveLoadConfig;
}
export declare function prepareGrid<TData = any>(config: GridConfig<TData>): PreparedGrid<TData>;
export declare function activateGrid<TData = any>(prepared: PreparedGrid<TData>): GridApi<TData>;
export declare function createGrid<TData = any>(config: GridConfig<TData>): GridApi<TData>;
//# sourceMappingURL=create-grid.d.ts.map