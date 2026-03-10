/**
 * @phozart/phz-grid — Compact Number Formatting + CSV Formula Injection Tests
 */
import { describe, it, expect } from 'vitest';
import { formatCompactNumber, exportToCSV, type CsvExportOptions } from '../export/csv-exporter.js';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/phz-core';

describe('formatCompactNumber', () => {
  it('formats billions', () => {
    expect(formatCompactNumber(2000000000)).toBe('2B');
    expect(formatCompactNumber(1500000000)).toBe('1.5B');
  });

  it('formats millions', () => {
    expect(formatCompactNumber(1500000)).toBe('1.5M');
    expect(formatCompactNumber(5000000)).toBe('5M');
  });

  it('formats thousands', () => {
    expect(formatCompactNumber(1234)).toBe('1.2K');
    expect(formatCompactNumber(5000)).toBe('5K');
  });

  it('passes through small numbers', () => {
    expect(formatCompactNumber(999)).toBe('999');
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(42)).toBe('42');
  });

  it('handles negative numbers', () => {
    expect(formatCompactNumber(-1500000)).toBe('-1.5M');
    expect(formatCompactNumber(-5000)).toBe('-5K');
    expect(formatCompactNumber(-42)).toBe('-42');
  });

  it('removes trailing .0', () => {
    expect(formatCompactNumber(1000)).toBe('1K');
    expect(formatCompactNumber(1000000)).toBe('1M');
    expect(formatCompactNumber(1000000000)).toBe('1B');
  });
});

describe('CSV formula injection sanitization', () => {
  function createMockGridApi(rows: RowData[]): GridApi {
    return {
      getSortedRowModel: () => ({ rows }),
      getCoreRowModel: () => ({ rows }),
      getSelection: () => ({ rows: new Set<string>() }),
    } as unknown as GridApi;
  }

  const cols: ColumnDefinition[] = [
    { field: 'val', header: 'Value', type: 'string' },
  ];

  it('sanitizes formula injection with =', () => {
    const api = createMockGridApi([{ __id: '1', val: '=CMD()' }]);
    const csv = exportToCSV(api, cols);
    expect(csv).toContain("'=CMD()");
  });

  it('sanitizes formula injection with +', () => {
    const api = createMockGridApi([{ __id: '1', val: '+1+2' }]);
    const csv = exportToCSV(api, cols);
    expect(csv).toContain("'+1+2");
  });

  it('sanitizes formula injection with -', () => {
    const api = createMockGridApi([{ __id: '1', val: '-1-2' }]);
    const csv = exportToCSV(api, cols);
    expect(csv).toContain("'-1-2");
  });

  it('sanitizes formula injection with @', () => {
    const api = createMockGridApi([{ __id: '1', val: '@SUM(A1)' }]);
    const csv = exportToCSV(api, cols);
    expect(csv).toContain("'@SUM(A1)");
  });

  it('does not sanitize normal strings', () => {
    const api = createMockGridApi([{ __id: '1', val: 'hello world' }]);
    const csv = exportToCSV(api, cols);
    expect(csv).toContain('hello world');
    expect(csv).not.toContain("'hello");
  });

  it('handles DataSet metadata header', () => {
    const api = createMockGridApi([{ __id: '1', val: 'test' }]);
    const csv = exportToCSV(api, cols, {
      dataSetMeta: { source: 'TestDB', lastUpdated: '2026-03-05' },
    });
    expect(csv).toContain('Source,TestDB');
    expect(csv).toContain('Generated,2026-03-05');
  });

  it('criteria metadata takes precedence over dataSetMeta', () => {
    const api = createMockGridApi([{ __id: '1', val: 'test' }]);
    const csv = exportToCSV(api, cols, {
      criteriaMetadata: {
        label: 'Filter Summary',
        entries: [{ fieldLabel: 'Status', displayValue: 'Active' }],
        generatedAt: Date.now(),
      },
      dataSetMeta: { source: 'TestDB' },
    });
    expect(csv).toContain('Filter Summary');
    expect(csv).toContain('Status');
    expect(csv).not.toContain('Source,TestDB');
  });
});

describe('CSV compact number formatting', () => {
  function createMockGridApi(rows: RowData[]): GridApi {
    return {
      getSortedRowModel: () => ({ rows }),
      getCoreRowModel: () => ({ rows }),
      getSelection: () => ({ rows: new Set<string>() }),
    } as unknown as GridApi;
  }

  it('formats numbers compactly when compactNumbers is true', () => {
    const cols: ColumnDefinition[] = [
      { field: 'revenue', header: 'Revenue', type: 'number' },
    ];
    const rows: RowData[] = [{ __id: '1', revenue: 1500000 }];
    const api = createMockGridApi(rows);
    const csv = exportToCSV(api, cols, {
      includeFormatting: true,
      compactNumbers: true,
      columnTypes: { revenue: 'number' },
    });
    expect(csv).toContain('1.5M');
  });
});
