/**
 * Server QueryBackend — delegates query execution to a DataAdapter.
 *
 * Maps the grid's LocalQuery format to the DataAdapter's DataQuery format,
 * executes via adapter.execute(), and returns LocalQueryResult.
 */
export function createServerQueryBackend(options) {
    const { adapter, sourceId } = options;
    const capabilities = {
        filter: true,
        sort: true,
        group: false,
        aggregate: false,
        pagination: true,
    };
    return {
        async execute(query) {
            const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const dataQuery = {
                source: sourceId,
                fields: query.fields ?? [],
                sort: query.sort.length > 0 ? query.sort : undefined,
                limit: query.limit,
                offset: query.offset,
            };
            if (query.filters.length > 0) {
                dataQuery.filters = query.filters.map(f => ({
                    field: f.field,
                    operator: f.operator,
                    value: f.value,
                }));
            }
            const result = await adapter.execute(dataQuery);
            const rows = result.rows ?? [];
            const totalCount = result.metadata?.totalRows ?? rows.length;
            const filteredCount = totalCount;
            const elapsed = typeof performance !== 'undefined'
                ? performance.now() - startTime
                : Date.now() - startTime;
            return {
                rows: rows,
                totalCount,
                filteredCount,
                executionEngine: 'server',
                executionTimeMs: Math.round(elapsed * 100) / 100,
            };
        },
        getCapabilities() {
            return { ...capabilities };
        },
        destroy() {
            // Server connections are managed by the DataAdapter
        },
    };
}
//# sourceMappingURL=server-query-backend.js.map