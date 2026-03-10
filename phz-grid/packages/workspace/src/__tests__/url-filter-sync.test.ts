import { describe, it, expect } from 'vitest';
import {
  serializeFilterState,
  deserializeFilterState,
} from '../filters/url-filter-sync.js';
import type { FilterValue, FilterContextState } from '../types.js';

function makeState(filters: FilterValue[]): FilterContextState {
  const values = new Map<string, FilterValue>();
  const activeFilterIds = new Set<string>();
  for (const f of filters) {
    values.set(f.filterId, f);
    activeFilterIds.add(f.filterId);
  }
  return {
    values,
    activeFilterIds,
    crossFilters: [],
    lastUpdated: Date.now(),
    source: 'user',
  };
}

describe('URL Filter Sync (O.3)', () => {
  describe('serializeFilterState', () => {
    it('serializes an empty state to empty string', () => {
      const state = makeState([]);
      const result = serializeFilterState(state);
      expect(result).toBe('');
    });

    it('serializes a single equality filter', () => {
      const state = makeState([{
        filterId: 'f1',
        field: 'region',
        operator: 'equals',
        value: 'US',
        label: 'Region: US',
      }]);
      const result = serializeFilterState(state);
      expect(result).toContain('f.region=equals:US');
    });

    it('serializes multiple filters', () => {
      const state = makeState([
        { filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: '' },
        { filterId: 'f2', field: 'status', operator: 'equals', value: 'active', label: '' },
      ]);
      const result = serializeFilterState(state);
      expect(result).toContain('f.region=equals:US');
      expect(result).toContain('f.status=equals:active');
    });

    it('serializes between operator with array value', () => {
      const state = makeState([{
        filterId: 'f1',
        field: 'amount',
        operator: 'between',
        value: [100, 500],
        label: '',
      }]);
      const result = serializeFilterState(state);
      expect(result).toContain('f.amount=between:100,500');
    });

    it('serializes in operator with array value', () => {
      const state = makeState([{
        filterId: 'f1',
        field: 'region',
        operator: 'in',
        value: ['US', 'EU', 'APAC'],
        label: '',
      }]);
      const result = serializeFilterState(state);
      expect(result).toContain('f.region=in:US,EU,APAC');
    });

    it('serializes null-check operators', () => {
      const state = makeState([{
        filterId: 'f1',
        field: 'email',
        operator: 'isNull',
        value: null,
        label: '',
      }]);
      const result = serializeFilterState(state);
      expect(result).toContain('f.email=isNull');
    });

    it('URL-encodes special characters in values', () => {
      const state = makeState([{
        filterId: 'f1',
        field: 'name',
        operator: 'contains',
        value: 'hello world',
        label: '',
      }]);
      const result = serializeFilterState(state);
      expect(result).toContain('f.name=contains:hello%20world');
    });
  });

  describe('deserializeFilterState', () => {
    it('deserializes an empty string', () => {
      const state = deserializeFilterState('');
      expect(state.values.size).toBe(0);
    });

    it('round-trips a simple equality filter', () => {
      const original = makeState([{
        filterId: 'f1',
        field: 'region',
        operator: 'equals',
        value: 'US',
        label: '',
      }]);
      const serialized = serializeFilterState(original);
      const deserialized = deserializeFilterState(serialized);
      expect(deserialized.values.size).toBe(1);
      const filter = Array.from(deserialized.values.values())[0];
      expect(filter.field).toBe('region');
      expect(filter.operator).toBe('equals');
      expect(filter.value).toBe('US');
    });

    it('round-trips between operator', () => {
      const original = makeState([{
        filterId: 'f1',
        field: 'amount',
        operator: 'between',
        value: [100, 500],
        label: '',
      }]);
      const serialized = serializeFilterState(original);
      const deserialized = deserializeFilterState(serialized);
      const filter = Array.from(deserialized.values.values())[0];
      expect(filter.operator).toBe('between');
      expect(filter.value).toEqual(['100', '500']); // URL values are strings
    });

    it('round-trips in operator', () => {
      const original = makeState([{
        filterId: 'f1',
        field: 'region',
        operator: 'in',
        value: ['US', 'EU'],
        label: '',
      }]);
      const serialized = serializeFilterState(original);
      const deserialized = deserializeFilterState(serialized);
      const filter = Array.from(deserialized.values.values())[0];
      expect(filter.operator).toBe('in');
      expect(filter.value).toEqual(['US', 'EU']);
    });

    it('round-trips isNull operator', () => {
      const original = makeState([{
        filterId: 'f1',
        field: 'email',
        operator: 'isNull',
        value: null,
        label: '',
      }]);
      const serialized = serializeFilterState(original);
      const deserialized = deserializeFilterState(serialized);
      const filter = Array.from(deserialized.values.values())[0];
      expect(filter.operator).toBe('isNull');
      expect(filter.value).toBeNull();
    });

    it('round-trips multiple filters', () => {
      const original = makeState([
        { filterId: 'f1', field: 'region', operator: 'equals', value: 'US', label: '' },
        { filterId: 'f2', field: 'status', operator: 'notEquals', value: 'closed', label: '' },
      ]);
      const serialized = serializeFilterState(original);
      const deserialized = deserializeFilterState(serialized);
      expect(deserialized.values.size).toBe(2);
    });

    it('sets source to "url"', () => {
      const deserialized = deserializeFilterState('f.x=equals:1');
      expect(deserialized.source).toBe('url');
    });

    it('handles URL-encoded values', () => {
      const deserialized = deserializeFilterState('f.name=contains:hello%20world');
      const filter = Array.from(deserialized.values.values())[0];
      expect(filter.value).toBe('hello world');
    });
  });
});
