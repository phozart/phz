import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AggregationController, type AggregationHost } from '../controllers/aggregation.controller.js';
import type { ColumnDefinition, RowData } from '@phozart/core';

function makeHost(overrides?: Partial<AggregationHost>): AggregationHost {
  return {
    filteredRows: [
      { __id: 'r1', name: 'Alice', score: 100, rating: 4.5 },
      { __id: 'r2', name: 'Bob', score: 200, rating: 3.2 },
      { __id: 'r3', name: 'Carol', score: 300, rating: 4.8 },
    ] as unknown as RowData[],
    addController: vi.fn(),
    removeController: vi.fn(),
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
    ...overrides,
  };
}

const numericCol = (field: string, header: string): ColumnDefinition =>
  ({ field, header, type: 'number' }) as ColumnDefinition;
const stringCol = (field: string, header: string): ColumnDefinition =>
  ({ field, header, type: 'string' }) as ColumnDefinition;

describe('AggregationController — computeSummaryRow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns object mapping field names to aggregated string values', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      stringCol('name', 'Name'),
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'sum',
    );
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('score');
  });

  it('with "sum" sums numeric columns', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      stringCol('name', 'Name'),
      numericCol('score', 'Score'),
      numericCol('rating', 'Rating'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'sum',
    );
    expect(result['score']).toBe('600');
    expect(result['rating']).toBe('12.5');
  });

  it('with "avg" averages numeric columns', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'avg',
    );
    expect(result['score']).toBe('200');
  });

  it('with "count" counts all columns', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      stringCol('name', 'Name'),
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'count',
    );
    // count works on all column types
    expect(result['name']).toBe('3');
    expect(result['score']).toBe('3');
  });

  it('with "min" finds minimum for numeric columns', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'min',
    );
    expect(result['score']).toBe('100');
  });

  it('with "max" finds maximum for numeric columns', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'max',
    );
    expect(result['score']).toBe('300');
  });

  it('returns empty string for non-numeric columns (except count)', () => {
    const host = makeHost();
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      stringCol('name', 'Name'),
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'sum',
    );
    expect(result['name']).toBe('');
    expect(result['score']).toBe('600');
  });

  it('handles empty rows array', () => {
    const host = makeHost({ filteredRows: [] as unknown as RowData[] });
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      stringCol('name', 'Name'),
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow([], columns, 'sum');
    expect(result['name']).toBe('');
    expect(result['score']).toBe('0');
  });

  it('handles rows with null/undefined values', () => {
    const host = makeHost({
      filteredRows: [
        { __id: 'r1', name: 'Alice', score: 100 },
        { __id: 'r2', name: null, score: null },
        { __id: 'r3', name: 'Carol', score: undefined },
        { __id: 'r4', name: 'Dave', score: 200 },
      ] as unknown as RowData[],
    });
    const ctrl = new AggregationController(host);
    const columns: ColumnDefinition[] = [
      stringCol('name', 'Name'),
      numericCol('score', 'Score'),
    ];
    const result = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'sum',
    );
    expect(result['score']).toBe('300');
    expect(result['name']).toBe('');
  });

  it('date/datetime columns return empty string for sum/avg', () => {
    const host = makeHost({
      filteredRows: [
        { __id: 'r1', name: 'Alice', created: '2024-01-15' },
        { __id: 'r2', name: 'Bob', created: '2024-06-20' },
      ] as unknown as RowData[],
    });
    const ctrl = new AggregationController(host);
    const dateCol = { field: 'created', header: 'Created', type: 'date' } as ColumnDefinition;
    const columns: ColumnDefinition[] = [stringCol('name', 'Name'), dateCol];

    const sumResult = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'sum',
    );
    expect(sumResult['created']).toBe('');

    const avgResult = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      columns,
      'avg',
    );
    expect(avgResult['created']).toBe('');
  });

  it('date/datetime columns only support count in summary', () => {
    const host = makeHost({
      filteredRows: [
        { __id: 'r1', created: '2024-01-15' },
        { __id: 'r2', created: '2024-06-20' },
      ] as unknown as RowData[],
    });
    const ctrl = new AggregationController(host);
    const dateCol = { field: 'created', header: 'Created', type: 'date' } as ColumnDefinition;

    // min/max on date strings return empty (strings can't be Number()-coerced)
    const minResult = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      [dateCol],
      'min',
    );
    expect(minResult['created']).toBe('');

    // count works on all column types
    const countResult = ctrl.computeSummaryRow(
      host.filteredRows as Record<string, unknown>[],
      [dateCol],
      'count',
    );
    expect(countResult['created']).toBe('2');
  });

  it('first cell shows function label', () => {
    expect(AggregationController.getSummaryLabel('sum')).toBe('Sum');
    expect(AggregationController.getSummaryLabel('avg')).toBe('Average');
    expect(AggregationController.getSummaryLabel('min')).toBe('Minimum');
    expect(AggregationController.getSummaryLabel('max')).toBe('Maximum');
    expect(AggregationController.getSummaryLabel('count')).toBe('Count');
    expect(AggregationController.getSummaryLabel('none')).toBe('');
  });
});
