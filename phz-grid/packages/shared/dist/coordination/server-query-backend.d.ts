/**
 * Server QueryBackend — delegates query execution to a DataAdapter.
 *
 * Maps the grid's LocalQuery format to the DataAdapter's DataQuery format,
 * executes via adapter.execute(), and returns LocalQueryResult.
 */
import type { QueryBackend } from '@phozart/core';
import type { DataAdapter } from '../adapters/data-adapter.js';
export interface ServerQueryBackendOptions {
    adapter: DataAdapter;
    sourceId: string;
}
export declare function createServerQueryBackend(options: ServerQueryBackendOptions): QueryBackend;
//# sourceMappingURL=server-query-backend.d.ts.map