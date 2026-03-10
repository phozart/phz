import { describe, it, expect, vi } from 'vitest';
import {
  resolveDynamicDefaults,
  resolveDynamicPreset,
  resolveDependencies,
  filterTreeByParent,
  buildExportMetadata,
  formatCriteriaValue,
  validateCriteria,
  serializeCriteria,
  deserializeCriteria,
  resolveBuiltinPreset,
  resolveComparisonPeriod,
  getAvailablePresets,
  formatDateRangeDisplay,
  getFiscalQuarter,
  getFiscalQuarterBounds,
  getWeekStart,
  getWeekEnd,
  getISOWeekNumber,
  getMonthBounds,
  inferCriteriaType,
  deriveOptionsFromData,
  resolveOptionsSource,
  resolveFieldOptions,
  applyCriteriaToData,
  applyPresenceFilter,
  BUILTIN_DATE_PRESETS,
} from '../selection-criteria.js';
import type {
  CriteriaConfig,
  SelectionFieldDef,
  DynamicDatePreset,
  TreeNode,
  DateRangeValue,
  DateRangeFieldConfig,
  DataSet,
} from '@phozart/phz-core';

// --- Test Data ---

const countryTree: TreeNode[] = [
  {
    value: 'EU',
    label: 'Europe',
    children: [
      { value: 'BE', label: 'Belgium' },
      { value: 'FR', label: 'France' },
      { value: 'DE', label: 'Germany' },
    ],
  },
  {
    value: 'NA',
    label: 'North America',
    children: [
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
    ],
  },
];

const baseConfig: CriteriaConfig = {
  fields: [
    {
      id: 'country',
      label: 'Country',
      type: 'tree_select',
      treeOptions: countryTree,
    },
    {
      id: 'period',
      label: 'Period',
      type: 'date_range',
      dateRangeConfig: {
        dynamicPresets: [
          {
            id: 'last-7d',
            label: 'Last 7 Days',
            type: 'relative',
            unit: 'day',
            count: 7,
            anchor: 'today',
          },
        ],
      },
    },
    {
      id: 'service',
      label: 'Service Type',
      type: 'chip_group',
      options: [
        { value: 'express', label: 'Express' },
        { value: 'standard', label: 'Standard' },
        { value: 'economy', label: 'Economy' },
      ],
    },
    {
      id: 'salary',
      label: 'Salary Range',
      type: 'numeric_range',
      numericRangeConfig: { min: 0, max: 200000, step: 1000, unit: 'USD' },
    },
    {
      id: 'search',
      label: 'Search',
      type: 'search',
      searchConfig: { minChars: 2, debounceMs: 300, maxSuggestions: 10 },
    },
  ],
};

// --- resolveDynamicPreset ---

describe('resolveDynamicPreset', () => {
  const now = new Date(2025, 2, 15); // Mar 15, 2025

  it('resolves "last 7 days" from today', () => {
    const preset: DynamicDatePreset = {
      id: 'last-7d', label: 'Last 7 Days', type: 'relative', unit: 'day', count: 7, anchor: 'today',
    };
    const result = resolveDynamicPreset(preset, now);
    expect(result.startDate).toBe('2025-03-08');
    expect(result.endDate).toBe('2025-03-15');
    expect(result.presetId).toBe('last-7d');
  });

  it('resolves "last 3 months" from start_of_month', () => {
    const preset: DynamicDatePreset = {
      id: 'last-3m', label: 'Last 3 Months', type: 'relative', unit: 'month', count: 3, anchor: 'start_of_month',
    };
    const result = resolveDynamicPreset(preset, now);
    expect(result.startDate).toBe('2024-12-01');
    expect(result.endDate).toBe('2025-03-01');
  });

  it('resolves "last 1 year" from start_of_year', () => {
    const preset: DynamicDatePreset = {
      id: 'last-1y', label: 'Last Year', type: 'relative', unit: 'year', count: 1, anchor: 'start_of_year',
    };
    const result = resolveDynamicPreset(preset, now);
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2025-01-01');
  });

  it('resolves quarter-based preset', () => {
    const preset: DynamicDatePreset = {
      id: 'last-2q', label: 'Last 2 Quarters', type: 'relative', unit: 'quarter', count: 2, anchor: 'today',
    };
    const result = resolveDynamicPreset(preset, now);
    expect(result.startDate).toBe('2024-09-15');
    expect(result.endDate).toBe('2025-03-15');
  });

  it('resolves week-based preset', () => {
    const preset: DynamicDatePreset = {
      id: 'last-2w', label: 'Last 2 Weeks', type: 'relative', unit: 'week', count: 2, anchor: 'today',
    };
    const result = resolveDynamicPreset(preset, now);
    expect(result.startDate).toBe('2025-03-01');
    expect(result.endDate).toBe('2025-03-15');
  });
});

// --- resolveDynamicDefaults ---

