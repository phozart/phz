/**
 * @phozart/core — createGrid Factory
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
/**
 * Create a headless grid instance with the full {@link GridApi}.
 *
 * This is the primary entry point for `@phozart/core`. It parses the
 * supplied data, builds the initial row model, and returns a stateful API
 * object that can be used directly or wired to a rendering layer (e.g. the
 * `<phz-grid>` Web Component or a React/Vue/Angular wrapper).
 *
 * @param config - Grid configuration: data, columns, features, plugins, etc.
 * @returns A fully initialized {@link GridApi} instance.
 *
 * @example
 * ```ts
 * import { createGrid } from '@phozart/core';
 *
 * const grid = createGrid({
 *   data: salesRows,
 *   columns: [
 *     { field: 'product', header: 'Product', type: 'string' },
 *     { field: 'revenue', header: 'Revenue', type: 'number' },
 *   ],
 *   enableSorting: true,
 *   enableFiltering: true,
 * });
 *
 * grid.sort('revenue', 'desc');
 * console.log(grid.getData().length);
 * ```
 */
export declare function createGrid<TData = any>(config: GridConfig<TData>): GridApi<TData>;
//# sourceMappingURL=create-grid.d.ts.map