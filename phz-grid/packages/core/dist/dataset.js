/**
 * @phozart/core — DataSet Utilities
 *
 * Conversion and factory functions for the DataSet container.
 */
/**
 * Map a DataSetColumnType to a core ColumnType.
 * - `datetime` → `date` (grid renders both via date formatter)
 * - `enum` → `string` (grid renders as plain text / status badge)
 */
function normalizeType(dsType) {
    switch (dsType) {
        case 'datetime': return 'date';
        case 'enum': return 'string';
        default: return dsType;
    }
}
/**
 * Convert DataSetColumn[] to ColumnDefinition[] for the grid.
 *
 * - `label` maps to `header`
 * - `datetime` / `enum` are normalized to core types
 * - `sortable` defaults to `true`
 * - Only includes columns where `visible !== false`
 */
export function toColumnDefinitions(columns) {
    return columns
        .filter(c => c.visible !== false)
        .map(c => {
        const def = {
            field: c.field,
            header: c.label ?? c.field,
            type: normalizeType(c.type),
            sortable: c.sortable !== false,
        };
        return def;
    });
}
/**
 * Convenience factory for creating a DataSet with type safety.
 */
export function createDataSet(columns, rows, meta) {
    return { columns, rows, meta };
}
/**
 * Infer DataSetColumn[] from sample rows.
 *
 * Scans the first few rows to detect types:
 * - `boolean` if all non-null values are boolean
 * - `number` if all non-null values are numeric
 * - `date` if value is a Date instance or ISO-format string
 * - `string` otherwise
 */
export function inferDataSetColumns(rows) {
    if (rows.length === 0)
        return [];
    const sampleSize = Math.min(rows.length, 50);
    const fields = Object.keys(rows[0]);
    return fields.map(field => {
        let boolCount = 0;
        let numCount = 0;
        let dateCount = 0;
        let nonNullCount = 0;
        for (let i = 0; i < sampleSize; i++) {
            const val = rows[i][field];
            if (val == null)
                continue;
            nonNullCount++;
            if (typeof val === 'boolean') {
                boolCount++;
            }
            else if (typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)))) {
                numCount++;
            }
            else if (val instanceof Date) {
                dateCount++;
            }
            else if (typeof val === 'string' && ISO_DATE_RE.test(val)) {
                dateCount++;
            }
        }
        let type = 'string';
        if (nonNullCount > 0) {
            if (boolCount === nonNullCount)
                type = 'boolean';
            else if (numCount === nonNullCount)
                type = 'number';
            else if (dateCount === nonNullCount)
                type = 'date';
        }
        return { field, type, label: field };
    });
}
/** Matches ISO date strings (YYYY-MM-DD with optional time). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;
//# sourceMappingURL=dataset.js.map