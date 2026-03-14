/**
 * @phozart/widgets -- Widget Export Pure Logic Tests
 *
 * Tests for CSV generation, clipboard formatting, and CSV field escaping.
 * These are pure functions with no DOM dependencies.
 */
import { describe, it, expect } from 'vitest';
import {
  escapeCSVField,
  exportToCSV,
  formatClipboardData,
  type ExportColumn,
} from '../widget-export.js';

describe('escapeCSVField', () => {
  it('returns empty string for null', () => {
    expect(escapeCSVField(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeCSVField(undefined)).toBe('');
  });

  it('returns plain string for simple value', () => {
    expect(escapeCSVField('hello')).toBe('hello');
  });

  it('wraps value containing comma in double quotes', () => {
    expect(escapeCSVField('hello, world')).toBe('"hello, world"');
  });

  it('wraps value containing newline in double quotes', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps value containing carriage return', () => {
    expect(escapeCSVField('line1\rline2')).toBe('"line1\rline2"');
  });

  it('escapes double quotes by doubling them', () => {
    expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""');
  });

  it('converts number to string', () => {
    expect(escapeCSVField(42)).toBe('42');
  });

  it('converts boolean to string', () => {
    expect(escapeCSVField(true)).toBe('true');
  });

  it('handles zero value', () => {
    expect(escapeCSVField(0)).toBe('0');
  });

  it('handles empty string (no wrapping needed)', () => {
    expect(escapeCSVField('')).toBe('');
  });
});

describe('exportToCSV', () => {
  const columns: ExportColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'score', label: 'Score' },
  ];

  const data = [
    { name: 'Alice', score: 95 },
    { name: 'Bob', score: 87 },
    { name: 'Charlie', score: 92 },
  ];

  it('generates header row from column labels', () => {
    const csv = exportToCSV(data, columns);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name,Score');
  });

  it('generates data rows', () => {
    const csv = exportToCSV(data, columns);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // header + 3 rows
    expect(lines[1]).toBe('Alice,95');
    expect(lines[2]).toBe('Bob,87');
    expect(lines[3]).toBe('Charlie,92');
  });

  it('escapes fields with commas', () => {
    const dataWithComma = [{ name: 'Doe, John', score: 100 }];
    const csv = exportToCSV(dataWithComma, columns);
    expect(csv).toContain('"Doe, John"');
  });

  it('returns CSV string even without filename', () => {
    const csv = exportToCSV(data, columns);
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('handles empty data', () => {
    const csv = exportToCSV([], columns);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // just the header
    expect(lines[0]).toBe('Name,Score');
  });

  it('handles empty columns', () => {
    const csv = exportToCSV(data, []);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('');
  });

  it('handles null values in data', () => {
    const dataWithNull = [{ name: null, score: 100 }];
    const csv = exportToCSV(dataWithNull as any, columns);
    expect(csv).toContain(',100');
  });

  it('handles undefined values in data', () => {
    const dataWithUndefined = [{ name: 'Alice' }] as any;
    const csv = exportToCSV(dataWithUndefined, columns);
    expect(csv).toContain('Alice,');
  });
});

describe('formatClipboardData', () => {
  const columns: ExportColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' },
  ];

  const data = [
    { name: 'Item A', value: 100 },
    { name: 'Item B', value: 200 },
  ];

  it('uses tab-separated values', () => {
    const tsv = formatClipboardData(data, columns);
    const lines = tsv.split('\n');
    expect(lines[0]).toBe('Name\tValue');
    expect(lines[1]).toBe('Item A\t100');
  });

  it('sanitizes tabs in values', () => {
    const dataWithTab = [{ name: 'A\tB', value: 100 }];
    const tsv = formatClipboardData(dataWithTab, columns);
    expect(tsv).not.toContain('A\tB'); // tab should be replaced
    expect(tsv).toContain('A B'); // replaced with space
  });

  it('sanitizes newlines in values', () => {
    const dataWithNewline = [{ name: 'A\nB', value: 100 }];
    const tsv = formatClipboardData(dataWithNewline, columns);
    expect(tsv.split('\n')[1]).not.toContain('A\nB');
  });

  it('handles null and undefined values', () => {
    const dataWithNull = [{ name: null, value: undefined }];
    const tsv = formatClipboardData(dataWithNull as any, columns);
    const lines = tsv.split('\n');
    expect(lines[1]).toBe('\t');
  });

  it('handles empty data', () => {
    const tsv = formatClipboardData([], columns);
    const lines = tsv.split('\n');
    expect(lines).toHaveLength(1); // just header
  });
});
