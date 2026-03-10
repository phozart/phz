import { describe, it, expect } from 'vitest';
import { toColumnDefinitions, createDataSet, inferDataSetColumns } from '../dataset.js';
import type { DataSetColumn } from '../types/dataset.js';

describe('toColumnDefinitions', () => {
  it('maps field, label→header, and normalizes types', () => {
    const cols: DataSetColumn[] = [
      { field: 'name', type: 'string', label: 'Full Name' },
      { field: 'hired', type: 'datetime', label: 'Hired At' },
      { field: 'status', type: 'enum', label: 'Status', enumValues: ['Active', 'Inactive'] },
    ];
    const defs = toColumnDefinitions(cols);

    expect(defs).toHaveLength(3);
    expect(defs[0]).toMatchObject({ field: 'name', header: 'Full Name', type: 'string', sortable: true });
    expect(defs[1]).toMatchObject({ field: 'hired', header: 'Hired At', type: 'date' });
    expect(defs[2]).toMatchObject({ field: 'status', header: 'Status', type: 'string' });
  });

  it('uses field as header fallback when label is omitted', () => {
    const defs = toColumnDefinitions([{ field: 'revenue', type: 'number' }]);
    expect(defs[0].header).toBe('revenue');
  });

  it('defaults sortable to true', () => {
    const defs = toColumnDefinitions([{ field: 'a', type: 'string' }]);
    expect(defs[0].sortable).toBe(true);
  });

  it('respects sortable: false', () => {
    const defs = toColumnDefinitions([{ field: 'a', type: 'string', sortable: false }]);
    expect(defs[0].sortable).toBe(false);
  });

  it('filters out invisible columns', () => {
    const cols: DataSetColumn[] = [
      { field: 'visible_col', type: 'string' },
      { field: 'hidden_col', type: 'string', visible: false },
    ];
    const defs = toColumnDefinitions(cols);
    expect(defs).toHaveLength(1);
    expect(defs[0].field).toBe('visible_col');
  });

  it('returns empty array for empty input', () => {
    expect(toColumnDefinitions([])).toEqual([]);
  });
});

describe('createDataSet', () => {
  it('constructs a DataSet with columns, rows, and meta', () => {
    const cols: DataSetColumn[] = [{ field: 'name', type: 'string' }];
    const rows = [{ name: 'Alice' }, { name: 'Bob' }];
    const meta = { totalCount: 100, source: 'test' };

    const ds = createDataSet(cols, rows, meta);
    expect(ds.columns).toBe(cols);
    expect(ds.rows).toBe(rows);
    expect(ds.meta).toBe(meta);
  });

  it('meta defaults to undefined', () => {
    const ds = createDataSet([], []);
    expect(ds.meta).toBeUndefined();
  });
});

describe('inferDataSetColumns', () => {
  it('detects string, number, boolean, and date types', () => {
    const rows = [
      { name: 'Alice', age: 30, active: true, joined: '2024-01-15' },
      { name: 'Bob', age: 25, active: false, joined: '2024-03-20' },
    ];
    const cols = inferDataSetColumns(rows);

    expect(cols).toHaveLength(4);
    const typeMap = Object.fromEntries(cols.map(c => [c.field, c.type]));
    expect(typeMap.name).toBe('string');
    expect(typeMap.age).toBe('number');
    expect(typeMap.active).toBe('boolean');
    expect(typeMap.joined).toBe('date');
  });

  it('returns empty array for no rows', () => {
    expect(inferDataSetColumns([])).toEqual([]);
  });

  it('handles mixed types as string', () => {
    const rows = [
      { val: 'hello' },
      { val: 42 },
    ];
    const cols = inferDataSetColumns(rows);
    expect(cols[0].type).toBe('string');
  });

  it('handles null values gracefully', () => {
    const rows = [
      { name: null, age: 30 },
      { name: 'Bob', age: null },
    ];
    const cols = inferDataSetColumns(rows);
    // 'name': one null + one string → string
    expect(cols.find(c => c.field === 'name')!.type).toBe('string');
    // 'age': one number + one null → number (nulls are skipped)
    expect(cols.find(c => c.field === 'age')!.type).toBe('number');
  });

  it('detects Date objects', () => {
    const rows = [
      { when: new Date('2024-01-01') },
      { when: new Date('2024-06-15') },
    ];
    const cols = inferDataSetColumns(rows);
    expect(cols[0].type).toBe('date');
  });
});
