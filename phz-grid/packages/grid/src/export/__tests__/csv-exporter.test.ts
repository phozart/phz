/**
 * @phozart/phz-grid — CSV Exporter Tests
 */
import { describe, it, expect } from 'vitest';
import { exportToCSV, type CsvExportOptions, type ExportGroupRow } from '../csv-exporter.js';
import type { GridApi, ColumnDefinition, RowData } from '@phozart/phz-core';

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
  { field: 'age', header: 'Age', type: 'number' },
  { field: 'active', header: 'Active', type: 'boolean' },
];

const sampleRows: RowData[] = [
  { __id: '1', name: 'Alice', age: 30, active: true },
  { __id: '2', name: 'Bob', age: 25, active: false },
  { __id: '3', name: 'Charlie', age: 35, active: true },
];

describe('exportToCSV', () => {
  it('exports basic CSV with headers', () => {
    const api = createMockGridApi(sampleRows);
    const csv = exportToCSV(api, sampleColumns);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name,Age,Active');
    expect(lines[1]).toBe('Alice,30,true');
    expect(lines[2]).toBe('Bob,25,false');
    expect(lines[3]).toBe('Charlie,35,true');
    expect(lines).toHaveLength(4);
  });

  it('exports CSV without headers', () => {
    const api = createMockGridApi(sampleRows);
    const csv = exportToCSV(api, sampleColumns, { includeHeaders: false });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Alice,30,true');
    expect(lines).toHaveLength(3);
  });

  it('uses semicolon separator', () => {
    const api = createMockGridApi(sampleRows);
    const csv = exportToCSV(api, sampleColumns, { separator: ';' });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name;Age;Active');
    expect(lines[1]).toBe('Alice;30;true');
  });

  it('escapes values containing separator', () => {
    const api = createMockGridApi([{ __id: '1', name: 'Smith, John', age: 40, active: true }]);
    const csv = exportToCSV(api, sampleColumns);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"Smith, John",40,true');
  });

  it('includes column group header row', () => {
    const api = createMockGridApi(sampleRows);
    const csv = exportToCSV(api, sampleColumns, {
      columnGroups: [{ header: 'Personal', children: ['name', 'age'] }],
    });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Personal,Personal,');
    expect(lines[1]).toBe('Name,Age,Active');
    expect(lines[2]).toBe('Alice,30,true');
  });

  describe('includeFormatting', () => {
    it('formats booleans as Yes/No', () => {
      const api = createMockGridApi(sampleRows);
      const csv = exportToCSV(api, sampleColumns, {
        includeFormatting: true,
        columnTypes: { name: 'string', age: 'number', active: 'boolean' },
      });
      const lines = csv.split('\n');
      expect(lines[1]).toContain('Yes');
      expect(lines[2]).toContain('No');
    });

    it('formats numbers with decimals', () => {
      const rows: RowData[] = [{ __id: '1', name: 'Alice', age: 30.5, active: true }];
      const api = createMockGridApi(rows);
      const csv = exportToCSV(api, sampleColumns, {
        includeFormatting: true,
        columnTypes: { name: 'string', age: 'number', active: 'boolean' },
        numberFormats: { age: { decimals: 2 } },
      });
      const lines = csv.split('\n');
      expect(lines[1]).toContain('30.50');
    });

    it('formats currency with prefix', () => {
      const cols: ColumnDefinition[] = [
        { field: 'name', header: 'Name', type: 'string' },
        { field: 'salary', header: 'Salary', type: 'number' },
      ];
      const rows: RowData[] = [{ __id: '1', name: 'Alice', salary: 50000 }];
      const api = createMockGridApi(rows);
      const csv = exportToCSV(api, cols, {
        includeFormatting: true,
        columnTypes: { name: 'string', salary: 'number' },
        numberFormats: { salary: { decimals: 0, display: 'currency' } },
      });
      const lines = csv.split('\n');
      expect(lines[1]).toContain('$50000');
    });

    it('formats percent values', () => {
      const cols: ColumnDefinition[] = [
        { field: 'name', header: 'Name', type: 'string' },
        { field: 'score', header: 'Score', type: 'number' },
      ];
      const rows: RowData[] = [{ __id: '1', name: 'Alice', score: 95 }];
      const api = createMockGridApi(rows);
      const csv = exportToCSV(api, cols, {
        includeFormatting: true,
        columnTypes: { name: 'string', score: 'number' },
        numberFormats: { score: { display: 'percent' } },
      });
      const lines = csv.split('\n');
      // Should contain the percent sign
      expect(lines[1]).toMatch(/95.*%/);
    });
  });

  describe('groupRows', () => {
    it('renders group header rows interspersed with data', () => {
      const api = createMockGridApi([]);
      const groupRows: ExportGroupRow[] = [
        { type: 'group-header', label: 'Engineering (2)', depth: 0, aggregations: { age: '32' } },
        { type: 'data', data: { __id: '1', name: 'Alice', age: 30, active: true } },
        { type: 'data', data: { __id: '3', name: 'Charlie', age: 35, active: true } },
        { type: 'group-header', label: 'Sales (1)', depth: 0, aggregations: { age: '25' } },
        { type: 'data', data: { __id: '2', name: 'Bob', age: 25, active: false } },
      ];
      const csv = exportToCSV(api, sampleColumns, { groupRows });
      const lines = csv.split('\n');
      // Header + 5 data/group rows
      expect(lines[0]).toBe('Name,Age,Active');
      expect(lines[1]).toContain('Engineering (2)');
      expect(lines[1]).toContain('32');
      expect(lines[2]).toBe('Alice,30,true');
      expect(lines[3]).toBe('Charlie,35,true');
      expect(lines[4]).toContain('Sales (1)');
      expect(lines[5]).toBe('Bob,25,false');
    });

    it('group header uses first column for label', () => {
      const api = createMockGridApi([]);
      const groupRows: ExportGroupRow[] = [
        { type: 'group-header', label: 'Group A', depth: 0, aggregations: { age: '30', active: '2' } },
      ];
      const csv = exportToCSV(api, sampleColumns, { groupRows, includeHeaders: false });
      const cells = csv.split(',');
      expect(cells[0]).toBe('Group A');
      expect(cells[1]).toBe('30');
      expect(cells[2]).toBe('2');
    });
  });

  describe('access control', () => {
    it('excludes fields in excludeFields set', () => {
      const api = createMockGridApi(sampleRows);
      const csv = exportToCSV(api, sampleColumns, {
        excludeFields: new Set(['age']),
      });
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Name,Active');
      expect(lines[1]).toBe('Alice,true');
    });

    it('applies maskFields to replace values', () => {
      const api = createMockGridApi(sampleRows);
      const csv = exportToCSV(api, sampleColumns, {
        maskFields: new Map([['name', (v: unknown) => String(v).charAt(0) + '***']]),
      });
      expect(csv).toContain('A***');
      expect(csv).toContain('B***');
      expect(csv).not.toContain('Alice');
    });

    it('combines excludeFields and maskFields', () => {
      const api = createMockGridApi(sampleRows);
      const csv = exportToCSV(api, sampleColumns, {
        excludeFields: new Set(['active']),
        maskFields: new Map([['name', () => 'REDACTED']]),
      });
      const lines = csv.split('\n');
      expect(lines[0]).toBe('Name,Age');
      expect(lines[1]).toBe('REDACTED,30');
      expect(csv).not.toContain('Active');
    });
  });
});
