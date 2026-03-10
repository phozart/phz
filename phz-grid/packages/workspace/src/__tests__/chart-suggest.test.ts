/**
 * chart-suggest.test.ts — P.3 sub-task: suggestChartType pure function
 */
import { describe, it, expect } from 'vitest';
import { suggestChartType } from '../explore/chart-suggest.js';
import type { ExploreQuery } from '../explore-types.js';

function makeExplore(overrides: Partial<ExploreQuery> = {}): ExploreQuery {
  return {
    dimensions: [],
    measures: [],
    filters: [],
    ...overrides,
  };
}

describe('suggestChartType (P.3)', () => {
  it('returns "table" when no measures are present', () => {
    const q = makeExplore({
      dimensions: [{ field: 'region' }],
    });
    expect(suggestChartType(q)).toBe('table');
  });

  it('returns "kpi" for 0 dimensions + 1 measure', () => {
    const q = makeExplore({
      measures: [{ field: 'revenue', aggregation: 'sum' }],
    });
    expect(suggestChartType(q)).toBe('kpi');
  });

  it('returns "bar" for 1 non-date dimension + 1 measure', () => {
    const q = makeExplore({
      dimensions: [{ field: 'region' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });
    expect(suggestChartType(q)).toBe('bar');
  });

  it('returns "line" for 1 date dimension + 1 measure', () => {
    const q = makeExplore({
      dimensions: [{ field: 'order_date' }],
      measures: [{ field: 'revenue', aggregation: 'sum' }],
    });
    expect(suggestChartType(q)).toBe('line');
  });

  it('returns "line" for date-like dimension names (created_at, timestamp)', () => {
    const q1 = makeExplore({
      dimensions: [{ field: 'created_at' }],
      measures: [{ field: 'count', aggregation: 'count' }],
    });
    expect(suggestChartType(q1)).toBe('line');

    const q2 = makeExplore({
      dimensions: [{ field: 'event_timestamp' }],
      measures: [{ field: 'value', aggregation: 'avg' }],
    });
    expect(suggestChartType(q2)).toBe('line');
  });

  it('returns "stacked-bar" for 2 non-date dimensions + 1 measure', () => {
    const q = makeExplore({
      dimensions: [{ field: 'region' }, { field: 'category' }],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });
    expect(suggestChartType(q)).toBe('stacked-bar');
  });

  it('returns "grouped-bar" for 1 dimension + 2+ measures', () => {
    const q = makeExplore({
      dimensions: [{ field: 'region' }],
      measures: [
        { field: 'sales', aggregation: 'sum' },
        { field: 'profit', aggregation: 'sum' },
      ],
    });
    expect(suggestChartType(q)).toBe('grouped-bar');
  });

  it('returns "multi-line" for date dimension + 2+ measures', () => {
    const q = makeExplore({
      dimensions: [{ field: 'order_date' }],
      measures: [
        { field: 'revenue', aggregation: 'sum' },
        { field: 'cost', aggregation: 'sum' },
      ],
    });
    expect(suggestChartType(q)).toBe('multi-line');
  });

  it('returns "pie" for 1 low-card dimension + 1 measure with alias "pie"', () => {
    const q = makeExplore({
      dimensions: [{ field: 'status' }],
      measures: [{ field: 'count', aggregation: 'count' }],
    });
    // pie is not auto-suggested; bar is default for 1 dim + 1 measure
    expect(suggestChartType(q)).toBe('bar');
  });

  it('returns "table" for 3+ dimensions', () => {
    const q = makeExplore({
      dimensions: [
        { field: 'region' },
        { field: 'category' },
        { field: 'subcategory' },
      ],
      measures: [{ field: 'sales', aggregation: 'sum' }],
    });
    expect(suggestChartType(q)).toBe('table');
  });

  it('returns "table" for empty query', () => {
    const q = makeExplore();
    expect(suggestChartType(q)).toBe('table');
  });

  it('accepts optional fieldMetadata for date detection', () => {
    const q = makeExplore({
      dimensions: [{ field: 'fiscal_period' }],
      measures: [{ field: 'revenue', aggregation: 'sum' }],
    });
    // Without metadata, fiscal_period is not recognized as date
    expect(suggestChartType(q)).toBe('bar');

    // With metadata marking it as date
    expect(suggestChartType(q, {
      fieldTypes: { fiscal_period: 'date' },
    })).toBe('line');
  });
});
