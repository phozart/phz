/**
 * @phozart/engine — Enhanced Pivot Tests
 *
 * Tests for row totals, subtotals, showAs transformations, and backward compat.
 */

import { describe, it, expect } from 'vitest';
import { computePivot, applyShowValuesAs } from '../pivot.js';
import type { PivotConfig } from '@phozart/core';

const salesData = [
  { region: 'North', product: 'Widget', amount: 100 },
  { region: 'North', product: 'Gadget', amount: 150 },
  { region: 'South', product: 'Widget', amount: 200 },
  { region: 'South', product: 'Gadget', amount: 250 },
  { region: 'North', product: 'Widget', amount: 120 },
  { region: 'South', product: 'Widget', amount: 180 },
];

// Multi-level row fields for subtotal tests
const hierarchyData = [
  { region: 'North', state: 'NY', product: 'Widget', amount: 100 },
  { region: 'North', state: 'NY', product: 'Gadget', amount: 150 },
  { region: 'North', state: 'CA', product: 'Widget', amount: 80 },
  { region: 'South', state: 'TX', product: 'Widget', amount: 200 },
  { region: 'South', state: 'TX', product: 'Gadget', amount: 250 },
  { region: 'South', state: 'FL', product: 'Widget', amount: 180 },
];

describe('pivot — backward compatibility', () => {
  it('default PivotConfig produces same result shape as before', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);

    // New fields exist but have sensible defaults
    expect(result.rowTotals).toEqual([]);
    expect(result.subtotals).toEqual([]);
    // Grand totals still computed by default
    expect(result.grandTotals.length).toBeGreaterThan(0);
  });

  it('empty rows produce empty result with new fields', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot([], config);
    expect(result.rowHeaders).toEqual([]);
    expect(result.rowTotals).toEqual([]);
    expect(result.subtotals).toEqual([]);
  });
});

describe('pivot — row totals', () => {
  it('computes sum across columns for each row when showRowTotals=true', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
      showRowTotals: true,
    };
    const result = computePivot(salesData, config);

    expect(result.rowTotals).toHaveLength(2);

    const northIdx = result.rowHeaders.findIndex(h => h[0] === 'North');
    const southIdx = result.rowHeaders.findIndex(h => h[0] === 'South');

    // North: Widget(100+120) + Gadget(150) = 370
    expect(result.rowTotals[northIdx]).toBe(370);
    // South: Widget(200+180) + Gadget(250) = 630
    expect(result.rowTotals[southIdx]).toBe(630);
  });

  it('returns empty rowTotals when showRowTotals is false/undefined', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);
    expect(result.rowTotals).toEqual([]);
  });
});

describe('pivot — subtotals', () => {
  it('computes subtotals for 2-level row fields', () => {
    const config: PivotConfig = {
      rowFields: ['region', 'state'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
      showSubtotals: true,
    };
    const result = computePivot(hierarchyData, config);

    expect(result.subtotals.length).toBeGreaterThan(0);

    // Should have subtotals for North and South
    const northSubtotal = result.subtotals.find(s => s.label.includes('North'));
    const southSubtotal = result.subtotals.find(s => s.label.includes('South'));
    expect(northSubtotal).toBeDefined();
    expect(southSubtotal).toBeDefined();

    // Subtotal labels should include "Subtotal"
    expect(northSubtotal!.label).toContain('Subtotal');
    expect(southSubtotal!.label).toContain('Subtotal');

    // Subtotals should have correct depth
    expect(northSubtotal!.depth).toBe(0);
  });

  it('returns empty subtotals when showSubtotals is false', () => {
    const config: PivotConfig = {
      rowFields: ['region', 'state'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
      showSubtotals: false,
    };
    const result = computePivot(hierarchyData, config);
    expect(result.subtotals).toEqual([]);
  });

  it('returns empty subtotals when only one row field', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
      showSubtotals: true,
    };
    const result = computePivot(salesData, config);
    expect(result.subtotals).toEqual([]);
  });

  it('subtotals have row total when showRowTotals is also enabled', () => {
    const config: PivotConfig = {
      rowFields: ['region', 'state'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
      showSubtotals: true,
      showRowTotals: true,
    };
    const result = computePivot(hierarchyData, config);

    for (const subtotal of result.subtotals) {
      expect(subtotal.rowTotal).not.toBeUndefined();
    }
  });
});

describe('pivot — showGrandTotals', () => {
  it('computes grand totals when showGrandTotals is undefined (default true)', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);
    expect(result.grandTotals).toHaveLength(2);
    expect(result.grandTotals.some(v => v !== null)).toBe(true);
  });

  it('suppresses grand totals when showGrandTotals=false', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
      showGrandTotals: false,
    };
    const result = computePivot(salesData, config);
    expect(result.grandTotals).toEqual([]);
  });
});

