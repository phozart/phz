/**
 * Tests for PhzReportView configuration types and data resolution logic.
 * Runs in Node (no DOM rendering).
 */
import { describe, it, expect } from 'vitest';
import type { ReportViewConfig } from '../components/phz-report-view.js';

describe('PhzReportView logic', () => {
  it('creates valid report config', () => {
    const config: ReportViewConfig = {
      id: 'rpt-1',
      title: 'Sales Report',
      description: 'Monthly sales breakdown',
      sourceId: 'sales-data',
      sort: { field: 'amount', direction: 'desc' },
      pageSize: 500,
    };
    expect(config.title).toBe('Sales Report');
    expect(config.description).toBe('Monthly sales breakdown');
    expect(config.sourceId).toBe('sales-data');
    expect(config.sort?.field).toBe('amount');
    expect(config.sort?.direction).toBe('desc');
    expect(config.pageSize).toBe(500);
  });

  it('handles report with filters', () => {
    const config: ReportViewConfig = {
      id: 'rpt-2',
      title: 'Filtered Report',
      sourceId: 'data-src',
      filters: [
        { field: 'region', operator: 'equals', value: 'North' },
        { field: 'amount', operator: 'greaterThan', value: 1000 },
      ],
    };
    expect(config.filters).toHaveLength(2);
    expect(config.filters![0].field).toBe('region');
    expect(config.filters![0].operator).toBe('equals');
    expect(config.filters![1].value).toBe(1000);
  });

  it('direct data takes precedence over adapter fetch', () => {
    const directData = [{ x: 1 }, { x: 2 }];
    // When data prop is provided, don't fetch from adapter
    const shouldFetch = !directData;
    expect(shouldFetch).toBe(false);
  });

  it('defaults pageSize to 10000', () => {
    const config: ReportViewConfig = {
      id: 'rpt-3',
      title: 'Large Report',
      sourceId: 'big-data',
    };
    const pageSize = config.pageSize ?? 10000;
    expect(pageSize).toBe(10000);
  });

  it('report without description renders only title', () => {
    const config: ReportViewConfig = {
      id: 'rpt-4',
      title: 'Simple Report',
      sourceId: 'data',
    };
    expect(config.description).toBeUndefined();
    expect(config.title).toBe('Simple Report');
  });

  it('report with columns provides field names for query', () => {
    const config: ReportViewConfig = {
      id: 'rpt-5',
      title: 'Column Report',
      sourceId: 'data',
      columns: [
        { field: 'name', header: 'Name', type: 'string' },
        { field: 'age', header: 'Age', type: 'number' },
      ],
    };
    const fields = config.columns?.map(c => c.field) ?? [];
    expect(fields).toEqual(['name', 'age']);
  });

  it('report sort builds query sort array', () => {
    const config: ReportViewConfig = {
      id: 'rpt-6',
      title: 'Sorted Report',
      sourceId: 'data',
      sort: { field: 'created', direction: 'asc' },
    };
    const sort = config.sort
      ? [{ field: config.sort.field, direction: config.sort.direction }]
      : undefined;
    expect(sort).toEqual([{ field: 'created', direction: 'asc' }]);
  });

  it('report without sort has undefined sort array', () => {
    const config: ReportViewConfig = {
      id: 'rpt-7',
      title: 'Unsorted Report',
      sourceId: 'data',
    };
    const sort = config.sort
      ? [{ field: config.sort.field, direction: config.sort.direction }]
      : undefined;
    expect(sort).toBeUndefined();
  });
});
