/**
 * @phozart/duckdb — SQL Builder
 *
 * Generates parameterized SQL from grid state (filters, sort, grouping, viewport).
 * Never interpolates values — all user data goes through params array.
 */
export function sanitizeIdentifier(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
}
function aggFnToSQL(fn, col) {
    switch (fn) {
        case 'sum': return `SUM(${col})`;
        case 'avg': return `AVG(${col})`;
        case 'min': return `MIN(${col})`;
        case 'max': return `MAX(${col})`;
        case 'count': return `COUNT(${col})`;
    }
}
function buildHavingClause(having) {
    if (having.length === 0)
        return { clause: '', params: [] };
    const parts = [];
    const params = [];
    for (const h of having) {
        const col = `"${sanitizeIdentifier(h.field)}"`;
        const aggExpr = aggFnToSQL(h.aggregation, col);
        const { sql, values } = filterToSQL(aggExpr, h.operator, h.value);
        parts.push(sql);
        params.push(...values);
    }
    return { clause: `HAVING ${parts.join(' AND ')}`, params };
}
function buildWhereClause(filters) {
    if (filters.length === 0)
        return { clause: '', params: [] };
    const parts = [];
    const params = [];
    for (const filter of filters) {
        const col = `"${sanitizeIdentifier(filter.field)}"`;
        const { sql, values } = filterToSQL(col, filter.operator, filter.value);
        parts.push(sql);
        params.push(...values);
    }
    return { clause: `WHERE ${parts.join(' AND ')}`, params };
}
function filterToSQL(col, operator, value) {
    switch (operator) {
        case 'equals':
            return { sql: `${col} = ?`, values: [value] };
        case 'notEquals':
            return { sql: `${col} != ?`, values: [value] };
        case 'contains':
            return { sql: `${col} ILIKE '%' || ? || '%'`, values: [value] };
        case 'notContains':
            return { sql: `${col} NOT ILIKE '%' || ? || '%'`, values: [value] };
        case 'startsWith':
            return { sql: `${col} ILIKE ? || '%'`, values: [value] };
        case 'endsWith':
            return { sql: `${col} ILIKE '%' || ?`, values: [value] };
        case 'lessThan':
            return { sql: `${col} < ?`, values: [value] };
        case 'lessThanOrEqual':
            return { sql: `${col} <= ?`, values: [value] };
        case 'greaterThan':
            return { sql: `${col} > ?`, values: [value] };
        case 'greaterThanOrEqual':
            return { sql: `${col} >= ?`, values: [value] };
        case 'between': {
            const [min, max] = value;
            return { sql: `${col} BETWEEN ? AND ?`, values: [min, max] };
        }
        case 'in': {
            const arr = value;
            const placeholders = arr.map(() => '?').join(', ');
            return { sql: `${col} IN (${placeholders})`, values: arr };
        }
        case 'notIn': {
            const arr = value;
            const placeholders = arr.map(() => '?').join(', ');
            return { sql: `${col} NOT IN (${placeholders})`, values: arr };
        }
        case 'isNull':
            return { sql: `${col} IS NULL`, values: [] };
        case 'isNotNull':
            return { sql: `${col} IS NOT NULL`, values: [] };
        case 'isEmpty':
            return { sql: `(${col} IS NULL OR ${col} = '')`, values: [] };
        case 'isNotEmpty':
            return { sql: `(${col} IS NOT NULL AND ${col} != '')`, values: [] };
        case 'dateDayOfWeek': {
            const arr = value;
            const placeholders = arr.map(() => '?').join(', ');
            return { sql: `EXTRACT(DOW FROM ${col}) IN (${placeholders})`, values: arr };
        }
        case 'dateMonth': {
            const arr = value;
            const placeholders = arr.map(() => '?').join(', ');
            return { sql: `(EXTRACT(MONTH FROM ${col}) - 1) IN (${placeholders})`, values: arr };
        }
        case 'dateYear': {
            const arr = value;
            const placeholders = arr.map(() => '?').join(', ');
            return { sql: `EXTRACT(YEAR FROM ${col}) IN (${placeholders})`, values: arr };
        }
        case 'dateWeekNumber': {
            const arr = value;
            const placeholders = arr.map(() => '?').join(', ');
            return { sql: `EXTRACT(WEEK FROM ${col}) IN (${placeholders})`, values: arr };
        }
        default:
            return { sql: '1=1', values: [] };
    }
}
export function buildGridQuery(input) {
    const table = `"${sanitizeIdentifier(input.tableName)}"`;
    const params = [];
    // SELECT
    let sql;
    const hasAggregates = input.aggregates && input.aggregates.length > 0;
    if (hasAggregates && input.groupBy.length > 0) {
        const groupCols = input.groupBy.map(f => `"${sanitizeIdentifier(f)}"`);
        const aggCols = input.aggregates.map(a => {
            const col = `"${sanitizeIdentifier(a.field)}"`;
            const alias = `"${sanitizeIdentifier(a.field)}_${sanitizeIdentifier(a.function)}"`;
            return `${aggFnToSQL(a.function, col)} AS ${alias}`;
        });
        const selectParts = [...groupCols, ...aggCols, 'COUNT(*) AS "group_count"'];
        sql = `SELECT ${selectParts.join(', ')} FROM ${table}`;
    }
    else {
        sql = `SELECT * FROM ${table}`;
    }
    // WHERE
    const where = buildWhereClause(input.filters);
    if (where.clause) {
        sql += ` ${where.clause}`;
        params.push(...where.params);
    }
    // GROUP BY
    if (input.groupBy.length > 0) {
        const groups = input.groupBy.map(f => `"${sanitizeIdentifier(f)}"`).join(', ');
        sql += ` GROUP BY ${groups}`;
    }
    // HAVING
    if (input.having && input.having.length > 0) {
        const having = buildHavingClause(input.having);
        if (having.clause) {
            sql += ` ${having.clause}`;
            params.push(...having.params);
        }
    }
    // ORDER BY
    if (input.sort.length > 0) {
        const sorts = input.sort.map(s => `"${sanitizeIdentifier(s.field)}" ${s.direction === 'desc' ? 'DESC' : 'ASC'}`).join(', ');
        sql += ` ORDER BY ${sorts}`;
    }
    // LIMIT/OFFSET
    if (input.viewport) {
        sql += ` LIMIT ? OFFSET ?`;
        params.push(input.viewport.limit, input.viewport.offset);
    }
    return { sql, params };
}
export function buildCountQuery(input) {
    const table = `"${sanitizeIdentifier(input.tableName)}"`;
    const params = [];
    let sql;
    if (input.groupBy && input.groupBy.length > 0) {
        const groups = input.groupBy.map(f => `"${sanitizeIdentifier(f)}"`).join(', ');
        sql = `SELECT ${groups}, COUNT(*) AS "total" FROM ${table}`;
    }
    else {
        sql = `SELECT COUNT(*) AS "total" FROM ${table}`;
    }
    const where = buildWhereClause(input.filters);
    if (where.clause) {
        sql += ` ${where.clause}`;
        params.push(...where.params);
    }
    if (input.groupBy && input.groupBy.length > 0) {
        const groups = input.groupBy.map(f => `"${sanitizeIdentifier(f)}"`).join(', ');
        sql += ` GROUP BY ${groups}`;
    }
    return { sql, params };
}
//# sourceMappingURL=sql-builder.js.map