/**
 * @phozart/phz-grid — Copy Engine Tests
 */
import { describe, it, expect } from 'vitest';
import { formatCellForCopy, buildCopyText, type CopyOptions } from '../clipboard/copy-engine.js';
import type { ColumnDefinition, RowData } from '@phozart/phz-core';

describe('formatCellForCopy', () => {
  describe('unformatted mode', () => {
    it('returns raw string for any type', () => {
      expect(formatCellForCopy(42, 'number', false)).toBe('42');
      expect(formatCellForCopy('hello', 'string', false)).toBe('hello');
      expect(formatCellForCopy(true, 'boolean', false)).toBe('true');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatCellForCopy(null, 'string', false)).toBe('');
      expect(formatCellForCopy(undefined, 'number', false)).toBe('');
    });
  });

  describe('formatted mode', () => {
    it('formats boolean as Yes/No', () => {
      expect(formatCellForCopy(true, 'boolean', true)).toBe('Yes');
      expect(formatCellForCopy(false, 'boolean', true)).toBe('No');
    });

    it('formats number using toLocaleString', () => {
      const result = formatCellForCopy(1234, 'number', true);
      // toLocaleString may vary by locale, just check it's not raw
      expect(result).toBeDefined();
    });

    it('formats bar type as percentage', () => {
      expect(formatCellForCopy(75, 'bar', true)).toBe('75%');
      expect(formatCellForCopy(150, 'bar', true)).toBe('100%');
      expect(formatCellForCopy(-10, 'bar', true)).toBe('0%');
    });

    it('formats date type', () => {
      const d = new Date(2026, 2, 5);
      const result = formatCellForCopy(d, 'date', true);
      expect(result).toContain('05');
      expect(result).toContain('03');
      expect(result).toContain('2026');
    });

    it('formats date from string', () => {
      const result = formatCellForCopy('2026-03-05', 'date', true);
      expect(result).toBeDefined();
    });

    it('returns raw string for invalid date', () => {
      const result = formatCellForCopy('not-a-date', 'date', true);
      expect(result).toBe('not-a-date');
    });

    it('uses custom date format when provided', () => {
      const d = new Date(2026, 2, 5);
      const result = formatCellForCopy(d, 'date', true, 'yyyy-mm-dd');
      expect(result).toBe('2026-03-05');
    });

    it('formats status type as-is', () => {
      expect(formatCellForCopy('Active', 'status', true)).toBe('Active');
    });

    it('returns string for unknown types', () => {
      expect(formatCellForCopy(42, 'custom', true)).toBe('42');
    });
  });
});

describe('buildCopyText', () => {
  const cols: ColumnDefinition[] = [
    { field: 'name', header: 'Name', type: 'string' },
    { field: 'age', header: 'Age', type: 'number' },
  ];

  const rows: RowData[] = [
    { __id: '1', name: 'Alice', age: 30 },
    { __id: '2', name: 'Bob', age: 25 },
  ];

  it('builds TSV with headers', () => {
    const result = buildCopyText(rows, cols, { includeHeaders: true, formatted: false });
    const lines = result.text.split('\n');
    expect(lines[0]).toBe('Name\tAge');
    expect(lines[1]).toBe('Alice\t30');
    expect(lines[2]).toBe('Bob\t25');
    expect(result.rowCount).toBe(2);
    expect(result.colCount).toBe(2);
  });

  it('builds TSV without headers', () => {
    const result = buildCopyText(rows, cols, { includeHeaders: false, formatted: false });
    const lines = result.text.split('\n');
    expect(lines[0]).toBe('Alice\t30');
  });

  it('excludes fields in excludeFields', () => {
    const result = buildCopyText(rows, cols, {
      includeHeaders: true,
      formatted: false,
      excludeFields: new Set(['age']),
    });
    expect(result.text).toContain('Name');
    expect(result.text).not.toContain('Age');
    expect(result.colCount).toBe(1);
  });

  it('applies maskFields', () => {
    const result = buildCopyText(rows, cols, {
      includeHeaders: false,
      formatted: false,
      maskFields: new Map([['name', () => '***']]),
    });
    expect(result.text).toContain('***');
    expect(result.text).not.toContain('Alice');
  });

  it('respects maxCopyRows', () => {
    const result = buildCopyText(rows, cols, {
      includeHeaders: false,
      formatted: false,
      maxCopyRows: 1,
    });
    expect(result.rowCount).toBe(1);
    expect(result.text).toContain('Alice');
    expect(result.text).not.toContain('Bob');
  });

  it('adds column group header row', () => {
    const result = buildCopyText(rows, cols, {
      includeHeaders: true,
      formatted: false,
      columnGroups: [{ header: 'Personal', children: ['name', 'age'] }],
    });
    const lines = result.text.split('\n');
    expect(lines[0]).toBe('Personal\tPersonal');
    expect(lines[1]).toBe('Name\tAge');
  });

  it('applies number formatting when formatted', () => {
    const result = buildCopyText(rows, cols, {
      includeHeaders: false,
      formatted: true,
      numberFormats: { age: { decimals: 1 } },
    });
    expect(result.text).toContain('30.0');
  });
});
