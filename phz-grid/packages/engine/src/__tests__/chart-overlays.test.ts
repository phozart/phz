/**
 * @phozart/phz-engine — Chart Analytics Overlays Tests
 *
 * TDD: Red → Green → Refactor
 * Tests for regression math, moving averages, alert-to-band conversion, and target resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  computeLinearRegression,
  computeMovingAverage,
  computeExponentialRegression,
  resolveTargetForCategory,
  alertRuleToThresholdBands,
  type ChartOverlay,
  type ReferenceLine,
  type TrendLine,
  type ChartThresholdBand,
  type AverageLine,
  type TargetLine,
} from '../chart-overlays.js';
import type { KPIDefinition } from '../kpi.js';
import type { AlertRule } from '../kpi-alerting.js';

// ========================================================================
// computeLinearRegression
// ========================================================================

describe('computeLinearRegression', () => {
  it('returns zero slope/intercept for empty data', () => {
    const result = computeLinearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.r2).toBe(0);
  });

  it('returns exact values for a single point', () => {
    const result = computeLinearRegression([{ x: 1, y: 5 }]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
    expect(result.r2).toBe(0);
  });

  it('computes perfect linear fit for y = 2x + 1', () => {
    const data = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = computeLinearRegression(data);
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(1, 10);
    expect(result.r2).toBeCloseTo(1, 10);
  });

  it('computes regression for noisy data with reasonable r2', () => {
    const data = [
      { x: 1, y: 2.1 },
      { x: 2, y: 3.9 },
      { x: 3, y: 6.2 },
      { x: 4, y: 7.8 },
      { x: 5, y: 10.1 },
    ];
    const result = computeLinearRegression(data);
    expect(result.slope).toBeGreaterThan(1.5);
    expect(result.slope).toBeLessThan(2.5);
    expect(result.r2).toBeGreaterThan(0.95);
  });

  it('handles all same y-values (flat line)', () => {
    const data = [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ];
    const result = computeLinearRegression(data);
    expect(result.slope).toBeCloseTo(0, 10);
    expect(result.intercept).toBeCloseTo(5, 10);
    // r2 is undefined for zero variance — we return 1 (perfect fit to constant)
    expect(result.r2).toBe(1);
  });

  it('handles negative slope', () => {
    const data = [
      { x: 0, y: 10 },
      { x: 1, y: 8 },
      { x: 2, y: 6 },
      { x: 3, y: 4 },
    ];
    const result = computeLinearRegression(data);
    expect(result.slope).toBeCloseTo(-2, 10);
    expect(result.intercept).toBeCloseTo(10, 10);
    expect(result.r2).toBeCloseTo(1, 10);
  });
});

// ========================================================================
// computeMovingAverage
// ========================================================================

describe('computeMovingAverage', () => {
  it('returns empty array for empty input', () => {
    expect(computeMovingAverage([], 3)).toEqual([]);
  });

  it('returns null for first (period-1) items', () => {
    const result = computeMovingAverage([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).not.toBeNull();
  });

  it('computes correct 3-period moving average', () => {
    const result = computeMovingAverage([2, 4, 6, 8, 10], 3);
    expect(result).toEqual([null, null, 4, 6, 8]);
  });

  it('handles period of 1 (no averaging)', () => {
    const result = computeMovingAverage([3, 7, 5], 1);
    expect(result).toEqual([3, 7, 5]);
  });

  it('handles period larger than data length', () => {
    const result = computeMovingAverage([1, 2], 5);
    expect(result).toEqual([null, null]);
  });

  it('handles period of 0 gracefully', () => {
    const result = computeMovingAverage([1, 2, 3], 0);
    // Period 0 is invalid — return all nulls
    expect(result).toEqual([null, null, null]);
  });
});

// ========================================================================
// computeExponentialRegression
// ========================================================================

describe('computeExponentialRegression', () => {
  it('returns defaults for empty data', () => {
    const result = computeExponentialRegression([]);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
    expect(result.r2).toBe(0);
  });

  it('returns defaults for single point', () => {
    const result = computeExponentialRegression([{ x: 1, y: 5 }]);
    expect(result.a).toBe(5);
    expect(result.b).toBe(0);
    expect(result.r2).toBe(0);
  });

  it('fits y = 2 * e^(0.5x) approximately', () => {
    // Generate data: y = 2 * e^(0.5x) for x = 0..4
    const data = [0, 1, 2, 3, 4].map(x => ({
      x,
      y: 2 * Math.exp(0.5 * x),
    }));
    const result = computeExponentialRegression(data);
    expect(result.a).toBeCloseTo(2, 1);
    expect(result.b).toBeCloseTo(0.5, 1);
    expect(result.r2).toBeGreaterThan(0.99);
  });

  it('skips zero and negative y-values', () => {
    const data = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 2, y: 4 },
      { x: 3, y: 8 },
    ];
    // Should only use the 2 positive y-values
    const result = computeExponentialRegression(data);
    expect(result.a).toBeGreaterThan(0);
  });

  it('returns defaults when all y-values are zero or negative', () => {
    const data = [
      { x: 0, y: 0 },
      { x: 1, y: -1 },
    ];
    const result = computeExponentialRegression(data);
    expect(result.a).toBe(0);
    expect(result.b).toBe(0);
    expect(result.r2).toBe(0);
  });
});

// ========================================================================
// resolveTargetForCategory
// ========================================================================

describe('resolveTargetForCategory', () => {
  const baseKpi: KPIDefinition = {
    id: 'kpi-1' as string,
    name: 'Test KPI',
    target: 100,
    unit: 'percent',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 70 },
    deltaComparison: 'previous_period',
    dimensions: ['region'],
    breakdowns: [
      { id: 'east', label: 'East', targetOverride: 95 },
      { id: 'west', label: 'West' },
    ],
    dataSource: { scoreEndpoint: '/api/score' },
  };

  it('returns KPI target when no categoryField matches', () => {
    expect(resolveTargetForCategory(baseKpi, 'region', 'north')).toBe(100);
  });

  it('returns breakdown targetOverride when category matches', () => {
    expect(resolveTargetForCategory(baseKpi, 'region', 'east')).toBe(95);
  });

  it('returns KPI target when breakdown has no override', () => {
    expect(resolveTargetForCategory(baseKpi, 'region', 'west')).toBe(100);
  });

  it('returns null for undefined KPI', () => {
    expect(resolveTargetForCategory(undefined, 'region', 'east')).toBeNull();
  });
});

// ========================================================================
// alertRuleToThresholdBands
// ========================================================================

describe('alertRuleToThresholdBands', () => {
  it('converts above-threshold breach to a band', () => {
    const rule: AlertRule = {
      id: 'rule-1',
      kpiId: 'kpi-1',
      type: 'threshold_breach',
      config: { operator: 'above', value: 100 },
      severity: 'warning',
    };
    const bands = alertRuleToThresholdBands(rule);
    expect(bands).toHaveLength(1);
    expect(bands[0].min).toBe(100);
    expect(bands[0].max).toBe(Infinity);
    expect(bands[0].type).toBe('threshold-band');
  });

  it('converts below-threshold breach to a band', () => {
    const rule: AlertRule = {
      id: 'rule-2',
      kpiId: 'kpi-1',
      type: 'threshold_breach',
      config: { operator: 'below', value: 50 },
      severity: 'critical',
    };
    const bands = alertRuleToThresholdBands(rule);
    expect(bands).toHaveLength(1);
    expect(bands[0].min).toBe(-Infinity);
    expect(bands[0].max).toBe(50);
  });

  it('returns empty array for non-threshold rules', () => {
    const rule: AlertRule = {
      id: 'rule-3',
      kpiId: 'kpi-1',
      type: 'anomaly_detected',
      config: { method: 'zscore', sigma: 2 },
      severity: 'warning',
    };
    expect(alertRuleToThresholdBands(rule)).toEqual([]);
  });

  it('assigns severity-based colors', () => {
    const warningRule: AlertRule = {
      id: 'rule-w',
      kpiId: 'kpi-1',
      type: 'threshold_breach',
      config: { operator: 'above', value: 80 },
      severity: 'warning',
    };
    const criticalRule: AlertRule = {
      id: 'rule-c',
      kpiId: 'kpi-1',
      type: 'threshold_breach',
      config: { operator: 'above', value: 90 },
      severity: 'critical',
    };
    const warningBands = alertRuleToThresholdBands(warningRule);
    const criticalBands = alertRuleToThresholdBands(criticalRule);
    expect(warningBands[0].fillColor).not.toBe(criticalBands[0].fillColor);
  });
});

// ========================================================================
// Type shape tests
// ========================================================================

describe('ChartOverlay types', () => {
  it('allows creating a ReferenceLine overlay', () => {
    const ref: ReferenceLine = {
      id: 'ref-1',
      type: 'reference-line',
      axis: 'y',
      value: 42,
      label: 'Target',
    };
    expect(ref.type).toBe('reference-line');
    expect(ref.axis).toBe('y');
  });

  it('allows creating a TrendLine overlay', () => {
    const trend: TrendLine = {
      id: 'trend-1',
      type: 'trend-line',
      method: 'linear',
    };
    expect(trend.method).toBe('linear');
  });

  it('allows creating a ChartThresholdBand overlay', () => {
    const band: ChartThresholdBand = {
      id: 'band-1',
      type: 'threshold-band',
      min: 0,
      max: 100,
      fillColor: '#ff0000',
      fillOpacity: 0.2,
    };
    expect(band.min).toBe(0);
    expect(band.max).toBe(100);
  });
});