describe('resolveDynamicDefaults', () => {
  const now = new Date(2025, 2, 15);

  it('resolves defaults from config', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'status', label: 'Status', type: 'single_select', defaultValue: 'active' },
        { id: 'name', label: 'Name', type: 'text' },
      ],
    };
    const values = resolveDynamicDefaults(config, now);
    expect(values.status).toBe('active');
    expect(values.name).toBeNull();
  });

  it('resolves locked values over defaults', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'region', label: 'Region', type: 'single_select', defaultValue: 'EU', lockedValue: 'NA' },
      ],
    };
    const values = resolveDynamicDefaults(config, now);
    expect(values.region).toBe('NA');
  });

  it('resolves date_range dynamic preset as default', () => {
    const values = resolveDynamicDefaults(baseConfig, now);
    const period = JSON.parse(values.period as string);
    expect(period.startDate).toBe('2025-03-08');
    expect(period.endDate).toBe('2025-03-15');
  });
});

// --- filterTreeByParent ---

describe('filterTreeByParent', () => {
  it('returns all nodes when parent is null', () => {
    const result = filterTreeByParent(countryTree, null);
    expect(result).toEqual(countryTree);
  });

  it('filters to matching top-level node', () => {
    const result = filterTreeByParent(countryTree, 'EU');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('EU');
  });

  it('filters to matching child node', () => {
    const result = filterTreeByParent(countryTree, 'BE');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('EU');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0].value).toBe('BE');
  });

  it('filters by array of values', () => {
    const result = filterTreeByParent(countryTree, ['BE', 'US']);
    expect(result).toHaveLength(2);
  });
});

// --- resolveDependencies ---

describe('resolveDependencies', () => {
  it('returns all options when no dependencies', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'service', label: 'Service', type: 'single_select', options: [{ value: 'a', label: 'A' }] },
      ],
    };
    const result = resolveDependencies(config, {});
    expect(result.get('service')).toHaveLength(1);
  });

  it('filters tree options by parent dependency', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'region', label: 'Region', type: 'single_select', options: [{ value: 'EU', label: 'Europe' }] },
        { id: 'country', label: 'Country', type: 'tree_select', treeOptions: countryTree },
      ],
      dependencies: [{ parentFieldId: 'region', childFieldId: 'country' }],
    };
    const result = resolveDependencies(config, { region: 'EU' });
    const countryOptions = result.get('country')!;
    expect(countryOptions.some(o => o.value === 'BE')).toBe(true);
    expect(countryOptions.some(o => o.value === 'US')).toBe(false);
  });
});

// --- validateCriteria ---

describe('validateCriteria', () => {
  it('validates required fields', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'name', label: 'Name', type: 'text', required: true },
      ],
    };
    const result = validateCriteria(config, { name: null });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('name');
  });

  it('passes when required field has value', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'name', label: 'Name', type: 'text', required: true },
      ],
    };
    const result = validateCriteria(config, { name: 'John' });
    expect(result.valid).toBe(true);
  });

  it('validates date range: start before end', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'period', label: 'Period', type: 'date_range' },
      ],
    };
    const result = validateCriteria(config, {
      period: JSON.stringify({ startDate: '2025-03-20', endDate: '2025-03-10' }),
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('start date');
  });

  it('validates numeric range: min < max', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'salary', label: 'Salary', type: 'numeric_range' },
      ],
    };
    const result = validateCriteria(config, {
      salary: JSON.stringify({ min: 100000, max: 50000 }),
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('min must be less than max');
  });

  it('validates numeric range against config bounds', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'salary', label: 'Salary', type: 'numeric_range', numericRangeConfig: { min: 0, max: 200000 } },
      ],
    };
    const result = validateCriteria(config, {
      salary: JSON.stringify({ min: -100, max: 50000 }),
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('below minimum');
  });

  it('passes valid config', () => {
    const result = validateCriteria(baseConfig, {
      country: ['BE'],
      period: JSON.stringify({ startDate: '2025-01-01', endDate: '2025-03-15' }),
      service: ['express'],
      salary: JSON.stringify({ min: 30000, max: 80000 }),
      search: null,
    });
    expect(result.valid).toBe(true);
  });
});

// --- formatCriteriaValue ---

describe('formatCriteriaValue', () => {
  it('returns "(All)" for null', () => {
    const field: SelectionFieldDef = { id: 'x', label: 'X', type: 'text' };
    expect(formatCriteriaValue(field, null)).toBe('(All)');
  });

  it('formats multi_select with labels', () => {
    const field: SelectionFieldDef = {
      id: 'service', label: 'Service', type: 'multi_select',
      options: [{ value: 'express', label: 'Express' }, { value: 'standard', label: 'Standard' }],
    };
    expect(formatCriteriaValue(field, ['express', 'standard'])).toBe('Express, Standard');
  });

  it('formats date_range', () => {
    const field: SelectionFieldDef = { id: 'period', label: 'Period', type: 'date_range' };
    const val = JSON.stringify({ startDate: '2025-01-01', endDate: '2025-03-15' });
    expect(formatCriteriaValue(field, val, 'en-GB')).toBe('1 Jan 2025 – 15 Mar 2025');
  });

  it('formats numeric_range with unit', () => {
    const field: SelectionFieldDef = {
      id: 'salary', label: 'Salary', type: 'numeric_range',
      numericRangeConfig: { unit: 'USD' },
    };
    const val = JSON.stringify({ min: 30000, max: 80000 });
    expect(formatCriteriaValue(field, val)).toBe('30000 USD – 80000 USD');
  });

  it('formats single_select with option label', () => {
    const field: SelectionFieldDef = {
      id: 'status', label: 'Status', type: 'single_select',
      options: [{ value: 'active', label: 'Active' }],
    };
    expect(formatCriteriaValue(field, 'active')).toBe('Active');
  });
});

