/**
 * @phozart/phz-engine/explorer — Explorer <-> Dashboard Integration
 *
 * Filter promotion: explore filters -> DashboardFilterDef
 * Drill-through pre-population: dimension values -> FilterValue[]
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
// ========================================================================
// ID generation
// ========================================================================
let counter = 0;
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${++counter}`;
}
// ========================================================================
// Operator -> FilterUIType mapping
// ========================================================================
const NUMERIC_OPERATORS = new Set(['gt', 'gte', 'lt', 'lte', 'between']);
function inferFilterType(operator) {
    if (operator === 'in' || operator === 'not_in')
        return 'multi-select';
    if (NUMERIC_OPERATORS.has(operator))
        return 'numeric-range';
    return 'select';
}
// ========================================================================
// promoteFilterToDashboard
// ========================================================================
export function promoteFilterToDashboard(filter, dataSourceId, appliesTo = []) {
    return {
        id: generateId('promoted'),
        field: filter.field,
        dataSourceId,
        label: filter.field,
        filterType: inferFilterType(filter.operator),
        defaultValue: filter.value,
        required: false,
        appliesTo,
    };
}
// ========================================================================
// buildDrillThroughPrePopulation
// ========================================================================
export function buildDrillThroughPrePopulation(dimensionValues) {
    const filters = [];
    for (const [field, value] of Object.entries(dimensionValues)) {
        if (value === null || value === undefined) {
            filters.push({
                filterId: `drill_${field}`,
                field,
                operator: 'isNull',
                value: null,
                label: `Drill: ${field} is null`,
            });
        }
        else {
            filters.push({
                filterId: `drill_${field}`,
                field,
                operator: 'equals',
                value,
                label: `Drill: ${field} = ${value}`,
            });
        }
    }
    return filters;
}
//# sourceMappingURL=explorer-dashboard-integration.js.map