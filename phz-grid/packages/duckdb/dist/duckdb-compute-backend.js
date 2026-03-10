/**
 * @phozart/phz-duckdb — DuckDB ComputeBackend
 *
 * Implements ComputeBackend by generating SQL and delegating execution
 * to a DuckDB connection via the DuckDBQueryExecutor interface.
 */
import { buildAggregationQuery } from './duckdb-aggregation.js';
import { buildPivotQuery } from './duckdb-pivot.js';
import { buildGridQuery, sanitizeIdentifier } from './sql-builder.js';
export class DuckDBComputeBackend {
    executor;
    constructor(executor) {
        this.executor = executor;
    }
    async aggregate(_data, config) {
        const fields = config.fields.map(f => ({
            field: f.field,
            functions: f.functions,
        }));
        const { sql, params } = buildAggregationQuery(this.executor.tableName, fields);
        const rows = await this.executor.execute(sql, params);
        const row = rows[0];
        const fieldResults = {};
        for (const fieldConfig of config.fields) {
            const results = {};
            for (const fn of fieldConfig.functions) {
                const key = `${fieldConfig.field}_${fn}`;
                results[fn] = row?.[key] ?? null;
            }
            fieldResults[fieldConfig.field] = results;
        }
        return { fieldResults };
    }
    async pivot(_data, config) {
        if (config.valueFields.length === 0 || config.columnFields.length === 0) {
            return { rowHeaders: [], columnHeaders: [], cells: [], grandTotals: [] };
        }
        const { sql, params } = buildPivotQuery(this.executor.tableName, config);
        const rows = await this.executor.execute(sql, params);
        // DuckDB PIVOT returns one row per row-key with dynamic column names.
        // We reconstruct PivotResult from the returned rows.
        const rowHeaders = [];
        const colHeaderSet = new Set();
        // Identify row-key columns vs pivot columns
        const rowFieldNames = config.rowFields.map(f => sanitizeIdentifier(f));
        for (const row of rows) {
            const rowKey = rowFieldNames.map(f => String(row[f] ?? ''));
            rowHeaders.push(rowKey);
            for (const key of Object.keys(row)) {
                if (!rowFieldNames.includes(key)) {
                    colHeaderSet.add(key);
                }
            }
        }
        const columnHeaders = Array.from(colHeaderSet).sort().map(k => [k]);
        const cells = rows.map(row => {
            return Array.from(colHeaderSet).sort().map(col => row[col] ?? null);
        });
        const grandTotals = Array.from(colHeaderSet).sort().map(() => null);
        return { rowHeaders, columnHeaders, cells, grandTotals };
    }
    async filter(_data, criteria) {
        const { sql, params } = buildGridQuery({
            tableName: this.executor.tableName,
            filters: criteria,
            sort: [],
            groupBy: [],
        });
        return this.executor.execute(sql, params);
    }
    async computeCalculatedFields(_data, fields) {
        const table = `"${sanitizeIdentifier(this.executor.tableName)}"`;
        if (fields.length === 0) {
            const sql = `SELECT * FROM ${table}`;
            return this.executor.execute(sql);
        }
        const extras = fields.map(f => `(${f.expression}) AS "${sanitizeIdentifier(f.name)}"`).join(', ');
        const sql = `SELECT *, ${extras} FROM ${table}`;
        return this.executor.execute(sql);
    }
}
export function createDuckDBComputeBackend(executor) {
    return new DuckDBComputeBackend(executor);
}
const ALLOWED_FUNCTIONS = new Set([
    'ABS', 'ROUND', 'CEIL', 'CEILING', 'FLOOR', 'TRUNC', 'TRUNCATE',
    'COALESCE', 'NULLIF', 'CAST', 'TRY_CAST',
    'UPPER', 'LOWER', 'LENGTH', 'TRIM', 'LTRIM', 'RTRIM', 'SUBSTRING', 'SUBSTR',
    'SUM', 'AVG', 'MIN', 'MAX', 'COUNT',
    'SQRT', 'POWER', 'MOD', 'LOG', 'LN', 'EXP',
    'DATE_PART', 'DATE_TRUNC', 'EXTRACT',
    'REPLACE', 'CONCAT', 'LEFT', 'RIGHT',
    'IF', 'IIF', 'CASE',
]);
const DANGEROUS_PATTERNS = [
    /;/,
    /--/,
    /\/\*/,
    /\*\//,
    /'/,
    /"/,
    /\bSELECT\b/i,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
    /\bEXEC\b/i,
    /\bUNION\b/i,
    /\bINTO\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
];
/**
 * Validates and sanitizes a SQL expression for use in calculated fields.
 * Returns the trimmed expression if safe, throws if dangerous.
 */
export function sanitizeExpression(expr) {
    const trimmed = expr.trim();
    if (trimmed.length === 0) {
        throw new Error('Expression must not be empty');
    }
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(trimmed)) {
            throw new Error('Unsafe SQL expression');
        }
    }
    // Validate that all function-like tokens are in the allowlist
    const funcPattern = /\b([A-Z_][A-Z0-9_]*)\s*\(/gi;
    let match;
    while ((match = funcPattern.exec(trimmed)) !== null) {
        if (!ALLOWED_FUNCTIONS.has(match[1].toUpperCase())) {
            throw new Error('Unsafe SQL expression');
        }
    }
    return trimmed;
}
//# sourceMappingURL=duckdb-compute-backend.js.map