// --- buildExportMetadata ---

describe('buildExportMetadata', () => {
  it('builds export metadata from config and values', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'name', label: 'Name', type: 'text' },
        { id: 'status', label: 'Status', type: 'single_select', options: [{ value: 'active', label: 'Active' }] },
      ],
    };
    const meta = buildExportMetadata(config, { name: 'John', status: 'active' });
    expect(meta.label).toBe('Selection Criteria');
    expect(meta.entries).toHaveLength(2);
    expect(meta.entries[0].fieldLabel).toBe('Name');
    expect(meta.entries[0].displayValue).toBe('John');
    expect(meta.entries[1].displayValue).toBe('Active');
    expect(meta.generatedAt).toBeGreaterThan(0);
  });
});

// --- URL Serialization ---

describe('serializeCriteria / deserializeCriteria', () => {
  const config: CriteriaConfig = {
    fields: [
      { id: 'country', label: 'Country', type: 'multi_select' },
      { id: 'status', label: 'Status', type: 'single_select' },
      { id: 'name', label: 'Name', type: 'text' },
    ],
  };

  it('serializes to URL params', () => {
    const params = serializeCriteria(
      { country: ['BE', 'FR'], status: 'active', name: null },
      config,
    );
    expect(params.get('country')).toBe('BE,FR');
    expect(params.get('status')).toBe('active');
    expect(params.has('name')).toBe(false);
  });

  it('deserializes from URL params', () => {
    const params = new URLSearchParams('country=BE,FR&status=active');
    const values = deserializeCriteria(params, config);
    expect(values.country).toEqual(['BE', 'FR']);
    expect(values.status).toBe('active');
    expect(values.name).toBeNull();
  });

  it('round-trips correctly', () => {
    const original = { country: ['BE', 'FR'], status: 'active', name: null };
    const params = serializeCriteria(original, config);
    const restored = deserializeCriteria(params, config);
    expect(restored.country).toEqual(['BE', 'FR']);
    expect(restored.status).toBe('active');
  });
});

// --- resolveBuiltinPreset ---

describe('resolveBuiltinPreset', () => {
  const now = new Date(2026, 1, 26); // Feb 26, 2026

  it('resolves "today"', () => {
    const result = resolveBuiltinPreset('today', now);
    expect(result.startDate).toBe('2026-02-26');
    expect(result.endDate).toBe('2026-02-26');
    expect(result.presetId).toBe('today');
    expect(result.isDynamic).toBe(true);
    expect(result.presetLabel).toBe('Today');
  });

  it('resolves "yesterday"', () => {
    const result = resolveBuiltinPreset('yesterday', now);
    expect(result.startDate).toBe('2026-02-25');
    expect(result.endDate).toBe('2026-02-25');
  });

  it('resolves "last-7d" — 7 days including today', () => {
    const result = resolveBuiltinPreset('last-7d', now);
    expect(result.startDate).toBe('2026-02-20');
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "last-30d"', () => {
    const result = resolveBuiltinPreset('last-30d', now);
    expect(result.startDate).toBe('2026-01-28');
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "last-12m"', () => {
    const result = resolveBuiltinPreset('last-12m', now);
    expect(result.startDate).toBe('2025-02-27');
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "mtd"', () => {
    const result = resolveBuiltinPreset('mtd', now);
    expect(result.startDate).toBe('2026-02-01');
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "ytd" with default fiscal (Jan)', () => {
    const result = resolveBuiltinPreset('ytd', now);
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "ytd" with fiscal start April', () => {
    const result = resolveBuiltinPreset('ytd', now, { fiscalYearStartMonth: 4 });
    // Feb 2026 is before April, so fiscal year started April 2025
    expect(result.startDate).toBe('2025-04-01');
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "prev-month"', () => {
    const result = resolveBuiltinPreset('prev-month', now);
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-01-31');
  });

  it('resolves "prev-year" with default fiscal', () => {
    const result = resolveBuiltinPreset('prev-year', now);
    expect(result.startDate).toBe('2025-01-01');
    expect(result.endDate).toBe('2025-12-31');
  });

  it('resolves "wtd" with Monday start', () => {
    // Feb 26 2026 is a Thursday
    const result = resolveBuiltinPreset('wtd', now, { weekStartDay: 'monday' });
    expect(result.startDate).toBe('2026-02-23'); // Monday
    expect(result.endDate).toBe('2026-02-26');
  });

  it('resolves "prev-week" with Monday start', () => {
    const result = resolveBuiltinPreset('prev-week', now, { weekStartDay: 'monday' });
    expect(result.startDate).toBe('2026-02-16'); // Mon
    expect(result.endDate).toBe('2026-02-22'); // Sun
  });
});

// --- getFiscalQuarter ---

describe('getFiscalQuarter', () => {
  it('returns Q1 for Jan with fiscal start Jan', () => {
    expect(getFiscalQuarter(new Date(2026, 0, 15), 1)).toBe(1);
  });

  it('returns Q4 for Jan with fiscal start April', () => {
    // April start: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
    expect(getFiscalQuarter(new Date(2026, 0, 15), 4)).toBe(4);
  });

  it('returns Q1 for April with fiscal start April', () => {
    expect(getFiscalQuarter(new Date(2026, 3, 15), 4)).toBe(1);
  });

  it('returns Q3 for Oct with fiscal start April', () => {
    expect(getFiscalQuarter(new Date(2026, 9, 15), 4)).toBe(3);
  });
});

