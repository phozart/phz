/**
 * Tests for FilterValueHandling types and helpers.
 */
import {
  createDefaultFilterValueHandling,
  resolveStaticDefault,
} from '@phozart/shared/types';
import type { FilterDefault } from '@phozart/shared/types';

// ========================================================================
// createDefaultFilterValueHandling
// ========================================================================

describe('createDefaultFilterValueHandling', () => {
  it('creates defaults with no overrides', () => {
    const result = createDefaultFilterValueHandling();
    expect(result.source).toEqual({ type: 'static', values: [] });
    expect(result.transform).toBeUndefined();
    expect(result.defaultValue).toBeUndefined();
    expect(result.required).toBe(false);
    expect(result.multi).toBe(false);
    expect(result.maxSelections).toBe(0);
    expect(result.allowFreeText).toBe(false);
    expect(result.placeholder).toBeUndefined();
    expect(result.excludeNulls).toBe(true);
    expect(result.showCounts).toBe(false);
    expect(result.searchDebounceMs).toBe(300);
  });

  it('applies source override', () => {
    const result = createDefaultFilterValueHandling({
      source: { type: 'data-source', dataSourceId: 'ds1', field: 'status' },
    });
    expect(result.source).toEqual({ type: 'data-source', dataSourceId: 'ds1', field: 'status' });
  });

  it('applies required and multi overrides', () => {
    const result = createDefaultFilterValueHandling({ required: true, multi: true });
    expect(result.required).toBe(true);
    expect(result.multi).toBe(true);
  });

  it('applies maxSelections and allowFreeText overrides', () => {
    const result = createDefaultFilterValueHandling({ maxSelections: 5, allowFreeText: true });
    expect(result.maxSelections).toBe(5);
    expect(result.allowFreeText).toBe(true);
  });

  it('applies placeholder override', () => {
    const result = createDefaultFilterValueHandling({ placeholder: 'Choose...' });
    expect(result.placeholder).toBe('Choose...');
  });

  it('applies excludeNulls override to false', () => {
    const result = createDefaultFilterValueHandling({ excludeNulls: false });
    expect(result.excludeNulls).toBe(false);
  });

  it('applies showCounts override', () => {
    const result = createDefaultFilterValueHandling({ showCounts: true });
    expect(result.showCounts).toBe(true);
  });

  it('applies searchDebounceMs override', () => {
    const result = createDefaultFilterValueHandling({ searchDebounceMs: 500 });
    expect(result.searchDebounceMs).toBe(500);
  });

  it('applies transform override', () => {
    const result = createDefaultFilterValueHandling({
      transform: { type: 'expression', expr: 'UPPER(value)' },
    });
    expect(result.transform).toEqual({ type: 'expression', expr: 'UPPER(value)' });
  });

  it('applies defaultValue override', () => {
    const result = createDefaultFilterValueHandling({
      defaultValue: { type: 'static', value: 'active' },
    });
    expect(result.defaultValue).toEqual({ type: 'static', value: 'active' });
  });
});

// ========================================================================
// resolveStaticDefault
// ========================================================================

describe('resolveStaticDefault', () => {
  it('returns the value for static type', () => {
    const def: FilterDefault = { type: 'static', value: 'hello' };
    expect(resolveStaticDefault(def)).toBe('hello');
  });

  it('returns null for static type with null value', () => {
    const def: FilterDefault = { type: 'static', value: null };
    expect(resolveStaticDefault(def)).toBeNull();
  });

  it('returns undefined for relative-date type', () => {
    const def: FilterDefault = { type: 'relative-date', offset: -7, unit: 'days' };
    expect(resolveStaticDefault(def)).toBeUndefined();
  });

  it('returns undefined for viewer-attribute type', () => {
    const def: FilterDefault = { type: 'viewer-attribute', attribute: 'region' };
    expect(resolveStaticDefault(def)).toBeUndefined();
  });

  it('returns undefined for expression type', () => {
    const def: FilterDefault = { type: 'expression', expr: 'NOW()' };
    expect(resolveStaticDefault(def)).toBeUndefined();
  });
});
