/**
 * @phozart/phz-workspace — Drop Zones Logic (P.2 + P.2a)
 *
 * 4 drop zones: Rows, Columns, Values, Filters
 * Aggregation defaults, cardinality warnings, validation.
 * Immutable state transitions.
 */

import type { FieldMetadata } from '../data-adapter.js';
import { validateAggregation, type AggregationWarning } from '../format/format-value.js';

// ========================================================================
// Zone entry types
// ========================================================================

export interface DimensionEntry {
  field: string;
  dataType: FieldMetadata['dataType'];
}

export interface ValueEntry {
  field: string;
  dataType: FieldMetadata['dataType'];
  aggregation: string;
}

export interface FilterEntry {
  field: string;
  dataType: FieldMetadata['dataType'];
  operator: string;
  value: unknown;
}

// ========================================================================
// Drop zone state
// ========================================================================

export interface DropZoneState {
  rows: DimensionEntry[];
  columns: DimensionEntry[];
  values: ValueEntry[];
  filters: FilterEntry[];
}

export type ZoneName = 'rows' | 'columns' | 'values' | 'filters';

// ========================================================================
// createDropZoneState
// ========================================================================

export function createDropZoneState(): DropZoneState {
  return {
    rows: [],
    columns: [],
    values: [],
    filters: [],
  };
}

// ========================================================================
// getDefaultAggregation
// ========================================================================

export function getDefaultAggregation(dataType: FieldMetadata['dataType']): string {
  return dataType === 'number' ? 'sum' : 'count';
}

// ========================================================================
// addFieldToZone
// ========================================================================

export function addFieldToZone(
  state: DropZoneState,
  zone: ZoneName,
  field: FieldMetadata,
): DropZoneState {
  const next = { ...state };

  if (zone === 'values') {
    // Check for duplicates
    if (state.values.some(v => v.field === field.name)) return state;
    next.values = [
      ...state.values,
      {
        field: field.name,
        dataType: field.dataType,
        aggregation: getDefaultAggregation(field.dataType),
      },
    ];
  } else if (zone === 'filters') {
    if (state.filters.some(f => f.field === field.name)) return state;
    next.filters = [
      ...state.filters,
      {
        field: field.name,
        dataType: field.dataType,
        operator: 'eq',
        value: undefined,
      },
    ];
  } else {
    // rows or columns
    const arr = state[zone];
    if (arr.some(d => d.field === field.name)) return state;
    next[zone] = [
      ...arr,
      { field: field.name, dataType: field.dataType },
    ];
  }

  return next;
}

// ========================================================================
// removeFieldFromZone
// ========================================================================

export function removeFieldFromZone(
  state: DropZoneState,
  zone: ZoneName,
  fieldName: string,
): DropZoneState {
  const next = { ...state };

  if (zone === 'values') {
    next.values = state.values.filter(v => v.field !== fieldName);
  } else if (zone === 'filters') {
    next.filters = state.filters.filter(f => f.field !== fieldName);
  } else {
    next[zone] = state[zone].filter(d => d.field !== fieldName);
  }

  return next;
}

// ========================================================================
// moveFieldBetweenZones
// ========================================================================

export function moveFieldBetweenZones(
  state: DropZoneState,
  fromZone: ZoneName,
  toZone: ZoneName,
  fieldName: string,
): DropZoneState {
  // Find the field entry to get its dataType
  let dataType: FieldMetadata['dataType'] = 'string';

  if (fromZone === 'values') {
    const entry = state.values.find(v => v.field === fieldName);
    if (entry) dataType = entry.dataType;
  } else if (fromZone === 'filters') {
    const entry = state.filters.find(f => f.field === fieldName);
    if (entry) dataType = entry.dataType;
  } else {
    const entry = state[fromZone].find(d => d.field === fieldName);
    if (entry) dataType = entry.dataType;
  }

  const removed = removeFieldFromZone(state, fromZone, fieldName);
  const field: FieldMetadata = { name: fieldName, dataType, nullable: false };
  return addFieldToZone(removed, toZone, field);
}

// ========================================================================
// getCardinalityWarning (P.2)
// ========================================================================

export function getCardinalityWarning(
  fieldName: string,
  distinctCount: number,
  threshold: number = 20,
): string | null {
  if (distinctCount > threshold) {
    return `Field "${fieldName}" has ${distinctCount} distinct values (threshold: ${threshold}). This may produce a wide pivot.`;
  }
  return null;
}

// ========================================================================
// validateDropZoneAggregation (P.2a)
// ========================================================================

export function validateDropZoneAggregation(
  field: FieldMetadata,
  aggregation: string,
): AggregationWarning | null {
  return validateAggregation(field, aggregation);
}
