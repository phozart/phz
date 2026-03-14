/**
 * @phozart/grid — Anomaly Detector
 *
 * Statistical anomaly detection for grid columns. Supports Z-score and IQR
 * methods. Zero external dependencies. Returns anomalies with scores and
 * reasons that can be fed into conditional formatting.
 */
import type { RowData, ColumnDefinition } from '@phozart/core';

export interface AnomalyResult {
  rowId: string | number;
  field: string;
  value: unknown;
  score: number;
  type: 'outlier' | 'missing' | 'inconsistent' | 'duplicate' | 'format';
  reason: string;
}

export interface AnomalyDetectionOptions {
  method?: 'zscore' | 'iqr' | 'auto';
  threshold?: number;
  includeNulls?: boolean;
  includeDuplicates?: boolean;
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function detectOutliersZScore(
  rows: RowData[],
  field: string,
  threshold: number,
): AnomalyResult[] {
  const numericValues: Array<{ rowId: string | number; value: number }> = [];
  for (const row of rows) {
    const v = row[field];
    if (v != null && typeof v === 'number' && !isNaN(v)) {
      numericValues.push({ rowId: row.__id, value: v });
    }
  }

  if (numericValues.length < 3) return [];

  const avg = mean(numericValues.map(v => v.value));
  const sd = stddev(numericValues.map(v => v.value), avg);
  if (sd === 0) return [];

  const anomalies: AnomalyResult[] = [];
  for (const { rowId, value } of numericValues) {
    const z = Math.abs((value - avg) / sd);
    if (z > threshold) {
      anomalies.push({
        rowId,
        field,
        value,
        score: Math.min(z / (threshold * 2), 1),
        type: 'outlier',
        reason: `Z-score ${z.toFixed(2)} exceeds threshold ${threshold} (mean: ${avg.toFixed(2)}, std: ${sd.toFixed(2)})`,
      });
    }
  }
  return anomalies;
}

function detectOutliersIQR(
  rows: RowData[],
  field: string,
  threshold: number,
): AnomalyResult[] {
  const numericValues: Array<{ rowId: string | number; value: number }> = [];
  for (const row of rows) {
    const v = row[field];
    if (v != null && typeof v === 'number' && !isNaN(v)) {
      numericValues.push({ rowId: row.__id, value: v });
    }
  }

  if (numericValues.length < 4) return [];

  const sorted = numericValues.map(v => v.value).sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  if (iqr === 0) return [];

  const lowerBound = q1 - threshold * iqr;
  const upperBound = q3 + threshold * iqr;

  const anomalies: AnomalyResult[] = [];
  for (const { rowId, value } of numericValues) {
    if (value < lowerBound || value > upperBound) {
      const distance = value < lowerBound ? (lowerBound - value) / iqr : (value - upperBound) / iqr;
      anomalies.push({
        rowId,
        field,
        value,
        score: Math.min(distance / (threshold * 2), 1),
        type: 'outlier',
        reason: `Outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}] (IQR: ${iqr.toFixed(2)})`,
      });
    }
  }
  return anomalies;
}

function detectMissingValues(rows: RowData[], field: string): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];
  for (const row of rows) {
    const v = row[field];
    if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) {
      anomalies.push({
        rowId: row.__id,
        field,
        value: v,
        score: 1,
        type: 'missing',
        reason: 'Missing or empty value',
      });
    }
  }
  return anomalies;
}

function detectDuplicates(rows: RowData[], field: string): AnomalyResult[] {
  const rowById = new Map<string | number, RowData>();
  const counts = new Map<string, Array<string | number>>();
  for (const row of rows) {
    rowById.set(row.__id, row);
    const v = row[field];
    if (v == null) continue;
    const key = String(v);
    const existing = counts.get(key) ?? [];
    existing.push(row.__id);
    counts.set(key, existing);
  }

  const anomalies: AnomalyResult[] = [];
  for (const [, rowIds] of counts) {
    if (rowIds.length > 1) {
      for (const rowId of rowIds) {
        const row = rowById.get(rowId);
        anomalies.push({
          rowId,
          field,
          value: row?.[field],
          score: 0.5,
          type: 'duplicate',
          reason: `Duplicate value (appears ${rowIds.length} times)`,
        });
      }
    }
  }
  return anomalies;
}

export function detectAnomalies(
  rows: RowData[],
  field: string,
  options: AnomalyDetectionOptions = {},
): AnomalyResult[] {
  const {
    method = 'auto',
    threshold = 2.5,
    includeNulls = true,
    includeDuplicates = false,
  } = options;

  const results: AnomalyResult[] = [];

  // Numeric outlier detection
  const firstValue = rows.find(r => r[field] != null)?.[field];
  if (typeof firstValue === 'number') {
    if (method === 'zscore') {
      results.push(...detectOutliersZScore(rows, field, threshold));
    } else if (method === 'iqr') {
      results.push(...detectOutliersIQR(rows, field, threshold));
    } else {
      // auto: use IQR for small datasets, z-score for large
      if (rows.length < 30) {
        results.push(...detectOutliersIQR(rows, field, threshold * 0.6));
      } else {
        results.push(...detectOutliersZScore(rows, field, threshold));
      }
    }
  }

  if (includeNulls) {
    results.push(...detectMissingValues(rows, field));
  }

  if (includeDuplicates) {
    results.push(...detectDuplicates(rows, field));
  }

  return results;
}

export function detectAllAnomalies(
  rows: RowData[],
  columns: ColumnDefinition[],
  options: AnomalyDetectionOptions = {},
): Map<string, AnomalyResult[]> {
  const allResults = new Map<string, AnomalyResult[]>();
  for (const col of columns) {
    const results = detectAnomalies(rows, col.field, options);
    if (results.length > 0) {
      allResults.set(col.field, results);
    }
  }
  return allResults;
}

/**
 * Builds a lookup Map from anomaly results for O(1) access by field+rowId.
 * Key format: "field:rowId"
 */
export function buildAnomalyLookup(
  anomalyMap: Map<string, AnomalyResult[]>,
): Map<string, AnomalyResult> {
  const lookup = new Map<string, AnomalyResult>();
  for (const [field, results] of anomalyMap) {
    for (const result of results) {
      lookup.set(`${field}:${result.rowId}`, result);
    }
  }
  return lookup;
}
