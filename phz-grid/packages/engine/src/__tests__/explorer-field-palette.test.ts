/**
 * Tests for field palette logic from the workspace explore module.
 *
 * Covers createFieldPalette, groupFieldsByType, searchFields, and autoPlaceField.
 */
import {
  createFieldPalette,
  groupFieldsByType,
  searchFields,
  autoPlaceField,
} from '@phozart/phz-workspace/explore';

// FieldMetadata type inferred from the function signatures
interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  cardinality?: 'low' | 'medium' | 'high';
  semanticHint?: string;
}

const SAMPLE_FIELDS: FieldMetadata[] = [
  { name: 'id', dataType: 'number', nullable: false },
  { name: 'name', dataType: 'string', nullable: false },
  { name: 'created_at', dataType: 'date', nullable: true },
  { name: 'active', dataType: 'boolean', nullable: false },
  { name: 'revenue', dataType: 'number', nullable: false, cardinality: 'high' },
  { name: 'category', dataType: 'string', nullable: false, cardinality: 'low', semanticHint: 'dimension' as FieldMetadata['semanticHint'] },
];

// ========================================================================
// createFieldPalette
// ========================================================================

describe('createFieldPalette', () => {
  it('creates a palette with all fields', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields).toHaveLength(SAMPLE_FIELDS.length);
  });

  it('maps field names correctly', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    const names = palette.fields.map(f => f.name);
    expect(names).toEqual(['id', 'name', 'created_at', 'active', 'revenue', 'category']);
  });

  it('maps data types to typeIcon', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields[0].typeIcon).toBe('number');
    expect(palette.fields[1].typeIcon).toBe('string');
    expect(palette.fields[2].typeIcon).toBe('date');
    expect(palette.fields[3].typeIcon).toBe('boolean');
  });

  it('maps cardinality to cardinalityBadge', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields[0].cardinalityBadge).toBeUndefined();
    expect(palette.fields[4].cardinalityBadge).toBe('high');
    expect(palette.fields[5].cardinalityBadge).toBe('low');
  });

  it('carries through semanticHint', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields[5].semanticHint).toBe('dimension');
    expect(palette.fields[0].semanticHint).toBeUndefined();
  });

  it('sets all fields as draggable', () => {
    const palette = createFieldPalette(SAMPLE_FIELDS);
    expect(palette.fields.every(f => f.draggable)).toBe(true);
  });

  it('handles empty input', () => {
    const palette = createFieldPalette([]);
    expect(palette.fields).toHaveLength(0);
  });
});

// ========================================================================
// groupFieldsByType
// ========================================================================

describe('groupFieldsByType', () => {
  it('groups fields by their dataType', () => {
    const groups = groupFieldsByType(SAMPLE_FIELDS);
    expect(groups.get('number')).toHaveLength(2); // id, revenue
    expect(groups.get('string')).toHaveLength(2); // name, category
    expect(groups.get('date')).toHaveLength(1);
    expect(groups.get('boolean')).toHaveLength(1);
  });

  it('returns a Map', () => {
    const groups = groupFieldsByType(SAMPLE_FIELDS);
    expect(groups).toBeInstanceOf(Map);
  });

  it('handles empty input', () => {
    const groups = groupFieldsByType([]);
    expect(groups.size).toBe(0);
  });

  it('handles single type', () => {
    const fields: FieldMetadata[] = [
      { name: 'a', dataType: 'string', nullable: false },
      { name: 'b', dataType: 'string', nullable: false },
    ];
    const groups = groupFieldsByType(fields);
    expect(groups.size).toBe(1);
    expect(groups.get('string')).toHaveLength(2);
  });

  it('preserves field order within groups', () => {
    const groups = groupFieldsByType(SAMPLE_FIELDS);
    const numberFields = groups.get('number')!;
    expect(numberFields[0].name).toBe('id');
    expect(numberFields[1].name).toBe('revenue');
  });
});

// ========================================================================
// searchFields
// ========================================================================

describe('searchFields', () => {
  it('returns all fields when query is empty', () => {
    expect(searchFields(SAMPLE_FIELDS, '')).toEqual(SAMPLE_FIELDS);
  });

  it('filters fields by name (case-insensitive)', () => {
    const results = searchFields(SAMPLE_FIELDS, 'rev');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('revenue');
  });

  it('matches partial field names', () => {
    const results = searchFields(SAMPLE_FIELDS, 'at');
    // Matches: created_at, category
    expect(results).toHaveLength(2);
    expect(results.map(f => f.name)).toEqual(['created_at', 'category']);
  });

  it('is case-insensitive', () => {
    const results = searchFields(SAMPLE_FIELDS, 'REVENUE');
    expect(results).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    const results = searchFields(SAMPLE_FIELDS, 'zzz');
    expect(results).toHaveLength(0);
  });

  it('handles empty field list', () => {
    const results = searchFields([], 'test');
    expect(results).toHaveLength(0);
  });

  it('matches single character query', () => {
    const results = searchFields(SAMPLE_FIELDS, 'a');
    // name, created_at, active, category
    expect(results.length).toBeGreaterThanOrEqual(3);
  });
});

// ========================================================================
// autoPlaceField
// ========================================================================

describe('autoPlaceField', () => {
  it('places number fields in values zone', () => {
    expect(autoPlaceField({ name: 'amount', dataType: 'number', nullable: false })).toBe('values');
  });

  it('places date fields in columns zone', () => {
    expect(autoPlaceField({ name: 'date', dataType: 'date', nullable: false })).toBe('columns');
  });

  it('places boolean fields in filters zone', () => {
    expect(autoPlaceField({ name: 'active', dataType: 'boolean', nullable: false })).toBe('filters');
  });

  it('places string fields in rows zone', () => {
    expect(autoPlaceField({ name: 'region', dataType: 'string', nullable: false })).toBe('rows');
  });

  it('places unknown types in rows zone (default)', () => {
    // Cast to bypass strict typing — tests the default branch
    expect(autoPlaceField({ name: 'custom', dataType: 'unknown' as 'string', nullable: false })).toBe('rows');
  });
});
