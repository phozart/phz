/**
 * @phozart/phz-workspace — MemoryDataAdapter
 *
 * In-memory implementation of DataAdapter for testing, prototyping,
 * and small datasets. Stores rows as plain objects and executes
 * queries (filter, sort, aggregate, paginate) over them.
 */

import type {
  DataAdapter,
  DataQuery,
  DataResult,
  DataSourceSchema,
  DataSourceSummary,
  FieldMetadata,
  ColumnDescriptor,
  AggregationSpec,
} from '../data-adapter.js';

type Row = Record<string, unknown>;

function inferDataType(value: unknown): FieldMetadata['dataType'] {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

function estimateCardinality(distinctCount: number, totalCount: number): FieldMetadata['cardinality'] {
  if (totalCount === 0) return 'low';
  const ratio = distinctCount / totalCount;
  if (ratio <= 0.5) return 'low';
  if (ratio <= 0.75) return 'medium';
  return 'high';
}

export class MemoryDataAdapter implements DataAdapter {
  private sources = new Map<string, Row[]>();

  addSource(id: string, data: Row[]): void {
    this.sources.set(id, data);
  }

  removeSource(id: string): void {
    this.sources.delete(id);
  }

  private getSourceOrThrow(id: string): Row[] {
    const data = this.sources.get(id);
    if (!data) throw new Error(`Data source not found: "${id}"`);
    return data;
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    const id = sourceId ?? this.sources.keys().next().value;
    if (!id) throw new Error('No data source available');
    const data = this.getSourceOrThrow(id as string);

    if (data.length === 0) {
      return { id: id as string, name: id as string, fields: [] };
    }

    // Collect all field names across all rows
    const fieldNames = new Set<string>();
    for (const row of data) {
      for (const key of Object.keys(row)) {
        fieldNames.add(key);
      }
    }

    const fields: FieldMetadata[] = [];
    for (const name of fieldNames) {
      let hasNull = false;
      let detectedType: FieldMetadata['dataType'] | undefined;
      const distinctValues = new Set<unknown>();

      for (const row of data) {
        const val = row[name];
        if (val == null) {
          hasNull = true;
        } else {
          if (!detectedType) detectedType = inferDataType(val);
          distinctValues.add(val);
        }
      }

      fields.push({
        name,
        dataType: detectedType ?? 'string',
        nullable: hasNull,
        cardinality: estimateCardinality(distinctValues.size, data.length),
      });
    }

    return { id: id as string, name: id as string, fields };
  }

  async listDataSources(): Promise<DataSourceSummary[]> {
    const summaries: DataSourceSummary[] = [];
    for (const [id, data] of this.sources) {
      const fieldCount = data.length > 0
        ? new Set(data.flatMap(r => Object.keys(r))).size
        : 0;
      summaries.push({ id, name: id, fieldCount, rowCount: data.length });
    }
    return summaries;
  }

  async execute(
    query: DataQuery,
    context?: { viewerContext?: unknown; signal?: AbortSignal },
  ): Promise<DataResult> {
    const start = performance.now();
    const data = this.getSourceOrThrow(query.source);

    if (data.length === 0) {
      return {
        columns: [],
        rows: [],
        metadata: { totalRows: 0, truncated: false, queryTimeMs: performance.now() - start },
      };
    }

    let rows = [...data];

    // Sort
    if (query.sort?.length) {
      rows.sort((a, b) => {
        for (const s of query.sort!) {
          const aVal = a[s.field];
          const bVal = b[s.field];
          if (aVal === bVal) continue;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const cmp = aVal < bVal ? -1 : 1;
          return s.direction === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    // Determine output fields
    const allFields = [...new Set(data.flatMap(r => Object.keys(r)))];
    const isWildcard = query.fields.length === 1 && query.fields[0] === '*';
    const selectFields = isWildcard ? allFields : query.fields;

    // Aggregation
    if (query.groupBy?.length && query.aggregations?.length) {
      return this.executeGroupBy(rows, selectFields, query.groupBy, query.aggregations, query, start);
    }

    // Total before pagination
    const totalRows = rows.length;

    // Pagination
    if (query.offset) {
      rows = rows.slice(query.offset);
    }
    if (query.limit != null) {
      rows = rows.slice(0, query.limit);
    }

    const columns: ColumnDescriptor[] = selectFields.map(f => ({
      name: f,
      dataType: typeof (rows[0]?.[f] ?? data[0]?.[f]) || 'string',
    }));

    const resultRows = rows.map(row => selectFields.map(f => row[f] ?? null));

    return {
      columns,
      rows: resultRows,
      metadata: {
        totalRows,
        truncated: rows.length < totalRows,
        queryTimeMs: performance.now() - start,
      },
    };
  }

  private executeGroupBy(
    rows: Row[],
    selectFields: string[],
    groupBy: string[],
    aggregations: AggregationSpec[],
    query: DataQuery,
    start: number,
  ): DataResult {
    // Group rows
    const groups = new Map<string, Row[]>();
    for (const row of rows) {
      const key = groupBy.map(g => String(row[g] ?? '')).join('\0');
      let group = groups.get(key);
      if (!group) {
        group = [];
        groups.set(key, group);
      }
      group.push(row);
    }

    // Build output columns: groupBy fields + aggregation aliases
    const aggAliases = aggregations.map(a => a.alias ?? `${a.function}_${a.field}`);
    const outFields = [...groupBy, ...aggAliases];
    const columns: ColumnDescriptor[] = outFields.map(f => ({ name: f, dataType: 'string' }));

    // Build result rows
    const resultRows: unknown[][] = [];
    for (const [, groupRows] of groups) {
      const row: unknown[] = [];
      // Group-by values
      for (const g of groupBy) {
        row.push(groupRows[0][g]);
      }
      // Aggregated values
      for (const agg of aggregations) {
        row.push(this.computeAggregation(groupRows, agg));
      }
      resultRows.push(row);
    }

    return {
      columns,
      rows: resultRows,
      metadata: {
        totalRows: resultRows.length,
        truncated: false,
        queryTimeMs: performance.now() - start,
      },
    };
  }

  private computeAggregation(rows: Row[], agg: AggregationSpec): unknown {
    const values = rows
      .map(r => r[agg.field])
      .filter(v => v != null);

    switch (agg.function) {
      case 'count':
        return values.length;
      case 'countDistinct':
        return new Set(values).size;
      case 'sum':
        return (values as number[]).reduce((a, b) => a + b, 0);
      case 'avg': {
        if (values.length === 0) return null;
        const sum = (values as number[]).reduce((a, b) => a + b, 0);
        return sum / values.length;
      }
      case 'min': {
        if (values.length === 0) return null;
        return Math.min(...(values as number[]));
      }
      case 'max': {
        if (values.length === 0) return null;
        return Math.max(...(values as number[]));
      }
      case 'median': {
        if (values.length === 0) return null;
        const sorted = [...(values as number[])].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      }
      case 'first':
        return values[0] ?? null;
      case 'last':
        return values[values.length - 1] ?? null;
      case 'stddev':
      case 'variance': {
        if (values.length === 0) return null;
        const nums = values as number[];
        const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
        return agg.function === 'variance' ? variance : Math.sqrt(variance);
      }
      default:
        return null;
    }
  }

  async getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number; filters?: unknown },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }> {
    const data = this.getSourceOrThrow(sourceId);

    const distinctSet = new Set<unknown>();
    for (const row of data) {
      const val = row[field];
      if (val != null) distinctSet.add(val);
    }

    let values = [...distinctSet];

    // Search filter (string fields)
    if (options?.search) {
      const q = options.search.toLowerCase();
      values = values.filter(v => String(v).toLowerCase().includes(q));
    }

    const totalCount = values.length;

    // Limit
    let truncated = false;
    if (options?.limit != null && values.length > options.limit) {
      values = values.slice(0, options.limit);
      truncated = true;
    }

    return { values, totalCount, truncated };
  }

  async getFieldStats(
    sourceId: string,
    field: string,
    _filters?: unknown,
  ): Promise<{
    min?: number;
    max?: number;
    distinctCount: number;
    nullCount: number;
    totalCount: number;
  }> {
    const data = this.getSourceOrThrow(sourceId);

    if (data.length === 0) {
      return { distinctCount: 0, nullCount: 0, totalCount: 0 };
    }

    let nullCount = 0;
    const distinctSet = new Set<unknown>();
    const numericValues: number[] = [];

    for (const row of data) {
      const val = row[field];
      if (val == null) {
        nullCount++;
      } else {
        distinctSet.add(val);
        if (typeof val === 'number') {
          numericValues.push(val);
        }
      }
    }

    const result: {
      min?: number;
      max?: number;
      distinctCount: number;
      nullCount: number;
      totalCount: number;
    } = {
      distinctCount: distinctSet.size,
      nullCount,
      totalCount: data.length,
    };

    if (numericValues.length > 0) {
      result.min = Math.min(...numericValues);
      result.max = Math.max(...numericValues);
    }

    return result;
  }
}
