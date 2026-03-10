/**
 * @phozart/phz-engine — Drill-Through Resolution
 *
 * Two-table pattern: aggregate → detail with selection context passthrough.
 */
/**
 * Resolve drill source into filter state.
 * Creates 'equals' filters from the drill context values.
 */
export function resolveDrillFilter(context) {
    const filters = [];
    switch (context.source.type) {
        case 'pivot':
            for (const [field, value] of Object.entries(context.source.rowValues)) {
                filters.push({ field, operator: 'equals', value });
            }
            for (const [field, value] of Object.entries(context.source.columnValues)) {
                filters.push({ field, operator: 'equals', value });
            }
            break;
        case 'chart':
            if (context.source.seriesField) {
                filters.push({ field: context.source.seriesField, operator: 'equals', value: context.source.xValue });
            }
            break;
        case 'kpi':
            filters.push({ field: 'kpiId', operator: 'equals', value: context.source.kpiId });
            if (context.source.breakdownId) {
                filters.push({ field: 'breakdownId', operator: 'equals', value: context.source.breakdownId });
            }
            break;
        case 'scorecard':
            filters.push({ field: 'kpiId', operator: 'equals', value: context.source.kpiId });
            if (context.source.breakdownId) {
                filters.push({ field: 'breakdownId', operator: 'equals', value: context.source.breakdownId });
            }
            if (context.source.entityId) {
                filters.push({ field: 'entityId', operator: 'equals', value: context.source.entityId });
            }
            break;
        case 'grid-row': {
            // Summary row drill: skip row-level filters (drill to ALL rows)
            if (context.source.isSummaryRow)
                break;
            const fields = context.filterFields ?? Object.keys(context.source.rowData);
            for (const field of fields) {
                if (field === '__id')
                    continue;
                const value = context.source.rowData[field];
                if (value !== null && value !== undefined && typeof value !== 'object') {
                    filters.push({ field, operator: 'equals', value });
                }
            }
            break;
        }
    }
    // Merge selection context as additional filters
    if (context.selectionContext) {
        for (const [field, value] of Object.entries(context.selectionContext)) {
            if (value !== null && !Array.isArray(value)) {
                filters.push({ field, operator: 'equals', value });
            }
        }
    }
    return { filters, presets: {} };
}
/**
 * Resolve a drill context into a full drill-through action.
 */
export function resolveDrillAction(context, reportStore) {
    const filterState = resolveDrillFilter(context);
    const filterMap = {};
    for (const f of filterState.filters) {
        filterMap[f.field] = String(f.value);
    }
    return {
        targetReportId: context.targetReportId ?? '',
        filters: filterMap,
        selectionOverrides: context.selectionContext,
        openIn: context.openIn ?? 'panel',
    };
}
//# sourceMappingURL=drill-through.js.map