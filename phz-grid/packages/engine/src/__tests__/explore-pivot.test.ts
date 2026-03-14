/**
 * Tests for the explore-pivot converter.
 *
 * Covers exploreQueryToPivot: null returns for missing columns/values,
 * correct mapping of rows/columns/values to PivotConfig, and
 * aggregation function pass-through.
 */
import { describe, it, expect } from 'vitest';
import {
  exploreQueryToPivot,
  createDropZoneState,
  addFieldToZone,
} from '@phozart/workspace/explore';

interface FieldMetadata {
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
}

const regionField: FieldMetadata = { name: 'region', dataType: 'string', nullable: false };
const categoryField: FieldMetadata = { name: 'category', dataType: 'string', nullable: false };
const yearField: FieldMetadata = { name: 'year', dataType: 'date', nullable: false };
const quarterField: FieldMetadata = { name: 'quarter', dataType: 'string', nullable: false };
const revenueField: FieldMetadata = { name: 'revenue', dataType: 'number', nullable: false };
const costField: FieldMetadata = { name: 'cost', dataType: 'number', nullable: false };
const countField: FieldMetadata = { name: 'order_count', dataType: 'string', nullable: false };

// ========================================================================
// exploreQueryToPivot
// ========================================================================

describe('exploreQueryToPivot', () => {
  it('returns null when no columns in state', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'values', revenueField);
    expect(exploreQueryToPivot(state)).toBeNull();
  });

  it('returns null when no values in state', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'columns', yearField);
    expect(exploreQueryToPivot(state)).toBeNull();
  });

  it('returns null for a completely empty state', () => {
    const state = createDropZoneState();
    expect(exploreQueryToPivot(state)).toBeNull();
  });

  it('returns null when only values are present (no columns)', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'values', revenueField);
    expect(exploreQueryToPivot(state)).toBeNull();
  });

  it('converts a valid DropZoneState with rows, columns, and values to PivotConfig', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'columns', yearField);
    state = addFieldToZone(state, 'values', revenueField);

    const result = exploreQueryToPivot(state);
    expect(result).not.toBeNull();
    expect(result!.rowFields).toEqual(['region']);
    expect(result!.columnFields).toEqual(['year']);
    expect(result!.valueFields).toHaveLength(1);
    expect(result!.valueFields[0].field).toBe('revenue');
    expect(result!.valueFields[0].aggregation).toBe('sum');
  });

  it('maps field names correctly for rows', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'rows', categoryField);
    state = addFieldToZone(state, 'columns', yearField);
    state = addFieldToZone(state, 'values', revenueField);

    const result = exploreQueryToPivot(state)!;
    expect(result.rowFields).toEqual(['region', 'category']);
  });

  it('maps field names correctly for columns', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'columns', yearField);
    state = addFieldToZone(state, 'columns', quarterField);
    state = addFieldToZone(state, 'values', revenueField);

    const result = exploreQueryToPivot(state)!;
    expect(result.columnFields).toEqual(['year', 'quarter']);
  });

  it('maps aggregation functions correctly', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'columns', yearField);
    // number field gets default 'sum' aggregation
    state = addFieldToZone(state, 'values', revenueField);
    // string field gets default 'count' aggregation
    state = addFieldToZone(state, 'values', countField);

    const result = exploreQueryToPivot(state)!;
    expect(result.valueFields[0].aggregation).toBe('sum');
    expect(result.valueFields[1].aggregation).toBe('count');
  });

  it('works with multiple row, column, and value fields', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'rows', categoryField);
    state = addFieldToZone(state, 'columns', yearField);
    state = addFieldToZone(state, 'columns', quarterField);
    state = addFieldToZone(state, 'values', revenueField);
    state = addFieldToZone(state, 'values', costField);

    const result = exploreQueryToPivot(state)!;
    expect(result.rowFields).toHaveLength(2);
    expect(result.rowFields).toEqual(['region', 'category']);
    expect(result.columnFields).toHaveLength(2);
    expect(result.columnFields).toEqual(['year', 'quarter']);
    expect(result.valueFields).toHaveLength(2);
    expect(result.valueFields[0]).toEqual({ field: 'revenue', aggregation: 'sum' });
    expect(result.valueFields[1]).toEqual({ field: 'cost', aggregation: 'sum' });
  });

  it('returns a valid PivotConfig even with no row fields (columns + values only)', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'columns', yearField);
    state = addFieldToZone(state, 'values', revenueField);

    const result = exploreQueryToPivot(state)!;
    expect(result).not.toBeNull();
    expect(result.rowFields).toEqual([]);
    expect(result.columnFields).toEqual(['year']);
    expect(result.valueFields).toHaveLength(1);
  });

  it('ignores filters in the drop zone state', () => {
    let state = createDropZoneState();
    state = addFieldToZone(state, 'rows', regionField);
    state = addFieldToZone(state, 'columns', yearField);
    state = addFieldToZone(state, 'values', revenueField);
    state = addFieldToZone(state, 'filters', { name: 'active', dataType: 'boolean', nullable: false });

    const result = exploreQueryToPivot(state)!;
    // Filters are not part of PivotConfig
    expect(result.rowFields).toEqual(['region']);
    expect(result.columnFields).toEqual(['year']);
    expect(result.valueFields).toHaveLength(1);
    expect(Object.keys(result)).not.toContain('filters');
  });
});
