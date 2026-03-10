/**
 * @phozart/phz-grid — Copy Engine Tests
 */
import { describe, it, expect } from 'vitest';
import { formatCellForCopy, buildCopyText, type CopyOptions } from '../copy-engine.js';
import type { ColumnDefinition, RowData } from '@phozart/phz-core';

// ─── formatCellForCopy ──────────────────────────────────────

describe('formatCellForCopy', () => {
  describe('unformatted (raw)', () => {
    it('returns string representation of value', () => {
      expect(formatCellForCopy('hello', 'string', false)).toBe('hello');
      expect(formatCellForCopy(42, 'number', false)).toBe('42');
      expect(formatCellForCopy(true, 'boolean', false)).toBe('true');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatCellForCopy(null, 'string', false)).toBe('');
      expect(formatCellForCopy(undefined, 'number', false)).toBe('');
    });
  });

  describe('formatted', () => {
    it('formats strings as-is', () => {
      expect(formatCellForCopy('Active', 'string', true)).toBe('Active');
      expect(formatCellForCopy('Active', 'status', true)).toBe('Active');
    });

    it('formats numbers with locale', () => {
      const result = formatCellForCopy(1234.5, 'number', true);
      // Locale-dependent, but should contain the digits
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('formats booleans as Yes/No', () => {
      expect(formatCellForCopy(true, 'boolean', true)).toBe('Yes');
      expect(formatCellForCopy(false, 'boolean', true)).toBe('No');
      expect(formatCellForCopy(0, 'boolean', true)).toBe('No');
      expect(formatCellForCopy(1, 'boolean', true)).toBe('Yes');
    });

    it('formats bar values as percentage', () => {
      expect(formatCellForCopy(75, 'bar', true)).toBe('75%');
      expect(formatCellForCopy(0, 'bar', true)).toBe('0%');
      expect(formatCellForCopy(100, 'bar', true)).toBe('100%');
    });

    it('clamps bar values to 0-100', () => {
      expect(formatCellForCopy(-10, 'bar', true)).toBe('0%');
      expect(formatCellForCopy(150, 'bar', true)).toBe('100%');
    });

    it('formats date with default format', () => {
      const d = new Date(2024, 2, 15); // March 15, 2024
      const result = formatCellForCopy(d, 'date', true);
      expect(result).toBe('15/03/2024');
    });

    it('formats datetime with default format', () => {
      const d = new Date(2024, 2, 15, 14, 30);
      const result = formatCellForCopy(d, 'datetime', true);
      expect(result).toBe('15/03/2024 14:30');
    });

    it('formats date with custom format', () => {
      const d = new Date(2024, 2, 15);
      const result = formatCellForCopy(d, 'date', true, 'yyyy-mm-dd');
      expect(result).toBe('2024-03-15');
    });

    it('handles date as ISO string', () => {
      const result = formatCellForCopy('2024-03-15T00:00:00.000Z', 'date', true, 'yyyy-mm-dd');
      expect(result).toBe('2024-03-15');
    });

    it('returns raw string for invalid date', () => {
      expect(formatCellForCopy('not-a-date', 'date', true)).toBe('not-a-date');
    });

    it('returns empty string for null', () => {
      expect(formatCellForCopy(null, 'date', true)).toBe('');
      expect(formatCellForCopy(undefined, 'number', true)).toBe('');
    });
  });
});

// ─── buildCopyText ──────────────────────────────────────────

describe('buildCopyText', () => {
  const columns: ColumnDefinition[] = [
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'age', header: 'Age', type: 'number' },
    { field: 'active', header: 'Active', type: 'boolean' as any },
  ];

  const rows: RowData[] = [
    { __id: '1', name: 'Alice', age: 30, active: true },
    { __id: '2', name: 'Bob', age: 25, active: false },
    { __id: '3', name: 'Charlie', age: 35, active: true },
  ];

  it('builds TSV without headers (unformatted)', () => {
    const result = buildCopyText(rows, columns, {
      includeHeaders: false,
      formatted: false,
    });
    expect(result.text).toBe('Alice\t30\ttrue\nBob\t25\tfalse\nCharlie\t35\ttrue');
    expect(result.rowCount).toBe(3);
    expect(result.colCount).toBe(3);
  });

  it('builds TSV with headers (unformatted)', () => {
    const result = buildCopyText(rows, columns, {
      includeHeaders: true,
      formatted: false,
    });
    const lines = result.text.split('\n');
    expect(lines[0]).toBe('Name\tAge\tActive');
    expect(lines[1]).toBe('Alice\t30\ttrue');
    expect(lines.length).toBe(4); // header + 3 rows
  });

  it('builds TSV with formatted values', () => {
    const result = buildCopyText(rows, columns, {
      includeHeaders: false,
      formatted: true,
    });
    const lines = result.text.split('\n');
    // Booleans should be Yes/No when formatted
    expect(lines[0]).toContain('Yes');
    expect(lines[1]).toContain('No');
  });

  it('handles empty data', () => {
    const result = buildCopyText([], columns, {
      includeHeaders: false,
      formatted: false,
    });
    expect(result.text).toBe('');
    expect(result.rowCount).toBe(0);
    expect(result.colCount).toBe(3);
  });

  it('handles empty data with headers', () => {
    const result = buildCopyText([], columns, {
      includeHeaders: true,
      formatted: false,
    });
    expect(result.text).toBe('Name\tAge\tActive');
    expect(result.rowCount).toBe(0);
  });

  it('handles single cell (1 row, 1 column)', () => {
    const result = buildCopyText(
      [rows[0]],
      [columns[0]],
      { includeHeaders: false, formatted: false },
    );
    expect(result.text).toBe('Alice');
    expect(result.rowCount).toBe(1);
    expect(result.colCount).toBe(1);
  });

  it('handles single row', () => {
    const result = buildCopyText(
      [rows[0]],
      columns,
      { includeHeaders: false, formatted: false },
    );
    expect(result.text).toBe('Alice\t30\ttrue');
  });

  it('uses column.header for header row, falls back to field', () => {
    const colsNoHeader: ColumnDefinition[] = [
      { field: 'name', type: 'string' },
      { field: 'age', header: 'User Age', type: 'number' },
    ];
    const result = buildCopyText(rows, colsNoHeader, {
      includeHeaders: true,
      formatted: false,
    });
    const headerLine = result.text.split('\n')[0];
    expect(headerLine).toBe('name\tUser Age');
  });

  it('uses valueGetter when present', () => {
    const colsWithGetter: ColumnDefinition[] = [
      {
        field: 'name',
        header: 'Name',
        type: 'string',
        valueGetter: (row: any) => row.name.toUpperCase(),
      },
    ];
    const result = buildCopyText(rows, colsWithGetter, {
      includeHeaders: false,
      formatted: false,
    });
    expect(result.text).toBe('ALICE\nBOB\nCHARLIE');
  });

  it('applies dateFormats per column', () => {
    const dateCols: ColumnDefinition[] = [
      { field: 'created', header: 'Created', type: 'date' as any },
    ];
    const dateRows: RowData[] = [
      { __id: '1', created: new Date(2024, 2, 15) },
    ];
    const result = buildCopyText(dateRows, dateCols, {
      includeHeaders: false,
      formatted: true,
      dateFormats: { created: 'yyyy-mm-dd' },
    });
    expect(result.text).toBe('2024-03-15');
  });

  it('applies maskFields to replace cell values', () => {
    const cols: ColumnDefinition[] = [
      { field: 'name', header: 'Name' },
      { field: 'ssn', header: 'SSN' },
    ];
    const rows: RowData[] = [
      { __id: '1', name: 'Alice', ssn: '123-45-6789' } as RowData,
      { __id: '2', name: 'Bob', ssn: '987-65-4321' } as RowData,
    ];
    const maskFn = (v: unknown) => {
      const s = String(v ?? '');
      return s.length > 4 ? '***-**-' + s.slice(-4) : '****';
    };
    const result = buildCopyText(rows, cols, {
      includeHeaders: true,
      formatted: false,
      maskFields: new Map([['ssn', maskFn]]),
    });
    expect(result.text).toContain('***-**-6789');
    expect(result.text).toContain('***-**-4321');
    expect(result.text).not.toContain('123-45-6789');
    expect(result.text).toContain('Alice');
  });
});
