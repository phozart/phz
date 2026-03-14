/**
 * @phozart/grid — Excel Exporter Tests
 */
import { describe, it, expect } from 'vitest';
import { exportToExcel, matchesThreshold, type ExcelExportOptions } from '../excel-exporter.js';
import type { ExportGroupRow } from '../csv-exporter.js';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/core';

// Mock GridApi
function createMockGridApi(rows: RowData[]): GridApi {
  return {
    getSortedRowModel: () => ({ rows }),
    getCoreRowModel: () => ({ rows }),
    getSelection: () => ({ rows: new Set<string>() }),
  } as unknown as GridApi;
}

const sampleColumns: ColumnDefinition[] = [
  { field: 'name', header: 'Name', type: 'string' },
  { field: 'score', header: 'Score', type: 'number' },
  { field: 'status', header: 'Status', type: 'status' as any },
];

const sampleRows: RowData[] = [
  { __id: '1', name: 'Alice', score: 90, status: 'Active' },
  { __id: '2', name: 'Bob', score: 45, status: 'Inactive' },
  { __id: '3', name: 'Charlie', score: 75, status: 'Active' },
];

// Helper: extract XML from the Blob (the sheet XML is the largest file in the ZIP)
async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

function findXmlInZip(buf: ArrayBuffer, searchStr: string): boolean {
  const bytes = new Uint8Array(buf);
  const text = new TextDecoder().decode(bytes);
  return text.includes(searchStr);
}

describe('matchesThreshold', () => {
  it('evaluates gt operator', () => {
    expect(matchesThreshold(10, 'gt', 5)).toBe(true);
    expect(matchesThreshold(5, 'gt', 10)).toBe(false);
    expect(matchesThreshold(5, 'gt', 5)).toBe(false);
  });

  it('evaluates gte operator', () => {
    expect(matchesThreshold(10, 'gte', 10)).toBe(true);
    expect(matchesThreshold(9, 'gte', 10)).toBe(false);
  });

  it('evaluates lt operator', () => {
    expect(matchesThreshold(3, 'lt', 5)).toBe(true);
    expect(matchesThreshold(5, 'lt', 5)).toBe(false);
  });

  it('evaluates lte operator', () => {
    expect(matchesThreshold(5, 'lte', 5)).toBe(true);
    expect(matchesThreshold(6, 'lte', 5)).toBe(false);
  });

  it('evaluates eq operator (numeric)', () => {
    expect(matchesThreshold(5, 'eq', 5)).toBe(true);
    expect(matchesThreshold(5, 'eq', 6)).toBe(false);
  });

  it('evaluates eq operator (string)', () => {
    expect(matchesThreshold('Active', 'eq', 'Active')).toBe(true);
    expect(matchesThreshold('Active', 'eq', 'Inactive')).toBe(false);
  });

  it('evaluates contains operator', () => {
    expect(matchesThreshold('Hello World', 'contains', 'world')).toBe(true);
    expect(matchesThreshold('Hello', 'contains', 'xyz')).toBe(false);
  });

  it('returns false for null', () => {
    expect(matchesThreshold(null, 'gt', 5)).toBe(false);
    expect(matchesThreshold(undefined, 'eq', 'x')).toBe(false);
  });
});