describe('pivot — showAs transformations', () => {
  const baseConfig: PivotConfig = {
    rowFields: ['region'],
    columnFields: ['product'],
    valueFields: [{ field: 'amount', aggregation: 'sum' }],
    showRowTotals: true,
  };

  it('pct_of_grand: cells as percentage of column grand total', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'pct_of_grand' }],
    };
    const result = computePivot(salesData, config);

    // All pct_of_grand values should be between 0 and 100
    for (const row of result.cells) {
      for (const cell of row) {
        expect(typeof cell).toBe('number');
        expect(cell as number).toBeGreaterThanOrEqual(0);
        expect(cell as number).toBeLessThanOrEqual(100);
      }
    }

    // Sum of percentages in each column should be ~100
    for (let ci = 0; ci < result.columnHeaders.length; ci++) {
      const colSum = result.cells.reduce((sum, row) => sum + (row[ci] as number), 0);
      expect(colSum).toBeCloseTo(100, 5);
    }
  });

  it('pct_of_row: cells as percentage of row total', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'pct_of_row' }],
    };
    const result = computePivot(salesData, config);

    // Sum of percentages in each row should be ~100
    for (const row of result.cells) {
      const rowSum = row.reduce((sum: number, cell) => sum + (cell as number), 0);
      expect(rowSum).toBeCloseTo(100, 5);
    }
  });

  it('pct_of_column: cells as percentage of column total', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'pct_of_column' }],
    };
    const result = computePivot(salesData, config);

    // Sum of percentages in each column should be ~100
    for (let ci = 0; ci < result.columnHeaders.length; ci++) {
      const colSum = result.cells.reduce((sum, row) => sum + (row[ci] as number), 0);
      expect(colSum).toBeCloseTo(100, 5);
    }
  });

  it('running_total: cumulative sum across columns per row', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'running_total' }],
    };
    const result = computePivot(salesData, config);

    // Each row should have non-decreasing running totals
    for (const row of result.cells) {
      for (let ci = 1; ci < row.length; ci++) {
        expect(row[ci] as number).toBeGreaterThanOrEqual(row[ci - 1] as number);
      }
    }
  });

  it('rank: ranks within each column (1 = highest)', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'rank' }],
    };
    const result = computePivot(salesData, config);

    // Each column should contain ranks 1..N
    for (let ci = 0; ci < result.columnHeaders.length; ci++) {
      const ranks = result.cells.map(row => row[ci] as number).sort((a, b) => a - b);
      expect(ranks).toEqual([1, 2]);
    }
  });

  it('difference_from_previous: delta from previous row', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'difference_from_previous' }],
    };
    const result = computePivot(salesData, config);

    // First row should be 0 (no previous)
    for (const cell of result.cells[0]) {
      expect(cell).toBe(0);
    }
  });

  it('value (default): no transformation applied', () => {
    const config: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum', showAs: 'value' }],
    };
    const result = computePivot(salesData, config);

    // Should match the default (no showAs) result
    const defaultConfig: PivotConfig = {
      ...baseConfig,
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const defaultResult = computePivot(salesData, defaultConfig);

    expect(result.cells).toEqual(defaultResult.cells);
  });
});
