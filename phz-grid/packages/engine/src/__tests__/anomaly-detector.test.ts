/**
 * @phozart/engine — Anomaly Detector Tests (TDD: RED phase)
 */
import { describe, it, expect } from 'vitest';
import {
  detectAnomalies,
  detectTrendChange,
  type AnomalyConfig,
  type AnomalyResult,
  type TrendChangeResult,
} from '../anomaly-detector.js';

// --- Test Data ---

const normalSeries = [10, 12, 11, 13, 10, 12, 11, 14, 10, 13];
const seriesWithOutlier = [10, 12, 11, 13, 10, 50, 11, 14, 10, 13];
const seriesWithMultipleOutliers = [10, 12, 11, 100, 10, 50, 11, 14, 10, 13];
const trendUp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const trendReversal = [1, 2, 3, 4, 5, 4, 3, 2, 1, 0];

describe('detectAnomalies', () => {
  describe('Z-score method', () => {
    it('returns empty array when no anomalies exist', () => {
      const result = detectAnomalies(normalSeries, { method: 'zscore', sigma: 2 });
      expect(result).toEqual([]);
    });

    it('detects a single outlier', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'zscore', sigma: 2 });
      expect(result.length).toBeGreaterThanOrEqual(1);
      const outlier = result.find(r => r.index === 5);
      expect(outlier).toBeDefined();
      expect(outlier!.value).toBe(50);
      expect(['warning', 'critical']).toContain(outlier!.severity);
    });

    it('uses configurable sigma threshold', () => {
      // With very high sigma, nothing should be anomalous
      const strict = detectAnomalies(seriesWithOutlier, { method: 'zscore', sigma: 10 });
      expect(strict).toEqual([]);

      // With low sigma, more items may be flagged
      const loose = detectAnomalies(seriesWithOutlier, { method: 'zscore', sigma: 1 });
      expect(loose.length).toBeGreaterThanOrEqual(1);
    });

    it('defaults to sigma=2 when not specified', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'zscore' });
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('returns expectedValue and deviation for each anomaly', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'zscore', sigma: 2 });
      for (const r of result) {
        expect(typeof r.expectedValue).toBe('number');
        expect(typeof r.deviation).toBe('number');
        expect(r.deviation).toBeGreaterThan(0);
      }
    });

    it('classifies severity as warning or critical', () => {
      const result = detectAnomalies(seriesWithMultipleOutliers, { method: 'zscore', sigma: 2 });
      for (const r of result) {
        expect(['warning', 'critical']).toContain(r.severity);
      }
    });
  });

  describe('IQR method', () => {
    it('returns empty array when no anomalies exist', () => {
      const result = detectAnomalies(normalSeries, { method: 'iqr' });
      expect(result).toEqual([]);
    });

    it('detects outliers using IQR', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'iqr' });
      expect(result.length).toBeGreaterThanOrEqual(1);
      const outlier = result.find(r => r.index === 5);
      expect(outlier).toBeDefined();
      expect(outlier!.value).toBe(50);
    });

    it('uses 1.5x IQR multiplier by default', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'iqr' });
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('accepts custom multiplier', () => {
      const strict = detectAnomalies(seriesWithOutlier, { method: 'iqr', multiplier: 20 });
      expect(strict).toEqual([]);
    });
  });

  describe('Moving average deviation method', () => {
    it('returns empty array for stable series', () => {
      const result = detectAnomalies(normalSeries, { method: 'moving_avg', windowSize: 5, threshold: 5 });
      expect(result).toEqual([]);
    });

    it('detects spike deviating from moving average', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'moving_avg', windowSize: 3, threshold: 2 });
      expect(result.length).toBeGreaterThanOrEqual(1);
      const outlier = result.find(r => r.index === 5);
      expect(outlier).toBeDefined();
    });

    it('defaults to windowSize=5 and threshold=2', () => {
      const result = detectAnomalies(seriesWithOutlier, { method: 'moving_avg' });
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = detectAnomalies([], { method: 'zscore' });
      expect(result).toEqual([]);
    });

    it('returns empty array for single element', () => {
      const result = detectAnomalies([42], { method: 'zscore' });
      expect(result).toEqual([]);
    });

    it('returns empty array for two elements', () => {
      const result = detectAnomalies([1, 2], { method: 'zscore' });
      expect(result).toEqual([]);
    });

    it('handles all identical values', () => {
      const result = detectAnomalies([5, 5, 5, 5, 5], { method: 'zscore' });
      expect(result).toEqual([]);
    });

    it('handles null/undefined values by skipping them', () => {
      const series = [10, 12, null as unknown as number, 11, 50, 13, undefined as unknown as number, 10];
      const result = detectAnomalies(series, { method: 'zscore', sigma: 2 });
      // Should still detect the outlier at original index 4 (value=50)
      const outlier = result.find(r => r.value === 50);
      expect(outlier).toBeDefined();
    });
  });
});

describe('detectTrendChange', () => {
  it('detects no trend change in monotonically increasing series', () => {
    const result = detectTrendChange(trendUp);
    expect(result.changes).toEqual([]);
    expect(result.overallTrend).toBe('increasing');
  });

  it('detects trend reversal (up then down)', () => {
    const result = detectTrendChange(trendReversal);
    expect(result.changes.length).toBeGreaterThanOrEqual(1);
    const reversal = result.changes[0];
    expect(reversal.fromTrend).toBe('increasing');
    expect(reversal.toTrend).toBe('decreasing');
    expect(typeof reversal.index).toBe('number');
  });

  it('detects trend reversal (down then up)', () => {
    const downThenUp = [10, 8, 6, 4, 2, 4, 6, 8, 10, 12];
    const result = detectTrendChange(downThenUp);
    expect(result.changes.length).toBeGreaterThanOrEqual(1);
    expect(result.changes[0].fromTrend).toBe('decreasing');
    expect(result.changes[0].toTrend).toBe('increasing');
  });

  it('returns flat trend for constant series', () => {
    const result = detectTrendChange([5, 5, 5, 5, 5]);
    expect(result.overallTrend).toBe('flat');
  });

  it('handles empty array', () => {
    const result = detectTrendChange([]);
    expect(result.changes).toEqual([]);
    expect(result.overallTrend).toBe('flat');
  });

  it('handles single element', () => {
    const result = detectTrendChange([42]);
    expect(result.changes).toEqual([]);
    expect(result.overallTrend).toBe('flat');
  });
});
