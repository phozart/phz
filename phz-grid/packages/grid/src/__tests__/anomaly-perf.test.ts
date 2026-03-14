/**
 * Sprint 2.4 — Perf 3: Anomaly detection lookup Map
 */

import { describe, it, expect } from 'vitest';
import {
  detectAnomalies,
  detectAllAnomalies,
  buildAnomalyLookup,
} from '../features/anomaly-detector.js';
import type { RowData, ColumnDefinition } from '@phozart/core';

describe('Perf 3: Anomaly detection Map lookup', () => {
  const rows: RowData[] = [
    { __id: '1', score: 100, name: 'Alice' },
    { __id: '2', score: 200, name: 'Bob' },
    { __id: '3', score: 100, name: 'Alice' },
    { __id: '4', score: 500, name: 'Dave' },
    { __id: '5', score: 100, name: 'Eve' },
  ];

  it('detectDuplicates uses Map for row lookup (no .find())', () => {
    const results = detectAnomalies(rows, 'name', {
      includeDuplicates: true,
      includeNulls: false,
    });
    const aliceDups = results.filter(r => r.value === 'Alice');
    expect(aliceDups.length).toBe(2);
    expect(aliceDups[0].type).toBe('duplicate');
  });

  it('buildAnomalyLookup creates O(1) lookup from anomaly map', () => {
    const columns: ColumnDefinition[] = [
      { field: 'score', header: 'Score', type: 'number' },
    ];
    const anomalyMap = detectAllAnomalies(rows, columns);
    const lookup = buildAnomalyLookup(anomalyMap);

    // Should be a Map
    expect(lookup).toBeInstanceOf(Map);

    // Lookup by field:rowId
    for (const [field, results] of anomalyMap) {
      for (const result of results) {
        const found = lookup.get(`${field}:${result.rowId}`);
        expect(found).toBe(result);
      }
    }
  });

  it('buildAnomalyLookup returns empty map for no anomalies', () => {
    const normalRows: RowData[] = [
      { __id: '1', score: 50 },
      { __id: '2', score: 51 },
      { __id: '3', score: 52 },
    ];
    const columns: ColumnDefinition[] = [
      { field: 'score', header: 'Score', type: 'number' },
    ];
    const anomalyMap = detectAllAnomalies(normalRows, columns, { includeNulls: false });
    const lookup = buildAnomalyLookup(anomalyMap);
    expect(lookup.size).toBe(0);
  });
});
