/**
 * @phozart/phz-duckdb — DuckDB Pivot
 *
 * Generates DuckDB-native PIVOT SQL from PivotConfig.
 * Supports multiple value fields (unlike the JS engine which uses only the first).
 */
import { sanitizeIdentifier } from './sql-builder.js';
function aggFnToSQL(fn) {
    return fn.toUpperCase();
}
export function buildPivotQuery(tableName, config) {
    if (config.valueFields.length === 0 ||
        config.columnFields.length === 0) {
        return { sql: '', params: [] };
    }
    const table = `"${sanitizeIdentifier(tableName)}"`;
    // Build USING clause: SUM("revenue"), AVG("revenue")
    const usingParts = config.valueFields.map(vf => `${aggFnToSQL(vf.aggregation)}("${sanitizeIdentifier(vf.field)}")`).join(', ');
    // ON clause: the column field to pivot on (DuckDB PIVOT supports single ON field)
    const onField = `"${sanitizeIdentifier(config.columnFields[0])}"`;
    // GROUP BY clause: the row fields
    const groupByParts = config.rowFields.map(f => `"${sanitizeIdentifier(f)}"`);
    let sql = `PIVOT ${table} ON ${onField} USING ${usingParts}`;
    if (groupByParts.length > 0) {
        sql += ` GROUP BY ${groupByParts.join(', ')}`;
    }
    return { sql, params: [] };
}
//# sourceMappingURL=duckdb-pivot.js.map