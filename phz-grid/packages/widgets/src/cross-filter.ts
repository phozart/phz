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
export function createCrossFilterEvent(params: {
  sourceWidgetId: string;
  field: string;
  value: string | string[];
}): CrossFilterEvent {
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
export function applyCrossFilter(event: CrossFilterEvent): CrossFilterState {
  return {
    active: true,
    sourceWidgetId: event.sourceWidgetId,
    field: event.field,
    value: event.value,
    getFilteredData(data: Record<string, unknown>[], widgetId: string): Record<string, unknown>[] {
      // Source widget gets unfiltered data
      if (widgetId === event.sourceWidgetId) return data;

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
export function clearCrossFilter(): CrossFilterState {
  return {
    active: false,
    sourceWidgetId: undefined,
    field: undefined,
    value: undefined,
    getFilteredData(data: Record<string, unknown>[]): Record<string, unknown>[] {
      return data;
    },
  };
}

/**
 * Check if a widget is the cross-filter source.
 */
export function isCrossFilterSource(state: CrossFilterState, widgetId: string): boolean {
  return state.active && state.sourceWidgetId === widgetId;
}
