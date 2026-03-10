import { describe, it, expect } from 'vitest';
import {
  exportToCSV,
  escapeCSVField,
  formatClipboardData,
} from '../widget-export.js';

describe('Widget Export — CSV', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' },
    { key: 'status', label: 'Status' },
  ];

  const data = [
    { name: 'Alpha', value: 100, status: 'ok' },
    { name: 'Beta', value: 200, status: 'warn' },
    { name: 'Gamma', value: 300, status: 'crit' },
  ];

  it('generates CSV with header row', () => {
    const csv = exportToCSV(data, columns);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name,Value,Status');
  });

  it('generates correct data rows', () => {
    const csv = exportToCSV(data, columns);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Alpha,100,ok');
    expect(lines[2]).toBe('Beta,200,warn');
    expect(lines[3]).toBe('Gamma,300,crit');
  });

  it('returns only header for empty data', () => {
    const csv = exportToCSV([], columns);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Name,Value,Status');
  });

  it('handles null and undefined values', () => {
    const row = [{ name: null, value: undefined, status: '' }];
    const csv = exportToCSV(row, columns);
    const lines = csv.split('\n');
    expect(lines[1]).toBe(',,');
  });
});

describe('Widget Export — CSV escaping', () => {
  it('wraps fields containing commas in quotes', () => {
    expect(escapeCSVField('hello, world')).toBe('"hello, world"');
  });

  it('wraps fields containing double quotes and escapes them', () => {
    expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""');
  });

  it('wraps fields containing newlines', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps fields containing carriage returns', () => {
    expect(escapeCSVField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('passes through plain strings unchanged', () => {
    expect(escapeCSVField('hello')).toBe('hello');
  });

  it('converts numbers to string', () => {
    expect(escapeCSVField(42)).toBe('42');
  });

  it('converts null/undefined to empty string', () => {
    expect(escapeCSVField(null)).toBe('');
    expect(escapeCSVField(undefined)).toBe('');
  });

  it('handles boolean values', () => {
    expect(escapeCSVField(true)).toBe('true');
    expect(escapeCSVField(false)).toBe('false');
  });

  it('handles combined special characters', () => {
    expect(escapeCSVField('"hi", she said\n')).toBe('"""hi"", she said\n"');
  });
});

describe('Widget Export — Clipboard', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' },
  ];

  const data = [
    { name: 'Alpha', value: 100 },
    { name: 'Beta', value: 200 },
  ];

  it('generates tab-separated values', () => {
    const tsv = formatClipboardData(data, columns);
    const lines = tsv.split('\n');
    expect(lines[0]).toBe('Name\tValue');
    expect(lines[1]).toBe('Alpha\t100');
    expect(lines[2]).toBe('Beta\t200');
  });

  it('replaces tabs in values with spaces', () => {
    const row = [{ name: 'Hello\tWorld', value: 42 }];
    const tsv = formatClipboardData(row, columns);
    expect(tsv.split('\n')[1]).toBe('Hello World\t42');
  });

  it('replaces newlines in values with spaces', () => {
    const row = [{ name: 'Hello\nWorld', value: 42 }];
    const tsv = formatClipboardData(row, columns);
    expect(tsv.split('\n')[1]).toBe('Hello World\t42');
  });
});
