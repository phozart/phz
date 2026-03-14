/**
 * Tests for drop zones logic from the workspace explore module.
 *
 * Covers createDropZoneState, addFieldToZone, removeFieldFromZone,
 * moveFieldBetweenZones, getDefaultAggregation, getCardinalityWarning,
 * and validateDropZoneAggregation.
 */
import {
  createDropZoneState,
  addFieldToZone,
  removeFieldFromZone,
  moveFieldBetweenZones,
  getDefaultAggregation,
  getCardinalityWarning,
  validateDropZoneAggregation,
} from '@phozart/workspace/explore';

interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  cardinality?: 'low' | 'medium' | 'high';
  semanticHint?: string;
}

const regionField: FieldMetadata = { name: 'region', dataType: 'string', nullable: false };
const revenueField: FieldMetadata = { name: 'revenue', dataType: 'number', nullable: false };
const dateField: FieldMetadata = { name: 'created_at', dataType: 'date', nullable: true };
const activeField: FieldMetadata = { name: 'active', dataType: 'boolean', nullable: false };

// ========================================================================
// createDropZoneState
// ========================================================================

describe('createDropZoneState', () => {
  it('creates empty drop zone state', () => {
    const state = createDropZoneState();
    expect(state.rows).toEqual([]);
    expect(state.columns).toEqual([]);
    expect(state.values).toEqual([]);
    expect(state.filters).toEqual([]);
  });
});

// ========================================================================
// getDefaultAggregation
// ========================================================================

describe('getDefaultAggregation', () => {
  it('returns sum for number types', () => {
    expect(getDefaultAggregation('number')).toBe('sum');
  });

  it('returns count for string types', () => {
    expect(getDefaultAggregation('string')).toBe('count');
  });

  it('returns count for date types', () => {
    expect(getDefaultAggregation('date')).toBe('count');
  });

  it('returns count for boolean types', () => {
    expect(getDefaultAggregation('boolean')).toBe('count');
  });
});

// ========================================================================
// addFieldToZone
// ========================================================================

describe('addFieldToZone', () => {
  it('adds a field to rows', () => {
    const state = createDropZoneState();
    const next = addFieldToZone(state, 'rows', regionField);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0].field).toBe('region');
    expect(next.rows[0].dataType).toBe('string');
  });

  it('adds a field to columns', () => {
    const state = createDropZoneState();
    const next = addFieldToZone(state, 'columns', dateField);
    expect(next.columns).toHaveLength(1);
    expect(next.columns[0].field).toBe('created_at');
  });

  it('adds a field to values with default aggregation', () => {
    const state = createDropZoneState();
    const next = addFieldToZone(state, 'values', revenueField);
    expect(next.values).toHaveLength(1);
    expect(next.values[0].field).toBe('revenue');
    expect(next.values[0].aggregation).toBe('sum');
  });

  it('uses count aggregation for non-number fields in values', () => {
    const state = createDropZoneState();
    const next = addFieldToZone(state, 'values', regionField);
    expect(next.values[0].aggregation).toBe('count');
  });

  it('adds a field to filters', () => {
    const state = createDropZoneState();
    const next = addFieldToZone(state, 'filters', activeField);
    expect(next.filters).toHaveLength(1);
    expect(next.filters[0].field).toBe('active');
    expect(next.filters[0].operator).toBe('eq');
    expect(next.filters[0].value).toBeUndefined();
  });

  it('does not add duplicate fields to rows', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    const next = addFieldToZone(state, 'rows', regionField);
    expect(next.rows).toHaveLength(1);
    expect(next).toBe(state); // same reference — no mutation
  });

  it('does not add duplicate fields to columns', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'columns', dateField);
    const next = addFieldToZone(state, 'columns', dateField);
    expect(next).toBe(state);
  });

  it('does not add duplicate fields to values', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'values', revenueField);
    const next = addFieldToZone(state, 'values', revenueField);
    expect(next).toBe(state);
  });

  it('does not add duplicate fields to filters', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'filters', activeField);
    const next = addFieldToZone(state, 'filters', activeField);
    expect(next).toBe(state);
  });

  it('does not mutate the original state', () => {
    const state = createDropZoneState();
    const next = addFieldToZone(state, 'rows', regionField);
    expect(state.rows).toHaveLength(0);
    expect(next.rows).toHaveLength(1);
  });

  it('can add multiple different fields to the same zone', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'rows', { name: 'category', dataType: 'string', nullable: false });
    expect(state.rows).toHaveLength(2);
  });
});

