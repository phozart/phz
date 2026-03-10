import { describe, it, expect } from 'vitest';
import type { FilterDefinition, FilterDefinitionPreset, FilterDefinitionId, FilterDataSource } from '@phozart/phz-core';
import { filterDefinitionId } from '@phozart/phz-core';
import {
  defToFieldDef,
  formatPresetValuePreview,
  isFilterTypeCompatible,
  buildFilterPresetContextItems,
  resolveDefinitionOptions,
} from '../components/phz-preset-admin.js';

function makeDef(id: string, overrides?: Partial<FilterDefinition>): FilterDefinition {
  return {
    id: filterDefinitionId(id),
    label: id.charAt(0).toUpperCase() + id.slice(1),
    type: 'single_select',
    sessionBehavior: 'reset',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  } as FilterDefinition;
}

function makeFilterPreset(id: string, defId: string, overrides?: Partial<FilterDefinitionPreset>): FilterDefinitionPreset {
  return {
    id,
    filterDefinitionId: filterDefinitionId(defId),
    name: `Preset ${id}`,
    scope: 'shared',
    owner: 'admin',
    value: null,
    isDefault: false,
    created: Date.now(),
    updated: Date.now(),
    ...overrides,
  };
}

describe('Filter Preset Admin — pure functions', () => {
  describe('defToFieldDef', () => {
    it('converts a single_select definition', () => {
      const def = makeDef('region', {
        type: 'single_select',
        options: [{ value: 'us', label: 'United States' }],
        dataField: 'region_code',
      });
      const fd = defToFieldDef(def);
      expect(fd.id).toBe('region');
      expect(fd.label).toBe('Region');
      expect(fd.type).toBe('single_select');
      expect(fd.options).toHaveLength(1);
      expect(fd.dataField).toBe('region_code');
    });

    it('converts a multi_select definition', () => {
      const def = makeDef('status', {
        type: 'multi_select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'closed', label: 'Closed' },
        ],
      });
      const fd = defToFieldDef(def);
      expect(fd.type).toBe('multi_select');
      expect(fd.options).toHaveLength(2);
    });

    it('converts a date_range definition with config', () => {
      const def = makeDef('period', {
        type: 'date_range',
        dateRangeConfig: {
          minDate: '2020-01-01',
          maxDate: '2030-12-31',
        },
      });
      const fd = defToFieldDef(def);
      expect(fd.type).toBe('date_range');
      expect(fd.dateRangeConfig?.minDate).toBe('2020-01-01');
    });

    it('handles empty config gracefully', () => {
      const def = makeDef('bare', { type: 'text' });
      const fd = defToFieldDef(def);
      expect(fd.type).toBe('text');
      expect(fd.options).toBeUndefined();
      expect(fd.dateRangeConfig).toBeUndefined();
    });

    it('maps valueSource.optionsSource to optionsSource', () => {
      const def = makeDef('ds', {
        valueSource: {
          type: 'dataset',
          optionsSource: { dataSetId: 'ds1', valueField: 'code' },
        },
      });
      const fd = defToFieldDef(def);
      expect(fd.optionsSource?.dataSetId).toBe('ds1');
      expect(fd.optionsSource?.valueField).toBe('code');
    });
  });

  describe('formatPresetValuePreview', () => {
    it('returns ["(All)"] for null value', () => {
      const def = makeDef('region');
      expect(formatPresetValuePreview(null, def)).toEqual(['(All)']);
    });

    it('resolves string array to option labels', () => {
      const def = makeDef('status', {
        options: [
          { value: 'a', label: 'Active' },
          { value: 'c', label: 'Closed' },
        ],
      });
      expect(formatPresetValuePreview(['a', 'c'], def)).toEqual(['Active', 'Closed']);
    });

    it('falls back to raw values when options are missing', () => {
      const def = makeDef('region');
      expect(formatPresetValuePreview(['us', 'uk'], def)).toEqual(['us', 'uk']);
    });

    it('formats date_range JSON', () => {
      const def = makeDef('period', { type: 'date_range' });
      const val = JSON.stringify({ startDate: '2024-01-01', endDate: '2024-12-31' });
      const result = formatPresetValuePreview(val, def);
      expect(result).toEqual(['2024-01-01 \u2013 2024-12-31']);
    });

    it('uses presetLabel for date_range if available', () => {
      const def = makeDef('period', { type: 'date_range' });
      const val = JSON.stringify({ startDate: '2024-01-01', endDate: '2024-12-31', presetLabel: 'This Year' });
      const result = formatPresetValuePreview(val, def);
      expect(result).toEqual(['This Year']);
    });

    it('formats numeric_range JSON', () => {
      const def = makeDef('amount', {
        type: 'numeric_range',
        numericRangeConfig: { unit: 'k' },
      });
      const val = JSON.stringify({ min: 10, max: 100 });
      const result = formatPresetValuePreview(val, def);
      expect(result).toEqual(['10k \u2013 100k']);
    });

    it('formats numeric_range without unit', () => {
      const def = makeDef('amount', { type: 'numeric_range' });
      const val = JSON.stringify({ min: 0, max: 50 });
      const result = formatPresetValuePreview(val, def);
      expect(result).toEqual(['0 \u2013 50']);
    });

    it('falls back on malformed JSON for date_range', () => {
      const def = makeDef('period', { type: 'date_range' });
      expect(formatPresetValuePreview('not-json', def)).toEqual(['not-json']);
    });

    it('falls back on malformed JSON for numeric_range', () => {
      const def = makeDef('amount', { type: 'numeric_range' });
      expect(formatPresetValuePreview('bad', def)).toEqual(['bad']);
    });

    it('resolves single string value to option label', () => {
      const def = makeDef('region', {
        options: [{ value: 'us', label: 'United States' }],
      });
      expect(formatPresetValuePreview('us', def)).toEqual(['United States']);
    });
  });

  describe('isFilterTypeCompatible', () => {
    it('same type is always compatible', () => {
      expect(isFilterTypeCompatible('single_select', 'single_select')).toBe(true);
      expect(isFilterTypeCompatible('date_range', 'date_range')).toBe(true);
    });

    it('multi_select and chip_group are cross-compatible', () => {
      expect(isFilterTypeCompatible('multi_select', 'chip_group')).toBe(true);
      expect(isFilterTypeCompatible('chip_group', 'multi_select')).toBe(true);
    });

    it('incompatible pairs return false', () => {
      expect(isFilterTypeCompatible('single_select', 'multi_select')).toBe(false);
      expect(isFilterTypeCompatible('date_range', 'numeric_range')).toBe(false);
      expect(isFilterTypeCompatible('text', 'tree_select')).toBe(false);
    });
  });

  describe('buildFilterPresetContextItems', () => {
    it('includes edit, default, copy, delete', () => {
      const preset = makeFilterPreset('fp1', 'region');
      const items = buildFilterPresetContextItems(preset);
      const ids = items.filter(i => !i.separator).map(i => i.id);
      expect(ids).toContain('edit-filter-preset');
      expect(ids).toContain('set-default-filter-preset');
      expect(ids).toContain('copy-filter-preset');
      expect(ids).toContain('delete-filter-preset');
    });

    it('shows "Remove Default" when preset is default', () => {
      const preset = makeFilterPreset('fp1', 'region', { isDefault: true });
      const items = buildFilterPresetContextItems(preset);
      const defaultItem = items.find(i => i.id === 'set-default-filter-preset');
      expect(defaultItem?.label).toBe('Remove Default');
    });

    it('shows "Set as Default" when preset is not default', () => {
      const preset = makeFilterPreset('fp1', 'region', { isDefault: false });
      const items = buildFilterPresetContextItems(preset);
      const defaultItem = items.find(i => i.id === 'set-default-filter-preset');
      expect(defaultItem?.label).toBe('Set as Default');
    });

    it('marks delete as danger variant', () => {
      const preset = makeFilterPreset('fp1', 'region');
      const items = buildFilterPresetContextItems(preset);
      const del = items.find(i => i.id === 'delete-filter-preset');
      expect(del?.variant).toBe('danger');
    });

    it('includes separator before delete', () => {
      const preset = makeFilterPreset('fp1', 'region');
      const items = buildFilterPresetContextItems(preset);
      const seps = items.filter(i => i.separator);
      expect(seps.length).toBe(1);
    });
  });

  describe('event detail shapes', () => {
    it('filter-preset-create has correct shape', () => {
      const detail = {
        filterDefinitionId: filterDefinitionId('region'),
        name: 'Eastern Regions',
        value: ['us-east', 'eu-west'],
        scope: 'shared' as const,
      };
      expect(detail.filterDefinitionId).toBe(filterDefinitionId('region'));
      expect(detail.name).toBe('Eastern Regions');
      expect(detail.value).toEqual(['us-east', 'eu-west']);
    });

    it('filter-preset-update has correct shape', () => {
      const detail = {
        presetId: 'fp1',
        patch: { name: 'Updated', value: ['new-val'] },
      };
      expect(detail.presetId).toBe('fp1');
      expect(detail.patch.name).toBe('Updated');
    });

    it('filter-preset-delete has correct shape', () => {
      const detail = { presetId: 'fp1' };
      expect(detail.presetId).toBe('fp1');
    });

    it('filter-preset-copy has correct shape', () => {
      const detail = {
        sourcePresetId: 'fp1',
        targetFilterDefinitionId: filterDefinitionId('status'),
      };
      expect(detail.sourcePresetId).toBe('fp1');
      expect(detail.targetFilterDefinitionId).toBe(filterDefinitionId('status'));
    });
  });

  describe('filter preset list filtering', () => {
    it('filters presets by definition ID', () => {
      const presets: FilterDefinitionPreset[] = [
        makeFilterPreset('fp1', 'region', { value: ['us'] }),
        makeFilterPreset('fp2', 'status', { value: ['active'] }),
        makeFilterPreset('fp3', 'region', { value: ['eu'] }),
      ];

      const regionId = filterDefinitionId('region');
      const filtered = presets.filter(p => p.filterDefinitionId === regionId);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.filterDefinitionId === regionId)).toBe(true);
    });

    it('returns empty array when no presets match', () => {
      const presets: FilterDefinitionPreset[] = [
        makeFilterPreset('fp1', 'region'),
      ];
      const statusId = filterDefinitionId('status');
      const filtered = presets.filter(p => p.filterDefinitionId === statusId);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('resolveDefinitionOptions', () => {
    const DS_REGIONS: FilterDataSource = {
      id: 'regions-ds',
      name: 'Regions',
      columns: ['code', 'name'],
      sampleRows: [
        { code: 'US', name: 'United States' },
        { code: 'UK', name: 'United Kingdom' },
        { code: 'DE', name: 'Germany' },
      ],
    };

    it('resolves from valueSource.optionsSource with sampleRows', () => {
      const def = makeDef('region', {
        valueSource: {
          type: 'dataset',
          optionsSource: { dataSetId: 'regions-ds', valueField: 'code', labelField: 'name' },
        },
      });
      const options = resolveDefinitionOptions(def, [DS_REGIONS], []);
      expect(options).toHaveLength(3);
      expect(options.map(o => o.value)).toEqual(expect.arrayContaining(['US', 'UK', 'DE']));
      expect(options.find(o => o.value === 'US')?.label).toBe('United States');
    });

    it('resolves from optionsSource with labelTemplate', () => {
      const def = makeDef('region', {
        valueSource: {
          type: 'dataset',
          optionsSource: { dataSetId: 'regions-ds', valueField: 'code', labelTemplate: '{code} - {name}' },
        },
      });
      const options = resolveDefinitionOptions(def, [DS_REGIONS], []);
      expect(options.find(o => o.value === 'DE')?.label).toBe('DE - Germany');
    });

    it('uses value as label when no labelField/labelTemplate', () => {
      const def = makeDef('region', {
        valueSource: {
          type: 'dataset',
          optionsSource: { dataSetId: 'regions-ds', valueField: 'code' },
        },
      });
      const options = resolveDefinitionOptions(def, [DS_REGIONS], []);
      expect(options.find(o => o.value === 'US')?.label).toBe('US');
    });

    it('falls back to static options when no datasource match', () => {
      const def = makeDef('status', {
        options: [
          { value: 'active', label: 'Active' },
          { value: 'closed', label: 'Closed' },
        ],
      });
      const options = resolveDefinitionOptions(def, [], []);
      expect(options).toHaveLength(2);
      expect(options[0].value).toBe('active');
    });

    it('falls back to deriving from data via dataField', () => {
      const def = makeDef('color', { dataField: 'color' });
      const data = [
        { color: 'red' },
        { color: 'blue' },
        { color: 'red' },
        { color: 'green' },
      ];
      const options = resolveDefinitionOptions(def, [], data);
      expect(options).toHaveLength(3);
      expect(options.map(o => o.value)).toEqual(expect.arrayContaining(['red', 'blue', 'green']));
    });

    it('returns empty array when no source available', () => {
      const def = makeDef('bare', { type: 'text' });
      const options = resolveDefinitionOptions(def, [], []);
      expect(options).toHaveLength(0);
    });

    it('deduplicates values from datasource', () => {
      const ds: FilterDataSource = {
        id: 'dupes',
        name: 'Dupes',
        columns: ['val'],
        sampleRows: [
          { val: 'A' },
          { val: 'A' },
          { val: 'B' },
        ],
      };
      const def = makeDef('x', {
        valueSource: { type: 'dataset', optionsSource: { dataSetId: 'dupes', valueField: 'val' } },
      });
      const options = resolveDefinitionOptions(def, [ds], []);
      expect(options).toHaveLength(2);
    });

    it('skips null/empty values from datasource', () => {
      const ds: FilterDataSource = {
        id: 'sparse',
        name: 'Sparse',
        columns: ['val'],
        sampleRows: [
          { val: 'A' },
          { val: null },
          { val: '' },
          { val: 'B' },
        ],
      };
      const def = makeDef('x', {
        valueSource: { type: 'dataset', optionsSource: { dataSetId: 'sparse', valueField: 'val' } },
      });
      const options = resolveDefinitionOptions(def, [ds], []);
      expect(options).toHaveLength(2);
    });

    it('sorts options alphabetically by label', () => {
      const ds: FilterDataSource = {
        id: 'unsorted',
        name: 'Unsorted',
        columns: ['val'],
        sampleRows: [
          { val: 'Zebra' },
          { val: 'Apple' },
          { val: 'Mango' },
        ],
      };
      const def = makeDef('x', {
        valueSource: { type: 'dataset', optionsSource: { dataSetId: 'unsorted', valueField: 'val' } },
      });
      const options = resolveDefinitionOptions(def, [ds], []);
      expect(options.map(o => o.label)).toEqual(['Apple', 'Mango', 'Zebra']);
    });

    it('prioritises optionsSource over static options', () => {
      const def = makeDef('region', {
        options: [{ value: 'static', label: 'Static' }],
        valueSource: {
          type: 'dataset',
          optionsSource: { dataSetId: 'regions-ds', valueField: 'code' },
        },
      });
      const options = resolveDefinitionOptions(def, [DS_REGIONS], []);
      expect(options).toHaveLength(3);
      expect(options.every(o => o.value !== 'static')).toBe(true);
    });
  });
});
