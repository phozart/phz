import { describe, it, expect } from 'vitest';
import {
  getOperatorsForType,
  validateFilter,
  buildQuerySummary,
  applyQueryToData,
} from '../components/phz-query-builder.js';
import type { QueryField, QueryConfig } from '../components/phz-query-builder.js';

const SAMPLE_FIELDS: QueryField[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'age', type: 'number', label: 'Age' },
  { name: 'active', type: 'boolean', label: 'Active' },
  { name: 'joined', type: 'date', label: 'Join Date' },
];

const SAMPLE_DATA = [
  { name: 'Alice', age: 30, active: true, joined: '2023-01-15' },
  { name: 'Bob', age: 25, active: false, joined: '2023-06-20' },
  { name: 'Carol', age: 35, active: true, joined: '2022-11-01' },
  { name: 'Dave', age: 28, active: true, joined: '2024-02-10' },
];

describe('Query Builder — getOperatorsForType', () => {
  it('returns string operators', () => {
    const ops = getOperatorsForType('string');
    expect(ops).toContain('equals');
    expect(ops).toContain('contains');
    expect(ops).toContain('starts_with');
    expect(ops).toContain('ends_with');
    expect(ops).toContain('is_empty');
  });

  it('returns number operators', () => {
    const ops = getOperatorsForType('number');
    expect(ops).toContain('greater_than');
    expect(ops).toContain('less_than');
    expect(ops).toContain('between');
    expect(ops).not.toContain('contains');
  });

  it('returns boolean operators', () => {
    const ops = getOperatorsForType('boolean');
    expect(ops).toEqual(['equals', 'not_equals']);
  });

  it('returns date operators', () => {
    const ops = getOperatorsForType('date');
    expect(ops).toContain('before');
    expect(ops).toContain('after');
    expect(ops).toContain('between');
  });
});

describe('Query Builder — validateFilter', () => {
  it('rejects missing field', () => {
    expect(validateFilter({ field: '', operator: 'equals', value: 'x' }, SAMPLE_FIELDS))
      .toBe('Field is required');
  });

  it('rejects missing operator', () => {
    expect(validateFilter({ field: 'name', operator: '', value: 'x' }, SAMPLE_FIELDS))
      .toBe('Operator is required');
  });

  it('rejects unknown field', () => {
    expect(validateFilter({ field: 'unknown', operator: 'equals', value: 'x' }, SAMPLE_FIELDS))
      .toBe('Unknown field: unknown');
  });

  it('rejects invalid operator for type', () => {
    expect(validateFilter({ field: 'age', operator: 'contains', value: '5' }, SAMPLE_FIELDS))
      .toBe('Invalid operator "contains" for type number');
  });

  it('rejects missing value for non-empty check operators', () => {
    expect(validateFilter({ field: 'name', operator: 'equals', value: '' }, SAMPLE_FIELDS))
      .toBe('Value is required');
  });

  it('accepts is_empty without value', () => {
    expect(validateFilter({ field: 'name', operator: 'is_empty', value: '' }, SAMPLE_FIELDS))
      .toBeNull();
  });

  it('accepts valid filter', () => {
    expect(validateFilter({ field: 'name', operator: 'equals', value: 'Alice' }, SAMPLE_FIELDS))
      .toBeNull();
  });
});

describe('Query Builder — buildQuerySummary', () => {
  it('produces SELECT * when no fields selected', () => {
    const config: QueryConfig = { selectedFields: [], filters: [], aggregations: [], groupBy: [], sorts: [] };
    expect(buildQuerySummary(config, SAMPLE_FIELDS)).toBe('SELECT *');
  });

  it('includes selected field labels', () => {
    const config: QueryConfig = { selectedFields: ['name', 'age'], filters: [], aggregations: [], groupBy: [], sorts: [] };
    expect(buildQuerySummary(config, SAMPLE_FIELDS)).toBe('SELECT Name, Age');
  });

  it('includes WHERE clause for filters', () => {
    const config: QueryConfig = {
      selectedFields: ['name'],
      filters: [{ field: 'age', operator: 'greater_than', value: '25' }],
      aggregations: [], groupBy: [], sorts: [],
    };
    const summary = buildQuerySummary(config, SAMPLE_FIELDS);
    expect(summary).toContain('WHERE age greater_than 25');
  });

  it('includes GROUP BY', () => {
    const config: QueryConfig = {
      selectedFields: [], filters: [],
      aggregations: [{ field: 'age', fn: 'avg' }],
      groupBy: ['active'], sorts: [],
    };
    const summary = buildQuerySummary(config, SAMPLE_FIELDS);
    expect(summary).toContain('GROUP BY active');
    expect(summary).toContain('AVG(age)');
  });

  it('includes ORDER BY', () => {
    const config: QueryConfig = {
      selectedFields: [], filters: [], aggregations: [], groupBy: [],
      sorts: [{ field: 'name', direction: 'desc' }],
    };
    const summary = buildQuerySummary(config, SAMPLE_FIELDS);
    expect(summary).toContain('ORDER BY name DESC');
  });
});

describe('Query Builder — applyQueryToData', () => {
  it('returns all rows when no config', () => {
    const config: QueryConfig = { selectedFields: [], filters: [], aggregations: [], groupBy: [], sorts: [] };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(4);
  });

  it('filters with equals operator', () => {
    const config: QueryConfig = {
      selectedFields: [], sorts: [], aggregations: [], groupBy: [],
      filters: [{ field: 'name', operator: 'equals', value: 'Alice' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('filters with greater_than operator', () => {
    const config: QueryConfig = {
      selectedFields: [], sorts: [], aggregations: [], groupBy: [],
      filters: [{ field: 'age', operator: 'greater_than', value: '28' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(2);
  });

  it('filters with contains operator', () => {
    const config: QueryConfig = {
      selectedFields: [], sorts: [], aggregations: [], groupBy: [],
      filters: [{ field: 'name', operator: 'contains', value: 'a' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(2);
  });

  it('sorts ascending', () => {
    const config: QueryConfig = {
      selectedFields: [], filters: [], aggregations: [], groupBy: [],
      sorts: [{ field: 'age', direction: 'asc' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result[0].name).toBe('Bob');
    expect(result[3].name).toBe('Carol');
  });

  it('sorts descending', () => {
    const config: QueryConfig = {
      selectedFields: [], filters: [], aggregations: [], groupBy: [],
      sorts: [{ field: 'age', direction: 'desc' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result[0].name).toBe('Carol');
    expect(result[3].name).toBe('Bob');
  });

  it('selects specific fields', () => {
    const config: QueryConfig = {
      selectedFields: ['name', 'age'], filters: [], aggregations: [], groupBy: [], sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(Object.keys(result[0])).toEqual(['name', 'age']);
  });

  it('combines filter and sort', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'active', operator: 'equals', value: 'true' }],
      aggregations: [], groupBy: [],
      sorts: [{ field: 'age', direction: 'asc' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Dave');
    expect(result[2].name).toBe('Carol');
  });

  it('handles multiple filters (AND logic)', () => {
    const config: QueryConfig = {
      selectedFields: [], aggregations: [], groupBy: [], sorts: [],
      filters: [
        { field: 'active', operator: 'equals', value: 'true' },
        { field: 'age', operator: 'greater_than', value: '29' },
      ],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(2);
  });
});
