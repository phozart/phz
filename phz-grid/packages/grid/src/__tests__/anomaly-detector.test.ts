/**
 * @phozart/phz-grid — Anomaly Detector Tests
 */
import { describe, it, expect } from 'vitest';
import { detectAnomalies, detectAllAnomalies, buildAnomalyLookup } from '../features/anomaly-detector.js';
import type { RowData, ColumnDefinition } from '@phozart/phz-core';

function makeRows(values: (number | null | undefined | string)[]): RowData[] {
  return values.map((v, i) => ({ __id: String(i), value: v }));
}

describe('detectAnomalies', () => {
  describe('z-score method', () => {
    it('detects outliers using z-score', () => {
      // 10 normal values + 1 extreme outlier
      const rows = makeRows([10, 12, 11, 13, 10, 11, 12, 10, 11, 12, 100]);
      const results = detectAnomalies(rows, 'value', { method: 'zscore', threshold: 2 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.value === 100)).toBe(true);
      expect(results[0].type).toBe('outlier');
      expect(results[0].reason).toContain('Z-score');
    });

    it('returns empty for uniform data', () => {
      const rows = makeRows([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
      const results = detectAnomalies(rows, 'value', { method: 'zscore' });
      expect(results).toHaveLength(0);
    });

    it('returns empty for less than 3 values', () => {
      const rows = makeRows([1, 2]);
      const results = detectAnomalies(rows, 'value', { method: 'zscore' });
      expect(results).toHaveLength(0);
    });
  });

  describe('IQR method', () => {
    it('detects outliers using IQR', () => {
      const rows = makeRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]);
      const results = detectAnomalies(rows, 'value', { method: 'iqr', threshold: 1.5 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.value === 100)).toBe(true);
      expect(results[0].reason).toContain('IQR');
    });

    it('returns empty for less than 4 values', () => {
      const rows = makeRows([1, 2, 3]);
      const results = detectAnomalies(rows, 'value', { method: 'iqr' });
      expect(results).toHaveLength(0);
    });

    it('returns empty for uniform data', () => {
      const rows = makeRows([5, 5, 5, 5, 5, 5, 5, 5]);
      const results = detectAnomalies(rows, 'value', { method: 'iqr' });
      expect(results).toHaveLength(0);
    });
  });

  describe('auto method', () => {
    it('uses IQR for small datasets (< 30 rows)', () => {
      const rows = makeRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]);
      const results = detectAnomalies(rows, 'value', { method: 'auto', threshold: 2.5 });
      expect(results.some(r => r.reason.includes('IQR'))).toBe(true);
    });

    it('uses z-score for large datasets (>= 30 rows)', () => {
      const values = Array.from({ length: 35 }, (_, i) => i + 1);
      values.push(1000); // outlier
      const rows = makeRows(values);
      const results = detectAnomalies(rows, 'value', { method: 'auto', threshold: 2.5 });
      expect(results.some(r => r.reason.includes('Z-score'))).toBe(true);
    });
  });

  describe('missing value detection', () => {
    it('detects null values', () => {
      const rows = makeRows([1, null, 3, undefined, 5]);
      const results = detectAnomalies(rows, 'value', { includeNulls: true });
      const missing = results.filter(r => r.type === 'missing');
      expect(missing).toHaveLength(2);
    });

    it('detects empty string values', () => {
      const rows = makeRows([1, '', 3]);
      const results = detectAnomalies(rows, 'value', { includeNulls: true });
      const missing = results.filter(r => r.type === 'missing');
      expect(missing).toHaveLength(1);
    });

    it('skips missing detection when includeNulls is false', () => {
      const rows = makeRows([1, null, 3]);
      const results = detectAnomalies(rows, 'value', { includeNulls: false });
      const missing = results.filter(r => r.type === 'missing');
      expect(missing).toHaveLength(0);
    });
  });

  describe('duplicate detection', () => {
    it('detects duplicates when enabled', () => {
      const rows = makeRows([1, 2, 3, 2, 5]);
      const results = detectAnomalies(rows, 'value', { includeDuplicates: true, includeNulls: false });
      const dupes = results.filter(r => r.type === 'duplicate');
      expect(dupes).toHaveLength(2); // Both '2' values flagged
      expect(dupes[0].reason).toContain('Duplicate');
    });

    it('does not detect duplicates by default', () => {
      const rows = makeRows([1, 2, 3, 2, 5]);
      const results = detectAnomalies(rows, 'value', { includeNulls: false });
      const dupes = results.filter(r => r.type === 'duplicate');
      expect(dupes).toHaveLength(0);
    });
  });

  describe('non-numeric fields', () => {
    it('skips outlier detection for string fields', () => {
      const rows: RowData[] = [
        { __id: '1', value: 'hello' },
        { __id: '2', value: 'world' },
        { __id: '3', value: 'test' },
      ];
      const results = detectAnomalies(rows, 'value', { includeNulls: false });
      expect(results.filter(r => r.type === 'outlier')).toHaveLength(0);
    });
  });
});

describe('detectAllAnomalies', () => {
  it('detects anomalies across multiple columns', () => {
    const rows: RowData[] = [
      { __id: '1', score: 10, name: null },
      { __id: '2', score: 11, name: 'Bob' },
      { __id: '3', score: 12, name: 'Charlie' },
      { __id: '4', score: 100, name: '' },
    ];
    const cols: ColumnDefinition[] = [
      { field: 'score', header: 'Score', type: 'number' },
      { field: 'name', header: 'Name', type: 'string' },
    ];
    const result = detectAllAnomalies(rows, cols);
    expect(result.size).toBeGreaterThan(0);
    // 'name' should have missing values
    expect(result.has('name')).toBe(true);
  });
});

describe('buildAnomalyLookup', () => {
  it('creates lookup map with field:rowId keys', () => {
    const anomalyMap = new Map([
      ['score', [
        { rowId: '1', field: 'score', value: 100, score: 0.8, type: 'outlier' as const, reason: 'test' },
        { rowId: '3', field: 'score', value: -5, score: 0.6, type: 'outlier' as const, reason: 'test' },
      ]],
    ]);
    const lookup = buildAnomalyLookup(anomalyMap);
    expect(lookup.get('score:1')?.value).toBe(100);
    expect(lookup.get('score:3')?.value).toBe(-5);
    expect(lookup.has('score:2')).toBe(false);
  });
});
