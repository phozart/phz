/**
 * DuckDB Connection Pool — singleton lifecycle management for DuckDB-WASM.
 *
 * Reference counting ensures the WASM module is loaded once and shared
 * across multiple consumers. When all references are released, the
 * database is destroyed.
 */
export interface DuckDBPoolTable {
    name: string;
    rowCount: number;
    createdAt: number;
}
export interface DuckDBPool {
    acquire(): void;
    release(): void;
    ingestArrow(tableName: string, arrowBuffer: ArrayBuffer): Promise<void>;
    ingestJSON(tableName: string, rows: Record<string, unknown>[]): Promise<void>;
    dropTable(tableName: string): void;
    query(sql: string): Promise<Record<string, unknown>[]>;
    listTables(): DuckDBPoolTable[];
    getRefCount(): number;
    isInitialized(): boolean;
}
/**
 * Create a DuckDB connection pool.
 * In production, this would manage the DuckDB-WASM lifecycle.
 * This implementation provides the interface for consumers to program against,
 * with DuckDB-WASM as an optional peer dependency.
 */
export declare function createDuckDBPool(): DuckDBPool;
//# sourceMappingURL=duckdb-pool.d.ts.map