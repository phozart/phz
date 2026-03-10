/**
 * @phozart/phz-duckdb — DuckDB AsyncDataSource Adapter
 *
 * Implements AsyncDataSource from @phozart/phz-core, converting
 * DataFetchRequest into parameterized SQL via sql-builder and executing
 * against DuckDB.
 */

import type { AsyncDataSource, DataFetchRequest, DataFetchResponse } from '@phozart/phz-core';
import type { DuckDBDataSource } from './types.js';
import {
  buildGridQuery,
  buildCountQuery,
  type FilterInput,
  type SortInput,
} from './sql-builder.js';
import type { FilterOperator, SortDirection } from '@phozart/phz-core';

export class DuckDBAsyncSource<TData = any> implements AsyncDataSource<TData> {
  readonly type = 'async' as const;

  constructor(
    private dataSource: DuckDBDataSource,
    private tableName: string,
  ) {}

  async fetch(request: DataFetchRequest): Promise<DataFetchResponse<TData>> {
    const filters: FilterInput[] = (request.filter ?? []).map(f => ({
      field: f.field,
      operator: f.operator as FilterOperator,
      value: f.value,
    }));

    const sort: SortInput[] = (request.sort ?? []).map(s => ({
      field: s.field,
      direction: s.direction as SortDirection,
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

    const totalCount = Number(
      (countResult.data[0] as Record<string, unknown>)?.['total'] ?? 0,
    );

    return {
      data: dataResult.data as TData[],
      totalCount,
    };
  }
}
