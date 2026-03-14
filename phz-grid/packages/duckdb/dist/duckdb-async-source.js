/**
 * @phozart/duckdb — DuckDB AsyncDataSource Adapter
 *
 * Implements AsyncDataSource from @phozart/core, converting
 * DataFetchRequest into parameterized SQL via sql-builder and executing
 * against DuckDB.
 */
import { buildGridQuery, buildCountQuery, } from './sql-builder.js';
export class DuckDBAsyncSource {
    dataSource;
    tableName;
    type = 'async';
    constructor(dataSource, tableName) {
        this.dataSource = dataSource;
        this.tableName = tableName;
    }
    async fetch(request) {
        const filters = (request.filter ?? []).map(f => ({
            field: f.field,
            operator: f.operator,
            value: f.value,
        }));
        const sort = (request.sort ?? []).map(s => ({
            field: s.field,
            direction: s.direction,
        }));
        const dataQuery = buildGridQuery({
            tableName: this.tableName,
            filters,
            sort,
            groupBy: [],
            viewport: { offset: request.offset, limit: request.limit },
        });
        const countQuery = buildCountQuery({
            tableName: this.tableName,
            filters,
        });
        const [dataResult, countResult] = await Promise.all([
            this.dataSource.query(dataQuery.sql, dataQuery.params),
            this.dataSource.query(countQuery.sql, countQuery.params),
        ]);
        const totalCount = Number(countResult.data[0]?.['total'] ?? 0);
        return {
            data: dataResult.data,
            totalCount,
        };
    }
}
//# sourceMappingURL=duckdb-async-source.js.map