// --- getFiscalQuarterBounds ---

describe('getFiscalQuarterBounds', () => {
  it('returns Jan-Mar for Q1 with fiscal start Jan', () => {
    const { start, end } = getFiscalQuarterBounds(2026, 1, 1);
    expect(start.getMonth()).toBe(0); // Jan
    expect(end.getMonth()).toBe(2); // Mar
    expect(end.getDate()).toBe(31);
  });

  it('returns Apr-Jun for Q1 with fiscal start April', () => {
    const { start, end } = getFiscalQuarterBounds(2026, 1, 4);
    expect(start.getMonth()).toBe(3); // Apr
    expect(end.getMonth()).toBe(5); // Jun
    expect(end.getDate()).toBe(30);
  });
});

// --- getWeekStart / getWeekEnd ---

describe('getWeekStart / getWeekEnd', () => {
  // Feb 26, 2026 = Thursday
  const thursday = new Date(2026, 1, 26);

  it('Monday start: week starts Feb 23', () => {
    const ws = getWeekStart(thursday, 'monday');
    expect(ws.getDate()).toBe(23);
    expect(ws.getMonth()).toBe(1);
  });

  it('Sunday start: week starts Feb 22', () => {
    const ws = getWeekStart(thursday, 'sunday');
    expect(ws.getDate()).toBe(22);
    expect(ws.getMonth()).toBe(1);
  });

  it('Monday end: week ends Mar 1', () => {
    const we = getWeekEnd(thursday, 'monday');
    expect(we.getDate()).toBe(1);
    expect(we.getMonth()).toBe(2); // March
  });
});

// --- getISOWeekNumber ---

describe('getISOWeekNumber', () => {
  it('returns week 1 for Jan 1 2026 (Thursday)', () => {
    expect(getISOWeekNumber(new Date(2026, 0, 1))).toBe(1);
  });

  it('returns week 9 for Feb 26 2026', () => {
    expect(getISOWeekNumber(new Date(2026, 1, 26))).toBe(9);
  });
});

// --- resolveComparisonPeriod ---

describe('resolveComparisonPeriod', () => {
  const primary: DateRangeValue = { startDate: '2026-01-01', endDate: '2026-03-31' };

  it('previous_period: shifts back by duration', () => {
    const result = resolveComparisonPeriod(primary, 'previous_period');
    expect(result.startDate).toBe('2025-10-03');
    expect(result.endDate).toBe('2025-12-31');
  });

  it('same_period_last_year: shifts back 1 year', () => {
    const result = resolveComparisonPeriod(primary, 'same_period_last_year');
    expect(result.startDate).toBe('2025-01-01');
    expect(result.endDate).toBe('2025-03-31');
  });
});

// --- getAvailablePresets ---

describe('getAvailablePresets', () => {
  it('returns all presets with empty config', () => {
    const presets = getAvailablePresets({});
    expect(presets.length).toBe(BUILTIN_DATE_PRESETS.length);
  });

  it('filters by preset groups', () => {
    const presets = getAvailablePresets({ availablePresetGroups: ['relative'] });
    expect(presets.every(p => p.group === 'relative')).toBe(true);
    expect(presets.length).toBe(5);
  });

  it('filters by specific preset IDs', () => {
    const presets = getAvailablePresets({ availablePresets: ['today', 'ytd', 'last-12m'] });
    expect(presets.length).toBe(3);
  });
});

// --- formatDateRangeDisplay ---

describe('formatDateRangeDisplay', () => {
  const L = 'en-GB'; // pin locale for deterministic tests

  it('formats single day', () => {
    expect(formatDateRangeDisplay({ startDate: '2026-02-26', endDate: '2026-02-26' }, L))
      .toBe('26 Feb 2026');
  });

  it('formats single day with preset label', () => {
    expect(formatDateRangeDisplay({ startDate: '2026-02-26', endDate: '2026-02-26', presetLabel: 'Today' }, L))
      .toBe('Today (26 Feb 2026)');
  });

  it('formats full month', () => {
    expect(formatDateRangeDisplay({ startDate: '2026-01-01', endDate: '2026-01-31' }, L))
      .toBe('Jan 2026');
  });

  it('formats full month with preset label', () => {
    expect(formatDateRangeDisplay({ startDate: '2026-01-01', endDate: '2026-01-31', presetLabel: 'Previous month' }, L))
      .toBe('Previous month (Jan 2026)');
  });

  it('formats range within same month', () => {
    expect(formatDateRangeDisplay({ startDate: '2026-02-01', endDate: '2026-02-26' }, L))
      .toBe('1 Feb 2026 – 26 Feb 2026');
  });

  it('formats range within same year', () => {
    expect(formatDateRangeDisplay({ startDate: '2026-01-01', endDate: '2026-06-30' }, L))
      .toBe('1 Jan 2026 – 30 Jun 2026');
  });

  it('formats range across years', () => {
    expect(formatDateRangeDisplay({ startDate: '2025-03-01', endDate: '2026-02-28' }, L))
      .toBe('Mar 2025 – Feb 2026');
  });

  it('formats range with preset label', () => {
    expect(formatDateRangeDisplay({ startDate: '2025-03-01', endDate: '2026-02-28', presetLabel: 'Last 12 months' }, L))
      .toBe('Last 12 months (Mar 2025 – Feb 2026)');
  });
});

