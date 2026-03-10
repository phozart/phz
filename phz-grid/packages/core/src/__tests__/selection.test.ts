import { describe, it, expect } from 'vitest';
import {
  serializeSelection,
  deserializeSelection,
  mergeSelection,
  validateSelection,
} from '../selection.js';
import type { SelectionContext, SelectionFieldDef } from '../types/selection-context.js';

const fields: SelectionFieldDef[] = [
  { id: 'region', label: 'Region', type: 'single_select', options: [
    { value: 'north', label: 'North' },
    { value: 'south', label: 'South' },
    { value: 'east', label: 'East' },
  ]},
  { id: 'products', label: 'Products', type: 'multi_select', options: [
    { value: 'widget', label: 'Widget' },
    { value: 'gadget', label: 'Gadget' },
  ]},
  { id: 'period', label: 'Period', type: 'period_picker' },
  { id: 'tags', label: 'Tags', type: 'chip_group' },
  { id: 'search', label: 'Search', type: 'text' },
];

describe('serializeSelection', () => {
  it('serializes string values', () => {
    const ctx: SelectionContext = { region: 'north', period: '2024-Q1' };
    const params = serializeSelection(ctx);
    expect(params.get('region')).toBe('north');
    expect(params.get('period')).toBe('2024-Q1');
  });

  it('serializes array values as comma-separated', () => {
    const ctx: SelectionContext = { products: ['widget', 'gadget'] };
    const params = serializeSelection(ctx);
    expect(params.get('products')).toBe('widget,gadget');
  });

  it('skips null values', () => {
    const ctx: SelectionContext = { region: null, period: '2024-Q1' };
    const params = serializeSelection(ctx);
    expect(params.has('region')).toBe(false);
    expect(params.get('period')).toBe('2024-Q1');
  });

  it('skips empty arrays', () => {
    const ctx: SelectionContext = { products: [] };
    const params = serializeSelection(ctx);
    expect(params.has('products')).toBe(false);
  });
});

describe('deserializeSelection', () => {
  it('round-trips single values', () => {
    const original: SelectionContext = { region: 'north', period: '2024-Q1' };
    const params = serializeSelection(original);
    const result = deserializeSelection(params, fields);
    expect(result.region).toBe('north');
    expect(result.period).toBe('2024-Q1');
  });

  it('round-trips multi-select as arrays', () => {
    const original: SelectionContext = { products: ['widget', 'gadget'] };
    const params = serializeSelection(original);
    const result = deserializeSelection(params, fields);
    expect(result.products).toEqual(['widget', 'gadget']);
  });

  it('ignores unknown fields', () => {
    const params = new URLSearchParams({ unknown: 'value', region: 'north' });
    const result = deserializeSelection(params, fields);
    expect(result).not.toHaveProperty('unknown');
    expect(result.region).toBe('north');
  });

  it('applies defaults for missing fields', () => {
    const fieldsWithDefaults: SelectionFieldDef[] = [
      { id: 'region', label: 'Region', type: 'single_select', defaultValue: 'north' },
    ];
    const params = new URLSearchParams();
    const result = deserializeSelection(params, fieldsWithDefaults);
    expect(result.region).toBe('north');
  });
});

describe('mergeSelection', () => {
  it('merges overrides into base', () => {
    const base: SelectionContext = { region: 'north', period: '2024-Q1' };
    const overrides: SelectionContext = { region: 'south' };
    const result = mergeSelection(base, overrides);
    expect(result.region).toBe('south');
    expect(result.period).toBe('2024-Q1');
  });

  it('removes keys set to null in overrides', () => {
    const base: SelectionContext = { region: 'north', period: '2024-Q1' };
    const overrides: SelectionContext = { period: null };
    const result = mergeSelection(base, overrides);
    expect(result.region).toBe('north');
    expect(result).not.toHaveProperty('period');
  });

  it('does not mutate base', () => {
    const base: SelectionContext = { region: 'north' };
    mergeSelection(base, { region: 'south' });
    expect(base.region).toBe('north');
  });
});

describe('validateSelection', () => {
  it('passes valid selection', () => {
    const ctx: SelectionContext = { region: 'north', products: ['widget'] };
    const result = validateSelection(ctx, fields);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects array for single_select field', () => {
    const ctx: SelectionContext = { region: ['north', 'south'] };
    const result = validateSelection(ctx, fields);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('region');
  });

  it('rejects string for multi_select field', () => {
    const ctx: SelectionContext = { products: 'widget' as any };
    const result = validateSelection(ctx, fields);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('products');
  });

  it('rejects invalid option values', () => {
    const ctx: SelectionContext = { region: 'west' };
    const result = validateSelection(ctx, fields);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('west');
  });

  it('requires locked fields', () => {
    const lockedFields: SelectionFieldDef[] = [
      { id: 'region', label: 'Region', type: 'single_select', locked: true },
    ];
    const ctx: SelectionContext = { region: null };
    const result = validateSelection(ctx, lockedFields);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('required');
  });
});
