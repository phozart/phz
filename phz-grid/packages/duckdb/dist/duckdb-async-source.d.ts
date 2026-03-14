/**
 * @phozart/duckdb — DuckDB AsyncDataSource Adapter
 *
 * Implements AsyncDataSource from @phozart/core, converting
 * DataFetchRequest into parameterized SQL via sql-builder and executing
 * against DuckDB.
 */
import type { AsyncDataSource, DataFetchRequest, DataFetchResponse } from '@phozart/core';
import type { DuckDBDataSource } from './types.js';
export declare class DuckDBAsyncSource<TData = any> implements AsyncDataSource<TData> {
    private dataSource;
    private tableName;
    readonly type: "async";
    constructor(dataSource: DuckDBDataSource, tableName: string);
    fetch(request: DataFetchRequest): Promise<DataFetchResponse<TData>>;
}
//# sourceMappingURL=duckdb-async-source.d.ts.map