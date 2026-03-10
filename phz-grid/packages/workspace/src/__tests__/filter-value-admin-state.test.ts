import { describe, it, expect } from 'vitest';
import {
  initialFilterValueAdminState,
  setValueSourceType,
  updateDataSourceConfig,
  setStaticValues,
  addLookupEntry,
  removeLookupEntry,
  reorderLookupEntries,
  setTransform,
  setDefaultValue,
  setStaticDefault,
  setViewerAttributeDefault,
  setRelativeDateDefault,
  updateDisplayOptions,
  toggleMultiSelect,
  toggleShowCount,
  toggleFreeText,
  setPreviewLoading,
  setPreviewValues,
  setPreviewError,
  validateFilterValueConfig,
} from '../filters/filter-value-admin-state.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialFilterValueAdminState', () => {
  it('creates default state', () => {
    const state = initialFilterValueAdminState('fd-1');
    expect(state.filterDefinitionId).toBe('fd-1');
    expect(state.valueSource.type).toBe('static');
    expect(state.displayOptions.showCount).toBe(false);
    expect(state.displayOptions.multiSelect).toBe(false);
    expect(state.previewValues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Value source configuration
// ---------------------------------------------------------------------------

describe('value source', () => {
  it('switches to data-source', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'data-source');
    expect(state.valueSource.type).toBe('data-source');
  });

  it('switches to lookup-table', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'lookup-table');
    expect(state.valueSource.type).toBe('lookup-table');
  });

  it('updates data source config', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'data-source');
    state = updateDataSourceConfig(state, 'ds-1', 'region');
    expect(state.valueSource).toEqual({ type: 'data-source', dataSourceId: 'ds-1', field: 'region' });
  });

  it('updateDataSourceConfig does nothing for wrong type', () => {
    const state = initialFilterValueAdminState('fd-1');
    expect(updateDataSourceConfig(state, 'ds-1', 'region')).toBe(state);
  });

  it('sets static values', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setStaticValues(state, ['A', 'B', 'C']);
    expect((state.valueSource as any).values).toEqual(['A', 'B', 'C']);
  });
});

// ---------------------------------------------------------------------------
// Lookup entries
// ---------------------------------------------------------------------------

describe('lookup entries', () => {
  it('adds lookup entries', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'lookup-table');
    state = addLookupEntry(state, { value: 'us', label: 'United States' });
    state = addLookupEntry(state, { value: 'uk', label: 'United Kingdom' });
    expect((state.valueSource as any).entries).toHaveLength(2);
  });

  it('does not add duplicate value', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'lookup-table');
    state = addLookupEntry(state, { value: 'us', label: 'United States' });
    state = addLookupEntry(state, { value: 'us', label: 'USA' });
    expect((state.valueSource as any).entries).toHaveLength(1);
  });

  it('removes lookup entry', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'lookup-table');
    state = addLookupEntry(state, { value: 'us', label: 'United States' });
    state = removeLookupEntry(state, 'us');
    expect((state.valueSource as any).entries).toHaveLength(0);
  });

  it('reorders lookup entries', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'lookup-table');
    state = addLookupEntry(state, { value: 'a', label: 'A' });
    state = addLookupEntry(state, { value: 'b', label: 'B' });
    state = addLookupEntry(state, { value: 'c', label: 'C' });
    state = reorderLookupEntries(state, 0, 2);
    const entries = (state.valueSource as any).entries;
    expect(entries[0].value).toBe('b');
    expect(entries[1].value).toBe('c');
    expect(entries[2].value).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

describe('transform', () => {
  it('sets transform', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setTransform(state, { type: 'uppercase' } as any);
    expect(state.transform).toBeDefined();
  });

  it('clears transform', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setTransform(state, { type: 'uppercase' } as any);
    state = setTransform(state, undefined);
    expect(state.transform).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Default value
// ---------------------------------------------------------------------------

describe('default value', () => {
  it('sets static default', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setStaticDefault(state, 'US');
    expect(state.defaultValue).toEqual({ type: 'static', value: 'US' });
  });

  it('sets viewer-attribute default', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setViewerAttributeDefault(state, 'region');
    expect(state.defaultValue).toEqual({ type: 'viewer-attribute', attribute: 'region' });
  });

  it('sets relative-date default', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setRelativeDateDefault(state, -7, 'days');
    expect(state.defaultValue).toEqual({ type: 'relative-date', offset: -7, unit: 'days' });
  });

  it('clears default', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setStaticDefault(state, 'US');
    state = setDefaultValue(state, undefined);
    expect(state.defaultValue).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Display options
// ---------------------------------------------------------------------------

describe('display options', () => {
  it('updates display options', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = updateDisplayOptions(state, { placeholder: 'Select...' });
    expect(state.displayOptions.placeholder).toBe('Select...');
  });

  it('toggles multi-select', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = toggleMultiSelect(state);
    expect(state.displayOptions.multiSelect).toBe(true);
    state = toggleMultiSelect(state);
    expect(state.displayOptions.multiSelect).toBe(false);
  });

  it('toggles show count', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = toggleShowCount(state);
    expect(state.displayOptions.showCount).toBe(true);
  });

  it('toggles free text', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = toggleFreeText(state);
    expect(state.displayOptions.allowFreeText).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

describe('preview', () => {
  it('sets preview loading', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setPreviewLoading(state, true);
    expect(state.previewLoading).toBe(true);
  });

  it('sets preview values', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setPreviewValues(state, ['US', 'EU']);
    expect(state.previewValues).toEqual(['US', 'EU']);
    expect(state.previewLoading).toBe(false);
  });

  it('sets preview error', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setPreviewError(state, 'Connection failed');
    expect(state.previewError).toBe('Connection failed');
    expect(state.previewLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  it('fails for data-source without required fields', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'data-source');
    const result = validateFilterValueConfig(state);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });

  it('passes for valid data-source', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'data-source');
    state = updateDataSourceConfig(state, 'ds-1', 'region');
    const result = validateFilterValueConfig(state);
    expect(result.valid).toBe(true);
  });

  it('fails for empty lookup table', () => {
    let state = initialFilterValueAdminState('fd-1');
    state = setValueSourceType(state, 'lookup-table');
    const result = validateFilterValueConfig(state);
    expect(result.valid).toBe(false);
  });

  it('passes for static (even empty)', () => {
    const state = initialFilterValueAdminState('fd-1');
    const result = validateFilterValueConfig(state);
    expect(result.valid).toBe(true);
  });
});
