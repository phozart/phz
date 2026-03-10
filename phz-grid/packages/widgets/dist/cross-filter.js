/**
 * @phozart/phz-widgets — Cross-Filter Utilities
 *
 * Pure functions for cross-filtering between dashboard widgets.
 * No DOM dependencies — used by PhzDashboard to coordinate widget data.
 */
/**
 * Create a CrossFilterEvent from widget click parameters.
 */
export function createCrossFilterEvent(params) {
    return {
        sourceWidgetId: params.sourceWidgetId,
        field: params.field,
        value: params.value,
    };
}
/**
 * Apply a cross-filter event, returning a CrossFilterState.
 * The state's getFilteredData method returns filtered data for non-source widgets
 * and unfiltered data for the source widget.
 */
export function applyCrossFilter(event) {
    return {
        active: true,
        sourceWidgetId: event.sourceWidgetId,
        field: event.field,
        value: event.value,
        getFilteredData(data, widgetId) {
            // Source widget gets unfiltered data
            if (widgetId === event.sourceWidgetId)
                return data;
            // Other widgets get filtered data
            if (Array.isArray(event.value)) {
                return data.filter(row => event.value.includes(String(row[event.field] ?? '')));
            }
            return data.filter(row => String(row[event.field] ?? '') === String(event.value));
        },
    };
}
/**
 * Clear cross-filter state, returning an inactive state that passes all data through.
 */
export function clearCrossFilter() {
    return {
        active: false,
        sourceWidgetId: undefined,
        field: undefined,
        value: undefined,
        getFilteredData(data) {
            return data;
        },
    };
}
/**
 * Check if a widget is the cross-filter source.
 */
export function isCrossFilterSource(state, widgetId) {
    return state.active && state.sourceWidgetId === widgetId;
}
//# sourceMappingURL=cross-filter.js.map