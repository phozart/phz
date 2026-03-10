/**
 * DataAdapter implementation for the report app.
 * Wraps the existing /api/datasets/* endpoints to conform to the
 * @phozart/phz-workspace DataAdapter interface.
 */
import type {
  DataAdapter,
  DataQuery,
  DataResult,
  DataSourceSchema,
  DataSourceSummary,
} from '@phozart/phz-workspace';
import { DATASETS } from './datasets-registry';

function mapDataType(t?: string): 'string' | 'number' | 'date' | 'boolean' {
  if (t === 'number') return 'number';
  if (t === 'date') return 'date';
  if (t === 'boolean') return 'boolean';
  return 'string';
}

function inferSemanticHint(
  col: { field: string; type?: string },
): 'measure' | 'dimension' | 'category' | 'timestamp' | 'identifier' | undefined {
  if (col.type === 'number') {
    if (['amount', 'profit', 'unitPrice', 'discount', 'quantity', 'salary', 'bonus'].includes(col.field))
      return 'measure';
    if (col.field === 'id') return 'identifier';
    return 'measure';
  }
  if (col.type === 'date') return 'timestamp';
  if (['status', 'category', 'region', 'department', 'paymentMethod', 'role'].includes(col.field))
    return 'category';
  if (col.field === 'id') return 'identifier';
  return 'dimension';
}

export class ReportAppDataAdapter implements DataAdapter {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async execute(
    query: DataQuery,
    context?: { signal?: AbortSignal },
  ): Promise<DataResult> {
    const source = query.source;
    const limit = query.limit ?? 1000;
    const offset = query.offset ?? 0;

    const url = `${this.baseUrl}/api/datasets/${source}?mode=page&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { signal: context?.signal });
    if (!res.ok) throw new Error(`DataAdapter.execute failed: ${res.status}`);

    const body = await res.json();
    const rows: unknown[][] = (body.data ?? []).map((row: Record<string, unknown>) => {
      const fields = query.fields[0] === '*'
        ? Object.keys(row)
        : query.fields;
      return fields.map(f => row[f]);
    });

    const fieldNames = query.fields[0] === '*'
      ? Object.keys((body.data ?? [])[0] ?? {})
      : query.fields;

    const dataset = DATASETS[source];
    const columns = fieldNames.map(f => {
      const col = dataset?.columns.find(c => c.field === f);
      return { name: f, dataType: mapDataType(col?.type) as 'string' | 'number' | 'date' | 'boolean' };
    });

    return {
      columns,
      rows,
      metadata: {
        totalRows: body.totalCount ?? rows.length,
        truncated: rows.length < (body.totalCount ?? 0),
        queryTimeMs: 0,
      },
    };
  }

  async getSchema(sourceId?: string): Promise<DataSourceSchema> {
    const id = sourceId ?? 'sales_orders';
    const dataset = DATASETS[id];
    if (!dataset) throw new Error(`Unknown dataset: ${id}`);

    return {
      id: dataset.id,
      name: dataset.name,
      fields: dataset.columns.map(col => ({
        name: col.field,
        dataType: mapDataType(col.type),
        nullable: false,
        cardinality: ['status', 'category', 'region', 'department', 'paymentMethod', 'role'].includes(col.field)
          ? 'low' as const
          : col.type === 'number' ? 'high' as const : 'medium' as const,
        semanticHint: inferSemanticHint(col),
      })),
    };
  }

  async listDataSources(): Promise<DataSourceSummary[]> {
    return Object.values(DATASETS).map(ds => ({
      id: ds.id,
      name: ds.name,
      fieldCount: ds.columns.length,
    }));
  }

  async getDistinctValues(
    sourceId: string,
    field: string,
    options?: { search?: string; limit?: number },
  ): Promise<{ values: unknown[]; totalCount: number; truncated: boolean }> {
    const res = await fetch(
      `${this.baseUrl}/api/datasets/${sourceId}?mode=page&limit=5000&offset=0`,
    );
    const body = await res.json();
    const data = body.data ?? [];

    let values = [...new Set(data.map((r: any) => r[field]).filter((v: unknown) => v != null))];
    if (options?.search) {
      const s = options.search.toLowerCase();
      values = values.filter(v => String(v).toLowerCase().includes(s));
    }
    values.sort();
    const truncated = options?.limit ? values.length > options.limit : false;
    if (options?.limit) values = values.slice(0, options.limit);

    return { values, totalCount: values.length, truncated };
  }

  async getFieldStats(
    sourceId: string,
    field: string,
  ): Promise<{
    min?: number; max?: number; distinctCount: number; nullCount: number; totalCount: number;
  }> {
    const res = await fetch(
      `${this.baseUrl}/api/datasets/${sourceId}?mode=page&limit=5000&offset=0`,
    );
    const body = await res.json();
    const data = body.data ?? [];
    const vals = data.map((r: any) => r[field]).filter((v: unknown) => v != null);
    const nums = vals.filter((v: unknown) => typeof v === 'number') as number[];

    return {
      min: nums.length > 0 ? Math.min(...nums) : undefined,
      max: nums.length > 0 ? Math.max(...nums) : undefined,
      distinctCount: new Set(vals).size,
      nullCount: data.length - vals.length,
      totalCount: data.length,
    };
  }
}
