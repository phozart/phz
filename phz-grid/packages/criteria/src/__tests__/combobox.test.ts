/**
 * @phozart/phz-criteria — Combobox utility tests
 *
 * Tests for the headless filterComboboxOptions and resolveComboboxLabel
 * functions exported from phz-combobox.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  filterComboboxOptions,
  resolveComboboxLabel,
  type ComboboxOption,
} from '../components/fields/phz-combobox.js';

const SAMPLE_OPTIONS: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
];

/* ── filterComboboxOptions ── */

describe('filterComboboxOptions', () => {
  it('returns all options when query is empty', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, '', false, '— None —');
    expect(result).toEqual(SAMPLE_OPTIONS);
  });

  it('prepends empty option when allowEmpty is true and query is empty', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, '', true, '— None —');
    expect(result.length).toBe(SAMPLE_OPTIONS.length + 1);
    expect(result[0]).toEqual({ value: '', label: '— None —' });
    expect(result.slice(1)).toEqual(SAMPLE_OPTIONS);
  });

  it('skips empty option when allowEmpty is false', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, '', false, '— None —');
    expect(result.every(o => o.value !== '')).toBe(true);
    expect(result.length).toBe(SAMPLE_OPTIONS.length);
  });

  it('filters by case-insensitive substring of label', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, 'united', false, '');
    expect(result.length).toBe(2);
    expect(result.map(o => o.value)).toEqual(['us', 'gb']);
  });

  it('filters by case-insensitive substring of value', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, 'DE', false, '');
    expect(result.length).toBe(1);
    expect(result[0].value).toBe('de');
  });

  it('returns empty array when no match', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, 'xyz', false, '');
    expect(result).toEqual([]);
  });

  it('empty option matches query against emptyLabel', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, 'none', true, '— None —');
    // The empty option label contains "none", so it should match
    expect(result.some(o => o.value === '')).toBe(true);
  });

  it('empty option is excluded when it does not match query', () => {
    const result = filterComboboxOptions(SAMPLE_OPTIONS, 'japan', true, '— None —');
    expect(result.some(o => o.value === '')).toBe(false);
    expect(result.length).toBe(1);
    expect(result[0].value).toBe('jp');
  });

  it('matches both label and value in the same search', () => {
    // 'fr' matches France by value, also 'fr' is in 'France' label
    const result = filterComboboxOptions(SAMPLE_OPTIONS, 'fr', false, '');
    expect(result.some(o => o.value === 'fr')).toBe(true);
  });
});

/* ── resolveComboboxLabel ── */

describe('resolveComboboxLabel', () => {
  it('returns matching label for known value', () => {
    const result = resolveComboboxLabel(SAMPLE_OPTIONS, 'de', '— None —', '— Select —');
    expect(result).toBe('Germany');
  });

  it('returns emptyLabel when value is empty string', () => {
    const result = resolveComboboxLabel(SAMPLE_OPTIONS, '', '— None —', '— Select —');
    expect(result).toBe('— None —');
  });

  it('returns placeholder when value is empty and emptyLabel is empty', () => {
    const result = resolveComboboxLabel(SAMPLE_OPTIONS, '', '', '— Select —');
    expect(result).toBe('— Select —');
  });

  it('returns value as fallback when not found in options', () => {
    const result = resolveComboboxLabel(SAMPLE_OPTIONS, 'zz', '— None —', '— Select —');
    expect(result).toBe('zz');
  });
});

/* ── Type compatibility ── */

describe('ComboboxOption type', () => {
  it('is compatible with { value: string; label: string } shape', () => {
    // SelectionFieldOption from core has { value: string; label: string; ... }
    // ComboboxOption is a subset — they share value+label fields
    const opt: ComboboxOption = { value: 'x', label: 'X' };
    const asSelectionField: { value: string; label: string } = opt;
    expect(asSelectionField.value).toBe('x');
    expect(asSelectionField.label).toBe('X');
  });
});
