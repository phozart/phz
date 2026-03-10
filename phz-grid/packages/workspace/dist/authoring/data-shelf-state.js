/**
 * @phozart/phz-workspace — Data Shelf State (Canvas Phase 3A)
 *
 * Bridges the engine's drop zone model (Rows/Columns/Values/Filters)
 * with the dashboard editor's widget data config (dimensions/measures/filters).
 * Provides a Tableau-like shelf UX for binding data to widgets.
 *
 * All functions are pure and domain-prefixed with `dataShelf` to avoid
 * barrel collisions in the workspace root barrel.
 */
// ========================================================================
// Factory
// ========================================================================
/**
 * Creates a DataShelfState from an existing widget's data config.
 *
 * Mapping:
 * - dimensions[0] → rows, dimensions[1..] → columns
 * - measures → values
 * - filters → filters
 */
export function initialDataShelfFromWidget(widgetId, dataConfig) {
    const rows = dataConfig.dimensions.length > 0
        ? [{ name: dataConfig.dimensions[0].field, dataType: 'string', alias: dataConfig.dimensions[0].alias }]
        : [];
    const columns = dataConfig.dimensions.slice(1).map(d => ({
        name: d.field,
        dataType: 'string',
        alias: d.alias,
    }));
    const values = dataConfig.measures.map(m => ({
        name: m.field,
        aggregation: m.aggregation,
        alias: m.alias,
    }));
    const filters = dataConfig.filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
    }));
    return {
        widgetId,
        rows,
        columns,
        values,
        filters,
        showDropZones: true,
    };
}
// ========================================================================
// Auto-aggregation helper
// ========================================================================
/**
 * Returns the default aggregation for a given data type.
 * number → 'sum', everything else → 'count'.
 */
export function getDefaultDataShelfAggregation(dataType) {
    return dataType === 'number' ? 'sum' : 'count';
}
// ========================================================================
// Zone management
// ========================================================================
/**
 * Add a field to a shelf zone.
 *
 * - 'rows' / 'columns': adds as DataShelfField (dimension)
 * - 'values': adds as DataShelfMeasure with auto-aggregation based on dataType
 * - 'filters': adds as DataShelfFilter with operator 'eq' and value null
 */
export function addFieldToDataShelf(state, zone, field) {
    switch (zone) {
        case 'rows':
            return { ...state, rows: [...state.rows, field] };
        case 'columns':
            return { ...state, columns: [...state.columns, field] };
        case 'values': {
            const measure = {
                name: field.name,
                aggregation: getDefaultDataShelfAggregation(field.dataType),
                alias: field.alias,
            };
            return { ...state, values: [...state.values, measure] };
        }
        case 'filters': {
            const filter = {
                field: field.name,
                operator: 'eq',
                value: null,
            };
            return { ...state, filters: [...state.filters, filter] };
        }
    }
}
/**
 * Remove a field from a shelf zone by name.
 */
export function removeFieldFromDataShelf(state, zone, fieldName) {
    switch (zone) {
        case 'rows':
            return { ...state, rows: state.rows.filter(f => f.name !== fieldName) };
        case 'columns':
            return { ...state, columns: state.columns.filter(f => f.name !== fieldName) };
        case 'values':
            return { ...state, values: state.values.filter(m => m.name !== fieldName) };
        case 'filters':
            return { ...state, filters: state.filters.filter(f => f.field !== fieldName) };
    }
}
/**
 * Move a field between shelf zones.
 *
 * - rows/columns → values: auto-applies default aggregation
 * - values → rows/columns: strips aggregation, creates dimension
 * - No-op if field not found in source zone
 */
export function moveFieldBetweenDataShelves(state, from, to, fieldName) {
    if (from === to)
        return state;
    // Find the field in the source zone
    let fieldInfo;
    switch (from) {
        case 'rows': {
            const f = state.rows.find(r => r.name === fieldName);
            if (!f)
                return state;
            fieldInfo = f;
            break;
        }
        case 'columns': {
            const f = state.columns.find(c => c.name === fieldName);
            if (!f)
                return state;
            fieldInfo = f;
            break;
        }
        case 'values': {
            const m = state.values.find(v => v.name === fieldName);
            if (!m)
                return state;
            // Measures don't carry dataType; default to 'number' since they were in values
            fieldInfo = { name: m.name, dataType: 'number', alias: m.alias };
            break;
        }
        case 'filters': {
            const f = state.filters.find(fl => fl.field === fieldName);
            if (!f)
                return state;
            // Filters don't carry dataType; default to 'string'
            fieldInfo = { name: f.field, dataType: 'string' };
            break;
        }
    }
    if (!fieldInfo)
        return state;
    // Remove from source
    const removed = removeFieldFromDataShelf(state, from, fieldName);
    // Add to target
    const shelfField = {
        name: fieldInfo.name,
        dataType: fieldInfo.dataType,
        alias: fieldInfo.alias,
    };
    return addFieldToDataShelf(removed, to, shelfField);
}
/**
 * Reorder a field within its zone.
 */
