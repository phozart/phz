/**
 * @phozart/phz-engine/explorer — Explore Types
 *
 * Self-service exploration query model. Users drag fields into
 * dimension/measure/filter slots to build ad-hoc queries.
 * exploreToDataQuery() converts to the flat ExploreDataQuery format.
 *
 * Moved from @phozart/phz-workspace in v15 (A-2.01).
 */
// --- Conversion ---
export function exploreToDataQuery(explore) {
    const dimensionFields = explore.dimensions.map(d => d.field);
    const measureFields = explore.measures.map(m => m.field);
    const aggregations = explore.measures.map(m => ({
        field: m.field,
        function: m.aggregation,
        alias: m.alias,
    }));
    const filters = explore.filters.map(f => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
    }));
    const result = {
        fields: [...dimensionFields, ...measureFields],
        aggregations,
        filters,
    };
    if (dimensionFields.length > 0) {
        result.groupBy = dimensionFields;
    }
    if (explore.sort) {
        result.sort = explore.sort;
    }
    if (explore.limit !== undefined) {
        result.limit = explore.limit;
    }
    return result;
}
//# sourceMappingURL=explore-types.js.map