/**
 * @phozart/widgets -- Query Builder Pure Logic Tests
 *
 * Tests for getOperatorsForType, validateFilter, buildQuerySummary,
 * and applyQueryToData.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('lit', () => ({
  LitElement: class {},
  html: () => '',
  css: () => '',
  nothing: Symbol('nothing'),
}));
vi.mock('lit/decorators.js', () => ({
  customElement: () => (c: any) => c,
  property: () => () => {},
  state: () => () => {},
}));

import {
  getOperatorsForType,
  validateFilter,
  buildQuerySummary,
  applyQueryToData,
  type QueryField,
  type QueryFilter,
  type QueryConfig,
} from '../components/phz-query-builder.js';

const FIELDS: QueryField[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'age', type: 'number', label: 'Age' },
  { name: 'active', type: 'boolean', label: 'Active' },
  { name: 'created', type: 'date', label: 'Created Date' },
];

const SAMPLE_DATA = [
  { name: 'Alice', age: 30, active: true, created: '2025-01-01' },
  { name: 'Bob', age: 25, active: false, created: '2025-06-15' },
  { name: 'Charlie', age: 35, active: true, created: '2024-12-01' },
  { name: 'Diana', age: 28, active: true, created: '2025-03-20' },
  { name: 'Eve', age: 40, active: false, created: '2025-09-01' },
];

describe('getOperatorsForType', () => {
  it('returns string operators', () => {
    const ops = getOperatorsForType('string');
    expect(ops).toContain('equals');
    expect(ops).toContain('contains');
    expect(ops).toContain('starts_with');
    expect(ops).toContain('ends_with');
    expect(ops).toContain('is_empty');
    expect(ops).toContain('is_not_empty');
  });

  it('returns number operators', () => {
    const ops = getOperatorsForType('number');
    expect(ops).toContain('greater_than');
    expect(ops).toContain('less_than');
    expect(ops).toContain('greater_or_equal');
    expect(ops).toContain('less_or_equal');
    expect(ops).toContain('between');
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

  it('returns default operators for unknown type', () => {
    const ops = getOperatorsForType('unknown' as any);
    expect(ops).toEqual(['equals', 'not_equals']);
  });
});

describe('validateFilter', () => {
  it('returns error when field is empty', () => {
    expect(validateFilter({ field: '', operator: 'equals', value: 'x' }, FIELDS)).toBe('Field is required');
  });

  it('returns error when operator is empty', () => {
    expect(validateFilter({ field: 'name', operator: '', value: 'x' }, FIELDS)).toBe('Operator is required');
  });

  it('returns error for unknown field', () => {
    expect(validateFilter({ field: 'unknown', operator: 'equals', value: 'x' }, FIELDS)).toBe('Unknown field: unknown');
  });

  it('returns error for invalid operator for field type', () => {
    const result = validateFilter({ field: 'name', operator: 'greater_than', value: '5' }, FIELDS);
    expect(result).toContain('Invalid operator');
  });

  it('returns error when value is required but missing', () => {
    const result = validateFilter({ field: 'name', operator: 'equals', value: '' }, FIELDS);
    expect(result).toBe('Value is required');
  });

  it('does not require value for is_empty', () => {
    const result = validateFilter({ field: 'name', operator: 'is_empty', value: '' }, FIELDS);
    expect(result).toBeNull();
  });

  it('does not require value for is_not_empty', () => {
    const result = validateFilter({ field: 'name', operator: 'is_not_empty', value: '' }, FIELDS);
    expect(result).toBeNull();
  });

  it('returns null for valid filter', () => {
    const result = validateFilter({ field: 'name', operator: 'equals', value: 'Alice' }, FIELDS);
    expect(result).toBeNull();
  });
});

describe('buildQuerySummary', () => {
  it('shows SELECT * when no fields selected', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('SELECT *');
  });

  it('shows selected field labels', () => {
    const config: QueryConfig = {
      selectedFields: ['name', 'age'],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('SELECT Name, Age');
  });

  it('uses field name when no label', () => {
    const fields: QueryField[] = [{ name: 'x', type: 'string' }];
    const config: QueryConfig = {
      selectedFields: ['x'],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const summary = buildQuerySummary(config, fields);
    expect(summary).toContain('SELECT x');
  });

  it('includes WHERE clause for filters', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'equals', value: 'Alice' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('WHERE');
    expect(summary).toContain('name equals Alice');
  });

  it('joins multiple filters with AND', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [
        { field: 'name', operator: 'equals', value: 'Alice' },
        { field: 'age', operator: 'greater_than', value: '20' },
      ],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('AND');
  });

  it('includes GROUP BY', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [],
      groupBy: ['name'],
      sorts: [],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('GROUP BY name');
  });

  it('includes AGGREGATIONS', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [{ field: 'age', fn: 'avg' }],
      groupBy: [],
      sorts: [],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('AVG(age)');
  });

  it('includes ORDER BY', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [{ field: 'name', direction: 'asc' }],
    };
    const summary = buildQuerySummary(config, FIELDS);
    expect(summary).toContain('ORDER BY name ASC');
  });
});

describe('applyQueryToData', () => {
  it('returns all data when no config', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(5);
  });

  it('filters by equals', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'equals', value: 'Alice' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('filters by not_equals', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'not_equals', value: 'Alice' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(4);
  });

  it('filters by contains', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'contains', value: 'li' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.some(r => r.name === 'Alice')).toBe(true);
    expect(result.some(r => r.name === 'Charlie')).toBe(true);
  });

  it('filters by starts_with', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'starts_with', value: 'A' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('filters by ends_with', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'ends_with', value: 'e' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.some(r => r.name === 'Alice')).toBe(true);
    expect(result.some(r => r.name === 'Charlie')).toBe(true);
    expect(result.some(r => r.name === 'Eve')).toBe(true);
  });

  it('filters by greater_than', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'age', operator: 'greater_than', value: '30' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.every(r => (r.age as number) > 30)).toBe(true);
  });

  it('filters by less_than', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'age', operator: 'less_than', value: '30' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.every(r => (r.age as number) < 30)).toBe(true);
  });

  it('filters by greater_or_equal', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'age', operator: 'greater_or_equal', value: '35' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.every(r => (r.age as number) >= 35)).toBe(true);
  });

  it('filters by less_or_equal', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'age', operator: 'less_or_equal', value: '28' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.every(r => (r.age as number) <= 28)).toBe(true);
  });

  it('filters by is_empty', () => {
    const dataWithEmpty = [
      { name: 'Alice', age: 30 },
      { name: '', age: 25 },
      { name: null, age: 28 },
    ];
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'is_empty', value: '' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(dataWithEmpty as any, config);
    expect(result).toHaveLength(2); // '' and null
  });

  it('filters by is_not_empty', () => {
    const dataWithEmpty = [
      { name: 'Alice', age: 30 },
      { name: '', age: 25 },
      { name: null, age: 28 },
    ];
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'is_not_empty', value: '' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(dataWithEmpty as any, config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('sorts ascending', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [{ field: 'age', direction: 'asc' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect((result[0].age as number)).toBeLessThanOrEqual(result[1].age as number);
  });

  it('sorts descending', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [{ field: 'age', direction: 'desc' }],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect((result[0].age as number)).toBeGreaterThanOrEqual(result[1].age as number);
  });

  it('projects selected fields', () => {
    const config: QueryConfig = {
      selectedFields: ['name'],
      filters: [],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(Object.keys(result[0])).toEqual(['name']);
  });

  it('applies multiple filters (AND logic)', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [
        { field: 'age', operator: 'greater_than', value: '25' },
        { field: 'active', operator: 'equals', value: 'true' },
      ],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result.every(r => (r.age as number) > 25 && r.active === true)).toBe(true);
  });

  it('unknown operator passes all rows', () => {
    const config: QueryConfig = {
      selectedFields: [],
      filters: [{ field: 'name', operator: 'mystery_op', value: 'x' }],
      aggregations: [],
      groupBy: [],
      sorts: [],
    };
    const result = applyQueryToData(SAMPLE_DATA, config);
    expect(result).toHaveLength(5);
  });
});
