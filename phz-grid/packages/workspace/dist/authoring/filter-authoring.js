/**
 * @phozart/workspace — Filter Authoring
 *
 * Multi-entry-point filter creation. All entry points produce
 * the same FilterValue output regardless of how the user triggered it.
 */
export function inferFilterDefaults(dataType, cardinality) {
    switch (dataType) {
        case 'boolean':
            return { operator: 'equals', uiType: 'boolean-toggle' };
        case 'date':
            return { operator: 'between', uiType: 'date-range' };
        case 'number':
            return { operator: 'between', uiType: 'numeric-range' };
        case 'string':
        default:
            if (cardinality === 'low')
                return { operator: 'in', uiType: 'select' };
            if (cardinality === 'medium')
                return { operator: 'in', uiType: 'chip-select' };
            return { operator: 'contains', uiType: 'search' };
    }
}
export function createFilterFromEntry(entryPoint, field, dataType, value, cardinality) {
    const defaults = inferFilterDefaults(dataType, cardinality);
    // When filtering by a specific value, use 'equals' instead of range/in
    let operator = defaults.operator;
    if (entryPoint === 'context-menu-filter-by-value' && value !== undefined) {
        operator = 'equals';
    }
    return {
        entryPoint,
        field,
        dataType,
        prefilledValue: value,
        suggestedOperator: operator,
        suggestedUIType: defaults.uiType,
    };
}
let filterIdCounter = 0;
export function finalizeFilter(creation, userChoices) {
    filterIdCounter++;
    const operator = userChoices?.operator ?? creation.suggestedOperator;
    const value = userChoices?.value ?? creation.prefilledValue ?? null;
    return {
        filterId: `filter_${Date.now()}_${filterIdCounter}`,
        field: creation.field,
        operator,
        value,
        label: `${creation.field}: ${formatFilterLabel(operator, value)}`,
    };
}
function formatFilterLabel(operator, value) {
    if (value === null || value === undefined)
        return operator;
    if (operator === 'between' && Array.isArray(value)) {
        return `${value[0]} \u2013 ${value[1]}`;
    }
    if (operator === 'in' && Array.isArray(value)) {
        return value.join(', ');
    }
    return String(value);
}
export function createDashboardFilterDef(field, dataSourceId, options) {
    filterIdCounter++;
    const defaults = inferFilterDefaults('string'); // default to string
    return {
        id: `df_${Date.now()}_${filterIdCounter}`,
        field,
        dataSourceId,
        label: options?.label ?? field,
        filterType: options?.filterType ?? defaults.uiType,
        required: options?.required ?? false,
        appliesTo: options?.appliesTo ?? [],
    };
}
// For testing: reset counter
export function _resetFilterIdCounter() {
    filterIdCounter = 0;
}
//# sourceMappingURL=filter-authoring.js.map