export function reorderDataShelfField(state, zone, fieldName, newIndex) {
    switch (zone) {
        case 'rows': {
            const idx = state.rows.findIndex(f => f.name === fieldName);
            if (idx === -1)
                return state;
            const clamped = Math.max(0, Math.min(newIndex, state.rows.length - 1));
            const next = [...state.rows];
            const [item] = next.splice(idx, 1);
            next.splice(clamped, 0, item);
            return { ...state, rows: next };
        }
        case 'columns': {
            const idx = state.columns.findIndex(f => f.name === fieldName);
            if (idx === -1)
                return state;
            const clamped = Math.max(0, Math.min(newIndex, state.columns.length - 1));
            const next = [...state.columns];
            const [item] = next.splice(idx, 1);
            next.splice(clamped, 0, item);
            return { ...state, columns: next };
        }
        case 'values': {
            const idx = state.values.findIndex(m => m.name === fieldName);
            if (idx === -1)
                return state;
            const clamped = Math.max(0, Math.min(newIndex, state.values.length - 1));
            const next = [...state.values];
            const [item] = next.splice(idx, 1);
            next.splice(clamped, 0, item);
            return { ...state, values: next };
        }
        case 'filters': {
            const idx = state.filters.findIndex(f => f.field === fieldName);
            if (idx === -1)
                return state;
            const clamped = Math.max(0, Math.min(newIndex, state.filters.length - 1));
            const next = [...state.filters];
            const [item] = next.splice(idx, 1);
            next.splice(clamped, 0, item);
            return { ...state, filters: next };
        }
    }
}
// ========================================================================
// Aggregation
// ========================================================================
/**
 * Update the aggregation function for a measure in the values zone.
 * No-op if the field is not in the values zone.
 */
export function setDataShelfAggregation(state, fieldName, aggregation) {
    const idx = state.values.findIndex(m => m.name === fieldName);
    if (idx === -1)
        return state;
    const next = [...state.values];
    next[idx] = { ...next[idx], aggregation };
    return { ...state, values: next };
}
// ========================================================================
// Drag state
// ========================================================================
/**
 * Set the currently dragged field (for drag-and-drop between zones).
 */
export function startDataShelfDrag(state, field, sourceZone) {
    return { ...state, draggedField: { ...field, sourceZone } };
}
/**
 * Set the zone currently being hovered during a drag (for visual highlight).
 */
export function setDataShelfHoveredZone(state, zone) {
    return { ...state, hoveredZone: zone };
}
/**
 * Clear drag state after drop or cancel.
 */
export function endDataShelfDrag(state) {
    return { ...state, draggedField: undefined, hoveredZone: undefined };
}
// ========================================================================
// Toggle
// ========================================================================
/**
 * Toggle visibility of the drop zone UI overlay.
 */
export function toggleDataShelfDropZones(state) {
    return { ...state, showDropZones: !state.showDropZones };
}
// ========================================================================
// Chart suggestion
// ========================================================================
/**
 * Set the suggested chart type based on current shelf configuration.
 */
export function setDataShelfSuggestion(state, chartType) {
    return { ...state, suggestedChartType: chartType };
}
// ========================================================================
// Export to widget config
// ========================================================================
/**
 * Convert shelf state back to the widget dataConfig format.
 *
 * - rows + columns → dimensions
 * - values → measures (with aggregation)
 * - filters → filters
 */
export function applyDataShelfToWidget(state) {
    const dimensions = [...state.rows, ...state.columns].map(f => ({
        field: f.name,
        alias: f.alias,
    }));
    const measures = state.values.map(m => ({
        field: m.name,
        aggregation: m.aggregation,
        alias: m.alias,
    }));
    const filters = state.filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
    }));
    return { dimensions, measures, filters };
}
//# sourceMappingURL=data-shelf-state.js.map