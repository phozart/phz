/**
 * @phozart/phz-criteria — Pure Logic Tests
 *
 * Tests for exported pure functions across criteria components.
 */
import { describe, it, expect } from 'vitest';
import {
  filterComboboxOptions,
  resolveComboboxLabel,
  type ComboboxOption,
} from '../components/fields/phz-combobox.js';
import {
  filterSearchOptions,
} from '../components/fields/phz-searchable-dropdown.js';
import {
  formatPresetValuePreview,
  isFilterTypeCompatible,
  buildFilterPresetContextItems,
} from '../components/phz-preset-admin.js';
import {
  buildDefContextItems,
  buildRuleContextItems,
  buildPresetContextItems,
  buildBgContextItems,
} from '../components/phz-filter-designer.js';
import type { FilterDefinition, FilterRule, SelectionPreset, SearchFieldConfig, SelectionFieldOption } from '@phozart/phz-core';

// --- Combobox ---

describe('filterComboboxOptions', () => {
  const options: ComboboxOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
  ];

  it('returns all options when query is empty', () => {
    const result = filterComboboxOptions(options, '', false, '');
    expect(result).toHaveLength(3);
  });

  it('filters by label substring (case-insensitive)', () => {
    const result = filterComboboxOptions(options, 'united', false, '');
    expect(result).toHaveLength(2);
  });

  it('filters by value substring', () => {
    const result = filterComboboxOptions(options, 'au', false, '');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('au');
  });

  it('prepends empty option when allowEmpty is true', () => {
    const result = filterComboboxOptions(options, '', true, '(None)');
    expect(result).toHaveLength(4);
    expect(result[0].value).toBe('');
    expect(result[0].label).toBe('(None)');
  });

  it('empty option is included in filter results', () => {
    const result = filterComboboxOptions(options, 'none', true, '(None)');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('(None)');
  });
});

describe('resolveComboboxLabel', () => {
  const options: ComboboxOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
  ];

  it('resolves label from matching option', () => {
    expect(resolveComboboxLabel(options, 'us', '', 'Select...')).toBe('United States');
  });

  it('returns value when no match found', () => {
    expect(resolveComboboxLabel(options, 'unknown', '', 'Select...')).toBe('unknown');
  });

  it('returns emptyLabel for empty value', () => {
    expect(resolveComboboxLabel(options, '', '(All)', 'Select...')).toBe('(All)');
  });

  it('returns placeholder when emptyLabel is empty', () => {
    expect(resolveComboboxLabel(options, '', '', 'Select...')).toBe('Select...');
  });
});

// --- Search dropdown ---

describe('filterSearchOptions', () => {
  const options: SelectionFieldOption[] = [
    { value: '1', label: 'Apple' },
    { value: '2', label: 'Banana' },
    { value: '3', label: 'Avocado' },
    { value: '4', label: 'Blueberry' },
  ];

  it('filters by contains (default)', () => {
    const config: SearchFieldConfig = {};
    const result = filterSearchOptions(options, 'an', config);
    expect(result.map(o => o.label)).toEqual(['Banana']);
  });

  it('filters by beginsWith', () => {
    const config: SearchFieldConfig = { matchMode: 'beginsWith' };
    const result = filterSearchOptions(options, 'a', config);
    expect(result.map(o => o.label)).toEqual(['Apple', 'Avocado']);
  });

  it('returns empty when query is shorter than minChars', () => {
    const config: SearchFieldConfig = { minChars: 3 };
    const result = filterSearchOptions(options, 'ap', config);
    expect(result).toHaveLength(0);
  });

  it('respects maxSuggestions', () => {
    const config: SearchFieldConfig = { maxSuggestions: 2 };
    const result = filterSearchOptions(options, 'a', config);
    expect(result).toHaveLength(2);
  });

  it('supports multiValue tokenization', () => {
    const config: SearchFieldConfig = { multiValue: true };
    const result = filterSearchOptions(options, 'apple banana', config);
    expect(result.map(o => o.label)).toEqual(['Apple', 'Banana']);
  });
});

// --- Preset Admin ---

describe('formatPresetValuePreview', () => {
  const baseDef = {
    id: 'f1',
    label: 'Status',
    type: 'single_select' as const,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  } as FilterDefinition;

  it('returns (All) for null value', () => {
    expect(formatPresetValuePreview(null, baseDef)).toEqual(['(All)']);
  });

  it('resolves label from options for single value', () => {
    expect(formatPresetValuePreview('active', baseDef)).toEqual(['Active']);
  });

  it('returns raw value when no option match', () => {
    expect(formatPresetValuePreview('unknown', baseDef)).toEqual(['unknown']);
  });

  it('resolves labels for array values', () => {
    expect(formatPresetValuePreview(['active', 'inactive'], baseDef)).toEqual(['Active', 'Inactive']);
  });

  it('handles date_range JSON value', () => {
    const dateDef = { ...baseDef, type: 'date_range' as const };
    const value = JSON.stringify({ startDate: '2026-01-01', endDate: '2026-03-01' });
    const result = formatPresetValuePreview(value, dateDef);
    expect(result[0]).toContain('2026-01-01');
    expect(result[0]).toContain('2026-03-01');
  });

  it('handles numeric_range JSON value', () => {
    const numDef = { ...baseDef, type: 'numeric_range' as const, numericRangeConfig: { unit: '%' } } as FilterDefinition;
    const value = JSON.stringify({ min: 0, max: 100 });
    const result = formatPresetValuePreview(value, numDef);
    expect(result[0]).toContain('0%');
    expect(result[0]).toContain('100%');
  });
});