describe('exportToExcel', () => {
  it('returns a Blob', () => {
    const api = createMockGridApi(sampleRows);
    const blob = exportToExcel(api, sampleColumns);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('contains header text in sheet XML', async () => {
    const api = createMockGridApi(sampleRows);
    const blob = exportToExcel(api, sampleColumns);
    const buf = await blobToArrayBuffer(blob);
    expect(findXmlInZip(buf, 'Name')).toBe(true);
    expect(findXmlInZip(buf, 'Score')).toBe(true);
    expect(findXmlInZip(buf, 'Status')).toBe(true);
  });

  it('contains data values in sheet XML', async () => {
    const api = createMockGridApi(sampleRows);
    const blob = exportToExcel(api, sampleColumns);
    const buf = await blobToArrayBuffer(blob);
    expect(findXmlInZip(buf, 'Alice')).toBe(true);
    expect(findXmlInZip(buf, 'Bob')).toBe(true);
    expect(findXmlInZip(buf, '90')).toBe(true);
  });

  it('contains status color fills when includeFormatting is true', async () => {
    const api = createMockGridApi(sampleRows);
    const blob = exportToExcel(api, sampleColumns, {
      includeFormatting: true,
      statusColors: {
        active: { bg: '#22C55E', color: '#16A34A' },
        inactive: { bg: '#EF4444', color: '#A8A29E' },
      },
      columnTypes: { name: 'string', score: 'number', status: 'status' },
    });
    const buf = await blobToArrayBuffer(blob);
    // Soft neutral bg for all status cells, text colors as differentiators
    expect(findXmlInZip(buf, 'F5F5F4')).toBe(true);
    expect(findXmlInZip(buf, '16A34A')).toBe(true);
    expect(findXmlInZip(buf, 'A8A29E')).toBe(true);
  });

  it('contains bar threshold fill colors when includeFormatting is true', async () => {
    const barCols: ColumnDefinition[] = [
      { field: 'name', header: 'Name', type: 'string' },
      { field: 'progress', header: 'Progress', type: 'bar' as any },
    ];
    const barRows: RowData[] = [
      { __id: '1', name: 'Alice', progress: 90 },
      { __id: '2', name: 'Bob', progress: 40 },
    ];
    const api = createMockGridApi(barRows);
    const blob = exportToExcel(api, barCols, {
      includeFormatting: true,
      barThresholds: [
        { min: 80, color: '#22C55E' },
        { min: 50, color: '#EAB308' },
        { min: 0, color: '#EF4444' },
      ],
      columnTypes: { name: 'string', progress: 'bar' },
    });
    const buf = await blobToArrayBuffer(blob);
    // Green for 90 (>= 80), Red for 40 (>= 0 but < 50)
    expect(findXmlInZip(buf, '22C55E')).toBe(true);
    expect(findXmlInZip(buf, 'EF4444')).toBe(true);
  });

  describe('groupRows', () => {
    it('renders group header rows in sheet XML', async () => {
      const api = createMockGridApi([]);
      const groupRows: ExportGroupRow[] = [
        { type: 'group-header', label: 'Engineering (2)', depth: 0, aggregations: { score: '82' } },
        { type: 'data', data: { __id: '1', name: 'Alice', score: 90, status: 'Active' } },
        { type: 'data', data: { __id: '3', name: 'Charlie', score: 75, status: 'Active' } },
      ];
      const blob = exportToExcel(api, sampleColumns, {
        includeFormatting: true,
        groupRows,
        columnTypes: { name: 'string', score: 'number', status: 'status' },
      });
      const buf = await blobToArrayBuffer(blob);
      expect(findXmlInZip(buf, 'Engineering (2)')).toBe(true);
      expect(findXmlInZip(buf, 'Alice')).toBe(true);
      expect(findXmlInZip(buf, 'Charlie')).toBe(true);
    });

    it('applies bold+gray style to group header rows', async () => {
      const api = createMockGridApi([]);
      const groupRows: ExportGroupRow[] = [
        { type: 'group-header', label: 'Group A', depth: 0 },
      ];
      const blob = exportToExcel(api, sampleColumns, {
        includeFormatting: true,
        groupRows,
      });
      const buf = await blobToArrayBuffer(blob);
      // Bold font and gray fill should be present in styles XML
      expect(findXmlInZip(buf, '<b/>')).toBe(true);
      expect(findXmlInZip(buf, 'E5E5E5')).toBe(true);
    });
  });

  it('applies static column formatting fills', async () => {
    const api = createMockGridApi(sampleRows);
    const blob = exportToExcel(api, sampleColumns, {
      includeFormatting: true,
      columnFormatting: {
        name: { bgColor: '#FFD700' },
      },
    });
    const buf = await blobToArrayBuffer(blob);
    expect(findXmlInZip(buf, 'FFD700')).toBe(true);
  });

  it('applies color threshold rules', async () => {
    const api = createMockGridApi(sampleRows);
    const blob = exportToExcel(api, sampleColumns, {
      includeFormatting: true,
      colorThresholds: {
        score: [
          { operator: 'gte', value: 80, bgColor: '#22C55E' },
          { operator: 'lt', value: 50, bgColor: '#EF4444' },
        ],
      },
    });
    const buf = await blobToArrayBuffer(blob);
    // Alice score=90 (>=80) → green, Bob score=45 (<50) → red
    expect(findXmlInZip(buf, '22C55E')).toBe(true);
    expect(findXmlInZip(buf, 'EF4444')).toBe(true);
  });
});