// ========================================================================
// removeFieldFromZone
// ========================================================================

describe('removeFieldFromZone', () => {
  it('removes a field from rows', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    const next = removeFieldFromZone(state, 'rows', 'region');
    expect(next.rows).toHaveLength(0);
  });

  it('removes a field from values', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'values', revenueField);
    const next = removeFieldFromZone(state, 'values', 'revenue');
    expect(next.values).toHaveLength(0);
  });

  it('removes a field from filters', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'filters', activeField);
    const next = removeFieldFromZone(state, 'filters', 'active');
    expect(next.filters).toHaveLength(0);
  });

  it('does nothing when field is not in the zone', () => {
    const state = createDropZoneState();
    const next = removeFieldFromZone(state, 'rows', 'nonexistent');
    expect(next.rows).toHaveLength(0);
  });

  it('preserves other fields in the zone', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'rows', { name: 'category', dataType: 'string', nullable: false });
    const next = removeFieldFromZone(state, 'rows', 'region');
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0].field).toBe('category');
  });
});

// ========================================================================
// moveFieldBetweenZones
// ========================================================================

describe('moveFieldBetweenZones', () => {
  it('moves a field from rows to columns', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    const next = moveFieldBetweenZones(state, 'rows', 'columns', 'region');
    expect(next.rows).toHaveLength(0);
    expect(next.columns).toHaveLength(1);
    expect(next.columns[0].field).toBe('region');
  });

  it('moves a field from values to rows (loses aggregation info)', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'values', revenueField);
    const next = moveFieldBetweenZones(state, 'values', 'rows', 'revenue');
    expect(next.values).toHaveLength(0);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0].field).toBe('revenue');
  });

  it('moves a field from rows to values (gets default aggregation)', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', revenueField);
    const next = moveFieldBetweenZones(state, 'rows', 'values', 'revenue');
    expect(next.rows).toHaveLength(0);
    expect(next.values).toHaveLength(1);
    expect(next.values[0].aggregation).toBe('sum');
  });

  it('moves a field from filters to rows', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'filters', activeField);
    const next = moveFieldBetweenZones(state, 'filters', 'rows', 'active');
    expect(next.filters).toHaveLength(0);
    expect(next.rows).toHaveLength(1);
  });

  it('handles moving from columns to filters', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'columns', dateField);
    const next = moveFieldBetweenZones(state, 'columns', 'filters', 'created_at');
    expect(next.columns).toHaveLength(0);
    expect(next.filters).toHaveLength(1);
    expect(next.filters[0].field).toBe('created_at');
    expect(next.filters[0].operator).toBe('eq');
  });

  it('preserves dataType when moving between zones', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', revenueField);
    const next = moveFieldBetweenZones(state, 'rows', 'columns', 'revenue');
    expect(next.columns[0].dataType).toBe('number');
  });
});

// ========================================================================
// getCardinalityWarning
// ========================================================================

describe('getCardinalityWarning', () => {
  it('returns null when distinct count is at or below threshold', () => {
    expect(getCardinalityWarning('region', 10)).toBeNull();
    expect(getCardinalityWarning('region', 20)).toBeNull();
  });

  it('returns a warning when distinct count exceeds threshold', () => {
    const warning = getCardinalityWarning('region', 21);
    expect(warning).not.toBeNull();
    expect(warning).toContain('region');
    expect(warning).toContain('21');
    expect(warning).toContain('20');
  });

  it('uses custom threshold', () => {
    expect(getCardinalityWarning('status', 6, 5)).not.toBeNull();
    expect(getCardinalityWarning('status', 5, 5)).toBeNull();
  });

  it('returns null when distinctCount is exactly the threshold', () => {
    expect(getCardinalityWarning('x', 20, 20)).toBeNull();
  });

  it('includes field name and counts in warning message', () => {
    const warning = getCardinalityWarning('product_id', 500, 100);
    expect(warning).toContain('product_id');
    expect(warning).toContain('500');
    expect(warning).toContain('100');
  });
});

// ========================================================================
// validateDropZoneAggregation
// ========================================================================

describe('validateDropZoneAggregation', () => {
  it('returns null for valid aggregation on number field', () => {
    expect(validateDropZoneAggregation(revenueField, 'sum')).toBeNull();
  });

  it('returns null for count on string field (universal)', () => {
    expect(validateDropZoneAggregation(regionField, 'count')).toBeNull();
  });

  it('returns null for count_distinct on any field', () => {
    expect(validateDropZoneAggregation(regionField, 'count_distinct')).toBeNull();
  });
});
