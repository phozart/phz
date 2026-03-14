/**
 * @phozart/grid — Visual Options Tests
 *
 * Tests for grid lines, banding colors, display settings,
 * compact numbers, and export integration.
 */
import { describe, it, expect } from 'vitest';
import { formatCompactNumber, exportToCSV, type CsvExportOptions } from '../export/csv-exporter.js';
import { exportToExcel, StyleRegistry, type ExcelExportOptions } from '../export/excel-exporter.js';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/core';

function createMockGridApi(rows: RowData[]): GridApi {
  return {
    getSortedRowModel: () => ({ rows }),
    getCoreRowModel: () => ({ rows }),
    getSelection: () => ({ rows: new Set<string>() }),
  } as unknown as GridApi;
}

const numCols: ColumnDefinition[] = [
  { field: 'name', header: 'Name', type: 'string' },
  { field: 'value', header: 'Value', type: 'number' },
];

const numRows: RowData[] = [
  { __id: '1', name: 'Small', value: 500 },
  { __id: '2', name: 'Thousand', value: 1234 },
  { __id: '3', name: 'Million', value: 1500000 },
  { __id: '4', name: 'Billion', value: 2300000000 },
  { __id: '5', name: 'Negative', value: -45000 },
  { __id: '6', name: 'Zero', value: 0 },
];

// ── formatCompactNumber ──

describe('formatCompactNumber', () => {
  it('returns small numbers unchanged', () => {
    expect(formatCompactNumber(0)).toBe('0');
    expect(formatCompactNumber(500)).toBe('500');
    expect(formatCompactNumber(999)).toBe('999');
  });

  it('formats thousands as K', () => {
    expect(formatCompactNumber(1000)).toBe('1K');
    expect(formatCompactNumber(1234)).toBe('1.2K');
    expect(formatCompactNumber(9999)).toBe('10K');
  });

  it('formats millions as M', () => {
    expect(formatCompactNumber(1000000)).toBe('1M');
    expect(formatCompactNumber(1500000)).toBe('1.5M');
    expect(formatCompactNumber(2700000)).toBe('2.7M');
  });

  it('formats billions as B', () => {
    expect(formatCompactNumber(1000000000)).toBe('1B');
    expect(formatCompactNumber(2300000000)).toBe('2.3B');
  });

  it('handles negative numbers', () => {
    expect(formatCompactNumber(-1234)).toBe('-1.2K');
    expect(formatCompactNumber(-45000)).toBe('-45K');
    expect(formatCompactNumber(-2300000000)).toBe('-2.3B');
  });

  it('strips trailing .0', () => {
    expect(formatCompactNumber(1000)).toBe('1K');
    expect(formatCompactNumber(1000000)).toBe('1M');
    expect(formatCompactNumber(1000000000)).toBe('1B');
  });
});

// ── CSV compact number export ──

describe('CSV compact numbers', () => {
  it('exports compact numbers when option is set', () => {
    const api = createMockGridApi(numRows);
    const csv = exportToCSV(api, numCols, {
      includeFormatting: true,
      compactNumbers: true,
      columnTypes: { name: 'string', value: 'number' },
    });
    const lines = csv.split('\n');
    expect(lines[1]).toContain('500'); // small unchanged
    expect(lines[2]).toContain('1.2K');
    expect(lines[3]).toContain('1.5M');
    expect(lines[4]).toContain('2.3B');
    expect(lines[5]).toContain('-45K');
  });

  it('does not compact numbers when option is off', () => {
    const api = createMockGridApi(numRows);
    const csv = exportToCSV(api, numCols, {
      includeFormatting: true,
      compactNumbers: false,
      columnTypes: { name: 'string', value: 'number' },
    });
    const lines = csv.split('\n');
    // Without compact, large numbers are formatted with locale (may have commas)
    expect(lines[3]).not.toContain('1.5M');
    expect(lines[3]).toContain('1,500,000');
  });
});

// ── Excel border XML generation ──

async function blobToText(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  return new TextDecoder().decode(new Uint8Array(buf));
}

describe('Excel border support', () => {
  it('StyleRegistry generates border XML', () => {
    const registry = new StyleRegistry();
    const borderId = registry.getOrCreateBorderId({
      bottom: { style: 'thin', color: '#E7E5E4' },
    });
    expect(borderId).toBe(1);

    const styleIdx = registry.getOrCreateStyleIndex({ borderId });
    expect(styleIdx).toBeGreaterThanOrEqual(2);

    const xml = registry.buildStylesXml();
    expect(xml).toContain('<borders count="2">');
    expect(xml).toContain('style="thin"');
    expect(xml).toContain('E7E5E4');
    expect(xml).toContain('applyBorder="1"');
  });

  it('generates horizontal borders for gridLines=horizontal', async () => {
    const api = createMockGridApi(numRows.slice(0, 2));
    const blob = exportToExcel(api, numCols, {
      includeFormatting: true,
      gridLines: 'horizontal',
      gridLineColor: '#D6D3D1',
    });
    const text = await blobToText(blob);
    expect(text).toContain('D6D3D1');
    expect(text).toContain('<bottom');
  });

  it('generates vertical borders for gridLines=vertical', async () => {
    const api = createMockGridApi(numRows.slice(0, 2));
    const blob = exportToExcel(api, numCols, {
      includeFormatting: true,
      gridLines: 'vertical',
      gridLineColor: '#AABBCC',
    });
    const text = await blobToText(blob);
    expect(text).toContain('AABBCC');
    expect(text).toContain('<right');
  });

  it('no border XML when gridLines=none', async () => {
    const api = createMockGridApi(numRows.slice(0, 2));
    const blob = exportToExcel(api, numCols, {
      includeFormatting: true,
      gridLines: 'none',
    });
    const text = await blobToText(blob);
    expect(text).toContain('<borders count="1">');
  });
});

// ── Excel compact numbers ──

describe('Excel compact numbers', () => {
  it('renders compact numbers as text in XLSX', async () => {
    const api = createMockGridApi(numRows.slice(2, 4)); // Million + Billion
    const blob = exportToExcel(api, numCols, {
      includeFormatting: true,
      compactNumbers: true,
    });
    const text = await blobToText(blob);
    expect(text).toContain('1.5M');
    expect(text).toContain('2.3B');
  });
});