// --- getMonthBounds ---

describe('getMonthBounds', () => {
  it('returns correct bounds for Feb 2026', () => {
    const { start, end } = getMonthBounds(2026, 1); // 0-based month
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(1);
    expect(end.getDate()).toBe(28);
  });

  it('handles leap year Feb 2024', () => {
    const { end } = getMonthBounds(2024, 1);
    expect(end.getDate()).toBe(29);
  });
});

// --- formatCriteriaValue (updated for rich date display) ---

describe('formatCriteriaValue (enhanced date)', () => {
  const L = 'en-GB';

  it('formats date_range with preset label', () => {
    const field: SelectionFieldDef = { id: 'period', label: 'Period', type: 'date_range' };
    const val = JSON.stringify({ startDate: '2025-03-01', endDate: '2026-02-28', presetLabel: 'Last 12 months' });
    expect(formatCriteriaValue(field, val, L)).toBe('Last 12 months (Mar 2025 – Feb 2026)');
  });

  it('formats date_range with comparison', () => {
    const field: SelectionFieldDef = { id: 'period', label: 'Period', type: 'date_range' };
    const val = JSON.stringify({
      startDate: '2026-01-01', endDate: '2026-03-31',
      presetLabel: 'Q1 2026',
      comparisonStartDate: '2025-01-01', comparisonEndDate: '2025-03-31',
    });
    const result = formatCriteriaValue(field, val, L);
    expect(result).toContain('Q1 2026');
    expect(result).toContain('vs');
  });
});

// --- Data-Binding Utilities ---

describe('inferCriteriaType', () => {
  it('returns date_range for date columns', () => {
    expect(inferCriteriaType('date', 100)).toBe('date_range');
  });

  it('returns single_select for number columns with low cardinality', () => {
    expect(inferCriteriaType('number', 5)).toBe('single_select');
  });

  it('returns numeric_range for number columns with high cardinality', () => {
    expect(inferCriteriaType('number', 50)).toBe('numeric_range');
  });

  it('returns single_select for boolean columns', () => {
    expect(inferCriteriaType('boolean', 2)).toBe('single_select');
  });

  it('returns chip_group for strings with few distinct values', () => {
    expect(inferCriteriaType('string', 4)).toBe('chip_group');
  });

  it('returns multi_select for strings with moderate distinct values', () => {
    expect(inferCriteriaType('string', 15)).toBe('multi_select');
  });

  it('returns search for strings with many distinct values', () => {
    expect(inferCriteriaType('string', 50)).toBe('search');
  });

  it('returns chip_group for undefined type with low cardinality', () => {
    expect(inferCriteriaType(undefined, 3)).toBe('chip_group');
  });
});

describe('deriveOptionsFromData', () => {
  const data = [
    { dept: 'Engineering', name: 'Alice' },
    { dept: 'Sales', name: 'Bob' },
    { dept: 'Engineering', name: 'Charlie' },
    { dept: null, name: 'Diana' },
    { dept: 'Sales', name: '' },
  ];

  it('extracts distinct non-null values sorted alphabetically', () => {
    const options = deriveOptionsFromData(data, 'dept');
    expect(options).toEqual([
      { value: 'Engineering', label: 'Engineering' },
      { value: 'Sales', label: 'Sales' },
    ]);
  });

  it('skips empty strings and null', () => {
    const options = deriveOptionsFromData(data, 'dept');
    expect(options).toHaveLength(2);
  });

  it('returns empty array for unknown field', () => {
    const options = deriveOptionsFromData(data, 'unknown');
    expect(options).toEqual([]);
  });
});

