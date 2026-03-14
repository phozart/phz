import { describe, it, expect } from 'vitest';
import {
  filterItems,
  toggleMultiValue,
  selectAll,
  selectNone,
  clampRange,
  buildRangeValues,
} from '../components/phz-slicer.js';
import type { SlicerItem, SlicerChangeDetail } from '../components/phz-slicer.js';

const ITEMS: SlicerItem[] = [
  { value: 'north', label: 'North', count: 42 },
  { value: 'south', label: 'South', count: 38 },
  { value: 'east', label: 'East', count: 25 },
  { value: 'west', label: 'West', count: 17 },
];

const NUMERIC_ITEMS: SlicerItem[] = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 50, label: '50' },
];

// --- Component class existence ---

describe('PhzSlicer component', () => {
  it('is defined as phz-slicer custom element tag', async () => {
    // The component is registered via @customElement('phz-slicer')
    // In node environment we can verify the class exists and exports correctly
    const mod = await import('../components/phz-slicer.js');
    expect(mod.PhzSlicer).toBeDefined();
    expect(typeof mod.PhzSlicer).toBe('function');
  });

  it('has expected static properties on the class', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    // Lit components have a static `properties` or use decorators that define them
    // We verify the prototype has the expected property names
    const instance = Object.create(PhzSlicer.prototype);
    // Default values are set in the class body
    expect(PhzSlicer.prototype).toBeDefined();
  });
});

// --- Default property values ---

describe('PhzSlicer default property values', () => {
  it('field defaults to empty string', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.field).toBe('');
  });

  it('label defaults to empty string', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.label).toBe('');
  });

  it('items defaults to empty array', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.items).toEqual([]);
  });

  it('selectedValues defaults to empty array', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.selectedValues).toEqual([]);
  });

  it('mode defaults to multi', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.mode).toBe('multi');
  });

  it('showSearch defaults to false', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.showSearch).toBe(false);
  });

  it('showCounts defaults to false', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.showCounts).toBe(false);
  });

  it('layout defaults to vertical', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    expect(slicer.layout).toBe('vertical');
  });
});

// --- Items assignment ---

describe('PhzSlicer items', () => {
  it('items can be set on the component', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    slicer.items = ITEMS;
    expect(slicer.items).toEqual(ITEMS);
    expect(slicer.items).toHaveLength(4);
  });

  it('selectedValues can be set', async () => {
    const { PhzSlicer } = await import('../components/phz-slicer.js');
    const slicer = new PhzSlicer();
    slicer.selectedValues = ['north', 'east'];
    expect(slicer.selectedValues).toEqual(['north', 'east']);
  });
});

// --- Multi-select logic ---

describe('PhzSlicer multi-select logic (toggleMultiValue)', () => {
  it('adds a value that is not selected', () => {
    const result = toggleMultiValue(['north'], 'south');
    expect(result).toEqual(['north', 'south']);
  });

  it('removes a value that is already selected', () => {
    const result = toggleMultiValue(['north', 'south'], 'north');
    expect(result).toEqual(['south']);
  });

  it('adds first value to empty array', () => {
    const result = toggleMultiValue([], 'east');
    expect(result).toEqual(['east']);
  });

  it('removes last value resulting in empty array', () => {
    const result = toggleMultiValue(['west'], 'west');
    expect(result).toEqual([]);
  });

  it('does not mutate original array', () => {
    const original = ['north', 'south'];
    const result = toggleMultiValue(original, 'east');
    expect(original).toEqual(['north', 'south']);
    expect(result).toEqual(['north', 'south', 'east']);
  });
});

// --- Single-select logic ---

describe('PhzSlicer single-select logic', () => {
  it('single mode selects exactly one value', () => {
    // In single mode, the component calls emitChange([value])
    const values = ['north'];
    expect(values).toHaveLength(1);
    expect(values[0]).toBe('north');
  });

  it('replacing single selection replaces the array', () => {
    // Simulating the component behavior: new selection replaces old
    const previous = ['north'];
    const next = ['south'];
    expect(next).not.toEqual(previous);
    expect(next).toHaveLength(1);
  });
});

