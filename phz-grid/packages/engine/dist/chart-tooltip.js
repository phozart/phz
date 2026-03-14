/**
 * @phozart/engine — Chart Tooltip Configuration
 *
 * Types and pure functions for tooltip customization on chart widgets.
 * Supports auto-resolution from chart encoding channels and manual
 * custom field configuration with conditional visibility.
 */
// ========================================================================
// resolveAutoTooltip
// ========================================================================
/**
 * Auto-assembles tooltip fields from chart encoding channels.
 * Display order: category → values → color → detail.
 * If a KPIDefinition with an active delta comparison is provided,
 * appends a synthetic `_delta` field.
 */
export function resolveAutoTooltip(encoding, kpiDef) {
    const fields = [];
    let order = 0;
    // Category first
    if (encoding.category != null) {
        fields.push({ field: encoding.category, order: order++ });
    }
    // Value fields
    for (const v of encoding.value) {
        fields.push({ field: v, order: order++ });
    }
    // Color
    if (encoding.color != null) {
        fields.push({ field: encoding.color, order: order++ });
    }
    // Detail
    if (encoding.detail != null) {
        fields.push({ field: encoding.detail, order: order++ });
    }
    // KPI delta field (only when comparison is active)
    if (kpiDef != null && kpiDef.deltaComparison !== 'none') {
        fields.push({ field: '_delta', label: 'Delta', order: order++ });
    }
    return fields;
}
// ========================================================================
// evaluateTooltipCondition
// ========================================================================
/**
 * Evaluates a conditional visibility rule against a data row.
 * Returns false when:
 *  - the field is missing from rowData
 *  - types are incompatible for ordered comparisons (gt/lt/gte/lte)
 */
export function evaluateTooltipCondition(condition, rowData) {
    const actual = rowData[condition.field];
    if (actual === undefined)
        return false;
    const expected = condition.value;
    // eq and ne work across all types
    if (condition.operator === 'eq')
        return actual === expected;
    if (condition.operator === 'ne')
        return actual !== expected;
    // Ordered comparisons require matching numeric types
    if (typeof actual !== 'number' || typeof expected !== 'number')
        return false;
    switch (condition.operator) {
        case 'gt': return actual > expected;
        case 'lt': return actual < expected;
        case 'gte': return actual >= expected;
        case 'lte': return actual <= expected;
        default: return false;
    }
}
// ========================================================================
// computeTooltipDelta
// ========================================================================
/**
 * Computes the delta between a current and comparison value.
 * Handles division by zero: when comparisonValue is 0, percentage
 * is null and formatted shows 'N/A' for the percentage part.
 */
export function computeTooltipDelta(currentValue, comparisonValue, deltaMode) {
    const diff = currentValue - comparisonValue;
    const canPercent = comparisonValue !== 0;
    const pct = canPercent ? (diff / comparisonValue) * 100 : null;
    const sign = (n) => (n > 0 ? '+' : n < 0 ? '' : '');
    switch (deltaMode) {
        case 'absolute':
            return {
                absolute: diff,
                percentage: null,
                formatted: `${sign(diff)}${diff}`,
            };
        case 'percentage':
            return {
                absolute: null,
                percentage: pct,
                formatted: pct != null ? `${sign(pct)}${pct.toFixed(1)}%` : 'N/A',
            };
        case 'both': {
            const absPart = `${sign(diff)}${diff}`;
            const pctPart = pct != null ? `${sign(pct)}${pct.toFixed(1)}%` : 'N/A';
            return {
                absolute: diff,
                percentage: pct,
                formatted: `${absPart} (${pctPart})`,
            };
        }
    }
}
//# sourceMappingURL=chart-tooltip.js.map