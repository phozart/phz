import { describe, it, expect } from 'vitest';
import { computePivot, pivotResultToFlatRows } from '../pivot.js';
import type { PivotConfig } from '@phozart/phz-core';

const salesData = [
  { region: 'North', product: 'Widget', amount: 100 },
  { region: 'North', product: 'Gadget', amount: 150 },
  { region: 'South', product: 'Widget', amount: 200 },
  { region: 'South', product: 'Gadget', amount: 250 },
  { region: 'North', product: 'Widget', amount: 120 },
  { region: 'South', product: 'Widget', amount: 180 },
];

describe('computePivot', () => {
  it('pivots rows by region, columns by product, summing amount', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);

    expect(result.rowHeaders).toHaveLength(2); // North, South
    expect(result.columnHeaders).toHaveLength(2); // Gadget, Widget (sorted)
    expect(result.cells).toHaveLength(2);

    // Find North row
    const northIdx = result.rowHeaders.findIndex(h => h[0] === 'North');
    const gadgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Gadget');
    const widgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Widget');

    // North + Gadget = 150
    expect(result.cells[northIdx][gadgetIdx]).toBe(150);
    // North + Widget = 100 + 120 = 220
    expect(result.cells[northIdx][widgetIdx]).toBe(220);
  });

  it('returns empty for empty rows', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot([], config);
    expect(result.rowHeaders).toHaveLength(0);
  });

  it('computes grand totals per column', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);
    // Grand totals should be sum of each product column
    expect(result.grandTotals).toHaveLength(2);
    const gadgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Gadget');
    expect(result.grandTotals[gadgetIdx]).toBe(400); // 150 + 250
  });

  it('returns null cells for missing intersections', () => {
    const data = [
      { region: 'North', product: 'Widget', amount: 100 },
      { region: 'South', product: 'Gadget', amount: 200 },
    ];
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(data, config);
    // North+Gadget and South+Widget should be null
    const northIdx = result.rowHeaders.findIndex(h => h[0] === 'North');
    const gadgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Gadget');
    expect(result.cells[northIdx][gadgetIdx]).toBe(null);
  });

  it('supports multiple value fields', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [
        { field: 'amount', aggregation: 'sum' },
        { field: 'amount', aggregation: 'count' },
      ],
    };
    const result = computePivot(salesData, config);

    const northIdx = result.rowHeaders.findIndex(h => h[0] === 'North');
    const widgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Widget');

    // North + Widget: amount sum = 100 + 120 = 220, count = 2
    const cell = result.cells[northIdx][widgetIdx];
    expect(Array.isArray(cell)).toBe(true);
    expect((cell as unknown[])[0]).toBe(220);  // sum
    expect((cell as unknown[])[1]).toBe(2);    // count
  });

  it('returns single value (not array) for single value field', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);

    const northIdx = result.rowHeaders.findIndex(h => h[0] === 'North');
    const widgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Widget');
    // Single value field: unwrap from array
    expect(result.cells[northIdx][widgetIdx]).toBe(220);
  });

  it('computes grand totals for multiple value fields', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [
        { field: 'amount', aggregation: 'sum' },
        { field: 'amount', aggregation: 'count' },
      ],
    };
    const result = computePivot(salesData, config);
    const gadgetIdx = result.columnHeaders.findIndex(h => h[0] === 'Gadget');

    // Gadget total: sum = 150 + 250 = 400, count = 2
    const grandTotal = result.grandTotals[gadgetIdx];
    expect(Array.isArray(grandTotal)).toBe(true);
    expect((grandTotal as unknown[])[0]).toBe(400);
    expect((grandTotal as unknown[])[1]).toBe(2);
  });
});

describe('pivotResultToFlatRows', () => {
  it('flattens pivot result to rows', () => {
    const config: PivotConfig = {
      rowFields: ['region'],
      columnFields: ['product'],
      valueFields: [{ field: 'amount', aggregation: 'sum' }],
    };
    const result = computePivot(salesData, config);
    const flat = pivotResultToFlatRows(result, ['region'], ['product']);
    expect(flat).toHaveLength(2);
    expect(flat[0]).toHaveProperty('region');
  });
});