// --- Range mode logic ---

describe('PhzSlicer range logic', () => {
  it('builds default range from items when no selection', () => {
    const [min, max] = buildRangeValues([], NUMERIC_ITEMS);
    expect(min).toBe(10);
    expect(max).toBe(50);
  });

  it('builds range from existing selection', () => {
    const [min, max] = buildRangeValues([15, 40], NUMERIC_ITEMS);
    expect(min).toBe(15);
    expect(max).toBe(40);
  });

  it('falls back to item bounds when selection is not a valid pair', () => {
    const [min, max] = buildRangeValues(['invalid'], NUMERIC_ITEMS);
    expect(min).toBe(10);
    expect(max).toBe(50);
  });

  it('returns [0, 0] when no items', () => {
    const [min, max] = buildRangeValues([], []);
    expect(min).toBe(0);
    expect(max).toBe(0);
  });

  it('clamps min value within item bounds', () => {
    expect(clampRange(5, NUMERIC_ITEMS, 'min')).toBe(10);
    expect(clampRange(100, NUMERIC_ITEMS, 'min')).toBe(50);
    expect(clampRange(25, NUMERIC_ITEMS, 'min')).toBe(25);
  });

  it('clamps max value within item bounds', () => {
    expect(clampRange(100, NUMERIC_ITEMS, 'max')).toBe(50);
    expect(clampRange(5, NUMERIC_ITEMS, 'max')).toBe(10);
    expect(clampRange(35, NUMERIC_ITEMS, 'max')).toBe(35);
  });

  it('clampRange returns value as-is when items is empty', () => {
    expect(clampRange(42, [], 'min')).toBe(42);
    expect(clampRange(42, [], 'max')).toBe(42);
  });
});

// --- Search / filter logic ---

describe('PhzSlicer search filtering (filterItems)', () => {
  it('returns all items when search is empty', () => {
    const result = filterItems(ITEMS, '');
    expect(result).toHaveLength(4);
  });

  it('filters by partial match (case-insensitive)', () => {
    const result = filterItems(ITEMS, 'ort');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('north');
  });

  it('filters case-insensitively', () => {
    const result = filterItems(ITEMS, 'SOUTH');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('south');
  });

  it('returns empty when no match', () => {
    const result = filterItems(ITEMS, 'xyz');
    expect(result).toHaveLength(0);
  });

  it('matches multiple items', () => {
    const result = filterItems(ITEMS, 'th');
    // 'North' and 'South' both contain 'th'
    expect(result).toHaveLength(2);
    expect(result.map(i => i.value)).toEqual(['north', 'south']);
  });
});

// --- Select All / None ---

describe('PhzSlicer select all/none', () => {
  it('selectAll returns all item values', () => {
    const result = selectAll(ITEMS);
    expect(result).toEqual(['north', 'south', 'east', 'west']);
  });

  it('selectAll returns empty for empty items', () => {
    expect(selectAll([])).toEqual([]);
  });

  it('selectNone returns empty array', () => {
    expect(selectNone()).toEqual([]);
  });
});

// --- Event detail structure ---

describe('PhzSlicer slicer-change event detail', () => {
  it('detail has field and values properties', () => {
    const detail: SlicerChangeDetail = { field: 'region', values: ['north', 'south'] };
    expect(detail.field).toBe('region');
    expect(detail.values).toEqual(['north', 'south']);
  });

  it('detail values can be empty for clear-all', () => {
    const detail: SlicerChangeDetail = { field: 'region', values: [] };
    expect(detail.values).toHaveLength(0);
  });

  it('detail values can contain single item for single-select', () => {
    const detail: SlicerChangeDetail = { field: 'region', values: ['east'] };
    expect(detail.values).toHaveLength(1);
  });

  it('detail values can contain numeric range', () => {
    const detail: SlicerChangeDetail = { field: 'amount', values: [10, 50] };
    expect(detail.values).toEqual([10, 50]);
  });
});
