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
export type DataShelfZone = 'rows' | 'columns' | 'values' | 'filters';
export interface DataShelfField {
    name: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    alias?: string;
}
export interface DataShelfMeasure {
    name: string;
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';
    alias?: string;
}
export interface DataShelfFilter {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'between';
    value: unknown;
}
export interface DataShelfState {
    widgetId: string;
    rows: DataShelfField[];
    columns: DataShelfField[];
    values: DataShelfMeasure[];
    filters: DataShelfFilter[];
    showDropZones: boolean;
    draggedField?: {
        name: string;
        dataType: string;
        sourceZone?: DataShelfZone;
    };
    hoveredZone?: DataShelfZone;
    suggestedChartType?: string;
}
/**
 * Creates a DataShelfState from an existing widget's data config.
 *
 * Mapping:
 * - dimensions[0] → rows, dimensions[1..] → columns
 * - measures → values
 * - filters → filters
 */
export declare function initialDataShelfFromWidget(widgetId: string, dataConfig: {
    dimensions: Array<{
        field: string;
        alias?: string;
    }>;
    measures: Array<{
        field: string;
        aggregation: string;
        alias?: string;
    }>;
    filters: Array<{
        field: string;
        operator: string;
        value: unknown;
    }>;
}): DataShelfState;
/**
 * Returns the default aggregation for a given data type.
 * number → 'sum', everything else → 'count'.
 */
export declare function getDefaultDataShelfAggregation(dataType: string): DataShelfMeasure['aggregation'];
/**
 * Add a field to a shelf zone.
 *
 * - 'rows' / 'columns': adds as DataShelfField (dimension)
 * - 'values': adds as DataShelfMeasure with auto-aggregation based on dataType
 * - 'filters': adds as DataShelfFilter with operator 'eq' and value null
 */
export declare function addFieldToDataShelf(state: DataShelfState, zone: DataShelfZone, field: DataShelfField): DataShelfState;
/**
 * Remove a field from a shelf zone by name.
 */
export declare function removeFieldFromDataShelf(state: DataShelfState, zone: DataShelfZone, fieldName: string): DataShelfState;
/**
 * Move a field between shelf zones.
 *
 * - rows/columns → values: auto-applies default aggregation
 * - values → rows/columns: strips aggregation, creates dimension
 * - No-op if field not found in source zone
 */
export declare function moveFieldBetweenDataShelves(state: DataShelfState, from: DataShelfZone, to: DataShelfZone, fieldName: string): DataShelfState;
/**
 * Reorder a field within its zone.
 */
export declare function reorderDataShelfField(state: DataShelfState, zone: DataShelfZone, fieldName: string, newIndex: number): DataShelfState;
/**
 * Update the aggregation function for a measure in the values zone.
 * No-op if the field is not in the values zone.
 */
export declare function setDataShelfAggregation(state: DataShelfState, fieldName: string, aggregation: DataShelfMeasure['aggregation']): DataShelfState;
/**
 * Set the currently dragged field (for drag-and-drop between zones).
 */
export declare function startDataShelfDrag(state: DataShelfState, field: {
    name: string;
    dataType: string;
}, sourceZone?: DataShelfZone): DataShelfState;
/**
 * Set the zone currently being hovered during a drag (for visual highlight).
 */
export declare function setDataShelfHoveredZone(state: DataShelfState, zone: DataShelfZone | undefined): DataShelfState;
/**
 * Clear drag state after drop or cancel.
 */
export declare function endDataShelfDrag(state: DataShelfState): DataShelfState;
/**
 * Toggle visibility of the drop zone UI overlay.
 */
export declare function toggleDataShelfDropZones(state: DataShelfState): DataShelfState;
/**
 * Set the suggested chart type based on current shelf configuration.
 */
export declare function setDataShelfSuggestion(state: DataShelfState, chartType: string | undefined): DataShelfState;
/**
 * Convert shelf state back to the widget dataConfig format.
 *
 * - rows + columns → dimensions
 * - values → measures (with aggregation)
 * - filters → filters
 */
export declare function applyDataShelfToWidget(state: DataShelfState): {
    dimensions: Array<{
        field: string;
        alias?: string;
    }>;
    measures: Array<{
        field: string;
        aggregation: string;
        alias?: string;
    }>;
    filters: Array<{
        field: string;
        operator: string;
        value: unknown;
    }>;
};
//# sourceMappingURL=data-shelf-state.d.ts.map