/**
 * widget-data-wiring — Bridges widget configurations to DataAdapter execution.
 *
 * Task 3.1: Widget data subscription pattern
 * Task 3.2: Build DataQuery from widget data config → DataAdapter.execute()
 * Task 3.3: Real KPI data resolution (replaces synthetic previousValue)
 * Task 3.4: Auto-refresh handled by pipeline-filter-wiring (filter subscription)
 * Task 3.5: Loading/error state resolution per widget
 * Task 3.6: Empty state detection
 *
 * Tasks: 3.1-3.6 (WB-013 through WB-017, WB-027)
 */
// ========================================================================
// Task 3.2: Build DataQuery from widget data config
// ========================================================================
/**
 * Build a DataQuery from a widget's data configuration.
 * Maps dimensions → fields + groupBy, measures → fields + aggregations.
 */
export function buildWidgetQuery(input) {
    const dimensionFields = input.dimensions.map(d => d.field);
    const measureFields = input.measures.map(m => m.field);
    const aggregations = input.measures.map(m => ({
        field: m.field,
        function: m.aggregation,
    }));
    const query = {
        source: input.dataSourceId,
        fields: [...dimensionFields, ...measureFields],
    };
    // Only add groupBy if there are dimensions
    if (dimensionFields.length > 0) {
        query.groupBy = dimensionFields;
    }
    if (aggregations.length > 0) {
        query.aggregations = aggregations;
    }
    if (input.filters && input.filters.length > 0) {
        query.filters = input.filters;
    }
    if (input.limit) {
        query.limit = input.limit;
    }
    return query;
}
/**
 * Fetch data for a widget by building a DataQuery and calling DataAdapter.execute().
 * Returns a normalized result with error handling.
 */
export async function fetchWidgetData(adapter, input) {
    try {
        const query = buildWidgetQuery(input);
        const result = await adapter.execute(query);
        return {
            rows: result.rows,
            columns: result.columns,
            totalRows: result.metadata.totalRows,
        };
    }
    catch (err) {
        return {
            rows: [],
            columns: [],
            totalRows: 0,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
/**
 * Resolve the visual state for a widget based on its loading/data state.
 * Priority: loading > error > empty > ready.
 */
export function resolveWidgetLoadingState(input) {
    if (input.loading) {
        return { status: 'loading' };
    }
    if (input.error) {
        return { status: 'error', errorMessage: input.error };
    }
    if (!input.data || input.data.rows.length === 0) {
        return { status: 'empty' };
    }
    return { status: 'ready' };
}
/**
 * Resolve KPI display data from real DataAdapter results.
 * Computes delta percentage and direction from actual current/previous values
 * instead of using synthetic `previousValue = value * 0.95`.
 */
export function resolveKPIWithRealData(input) {
    const result = {
        value: input.currentValue,
        previousValue: input.previousValue,
        target: input.target,
        unit: input.unit,
    };
    if (input.previousValue !== undefined && input.previousValue !== null) {
        if (input.previousValue === 0) {
            result.deltaPercent = input.currentValue === 0 ? 0 : Infinity;
            result.deltaDirection = input.currentValue > 0 ? 'up' : input.currentValue < 0 ? 'down' : 'flat';
        }
        else {
            result.deltaPercent = (input.currentValue - input.previousValue) / input.previousValue;
            if (result.deltaPercent > 0) {
                result.deltaDirection = 'up';
            }
            else if (result.deltaPercent < 0) {
                result.deltaDirection = 'down';
            }
            else {
                result.deltaDirection = 'flat';
            }
        }
    }
    return result;
}
//# sourceMappingURL=widget-data-wiring.js.map