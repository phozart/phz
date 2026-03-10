/**
 * JS Array QueryBackend — reference implementation.
 *
 * Wraps the existing pure row-model functions (filterRows, sortRows)
 * behind the QueryBackend interface. This is the parity reference —
 * DuckDB and server backends must produce identical results.
 */
import { parseData, buildCoreRowModel, filterRows, sortRows } from './row-model.js';
export function createJSArrayQueryBackend(data, columns) {
    let currentData = data;
    const capabilities = {
        filter: true,
        sort: true,
        group: true,
        aggregate: false,
        pagination: true,
    };
    return {
        async execute(query) {
            const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const totalCount = currentData.length;
            const rows = parseData(currentData);
            let model = buildCoreRowModel(rows);
            // Apply filters
            if (query.filters.length > 0) {
                const filterState = {
                    filters: query.filters.map(f => ({
                        field: f.field,
                        operator: f.operator,
                        value: f.value,
                    })),
                    presets: {},
                };
                model = filterRows(model, filterState, columns);
            }
            // Apply sort
            if (query.sort.length > 0) {
                const sortState = { columns: query.sort };
                model = sortRows(model, sortState, columns);
            }
            const filteredCount = model.rowCount;
            // Apply pagination
            let resultRows = model.rows;
            if (query.offset !== undefined || query.limit !== undefined) {
                const start = query.offset ?? 0;
                const end = query.limit !== undefined ? start + query.limit : undefined;
                resultRows = resultRows.slice(start, end);
            }
            // Apply field selection
            let outputRows;
            if (query.fields && query.fields.length > 0) {
                outputRows = resultRows.map(row => {
                    const out = {};
                    for (const field of query.fields) {
                        out[field] = row[field];
                    }
                    return out;
                });
            }
            else {
                outputRows = resultRows.map(row => {
                    const { __id, ...rest } = row;
                    return rest;
                });
            }
            const elapsed = typeof performance !== 'undefined'
                ? performance.now() - startTime
                : Date.now() - startTime;
            return {
                rows: outputRows,
                totalCount,
                filteredCount,
                executionEngine: 'js-compute',
                executionTimeMs: Math.round(elapsed * 100) / 100,
            };
        },
        getCapabilities() {
            return { ...capabilities };
        },
        destroy() {
            currentData = [];
        },
    };
}
//# sourceMappingURL=js-query-backend.js.map