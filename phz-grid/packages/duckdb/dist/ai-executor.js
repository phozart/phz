/**
 * @phozart/duckdb — AI Query Executor
 *
 * Wires AI toolkit's NL→SQL output to DuckDB execution.
 * Validates SQL is read-only before execution.
 */
const ALLOWED_SQL_PREFIXES = /^\s*(SELECT|WITH|EXPLAIN)\b/i;
const FORBIDDEN_SQL_PATTERNS = /[;]|\b(DROP|DELETE|TRUNCATE|ALTER|INSERT|UPDATE|CREATE|EXEC|EXECUTE|GRANT|REVOKE|COPY|ATTACH|INSTALL|LOAD|CALL|PRAGMA)\b/i;
function columnSchemaToColumnDef(col) {
    let type = 'string';
    const upperType = col.type.toUpperCase();
    if (upperType.includes('INT') || upperType.includes('DOUBLE') || upperType.includes('FLOAT') || upperType.includes('DECIMAL') || upperType.includes('NUMERIC')) {
        type = 'number';
    }
    else if (upperType.includes('BOOL')) {
        type = 'boolean';
    }
    else if (upperType.includes('DATE') || upperType.includes('TIME') || upperType.includes('TIMESTAMP')) {
        type = 'date';
    }
    return {
        field: col.name,
        header: col.name,
        type,
        sortable: true,
        filterable: true,
    };
}
export function createAIQueryExecutor(dataSource, aiToolkit, config) {
    const tableName = config?.tableName;
    async function getSchemaContext() {
        if (!tableName)
            return [];
        const schema = await dataSource.getSchema(tableName);
        return schema.columns.map(columnSchemaToColumnDef);
    }
    async function executeNLQuery(query) {
        // Get schema for context
        const schema = await getSchemaContext();
        // Generate SQL via AI
        const aiResult = await aiToolkit.executeNaturalLanguageQuery(query, {
            schema: schema.length > 0 ? schema : undefined,
            dialect: 'duckdb',
        });
        // Check for AI error
        if (aiResult.error || !aiResult.sql) {
            return { sql: aiResult.sql ?? '', error: aiResult.error ?? 'No SQL generated' };
        }
        // Validate read-only
        if (!ALLOWED_SQL_PREFIXES.test(aiResult.sql)) {
            return { sql: aiResult.sql, error: 'Generated SQL is not a SELECT query. Only read-only queries are allowed.' };
        }
        if (FORBIDDEN_SQL_PATTERNS.test(aiResult.sql)) {
            return { sql: aiResult.sql, error: 'Generated SQL contains forbidden statements.' };
        }
        // Execute on DuckDB
        try {
            const result = await dataSource.query(aiResult.sql);
            return {
                sql: aiResult.sql,
                data: result.data,
                executionTime: result.executionTime,
            };
        }
        catch (err) {
            return {
                sql: aiResult.sql,
                error: err instanceof Error ? err.message : 'Query execution failed',
            };
        }
    }
    return { executeNLQuery, getSchemaContext };
}
//# sourceMappingURL=ai-executor.js.map