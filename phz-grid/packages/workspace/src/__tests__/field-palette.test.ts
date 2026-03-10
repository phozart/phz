/**
 * field-palette.test.ts — P.1: Field palette headless logic
 */
import { describe, it, expect } from 'vitest';
import {
  createFieldPalette,
  groupFieldsByType,
  searchFields,
  autoPlaceField,
} from '../explore/phz-field-palette.js';
import type { FieldMetadata } from '../data-adapter.js';

function makeField(name: string, dataType: FieldMetadata['dataType'], overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return { name, dataType, nullable: false, ...overrides };
}

const SAMPLE_FIELDS: FieldMetadata[] = [
  makeField('region', 'string', { cardinality: 'low', semanticHint: 'dimension' }),
  makeField('country', 'string', { cardinality: 'medium', semanticHint: 'dimension' }),
  makeField('revenue', 'number', { semanticHint: 'measure' }),
  makeField('cost', 'number', { semanticHint: 'currency' }),
  makeField('order_date', 'date', { semanticHint: 'timestamp' }),
  makeField('is_active', 'boolean'),
  makeField('customer_id', 'string', { cardinality: 'high', semanticHint: 'identifier' }),
];

describe('createFieldPalette (P.1)', () => {
  it('creates a palette from field metadata', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields).toHaveLength(7);
  });

  it('returns fields with type icons', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    const revenue = palette.fields.find(f => f.name === 'revenue');
    expect(revenue).toBeDefined();
    expect(revenue!.typeIcon).toBe('number');
  });

  it('includes cardinality badge when available', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    const region = palette.fields.find(f => f.name === 'region');
    expect(region!.cardinalityBadge).toBe('low');

    const revenue = palette.fields.find(f => f.name === 'revenue');
    expect(revenue!.cardinalityBadge).toBeUndefined();
  });

  it('marks draggable as true for all fields', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields.every(f => f.draggable)).toBe(true);
  });
});

describe('groupFieldsByType (P.1)', () => {
  it('groups fields by data type', () => {
    const groups = groupFieldsByType(SAMPLE_FIELDS);
    expect(groups.get('string')).toHaveLength(3);
    expect(groups.get('number')).toHaveLength(2);
    expect(groups.get('date')).toHaveLength(1);
    expect(groups.get('boolean')).toHaveLength(1);
  });

  it('returns empty map for empty fields', () => {
    const groups = groupFieldsByType([]);
    expect(groups.size).toBe(0);
  });
});

describe('searchFields (P.1)', () => {
  it('filters fields by name (case-insensitive)', () => {
    const results = searchFields(SAMPLE_FIELDS, 'rev');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('revenue');
  });

  it('returns all fields for empty search', () => {
    const results = searchFields(SAMPLE_FIELDS, '');
    expect(results).toHaveLength(7);
  });

  it('matches partial names', () => {
    const results = searchFields(SAMPLE_FIELDS, 'co');
    expect(results.map(f => f.name)).toContain('country');
    expect(results.map(f => f.name)).toContain('cost');
  });

  it('returns empty array for no matches', () => {
    const results = searchFields(SAMPLE_FIELDS, 'zzzzz');
    expect(results).toHaveLength(0);
  });
});

describe('autoPlaceField (P.1)', () => {
  it('places number fields into Values zone', () => {
    const field = makeField('revenue', 'number', { semanticHint: 'measure' });
    expect(autoPlaceField(field)).toBe('values');
  });

  it('places string fields into Rows zone', () => {
    const field = makeField('region', 'string', { semanticHint: 'dimension' });
    expect(autoPlaceField(field)).toBe('rows');
  });

  it('places date fields into Columns zone', () => {
    const field = makeField('order_date', 'date', { semanticHint: 'timestamp' });
    expect(autoPlaceField(field)).toBe('columns');
  });

  it('places boolean fields into Filters zone', () => {
    const field = makeField('is_active', 'boolean');
    expect(autoPlaceField(field)).toBe('filters');
  });

  it('places identifier strings into Rows zone', () => {
    const field = makeField('customer_id', 'string', { semanticHint: 'identifier' });
    expect(autoPlaceField(field)).toBe('rows');
  });

  it('places currency numbers into Values zone', () => {
    const field = makeField('cost', 'number', { semanticHint: 'currency' });
    expect(autoPlaceField(field)).toBe('values');
  });
});
