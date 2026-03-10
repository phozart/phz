/**
 * @phozart/phz-duckdb — DuckDB Bridge
 *
 * Connects DuckDB to grid state changes. On sort/filter/grouping change,
 * builds SQL via sql-builder, executes via DuckDB, and pushes results to the grid.
 */
import type { GridApi } from '@phozart/phz-core';
import type { DuckDBDataSource } from './types.js';
export interface BridgeRefreshResult {
    totalCount: number;
}
export declare class DuckDBBridge {
    private dataSource;
    private tableName;
    private grid;
    private unsubscribes;
    private pageSize;
    private page;
    constructor(dataSource: DuckDBDataSource, tableName: string);
    attach(grid: GridApi): void;
    detach(): void;
    refresh(): Promise<BridgeRefreshResult | undefined>;
    getTableName(): string;
    setTableName(tableName: string): void;
    setPageSize(pageSize: number | null): void;
    setPage(page: number): void;
    getPageSize(): number | null;
    getPage(): number;
}
//# sourceMappingURL=duckdb-bridge.d.ts.map