describe('isFilterTypeCompatible', () => {
  it('same type is compatible', () => {
    expect(isFilterTypeCompatible('single_select', 'single_select')).toBe(true);
  });

  it('multi_select and chip_group are compatible', () => {
    expect(isFilterTypeCompatible('multi_select', 'chip_group')).toBe(true);
    expect(isFilterTypeCompatible('chip_group', 'multi_select')).toBe(true);
  });

  it('different incompatible types are not compatible', () => {
    expect(isFilterTypeCompatible('single_select', 'multi_select')).toBe(false);
    expect(isFilterTypeCompatible('date_range', 'text')).toBe(false);
  });
});

describe('buildFilterPresetContextItems', () => {
  it('returns items with edit, set default, copy, delete', () => {
    const items = buildFilterPresetContextItems({ id: 'p1', name: 'Default', value: 'active', isDefault: false } as any);
    expect(items.some(i => i.id === 'edit-filter-preset')).toBe(true);
    expect(items.some(i => i.id === 'delete-filter-preset')).toBe(true);
  });

  it('shows "Remove Default" when preset is default', () => {
    const items = buildFilterPresetContextItems({ id: 'p1', name: 'Default', value: 'active', isDefault: true } as any);
    const defaultItem = items.find(i => i.id === 'set-default-filter-preset');
    expect(defaultItem?.label).toContain('Remove Default');
  });
});

// --- Filter Designer context menus ---

describe('buildDefContextItems', () => {
  it('returns edit/rename/duplicate for active definition', () => {
    const items = buildDefContextItems({ id: 'd1', label: 'Status', type: 'single_select', deprecated: false } as any);
    expect(items.some(i => i.id === 'edit-def')).toBe(true);
    expect(items.some(i => i.id === 'rename-def')).toBe(true);
    expect(items.some(i => i.id === 'duplicate-def')).toBe(true);
    expect(items.some(i => i.id === 'deprecate-def')).toBe(true);
  });

  it('returns restore for deprecated definition', () => {
    const items = buildDefContextItems({ id: 'd1', label: 'Status', type: 'single_select', deprecated: true } as any);
    expect(items.some(i => i.id === 'restore-def')).toBe(true);
    expect(items.some(i => i.id === 'edit-def')).toBe(false);
  });
});

describe('buildRuleContextItems', () => {
  it('disables move-up for first rule', () => {
    const items = buildRuleContextItems({ enabled: true } as any, true, false);
    const moveUp = items.find(i => i.id === 'move-rule-up');
    expect(moveUp?.disabled).toBe(true);
  });

  it('disables move-down for last rule', () => {
    const items = buildRuleContextItems({ enabled: true } as any, false, true);
    const moveDown = items.find(i => i.id === 'move-rule-down');
    expect(moveDown?.disabled).toBe(true);
  });

  it('shows Disable for enabled rule', () => {
    const items = buildRuleContextItems({ enabled: true } as any, false, false);
    const toggle = items.find(i => i.id === 'toggle-rule');
    expect(toggle?.label).toContain('Disable');
  });

  it('shows Enable for disabled rule', () => {
    const items = buildRuleContextItems({ enabled: false } as any, false, false);
    const toggle = items.find(i => i.id === 'toggle-rule');
    expect(toggle?.label).toContain('Enable');
  });
});

describe('buildPresetContextItems', () => {
  it('returns edit/delete for shared preset', () => {
    const items = buildPresetContextItems({ isDefault: false } as any, 'shared');
    expect(items.some(i => i.id === 'edit-preset')).toBe(true);
    expect(items.some(i => i.id === 'delete-preset')).toBe(true);
  });

  it('returns view/copy for non-shared preset', () => {
    const items = buildPresetContextItems({ isDefault: false } as any, 'user');
    expect(items.some(i => i.id === 'view-preset')).toBe(true);
    expect(items.some(i => i.id === 'copy-to-shared')).toBe(true);
  });
});

describe('buildBgContextItems', () => {
  it('shows New Definition on definitions tab', () => {
    const items = buildBgContextItems('definitions', false);
    expect(items.some(i => i.id === 'new-definition')).toBe(true);
  });

  it('shows Add New Rule on rules tab', () => {
    const items = buildBgContextItems('rules', false);
    expect(items.some(i => i.id === 'add-rule')).toBe(true);
  });

  it('shows New Preset on presets tab', () => {
    const items = buildBgContextItems('presets', false);
    expect(items.some(i => i.id === 'new-preset')).toBe(true);
  });

  it('shows Hide Guidance when help is open', () => {
    const items = buildBgContextItems('definitions', true);
    const toggleHelp = items.find(i => i.id === 'toggle-help');
    expect(toggleHelp?.label).toContain('Hide');
  });
});
