/**
 * @phozart/workspace — Explore to Artifact Conversion (P.4)
 *
 * Pure functions to convert ExploreQuery into report or dashboard widget
 * artifact configs. These are workspace-local types, not engine types —
 * a bridge layer maps them to the engine's ReportConfig/WidgetPlacement.
 */
// ========================================================================
// ID generation
// ========================================================================
let counter = 0;
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${++counter}`;
}
// ========================================================================
// exploreToReport
// ========================================================================
export function exploreToReport(explore, name, dataSource) {
    const dimFields = explore.dimensions.map(d => d.field);
    const measureFields = explore.measures.map(m => m.field);
    return {
        id: generateId('report'),
        type: 'report',
        name,
        dataSource,
        columns: [...dimFields, ...measureFields],
        groupBy: dimFields,
        aggregations: explore.measures.map(m => ({
            field: m.field,
            function: m.aggregation,
            alias: m.alias,
        })),
        filters: explore.filters.map(f => ({
            field: f.field,
            operator: f.operator,
            value: f.value,
        })),
        sort: explore.sort,
        limit: explore.limit,
        createdAt: Date.now(),
    };
}
// ========================================================================
// exploreToDashboardWidget
// ========================================================================
export function exploreToDashboardWidget(explore, widgetType, dashboardId) {
    return {
        id: generateId('widget'),
        widgetType,
        dashboardId,
        dataConfig: {
            dimensions: explore.dimensions.map(d => d.field),
            measures: explore.measures.map(m => ({
                field: m.field,
                aggregation: m.aggregation,
                alias: m.alias,
            })),
            filters: explore.filters.map(f => ({
                field: f.field,
                operator: f.operator,
                value: f.value,
            })),
        },
        position: { row: 0, col: 0, rowSpan: 2, colSpan: 3 },
    };
}
//# sourceMappingURL=explore-to-artifact.js.map