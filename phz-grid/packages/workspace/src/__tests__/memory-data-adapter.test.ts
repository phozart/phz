import { describe, it, expect } from 'vitest';
import { MemoryDataAdapter } from '../adapters/memory-data-adapter.js';
import type { DataAdapter } from '../data-adapter.js';

const SALES_DATA = [
  { region: 'North', product: 'Widget', revenue: 100, date: '2025-01-15', active: true },
  { region: 'South', product: 'Gadget', revenue: 200, date: '2025-02-20', active: false },
  { region: 'North', product: 'Widget', revenue: 150, date: '2025-03-10', active: true },
  { region: 'East', product: 'Gadget', revenue: 300, date: '2025-04-05', active: true },
  { region: 'South', product: 'Widget', revenue: 50, date: '2025-05-25', active: false },
];

function createAdapter() {
  const adapter = new MemoryDataAdapter();
  adapter.addSource('sales', SALES_DATA);
  return adapter;
}

describe('MemoryDataAdapter', () => {
  it('implements DataAdapter interface', () => {
    const adapter: DataAdapter = new MemoryDataAdapter();
    expect(adapter.execute).toBeTypeOf('function');
    expect(adapter.getSchema).toBeTypeOf('function');
    expect(adapter.listDataSources).toBeTypeOf('function');
    expect(adapter.getDistinctValues).toBeTypeOf('function');
    expect(adapter.getFieldStats).toBeTypeOf('function');
  });

  describe('addSource / listDataSources', () => {
    it('lists registered data sources', async () => {
      const adapter = createAdapter();
      const sources = await adapter.listDataSources();
      expect(sources).toHaveLength(1);
      expect(sources[0].id).toBe('sales');
      expect(sources[0].name).toBe('sales');
      expect(sources[0].fieldCount).toBe(5);
      expect(sources[0].rowCount).toBe(5);
    });

    it('lists multiple sources', async () => {
      const adapter = new MemoryDataAdapter();
      adapter.addSource('a', [{ x: 1 }]);
      adapter.addSource('b', [{ y: 2, z: 3 }]);
      const sources = await adapter.listDataSources();
      expect(sources).toHaveLength(2);
      expect(sources.map(s => s.id)).toContain('a');
      expect(sources.map(s => s.id)).toContain('b');
    });

    it('returns empty list for no sources', async () => {
      const adapter = new MemoryDataAdapter();
      const sources = await adapter.listDataSources();
      expect(sources).toEqual([]);
    });
  });

  describe('getSchema', () => {
    it('infers field types from data', async () => {
      const adapter = createAdapter();
      const schema = await adapter.getSchema('sales');
      expect(schema.id).toBe('sales');
      expect(schema.name).toBe('sales');

      const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
      expect(fieldMap.get('region')!.dataType).toBe('string');
      expect(fieldMap.get('revenue')!.dataType).toBe('number');
      expect(fieldMap.get('date')!.dataType).toBe('string');
      expect(fieldMap.get('active')!.dataType).toBe('boolean');
    });

    it('estimates cardinality', async () => {
      const adapter = createAdapter();
      const schema = await adapter.getSchema('sales');
      const fieldMap = new Map(schema.fields.map(f => [f.name, f]));

      // region has 3 distinct values out of 5 rows = 0.6 -> medium
      expect(fieldMap.get('region')!.cardinality).toBe('medium');
      // product has 2 distinct values out of 5 rows = 0.4 -> low
      expect(fieldMap.get('product')!.cardinality).toBe('low');
      // revenue has 4 distinct values out of 5 rows = 0.8 -> high
      expect(fieldMap.get('revenue')!.cardinality).toBe('high');
    });

    it('detects nullable fields', async () => {
      const adapter = new MemoryDataAdapter();
      adapter.addSource('test', [
        { a: 1, b: 'hello' },
        { a: null, b: 'world' },
        { a: 3, b: null },
      ]);
      const schema = await adapter.getSchema('test');
      const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
      expect(fieldMap.get('a')!.nullable).toBe(true);
      expect(fieldMap.get('b')!.nullable).toBe(true);
    });

    it('marks non-nullable fields', async () => {
      const adapter = createAdapter();
      const schema = await adapter.getSchema('sales');
      const fieldMap = new Map(schema.fields.map(f => [f.name, f]));
      expect(fieldMap.get('region')!.nullable).toBe(false);
      expect(fieldMap.get('revenue')!.nullable).toBe(false);
    });

    it('handles empty data source', async () => {
      const adapter = new MemoryDataAdapter();
      adapter.addSource('empty', []);
      const schema = await adapter.getSchema('empty');
      expect(schema.fields).toEqual([]);
    });

    it('throws for unknown source', async () => {
      const adapter = new MemoryDataAdapter();
      await expect(adapter.getSchema('nonexistent')).rejects.toThrow();
    });
  });

  describe('execute', () => {
    it('selects specific fields', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region', 'revenue'],
      });
      expect(result.columns).toHaveLength(2);
      expect(result.columns[0].name).toBe('region');
      expect(result.columns[1].name).toBe('revenue');
      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toEqual(['North', 100]);
    });

    it('returns all fields when fields is ["*"]', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['*'],
      });
      expect(result.columns).toHaveLength(5);
      expect(result.rows).toHaveLength(5);
    });

    it('sorts ascending', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['revenue'],
        sort: [{ field: 'revenue', direction: 'asc' }],
      });
      const revenues = result.rows.map(r => r[0]);
      expect(revenues).toEqual([50, 100, 150, 200, 300]);
    });

    it('sorts descending', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['revenue'],
        sort: [{ field: 'revenue', direction: 'desc' }],
      });
      const revenues = result.rows.map(r => r[0]);
      expect(revenues).toEqual([300, 200, 150, 100, 50]);
    });

    it('applies limit', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region'],
        limit: 2,
      });
      expect(result.rows).toHaveLength(2);
      expect(result.metadata.totalRows).toBe(5);
      expect(result.metadata.truncated).toBe(true);
    });

    it('applies offset', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['revenue'],
        sort: [{ field: 'revenue', direction: 'asc' }],
        offset: 2,
        limit: 2,
      });
      const revenues = result.rows.map(r => r[0]);
      expect(revenues).toEqual([150, 200]);
    });

    it('aggregates with sum', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region'],
        groupBy: ['region'],
        aggregations: [{ field: 'revenue', function: 'sum', alias: 'total' }],
      });
      // 3 distinct regions
      expect(result.rows).toHaveLength(3);
      const colNames = result.columns.map(c => c.name);
      expect(colNames).toContain('region');
      expect(colNames).toContain('total');
    });

    it('aggregates with avg', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region'],
        groupBy: ['region'],
        aggregations: [{ field: 'revenue', function: 'avg', alias: 'avg_revenue' }],
      });
      const northRow = result.rows.find((r) => r[0] === 'North');
      expect(northRow).toBeDefined();
      // North: (100 + 150) / 2 = 125
      const avgIdx = result.columns.findIndex(c => c.name === 'avg_revenue');
      expect(northRow![avgIdx]).toBe(125);
    });

    it('aggregates with count', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region'],
        groupBy: ['region'],
        aggregations: [{ field: 'revenue', function: 'count', alias: 'cnt' }],
      });
      const northRow = result.rows.find((r) => r[0] === 'North');
      const cntIdx = result.columns.findIndex(c => c.name === 'cnt');
      expect(northRow![cntIdx]).toBe(2);
    });

    it('aggregates with min and max', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region'],
        groupBy: ['region'],
        aggregations: [
          { field: 'revenue', function: 'min', alias: 'min_rev' },
          { field: 'revenue', function: 'max', alias: 'max_rev' },
        ],
      });
      const northRow = result.rows.find((r) => r[0] === 'North');
      const minIdx = result.columns.findIndex(c => c.name === 'min_rev');
      const maxIdx = result.columns.findIndex(c => c.name === 'max_rev');
      expect(northRow![minIdx]).toBe(100);
      expect(northRow![maxIdx]).toBe(150);
    });

    it('includes queryTimeMs in metadata', async () => {
      const adapter = createAdapter();
      const result = await adapter.execute({
        source: 'sales',
        fields: ['region'],
      });
      expect(result.metadata.queryTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('throws for unknown source', async () => {
      const adapter = new MemoryDataAdapter();
      await expect(
        adapter.execute({ source: 'missing', fields: ['x'] }),
      ).rejects.toThrow();
    });

    it('handles empty data source', async () => {
      const adapter = new MemoryDataAdapter();
      adapter.addSource('empty', []);
      const result = await adapter.execute({
        source: 'empty',
        fields: ['*'],
      });
      expect(result.rows).toEqual([]);
      expect(result.columns).toEqual([]);
      expect(result.metadata.totalRows).toBe(0);
    });
  });

  describe('getDistinctValues', () => {
    it('returns distinct values for a field', async () => {
      const adapter = createAdapter();
      const result = await adapter.getDistinctValues('sales', 'region');
      expect(result.values).toHaveLength(3);
      expect(result.values).toContain('North');
      expect(result.values).toContain('South');
      expect(result.values).toContain('East');
      expect(result.totalCount).toBe(3);
      expect(result.truncated).toBe(false);
    });

    it('applies search filter', async () => {
      const adapter = createAdapter();
      const result = await adapter.getDistinctValues('sales', 'region', { search: 'orth' });
      expect(result.values).toEqual(['North']);
    });

    it('applies limit', async () => {
      const adapter = createAdapter();
      const result = await adapter.getDistinctValues('sales', 'region', { limit: 2 });
      expect(result.values).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.truncated).toBe(true);
    });

    it('returns empty for unknown field', async () => {
      const adapter = createAdapter();
      const result = await adapter.getDistinctValues('sales', 'nonexistent');
      expect(result.values).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getFieldStats', () => {
    it('computes stats for a numeric field', async () => {
      const adapter = createAdapter();
      const stats = await adapter.getFieldStats('sales', 'revenue');
      expect(stats.min).toBe(50);
      expect(stats.max).toBe(300);
      // revenue values: 100, 200, 150, 300, 50 — all distinct
      expect(stats.distinctCount).toBe(5);
      expect(stats.nullCount).toBe(0);
      expect(stats.totalCount).toBe(5);
    });

    it('computes stats for a string field', async () => {
      const adapter = createAdapter();
      const stats = await adapter.getFieldStats('sales', 'region');
      expect(stats.min).toBeUndefined();
      expect(stats.max).toBeUndefined();
      expect(stats.distinctCount).toBe(3);
      expect(stats.nullCount).toBe(0);
      expect(stats.totalCount).toBe(5);
    });

    it('counts nulls', async () => {
      const adapter = new MemoryDataAdapter();
      adapter.addSource('test', [
        { val: 1 },
        { val: null },
        { val: 3 },
        { val: null },
      ]);
      const stats = await adapter.getFieldStats('test', 'val');
      expect(stats.nullCount).toBe(2);
      expect(stats.totalCount).toBe(4);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(3);
      expect(stats.distinctCount).toBe(2);
    });

    it('handles empty data source', async () => {
      const adapter = new MemoryDataAdapter();
      adapter.addSource('empty', []);
      const stats = await adapter.getFieldStats('empty', 'anything');
      expect(stats.totalCount).toBe(0);
      expect(stats.nullCount).toBe(0);
      expect(stats.distinctCount).toBe(0);
    });
  });
});