describe('applyCriteriaToData', () => {
  const data = [
    { id: 1, name: 'Alice', dept: 'Eng', salary: 100000, start: '2023-01-15' },
    { id: 2, name: 'Bob', dept: 'Sales', salary: 80000, start: '2023-06-20' },
    { id: 3, name: 'Charlie', dept: 'Eng', salary: 120000, start: '2024-02-01' },
    { id: 4, name: 'Diana', dept: 'HR', salary: 90000, start: '2024-08-10' },
  ];

  it('filters by chip_group (multi-value match)', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'dept', label: 'Dept', type: 'chip_group', dataField: 'dept' }],
    };
    const result = applyCriteriaToData(data, config, { dept: ['Eng'] });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie']);
  });

  it('filters by search (case-insensitive substring)', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'name', label: 'Name', type: 'search', dataField: 'name' }],
    };
    const result = applyCriteriaToData(data, config, { name: 'ali' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('filters by numeric_range', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'salary', label: 'Salary', type: 'numeric_range', dataField: 'salary' }],
    };
    const range = JSON.stringify({ min: 85000, max: 110000 });
    const result = applyCriteriaToData(data, config, { salary: range });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Diana']);
  });

  it('filters by date_range', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'start', label: 'Start', type: 'date_range', dataField: 'start' }],
    };
    const range = JSON.stringify({ startDate: '2024-01-01', endDate: '2024-12-31' });
    const result = applyCriteriaToData(data, config, { start: range });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Charlie', 'Diana']);
  });

  it('filters by single_select', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'dept', label: 'Dept', type: 'single_select', dataField: 'dept' }],
    };
    const result = applyCriteriaToData(data, config, { dept: 'HR' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Diana');
  });

  it('skips null/empty values (returns all data)', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'dept', label: 'Dept', type: 'chip_group', dataField: 'dept' }],
    };
    const result = applyCriteriaToData(data, config, { dept: null });
    expect(result).toHaveLength(4);
  });

  it('applies multiple filters (AND logic)', () => {
    const config: CriteriaConfig = {
      fields: [
        { id: 'dept', label: 'Dept', type: 'chip_group', dataField: 'dept' },
        { id: 'name', label: 'Name', type: 'search', dataField: 'name' },
      ],
    };
    const result = applyCriteriaToData(data, config, { dept: ['Eng'], name: 'char' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Charlie');
  });

  it('falls back to field.id when dataField is not set', () => {
    const config: CriteriaConfig = {
      fields: [{ id: 'dept', label: 'Dept', type: 'chip_group' }],
    };
    const result = applyCriteriaToData(data, config, { dept: ['Sales'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bob');
  });
});

// ── applyCriteriaToData with field_presence ──

describe('applyCriteriaToData — field_presence type', () => {
  const data = [
    { id: 1, name: 'Alice', email: 'alice@example.com', phone: null },
    { id: 2, name: 'Bob', email: '', phone: '555-1234' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', phone: '555-5678' },
    { id: 4, name: '', email: null, phone: null },
  ];

  const makeConfig = (): CriteriaConfig => ({
    fields: [{
      id: 'fp',
      label: 'Required Fields',
      type: 'field_presence',
      fieldPresenceConfig: { fields: ['email', 'phone'] },
    }],
  });

  it('has_value filters out rows with null/empty', () => {
    const val = JSON.stringify({ email: 'has_value', phone: 'any' });
    const result = applyCriteriaToData(data, makeConfig(), { fp: val });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie']);
  });

  it('empty filters out rows with values', () => {
    const val = JSON.stringify({ phone: 'empty', email: 'any' });
    const result = applyCriteriaToData(data, makeConfig(), { fp: val });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', '']);
  });

  it('any passes all through', () => {
    const val = JSON.stringify({ email: 'any', phone: 'any' });
    const result = applyCriteriaToData(data, makeConfig(), { fp: val });
    expect(result).toHaveLength(4);
  });

  it('multiple fields combined (AND logic)', () => {
    const val = JSON.stringify({ email: 'has_value', phone: 'has_value' });
    const result = applyCriteriaToData(data, makeConfig(), { fp: val });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Charlie');
  });

  it('null value passes all through (no filter)', () => {
    const result = applyCriteriaToData(data, makeConfig(), { fp: null });
    expect(result).toHaveLength(4);
  });

  it('JSON-stringified value round-trip', () => {
    const filters = { email: 'has_value', phone: 'empty' };
    const val = JSON.stringify(filters);
    const parsed = JSON.parse(val);
    expect(parsed).toEqual(filters);

    const result = applyCriteriaToData(data, makeConfig(), { fp: val });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });
});

// ── formatCriteriaValue with field_presence ──

describe('formatCriteriaValue — field_presence type', () => {
  const field: SelectionFieldDef = { id: 'fp', label: 'Presence', type: 'field_presence' };

  it('returns "(All)" for null', () => {
    expect(formatCriteriaValue(field, null)).toBe('(All)');
  });

  it('returns "(All)" when all filters are any', () => {
    const val = JSON.stringify({ email: 'any', phone: 'any' });
    expect(formatCriteriaValue(field, val)).toBe('(All)');
  });

  it('formats active filters', () => {
    const val = JSON.stringify({ email: 'has_value', phone: 'empty' });
    expect(formatCriteriaValue(field, val)).toBe('email: has value, phone: empty');
  });

  it('formats single active filter', () => {
    const val = JSON.stringify({ salary: 'has_value' });
    expect(formatCriteriaValue(field, val)).toBe('salary: has value');
  });
});

// ── applyPresenceFilter ──

describe('applyPresenceFilter', () => {
  const data = [
    { name: 'Alice', email: 'alice@example.com', phone: null },
    { name: 'Bob', email: '', phone: '555-1234' },
    { name: 'Charlie', email: 'charlie@example.com', phone: '555-5678' },
    { name: '', email: null, phone: null },
  ];

  it('returns all rows when all filters are "any"', () => {
    const result = applyPresenceFilter(data, { name: 'any', email: 'any' });
    expect(result).toHaveLength(4);
  });

  it('returns all rows when filter map is empty', () => {
    const result = applyPresenceFilter(data, {});
    expect(result).toHaveLength(4);
  });

  it('filters by has_value — only rows with non-null non-empty field', () => {
    const result = applyPresenceFilter(data, { email: 'has_value' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie']);
  });

  it('filters by empty — only rows with null or empty field', () => {
    const result = applyPresenceFilter(data, { phone: 'empty' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', '']);
  });

  it('applies multiple filters as AND', () => {
    const result = applyPresenceFilter(data, { email: 'has_value', phone: 'has_value' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Charlie');
  });

  it('combines has_value and empty on different fields', () => {
    const result = applyPresenceFilter(data, { name: 'has_value', phone: 'empty' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('returns empty array when no rows match', () => {
    const result = applyPresenceFilter(data, { name: 'empty', email: 'has_value' });
    expect(result).toHaveLength(0);
  });

  it('skips fields with state "any" in mixed filter', () => {
    const result = applyPresenceFilter(data, { name: 'any', phone: 'has_value' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Bob', 'Charlie']);
  });
});

// ── Field Role (Parameter vs Filter) ──

describe('Field Role', () => {
  const roleConfig: CriteriaConfig = {
    fields: [
      {
        id: 'direction',
        label: 'Direction',
        type: 'chip_group',
        fieldRole: 'parameter',
        dataField: 'direction',
        options: [
          { value: 'export', label: 'Export' },
          { value: 'import', label: 'Import' },
        ],
        defaultValue: 'export',
      },
      {
        id: 'region',
        label: 'Region',
        type: 'chip_group',
        fieldRole: 'filter',
        dataField: 'region',
        options: [
          { value: 'North', label: 'North' },
          { value: 'South', label: 'South' },
        ],
      },
      {
        id: 'status',
        label: 'Status',
        type: 'chip_group',
        dataField: 'status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'On Leave', label: 'On Leave' },
        ],
      },
    ],
  };

  it('resolveDynamicDefaults uses defaultValue for parameter fields', () => {
    const values = resolveDynamicDefaults(roleConfig);
    expect(values.direction).toBe('export');
  });

  it('applyCriteriaToData filters by parameter field with dataField', () => {
    const data = [
      { id: 1, name: 'Alice', direction: 'export', region: 'North' },
      { id: 2, name: 'Bob', direction: 'import', region: 'South' },
      { id: 3, name: 'Charlie', direction: 'export', region: 'South' },
    ];
    const result = applyCriteriaToData(data, roleConfig, { direction: 'export' });
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie']);
  });

  it('buildExportMetadata includes parameter and filter fields', () => {
    const meta = buildExportMetadata(roleConfig, { direction: 'export', region: ['North'] });
    expect(meta.entries.some(e => e.fieldLabel === 'Direction')).toBe(true);
    expect(meta.entries.some(e => e.fieldLabel === 'Region')).toBe(true);
  });

  it('validateCriteria validates all fields regardless of role', () => {
    const reqConfig: CriteriaConfig = {
      fields: [
        { id: 'dir', label: 'Dir', type: 'chip_group', fieldRole: 'parameter', required: true, options: [] },
        { id: 'region', label: 'Region', type: 'chip_group', fieldRole: 'filter', required: true, options: [] },
      ],
    };
    const result = validateCriteria(reqConfig, { dir: null, region: null });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('serializeCriteria/deserializeCriteria round-trips all fields', () => {
    const original = { direction: 'export', region: ['North'], status: null };
    const params = serializeCriteria(original, roleConfig);
    expect(params.get('direction')).toBe('export');
    expect(params.get('region')).toBe('North');

    const restored = deserializeCriteria(params, roleConfig);
    // chip_group deserializes as array
    expect(restored.direction).toEqual(['export']);
    expect(restored.region).toEqual(['North']);
  });

  it('fieldRole defaults to filter when not specified', () => {
    // The status field has no fieldRole — should still be treated as a filter
    const data = [
      { id: 1, status: 'Active' },
      { id: 2, status: 'On Leave' },
    ];
    const result = applyCriteriaToData(data, roleConfig, { status: ['Active'] });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Active');
  });
});

// ── selectionMode ──

describe('validateCriteria — selectionMode', () => {
  it('single mode rejects multi-value arrays', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'single',
        options: [
          { value: 'Eng', label: 'Engineering' },
          { value: 'Sales', label: 'Sales' },
          { value: 'HR', label: 'HR' },
        ],
      }],
    };
    const result = validateCriteria(config, { dept: ['Eng', 'Sales'] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('single selection');
  });

  it('single mode accepts single-value array', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'single',
        options: [{ value: 'Eng', label: 'Engineering' }],
      }],
    };
    const result = validateCriteria(config, { dept: ['Eng'] });
    expect(result.valid).toBe(true);
  });

  it('none mode skips required check', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'none',
        required: true,
        options: [],
      }],
    };
    const result = validateCriteria(config, { dept: null });
    expect(result.valid).toBe(true);
  });

  it('none mode rejects non-empty value', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'none',
        options: [],
      }],
    };
    const result = validateCriteria(config, { dept: ['Eng'] });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('does not allow selection');
  });

  it('multiple mode allows any number of values', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'multiple',
        options: [
          { value: 'Eng', label: 'Engineering' },
          { value: 'Sales', label: 'Sales' },
        ],
      }],
    };
    const result = validateCriteria(config, { dept: ['Eng', 'Sales'] });
    expect(result.valid).toBe(true);
  });
});

