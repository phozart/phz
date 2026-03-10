/**
 * drop-zones.test.ts — P.2 + P.2a: Drop zones headless logic
 */
import { describe, it, expect } from 'vitest';
import {
  createDropZoneState,
  addFieldToZone,
  removeFieldFromZone,
  moveFieldBetweenZones,
  getDefaultAggregation,
  getCardinalityWarning,
  validateDropZoneAggregation,
} from '../explore/phz-drop-zones.js';
import type { FieldMetadata } from '../data-adapter.js';

function makeField(name: string, dataType: FieldMetadata['dataType'], overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return { name, dataType, nullable: false, ...overrides };
}

describe('createDropZoneState (P.2)', () => {
  it('creates empty state with 4 zones', () => {
    const state = createDropZoneState();
    expect(state.rows).toEqual([]);
    expect(state.columns).toEqual([]);
    expect(state.values).toEqual([]);
    expect(state.filters).toEqual([]);
  });
});

describe('addFieldToZone (P.2)', () => {
  it('adds a field to the Rows zone', () => {
    const state = createDropZoneState();
    const field = makeField('region', 'string');
    const next = addFieldToZone(state, 'rows', field);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0].field).toBe('region');
  });

  it('adds a number field to Values with SUM aggregation by default', () => {
    const state = createDropZoneState();
    const field = makeField('revenue', 'number');
    const next = addFieldToZone(state, 'values', field);
    expect(next.values).toHaveLength(1);
    expect(next.values[0].field).toBe('revenue');
    expect(next.values[0].aggregation).toBe('sum');
  });

  it('adds a string field to Values with COUNT aggregation by default', () => {
    const state = createDropZoneState();
    const field = makeField('name', 'string');
    const next = addFieldToZone(state, 'values', field);
    expect(next.values[0].aggregation).toBe('count');
  });

  it('adds a date field to Values with COUNT aggregation', () => {
    const state = createDropZoneState();
    const field = makeField('order_date', 'date');
    const next = addFieldToZone(state, 'values', field);
    expect(next.values[0].aggregation).toBe('count');
  });

  it('prevents duplicate fields in the same zone', () => {
    const state = createDropZoneState();
    const field = makeField('region', 'string');
    const s1 = addFieldToZone(state, 'rows', field);
    const s2 = addFieldToZone(s1, 'rows', field);
    expect(s2.rows).toHaveLength(1);
  });

  it('adds a field to Filters zone as filter slot', () => {
    const state = createDropZoneState();
    const field = makeField('status', 'string');
    const next = addFieldToZone(state, 'filters', field);
    expect(next.filters).toHaveLength(1);
    expect(next.filters[0].field).toBe('status');
  });
});

describe('removeFieldFromZone (P.2)', () => {
  it('removes a field from a zone', () => {
    const state = createDropZoneState();
    const field = makeField('region', 'string');
    const s1 = addFieldToZone(state, 'rows', field);
    const s2 = removeFieldFromZone(s1, 'rows', 'region');
    expect(s2.rows).toHaveLength(0);
  });

  it('is a no-op if field not found', () => {
    const state = createDropZoneState();
    const next = removeFieldFromZone(state, 'rows', 'nonexistent');
    expect(next.rows).toHaveLength(0);
  });
});

describe('moveFieldBetweenZones (P.2)', () => {
  it('moves a field from Rows to Columns', () => {
    const state = createDropZoneState();
    const field = makeField('region', 'string');
    const s1 = addFieldToZone(state, 'rows', field);
    const s2 = moveFieldBetweenZones(s1, 'rows', 'columns', 'region');
    expect(s2.rows).toHaveLength(0);
    expect(s2.columns).toHaveLength(1);
    expect(s2.columns[0].field).toBe('region');
  });
});

describe('getDefaultAggregation (P.2)', () => {
  it('returns "sum" for number fields', () => {
    expect(getDefaultAggregation('number')).toBe('sum');
  });

  it('returns "count" for string fields', () => {
    expect(getDefaultAggregation('string')).toBe('count');
  });

  it('returns "count" for date fields', () => {
    expect(getDefaultAggregation('date')).toBe('count');
  });

  it('returns "count" for boolean fields', () => {
    expect(getDefaultAggregation('boolean')).toBe('count');
  });
});

describe('getCardinalityWarning (P.2)', () => {
  it('returns warning when cardinality exceeds threshold', () => {
    const warning = getCardinalityWarning('category', 25, 20);
    expect(warning).toBeTruthy();
    expect(warning).toContain('25');
  });

  it('returns null when cardinality is within threshold', () => {
    const warning = getCardinalityWarning('status', 5, 20);
    expect(warning).toBeNull();
  });

  it('uses default threshold of 20', () => {
    expect(getCardinalityWarning('field', 21)).toBeTruthy();
    expect(getCardinalityWarning('field', 20)).toBeNull();
  });
});

describe('validateDropZoneAggregation (P.2a)', () => {
  it('returns null for valid numeric aggregation', () => {
    const field = makeField('revenue', 'number');
    const result = validateDropZoneAggregation(field, 'sum');
    expect(result).toBeNull();
  });

  it('returns error for sum on string field', () => {
    const field = makeField('name', 'string');
    const result = validateDropZoneAggregation(field, 'sum');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('error');
  });

  it('returns warning for nullable numeric field with avg', () => {
    const field = makeField('score', 'number', { nullable: true });
    const result = validateDropZoneAggregation(field, 'avg');
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('warning');
  });

  it('returns null for count on any field type', () => {
    const field = makeField('name', 'string');
    expect(validateDropZoneAggregation(field, 'count')).toBeNull();
    expect(validateDropZoneAggregation(field, 'countDistinct')).toBeNull();
  });
});
