/**
 * DuckDB QueryBackend — executes queries against DuckDB-WASM tables.
 *
 * Delegates SQL generation and execution to a provided executeSQL function.
 * Consumers must provide a pre-initialized query executor with data loaded.
 */
import { sanitizeIdentifier } from './sql-builder.js';
function quoteId(name) {
    return `"${sanitizeIdentifier(name)}"`;
}
function mapOperator(op) {
    switch (op) {
        case 'equals': return '=';
        case 'notEquals': return '!=';
        case 'greaterThan': return '>';
        case 'greaterThanOrEqual': return '>=';
        case 'lessThan': return '<';
        case 'lessThanOrEqual': return '<=';
        case 'contains': return 'LIKE';
        default: return '=';
    }
}
function buildWhereClause(filters) {
    if (filters.length === 0)
        return '';
    const conditions = filters.map(f => {
        const field = quoteId(f.field);
        const op = mapOperator(f.operator);
        if (f.value === null || f.value === undefined) {
            return f.operator === 'equals' ? `${field} IS NULL` : `${field} IS NOT NULL`;
        }
        if (typeof f.value === 'string') {
            const escaped = String(f.value).replace(/'/g, "''");
            if (f.operator === 'contains')
                return `${field} LIKE '%${escaped}%'`;
            if (f.operator === 'startsWith')
                return `${field} LIKE '${escaped}%'`;
            if (f.operator === 'endsWith')
                return `${field} LIKE '%${escaped}'`;
            return `${field} ${op} '${escaped}'`;
        }
        return `${field} ${op} ${f.value}`;
    });
    return ` WHERE ${conditions.join(' AND ')}`;
}
function buildOrderByClause(sort) {
    if (sort.length === 0)
        return '';
    const clauses = sort.map(s => `${quoteId(s.field)} ${s.direction.toUpperCase()}`);
    return ` ORDER BY ${clauses.join(', ')}`;
}
function buildLimitClause(query) {
    let clause = '';
    if (query.limit !== undefined)
        clause += ` LIMIT ${query.limit}`;
    if (query.offset !== undefined)
        clause += ` OFFSET ${query.offset}`;
    return clause;
}
export function createDuckDBQueryBackend(options) {
    const { tableName, executeSQL } = options;
    const safeTable = quoteId(tableName);
    const capabilities = {
        filter: true,
        sort: true,
        group: true,
        aggregate: true,
        pagination: true,
    };
    return {
        async execute(query) {
            const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const fields = query.fields && query.fields.length > 0
                ? query.fields.map(f => quoteId(f)).join(', ')
                : '*';
            const where = buildWhereClause(query.filters);
            const orderBy = buildOrderByClause(query.sort);
            const limit = buildLimitClause(query);
            const countSQL = `SELECT COUNT(*) as cnt FROM ${safeTable}`;
            const filteredCountSQL = `SELECT COUNT(*) as cnt FROM ${safeTable}${where}`;
            const dataSQL = `SELECT ${fields} FROM ${safeTable}${where}${orderBy}${limit}`;
            const [countResult, filteredResult, rows] = await Promise.all([
                executeSQL(countSQL),
                executeSQL(filteredCountSQL),
                executeSQL(dataSQL),
            ]);
            const totalCount = Number(countResult[0]?.cnt ?? 0);
            const filteredCount = Number(filteredResult[0]?.cnt ?? 0);
            const elapsed = typeof performance !== 'undefined'
                ? performance.now() - startTime
                : Date.now() - startTime;
            return {
                rows,
                totalCount,
                filteredCount,
                executionEngine: 'duckdb-wasm',
                executionTimeMs: Math.round(elapsed * 100) / 100,
            };
        },
        getCapabilities() {
            return { ...capabilities };
        },
    };
}
//# sourceMappingURL=duckdb-query-backend.js.map