describe('applyCriteriaToData — selectionMode', () => {
  const data = [
    { id: 1, dept: 'Eng', name: 'Alice' },
    { id: 2, dept: 'Sales', name: 'Bob' },
    { id: 3, dept: 'HR', name: 'Charlie' },
  ];

  it('none mode skips filtering entirely', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'none',
        dataField: 'dept',
        options: [],
      }],
    };
    const result = applyCriteriaToData(data, config, { dept: ['Eng'] });
    expect(result).toHaveLength(3); // all rows returned despite filter value
  });

  it('single mode still filters correctly with single-item array', () => {
    const config: CriteriaConfig = {
      fields: [{
        id: 'dept',
        label: 'Department',
        type: 'chip_group',
        selectionMode: 'single',
        dataField: 'dept',
        options: [{ value: 'Eng', label: 'Engineering' }],
      }],
    };
    const result = applyCriteriaToData(data, config, { dept: ['Eng'] });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });
});

// ── resolveOptionsSource ──

describe('resolveOptionsSource', () => {
  const regionDs: DataSet = {
    columns: [
      { field: 'code', type: 'string', label: 'Code' },
      { field: 'name', type: 'string', label: 'Name' },
    ],
    rows: [
      { code: 'NA', name: 'North America' },
      { code: 'EU', name: 'Europe' },
      { code: 'AP', name: 'Asia Pacific' },
    ],
  };

  const dataSources: Record<string, DataSet> = { regions: regionDs };

  it('resolves options with value + label fields', () => {
    const options = resolveOptionsSource(
      { dataSetId: 'regions', valueField: 'code', labelField: 'name' },
      dataSources,
    );
    expect(options).toHaveLength(3);
    expect(options[0]).toEqual({ value: 'AP', label: 'Asia Pacific' }); // sorted by label
    expect(options[1]).toEqual({ value: 'EU', label: 'Europe' });
    expect(options[2]).toEqual({ value: 'NA', label: 'North America' });
  });

  it('uses valueField as label when labelField omitted', () => {
    const options = resolveOptionsSource(
      { dataSetId: 'regions', valueField: 'code' },
      dataSources,
    );
    expect(options).toHaveLength(3);
    expect(options[0].label).toBe(options[0].value); // label = value
  });

  it('returns empty array and warns for missing dataset', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const options = resolveOptionsSource(
      { dataSetId: 'unknown', valueField: 'code' },
      dataSources,
    );
    expect(options).toEqual([]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('respects sortBy: value', () => {
    const options = resolveOptionsSource(
      { dataSetId: 'regions', valueField: 'code', labelField: 'name', sortBy: 'value' },
      dataSources,
    );
    expect(options[0].value).toBe('AP');
    expect(options[1].value).toBe('EU');
    expect(options[2].value).toBe('NA');
  });

  it('respects sortBy: none (insertion order)', () => {
    const options = resolveOptionsSource(
      { dataSetId: 'regions', valueField: 'code', labelField: 'name', sortBy: 'none' },
      dataSources,
    );
    expect(options[0].value).toBe('NA');
    expect(options[1].value).toBe('EU');
    expect(options[2].value).toBe('AP');
  });

  it('deduplicates values', () => {
    const dsWithDupes: DataSet = {
      columns: [{ field: 'code', type: 'string' }],
      rows: [{ code: 'A' }, { code: 'B' }, { code: 'A' }, { code: 'B' }, { code: 'C' }],
    };
    const options = resolveOptionsSource(
      { dataSetId: 'dedup', valueField: 'code' },
      { dedup: dsWithDupes },
    );
    expect(options).toHaveLength(3);
  });

  it('skips null and empty values', () => {
    const dsWithNulls: DataSet = {
      columns: [{ field: 'code', type: 'string' }],
      rows: [{ code: 'A' }, { code: null }, { code: '' }, { code: 'B' }],
    };
    const options = resolveOptionsSource(
      { dataSetId: 'nulls', valueField: 'code' },
      { nulls: dsWithNulls },
    );
    expect(options).toHaveLength(2);
    expect(options.map(o => o.value)).toEqual(['A', 'B']);
  });
});

// ── resolveFieldOptions ──

describe('resolveFieldOptions', () => {
  const regionDs: DataSet = {
    columns: [
      { field: 'code', type: 'string' },
      { field: 'name', type: 'string' },
    ],
    rows: [
      { code: 'NA', name: 'North America' },
      { code: 'EU', name: 'Europe' },
    ],
  };

  it('priority 1: optionsSource > static options > data', () => {
    const field: SelectionFieldDef = {
      id: 'region', label: 'Region', type: 'chip_group',
      options: [{ value: 'X', label: 'Static X' }],
      optionsSource: { dataSetId: 'regions', valueField: 'code', labelField: 'name' },
    };
    const result = resolveFieldOptions(field, { regions: regionDs });
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Europe'); // from external, not static
  });

  it('priority 2: falls back to static options', () => {
    const field: SelectionFieldDef = {
      id: 'status', label: 'Status', type: 'chip_group',
      options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }],
    };
    const result = resolveFieldOptions(field);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe('active');
  });

  it('priority 3: falls back to deriveFromData', () => {
    const field: SelectionFieldDef = {
      id: 'dept', label: 'Dept', type: 'chip_group',
      dataField: 'dept',
    };
    const data = [{ dept: 'Eng' }, { dept: 'Sales' }, { dept: 'Eng' }];
    const result = resolveFieldOptions(field, undefined, data);
    expect(result).toHaveLength(2);
    expect(result.map(o => o.value).sort()).toEqual(['Eng', 'Sales']);
  });

  it('returns empty array when no sources available', () => {
    const field: SelectionFieldDef = {
      id: 'x', label: 'X', type: 'chip_group',
    };
    const result = resolveFieldOptions(field);
    expect(result).toEqual([]);
  });
});
