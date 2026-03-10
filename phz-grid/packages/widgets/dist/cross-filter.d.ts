/**
 * @phozart/phz-widgets — Cross-Filter Utilities
 *
 * Pure functions for cross-filtering between dashboard widgets.
 * No DOM dependencies — used by PhzDashboard to coordinate widget data.
 */
export interface CrossFilterEvent {
    sourceWidgetId: string;
    field: string;
    value: string | string[];
}
export interface CrossFilterState {
    active: boolean;
    sourceWidgetId?: string;
    field?: string;
    value?: string | string[];
    /** Get data for a specific widget, applying cross-filter if active and widget is not the source. */
    getFilteredData: (data: Record<string, unknown>[], widgetId: string) => Record<string, unknown>[];
}
/**
 * Create a CrossFilterEvent from widget click parameters.
 */
export declare function createCrossFilterEvent(params: {
    sourceWidgetId: string;
    field: string;
    value: string | string[];
}): CrossFilterEvent;
/**
 * Apply a cross-filter event, returning a CrossFilterState.
 * The state's getFilteredData method returns filtered data for non-source widgets
 * and unfiltered data for the source widget.
 */
export declare function applyCrossFilter(event: CrossFilterEvent): CrossFilterState;
/**
 * Clear cross-filter state, returning an inactive state that passes all data through.
 */
export declare function clearCrossFilter(): CrossFilterState;
/**
 * Check if a widget is the cross-filter source.
 */
export declare function isCrossFilterSource(state: CrossFilterState, widgetId: string): boolean;
//# sourceMappingURL=cross-filter.d.ts.map