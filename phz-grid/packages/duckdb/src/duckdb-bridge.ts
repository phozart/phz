/**
 * @phozart/duckdb — DuckDB Bridge
 *
 * Connects DuckDB to grid state changes. On sort/filter/grouping change,
 * builds SQL via sql-builder, executes via DuckDB, and pushes results to the grid.
 */

import type { GridApi, Unsubscribe } from '@phozart/core';
import type { DuckDBDataSource } from './types.js';
import { buildGridQuery, buildCountQuery, type FilterInput, type SortInput } from './sql-builder.js';

export interface BridgeRefreshResult {
  totalCount: number;
}

export class DuckDBBridge {
  private dataSource: DuckDBDataSource;
  private tableName: string;
  private grid: GridApi | null = null;
  private unsubscribes: Unsubscribe[] = [];
  private pageSize: number | null = null;
  private page: number = 0;

  constructor(dataSource: DuckDBDataSource, tableName: string) {
    this.dataSource = dataSource;
    this.tableName = tableName;
  }

  attach(grid: GridApi): void {
    this.grid = grid;
    let previousState = grid.getState();
    this.unsubscribes.push(
      grid.subscribe((state) => {
        const sortChanged = JSON.stringify(state.sort) !== JSON.stringify(previousState.sort);
        const filterChanged = JSON.stringify(state.filter) !== JSON.stringify(previousState.filter);
        const groupChanged = JSON.stringify(state.grouping) !== JSON.stringify(previousState.grouping);
        previousState = state;
        if (sortChanged || filterChanged || groupChanged) {
          this.refresh();
        }
      }),
    );
  }

  detach(): void {
    for (const unsub of this.unsubscribes) {
      unsub();
    }
    this.unsubscribes = [];
    this.grid = null;
  }

  async refresh(): Promise<BridgeRefreshResult | undefined> {
    if (!this.grid) return undefined;

    const state = this.grid.getState();

    const filters: FilterInput[] = state.filter.filters.map(f => ({
      field: f.field,
      operator: f.operator,
      value: f.value,
    }));

    const sort: SortInput[] = state.sort.columns.map(s => ({
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

    const totalCount = Number(
      (countResult.data[0] as Record<string, unknown>)?.['total'] ?? 0,
    );

    this.grid.setData(dataResult.data);

    return { totalCount };
  }

  getTableName(): string {
    return this.tableName;
  }

  setTableName(tableName: string): void {
    this.tableName = tableName;
  }

  setPageSize(pageSize: number | null): void {
    this.pageSize = pageSize;
  }

  setPage(page: number): void {
    this.page = page;
  }

  getPageSize(): number | null {
    return this.pageSize;
  }

  getPage(): number {
    return this.page;
  }
}
