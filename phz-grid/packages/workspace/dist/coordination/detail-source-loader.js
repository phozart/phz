/**
 * @phozart/workspace — Detail Source Loader (T.5)
 *
 * Loads detail data for drill-through, breach, and user-action triggers.
 * Maps dashboard filter context to detail source fields via filterMapping.
 * Fires preloadQuery + baseQuery in parallel when both are defined.
 */
function matchesTrigger(sourceTrigger, requestedTrigger) {
    // Both are string 'user-action'
    if (sourceTrigger === 'user-action' && requestedTrigger === 'user-action') {
        return true;
    }
    // Both are objects
    if (typeof sourceTrigger === 'object' && typeof requestedTrigger === 'object') {
        if (sourceTrigger.type !== requestedTrigger.type)
            return false;
        if (sourceTrigger.type === 'breach')
            return true;
        if (sourceTrigger.type === 'drill-through' && requestedTrigger.type === 'drill-through') {
            // If source has fromWidgetTypes, check overlap with requested
            if (sourceTrigger.fromWidgetTypes && requestedTrigger.fromWidgetTypes) {
                const sourceSet = new Set(sourceTrigger.fromWidgetTypes);
                return requestedTrigger.fromWidgetTypes.some(wt => sourceSet.has(wt));
            }
            // If source has no restriction, match any drill-through
            if (!sourceTrigger.fromWidgetTypes)
                return true;
            // Source has restriction but request doesn't specify — match
            if (!requestedTrigger.fromWidgetTypes)
                return true;
        }
    }
    return false;
}
function applyFilterMapping(filterMapping, currentFilters, clickedRow) {
    const mapped = {};
    for (const entry of filterMapping) {
        // Try currentFilters first, then clickedRow
        const value = currentFilters[entry.sourceField] ?? clickedRow?.[entry.sourceField];
        if (value !== undefined) {
            mapped[entry.targetField] = value;
        }
    }
    return mapped;
}
export function createDetailSourceLoader(sources, dataAdapter) {
    return {
        getAvailableSources(trigger) {
            return sources.filter(s => matchesTrigger(s.trigger, trigger));
        },
        async loadDetail(sourceId, context) {
            const source = sources.find(s => s.id === sourceId);
            if (!source) {
                throw new Error(`Unknown detail source: "${sourceId}"`);
            }
            const mappedFilters = applyFilterMapping(source.filterMapping, context.currentFilters, context.clickedRow);
            const baseQuery = {
                ...source.baseQuery,
                filters: mappedFilters,
                limit: source.maxRows ?? source.baseQuery.limit,
            };
            // If preloadQuery is defined, fire both in parallel
            if (source.preloadQuery) {
                const preloadQuery = {
                    ...source.preloadQuery,
                    filters: mappedFilters,
                };
                const [, baseResult] = await Promise.all([
                    dataAdapter.execute(preloadQuery),
                    dataAdapter.execute(baseQuery),
                ]);
                return baseResult;
            }
            return dataAdapter.execute(baseQuery);
        },
        destroy() {
            // No-op cleanup — sources are immutable config
        },
    };
}
//# sourceMappingURL=detail-source-loader.js.map