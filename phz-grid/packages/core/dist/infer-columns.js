/**
 * @phozart/core — Column Auto-Inference
 *
 * Infers ColumnDefinition[] from raw data shape.
 * Runs once at createGrid() time, not per-render.
 */
const DEFAULT_SAMPLE_SIZE = 100;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;
/**
 * Convert a field key to a human-readable header.
 * camelCase → "Camel Case", snake_case → "Snake Case"
 */
export function formatFieldAsHeader(field) {
    if (!field)
        return '';
    // Handle snake_case: split on underscores
    const parts = field.split('_');
    // Process each part for camelCase splitting
    const words = [];
    for (const part of parts) {
        if (!part)
            continue;
        // Split camelCase: insert space before uppercase runs
        // "totalRevenueUSD" → ["total", "Revenue", "USD"]
        const camelWords = part.replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            .split(' ');
        words.push(...camelWords);
    }
    return words
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
/**
 * Detect the column type from sampled values.
 * Priority: boolean > number > date > string. Mixed → string.
 */
export function detectColumnType(values) {
    const nonNull = values.filter(v => v !== null && v !== undefined);
    if (nonNull.length === 0)
        return 'string';
    let allBoolean = true;
    let allNumber = true;
    let allDate = true;
    for (const v of nonNull) {
        if (typeof v !== 'boolean')
            allBoolean = false;
        if (typeof v !== 'number')
            allNumber = false;
        if (!(v instanceof Date) && !(typeof v === 'string' && ISO_DATE_RE.test(v))) {
            allDate = false;
        }
    }
    if (allBoolean)
        return 'boolean';
    if (allNumber)
        return 'number';
    if (allDate)
        return 'date';
    return 'string';
}
/**
 * Infer column definitions from data shape.
 * Returns [] if data is empty or first row is not a plain object.
 */
export function inferColumns(data, options) {
    if (data.length === 0)
        return [];
    const firstRow = data[0];
    if (!firstRow || typeof firstRow !== 'object' || Array.isArray(firstRow))
        return [];
    const sampleSize = options?.sampleSize ?? DEFAULT_SAMPLE_SIZE;
    const keys = Object.keys(firstRow);
    const sample = data.slice(0, sampleSize);
    return keys
        .filter(k => !k.startsWith('_'))
        .map(key => {
        const values = sample.map(row => row[key]);
        const type = detectColumnType(values);
        return {
            field: key,
            header: formatFieldAsHeader(key),
            type,
            sortable: true,
            filterable: true,
        };
    });
}
//# sourceMappingURL=infer-columns.js.map