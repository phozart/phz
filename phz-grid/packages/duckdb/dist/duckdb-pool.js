/**
 * DuckDB Connection Pool — singleton lifecycle management for DuckDB-WASM.
 *
 * Reference counting ensures the WASM module is loaded once and shared
 * across multiple consumers. When all references are released, the
 * database is destroyed.
 */
/**
 * Create a DuckDB connection pool.
 * In production, this would manage the DuckDB-WASM lifecycle.
 * This implementation provides the interface for consumers to program against,
 * with DuckDB-WASM as an optional peer dependency.
 */
export function createDuckDBPool() {
    let refCount = 0;
    let initialized = false;
    const tables = new Map();
    const tableData = new Map();
    return {
        acquire() {
            refCount++;
            if (!initialized) {
                initialized = true;
            }
        },
        release() {
            refCount = Math.max(0, refCount - 1);
            if (refCount === 0 && initialized) {
                tables.clear();
                tableData.clear();
                initialized = false;
            }
        },
        async ingestArrow(tableName, _arrowBuffer) {
            tables.set(tableName, {
                name: tableName,
                rowCount: 0,
                createdAt: Date.now(),
            });
        },
        async ingestJSON(tableName, rows) {
            tableData.set(tableName, rows);
            tables.set(tableName, {
                name: tableName,
                rowCount: rows.length,
                createdAt: Date.now(),
            });
        },
        dropTable(tableName) {
            tables.delete(tableName);
            tableData.delete(tableName);
        },
        async query(sql) {
            const tableMatch = sql.match(/FROM\s+"?(\w+)"?/i);
            if (!tableMatch)
                return [];
            const data = tableData.get(tableMatch[1]);
            if (!data)
                return [];
            if (sql.match(/SELECT\s+COUNT\(\*\)/i)) {
                return [{ cnt: data.length }];
            }
            return [...data];
        },
        listTables() {
            return Array.from(tables.values());
        },
        getRefCount() {
            return refCount;
        },
        isInitialized() {
            return initialized;
        },
    };
}
//# sourceMappingURL=duckdb-pool.js.map