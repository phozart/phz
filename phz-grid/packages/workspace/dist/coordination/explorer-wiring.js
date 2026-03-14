/**
 * explorer-wiring — Bridges the Explorer module to DataAdapter execution
 * and artifact persistence.
 *
 * Task 4.1: ExploreQuery → DataQuery → DataAdapter.execute()
 * Task 4.2: Aggregation picker (handled by ExploreValueSlot.aggregation)
 * Task 4.3: Live preview data fetching
 * Task 4.4: Save explorer results as report or dashboard widget
 * Task 4.5: Build drill-through query from widget context
 *
 * Tasks: 4.1-4.5 (WB-018 through WB-020, WB-029, WB-030)
 */
import { exploreToReport, exploreToDashboardWidget, } from '@phozart/engine';
// ========================================================================
// Task 4.1: ExploreQuery → DataQuery
// ========================================================================
/** Map explorer filter operators to DataQueryFilter operators */
function mapExploreOperator(op) {
    switch (op) {
        case 'eq': return 'equals';
        case 'neq': return 'notEquals';
        case 'gt': return 'greaterThan';
        case 'gte': return 'greaterThanOrEqual';
        case 'lt': return 'lessThan';
        case 'lte': return 'lessThanOrEqual';
        case 'in': return 'in';
        case 'not_in': return 'notIn';
        case 'contains': return 'contains';
        case 'between': return 'between';
        default: return 'equals';
    }
}
/**
 * Convert an ExploreQuery (from the visual explorer) into a DataQuery
 * for DataAdapter.execute(). Adds the data source ID and maps operators.
 */
export function exploreQueryToDataQuery(explore, dataSourceId) {
    const dimensionFields = explore.dimensions.map(d => d.field);
    const measureFields = explore.measures.map(m => m.field);
    const query = {
        source: dataSourceId,
        fields: [...dimensionFields, ...measureFields],
    };
    if (dimensionFields.length > 0) {
        query.groupBy = dimensionFields;
    }
    if (explore.measures.length > 0) {
        query.aggregations = explore.measures.map(m => ({
            field: m.field,
            function: m.aggregation,
        }));
    }
    if (explore.filters.length > 0) {
        query.filters = explore.filters.map(f => ({
            field: f.field,
            operator: mapExploreOperator(f.operator),
            value: f.value,
        }));
    }
    if (explore.sort) {
        query.sort = explore.sort;
    }
    if (explore.limit !== undefined) {
        query.limit = explore.limit;
    }
    return query;
}
/**
 * Fetch live preview data for the explorer.
 * Converts ExploreQuery → DataQuery → DataAdapter.execute().
 */
export async function fetchExplorerPreview(adapter, explore, dataSourceId) {
    try {
        const query = exploreQueryToDataQuery(explore, dataSourceId);
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
 * Convert explorer query to a report artifact and persist via adapter.
 */
export async function saveExplorerAsReport(adapter, explore, dataSource, name) {
    const report = exploreToReport(explore, name, dataSource);
    await adapter.saveReport(report);
    return report;
}
/**
 * Convert explorer query to a dashboard widget artifact.
 * The widget can then be added to a dashboard via the dashboard editor.
 */
export function saveExplorerAsDashboardWidget(explore, widgetType, dashboardId) {
    return exploreToDashboardWidget(explore, widgetType, dashboardId);
}
/**
 * Build an ExploreQuery from a dashboard widget context for drill-through.
 * Pre-populates the explorer with the clicked dimension and widget's measures.
 */
export function buildDrillThroughQuery(context) {
    const dimensions = context.dimension
        ? [{ field: context.dimension }]
        : [];
    const filters = [];
    if (context.dimension && context.dimensionValue !== undefined) {
        filters.push({
            field: context.dimension,
            operator: 'eq',
            value: context.dimensionValue,
        });
    }
    if (context.additionalFilters) {
        filters.push(...context.additionalFilters);
    }
    return {
        dimensions,
        measures: context.measures.map(field => ({
            field,
            aggregation: 'sum',
        })),
        filters,
    };
}
//# sourceMappingURL=explorer-wiring.js.map