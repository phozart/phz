/**
 * @phozart/phz-workspace — Filter Bar Utilities (O.5 + O.5a)
 *
 * Auto-select filter UI type from field type/cardinality.
 * Build date filter options from TimeIntelligenceConfig.
 *
 * Lit component rendering is intentionally excluded here
 * (requires browser environment). This module provides the
 * headless logic that a Lit component would consume.
 */
export function inferFilterUIType(field, options) {
    switch (field.dataType) {
        case 'boolean':
            return 'boolean-toggle';
        case 'date':
            if (options?.hasTimeIntelligence && field.semanticHint === 'timestamp') {
                return 'date-preset';
            }
            return 'date-range';
        case 'number':
            return 'numeric-range';
        case 'string':
            switch (field.cardinality) {
                case 'low': return 'select';
                case 'medium': return 'chip-select';
                case 'high': return 'search';
                default: return 'multi-select';
            }
        default:
            return 'search';
    }
}
// Map period IDs to required granularity
const PERIOD_GRANULARITY = {
    'today': 'day',
    'yesterday': 'day',
    'this-week': 'week',
    'last-week': 'week',
    'this-month': 'month',
    'last-month': 'month',
    'this-quarter': 'quarter',
    'last-quarter': 'quarter',
    'this-year': 'year',
    'last-year': 'year',
    'last-7-days': 'day',
    'last-30-days': 'day',
    'last-90-days': 'day',
    'last-365-days': 'day',
};
export function buildDateFilterOptions(config) {
    const availableGranularities = new Set(config.granularities);
    return config.relativePeriods
        .filter(period => {
        const required = PERIOD_GRANULARITY[period.id];
        if (!required)
            return true; // custom periods always included
        return availableGranularities.has(required);
    })
        .map(period => ({
        id: period.id,
        label: period.label,
    }));
}
//# sourceMappingURL=phz-filter-bar.js.map