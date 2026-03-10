/**
 * @phozart/phz-duckdb — DuckDB Bridge
 *
 * Connects DuckDB to grid state changes. On sort/filter/grouping change,
 * builds SQL via sql-builder, executes via DuckDB, and pushes results to the grid.
 */
import { buildGridQuery, buildCountQuery } from './sql-builder.js';
export class DuckDBBridge {
    dataSource;
    tableName;
    grid = null;
    unsubscribes = [];
    pageSize = null;
    page = 0;
    constructor(dataSource, tableName) {
        this.dataSource = dataSource;
        this.tableName = tableName;
    }
    attach(grid) {
        this.grid = grid;
        let previousState = grid.getState();
        this.unsubscribes.push(grid.subscribe((state) => {
            const sortChanged = JSON.stringify(state.sort) !== JSON.stringify(previousState.sort);
            const filterChanged = JSON.stringify(state.filter) !== JSON.stringify(previousState.filter);
            const groupChanged = JSON.stringify(state.grouping) !== JSON.stringify(previousState.grouping);
            previousState = state;
            if (sortChanged || filterChanged || groupChanged) {
                this.refresh();
            }
        }));
    }
    detach() {
        for (const unsub of this.unsubscribes) {
            unsub();
        }
        this.unsubscribes = [];
        this.grid = null;
    }
    async refresh() {
        if (!this.grid)
            return undefined;
        const state = this.grid.getState();
        const filters = state.filter.filters.map(f => ({
            field: f.field,
            operator: f.operator,
            value: f.value,
        }));
        const sort = state.sort.columns.map(s => ({
            field: s.field,
            direction: s.direction,
        }));
        const groupBy = state.grouping.groupBy;
        // Build viewport from pagination settings
        const viewport = this.pageSize != null
            ? { offset: this.page * this.pageSize, limit: this.pageSize }
            : undefined;
        // Build and execute the data query
        const dataQuery = buildGridQuery({
            tableName: this.tableName,
            filters,
            sort,
            groupBy,
            viewport,
        });
        // Build and execute the count query
        const countQuery = buildCountQuery({
            tableName: this.tableName,
            filters,
        });
        const [dataResult, countResult] = await Promise.all([
            this.dataSource.query(dataQuery.sql, dataQuery.params),
            this.dataSource.query(countQuery.sql, countQuery.params),
        ]);
        const totalCount = Number(countResult.data[0]?.['total'] ?? 0);
        this.grid.setData(dataResult.data);
        return { totalCount };
    }
    getTableName() {
        return this.tableName;
    }
    setTableName(tableName) {
        this.tableName = tableName;
    }
    setPageSize(pageSize) {
        this.pageSize = pageSize;
    }
    setPage(page) {
        this.page = page;
    }
    getPageSize() {
        return this.pageSize;
    }
    getPage() {
        return this.page;
    }
}
//# sourceMappingURL=duckdb-bridge.js.map