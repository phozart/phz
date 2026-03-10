/**
 * Tests for FilterPresetValue types and helpers.
 */
import {
  createDefaultFilterPresetValue,
} from '@phozart/phz-shared/types';

describe('createDefaultFilterPresetValue', () => {
  it('creates a default filter preset value with required fields', () => {
    const result = createDefaultFilterPresetValue('f1', 'status');
    expect(result.filterId).toBe('f1');
    expect(result.field).toBe('status');
    expect(result.operator).toBe('equals');
    expect(result.value).toBeNull();
    expect(result.label).toBeUndefined();
  });

  it('applies overrides for operator', () => {
    const result = createDefaultFilterPresetValue('f1', 'name', { operator: 'contains' });
    expect(result.operator).toBe('contains');
    expect(result.value).toBeNull();
  });

  it('applies overrides for value', () => {
    const result = createDefaultFilterPresetValue('f1', 'age', { value: 25 });
    expect(result.value).toBe(25);
    expect(result.operator).toBe('equals');
  });

  it('applies overrides for label', () => {
    const result = createDefaultFilterPresetValue('f1', 'status', { label: 'Active' });
    expect(result.label).toBe('Active');
  });

  it('applies all overrides together', () => {
    const result = createDefaultFilterPresetValue('f2', 'category', {
      operator: 'in',
      value: ['a', 'b'],
      label: 'Categories A & B',
    });
    expect(result.filterId).toBe('f2');
    expect(result.field).toBe('category');
    expect(result.operator).toBe('in');
    expect(result.value).toEqual(['a', 'b']);
    expect(result.label).toBe('Categories A & B');
  });

  it('handles empty overrides object', () => {
    const result = createDefaultFilterPresetValue('f1', 'x', {});
    expect(result.operator).toBe('equals');
    expect(result.value).toBeNull();
    expect(result.label).toBeUndefined();
  });
});
