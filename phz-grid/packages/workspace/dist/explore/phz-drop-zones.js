/**
 * @phozart/phz-workspace — Drop Zones Logic (P.2 + P.2a)
 *
 * 4 drop zones: Rows, Columns, Values, Filters
 * Aggregation defaults, cardinality warnings, validation.
 * Immutable state transitions.
 */
import { validateAggregation } from '../format/format-value.js';
// ========================================================================
// createDropZoneState
// ========================================================================
export function createDropZoneState() {
    return {
        rows: [],
        columns: [],
        values: [],
        filters: [],
    };
}
// ========================================================================
// getDefaultAggregation
// ========================================================================
export function getDefaultAggregation(dataType) {
    return dataType === 'number' ? 'sum' : 'count';
}
// ========================================================================
// addFieldToZone
// ========================================================================
export function addFieldToZone(state, zone, field) {
    const next = { ...state };
    if (zone === 'values') {
        // Check for duplicates
        if (state.values.some(v => v.field === field.name))
            return state;
        next.values = [
            ...state.values,
            {
                field: field.name,
                dataType: field.dataType,
                aggregation: getDefaultAggregation(field.dataType),
            },
        ];
    }
    else if (zone === 'filters') {
        if (state.filters.some(f => f.field === field.name))
            return state;
        next.filters = [
            ...state.filters,
            {
                field: field.name,
                dataType: field.dataType,
                operator: 'eq',
                value: undefined,
            },
        ];
    }
    else {
        // rows or columns
        const arr = state[zone];
        if (arr.some(d => d.field === field.name))
            return state;
        next[zone] = [
            ...arr,
            { field: field.name, dataType: field.dataType },
        ];
    }
    return next;
}
// ========================================================================
// removeFieldFromZone
// ========================================================================
export function removeFieldFromZone(state, zone, fieldName) {
    const next = { ...state };
    if (zone === 'values') {
        next.values = state.values.filter(v => v.field !== fieldName);
    }
    else if (zone === 'filters') {
        next.filters = state.filters.filter(f => f.field !== fieldName);
    }
    else {
        next[zone] = state[zone].filter(d => d.field !== fieldName);
    }
    return next;
}
// ========================================================================
// moveFieldBetweenZones
// ========================================================================
export function moveFieldBetweenZones(state, fromZone, toZone, fieldName) {
    // Find the field entry to get its dataType
    let dataType = 'string';
    if (fromZone === 'values') {
        const entry = state.values.find(v => v.field === fieldName);
        if (entry)
            dataType = entry.dataType;
    }
    else if (fromZone === 'filters') {
        const entry = state.filters.find(f => f.field === fieldName);
        if (entry)
            dataType = entry.dataType;
    }
    else {
        const entry = state[fromZone].find(d => d.field === fieldName);
        if (entry)
            dataType = entry.dataType;
    }
    const removed = removeFieldFromZone(state, fromZone, fieldName);
    const field = { name: fieldName, dataType, nullable: false };
    return addFieldToZone(removed, toZone, field);
}
// ========================================================================
// getCardinalityWarning (P.2)
// ========================================================================
export function getCardinalityWarning(fieldName, distinctCount, threshold = 20) {
    if (distinctCount > threshold) {
        return `Field "${fieldName}" has ${distinctCount} distinct values (threshold: ${threshold}). This may produce a wide pivot.`;
    }
    return null;
}
// ========================================================================
// validateDropZoneAggregation (P.2a)
// ========================================================================
export function validateDropZoneAggregation(field, aggregation) {
    return validateAggregation(field, aggregation);
}
//# sourceMappingURL=phz-drop-zones.js.map