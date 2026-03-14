/**
 * @phozart/engine/explorer — Aggregation Validation
 *
 * Validates aggregation compatibility with field data types.
 * Extracted from workspace format-value.ts in v15 (A-2.01).
 */
// --- Aggregation sets ---
const NUMERIC_ONLY_AGGREGATIONS = new Set([
    'sum', 'avg', 'median', 'stddev', 'variance',
]);
const UNIVERSAL_AGGREGATIONS = new Set([
    'count', 'countDistinct', 'count_distinct', 'first', 'last',
]);
const ORDERABLE_AGGREGATIONS = new Set([
    'min', 'max',
]);
export function validateAggregation(field, aggregation) {
    // Universal aggregations work on any type
    if (UNIVERSAL_AGGREGATIONS.has(aggregation)) {
        return null;
    }
    // Orderable aggregations (min/max) work on number, date, string
    if (ORDERABLE_AGGREGATIONS.has(aggregation)) {
        if (field.dataType === 'boolean') {
            return {
                severity: 'error',
                message: `Cannot apply ${aggregation} to boolean field "${field.name}"`,
                field: field.name,
                aggregation,
            };
        }
        return null;
    }
    // Numeric-only aggregations
    if (NUMERIC_ONLY_AGGREGATIONS.has(aggregation)) {
        if (field.dataType !== 'number') {
            return {
                severity: 'error',
                message: `Cannot apply ${aggregation} to ${field.dataType} field "${field.name}". ${aggregation} requires a numeric field.`,
                field: field.name,
                aggregation,
            };
        }
        // Warn about nullable fields
        if (field.nullable) {
            return {
                severity: 'warning',
                message: `Field "${field.name}" is nullable. ${aggregation} will ignore null values, which may produce unexpected results.`,
                field: field.name,
                aggregation,
            };
        }
        return null;
    }
    // Unknown aggregation — allow but warn
    return {
        severity: 'warning',
        message: `Unknown aggregation "${aggregation}" on field "${field.name}"`,
        field: field.name,
        aggregation,
    };
}
//# sourceMappingURL=aggregation-validation.js.map