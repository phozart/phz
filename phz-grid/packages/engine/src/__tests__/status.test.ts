import { describe, it, expect } from 'vitest';
import { computeStatus, computeDelta, classifyKPIScore, STATUS_COLORS } from '../status.js';
import type { KPIDefinition, KPIScoreResponse } from '../kpi.js';
import { kpiId } from '../types.js';

const higherIsBetter: KPIDefinition = {
  id: kpiId('attendance'),
  name: 'Attendance',
  target: 95,
  unit: 'percent',
  direction: 'higher_is_better',
  thresholds: { ok: 90, warn: 75 },
  deltaComparison: 'previous_period',
  dimensions: ['region'],
  dataSource: { scoreEndpoint: '/api/kpi/attendance' },
};

const lowerIsBetter: KPIDefinition = {
  id: kpiId('defect-rate'),
  name: 'Defect Rate',
  target: 2,
  unit: 'percent',
  direction: 'lower_is_better',
  thresholds: { ok: 5, warn: 10 },
  deltaComparison: 'previous_period',
  dimensions: [],
  dataSource: { scoreEndpoint: '/api/kpi/defect-rate' },
};

describe('computeStatus — higher_is_better', () => {
  it('returns ok when value >= ok threshold', () => {
    expect(computeStatus(95, higherIsBetter).level).toBe('ok');
    expect(computeStatus(90, higherIsBetter).level).toBe('ok');
  });

  it('returns warn when value >= warn but < ok', () => {
    expect(computeStatus(85, higherIsBetter).level).toBe('warn');
    expect(computeStatus(75, higherIsBetter).level).toBe('warn');
  });

  it('returns crit when value < warn', () => {
    expect(computeStatus(70, higherIsBetter).level).toBe('crit');
    expect(computeStatus(0, higherIsBetter).level).toBe('crit');
  });

  it('returns correct color', () => {
    expect(computeStatus(95, higherIsBetter).color).toBe(STATUS_COLORS.ok);
    expect(computeStatus(80, higherIsBetter).color).toBe(STATUS_COLORS.warn);
    expect(computeStatus(50, higherIsBetter).color).toBe(STATUS_COLORS.crit);
  });

  it('returns correct icon', () => {
    expect(computeStatus(95, higherIsBetter).icon).toBe('circle');
    expect(computeStatus(80, higherIsBetter).icon).toBe('diamond');
    expect(computeStatus(50, higherIsBetter).icon).toBe('triangle');
  });
});

describe('computeStatus — lower_is_better', () => {
  it('returns ok when value <= ok threshold', () => {
    expect(computeStatus(3, lowerIsBetter).level).toBe('ok');
    expect(computeStatus(5, lowerIsBetter).level).toBe('ok');
  });

  it('returns warn when value <= warn but > ok', () => {
    expect(computeStatus(7, lowerIsBetter).level).toBe('warn');
    expect(computeStatus(10, lowerIsBetter).level).toBe('warn');
  });

  it('returns crit when value > warn', () => {
    expect(computeStatus(15, lowerIsBetter).level).toBe('crit');
  });
});

describe('computeStatus — edge cases', () => {
  it('returns unknown for null', () => {
    expect(computeStatus(null, higherIsBetter).level).toBe('unknown');
  });

  it('returns unknown for undefined', () => {
    expect(computeStatus(undefined, higherIsBetter).level).toBe('unknown');
  });

  it('returns unknown for NaN', () => {
    expect(computeStatus(NaN, higherIsBetter).level).toBe('unknown');
  });
});

describe('computeDelta', () => {
  it('detects improving delta (higher_is_better, positive diff)', () => {
    const delta = computeDelta(92, 88, higherIsBetter);
    expect(delta.value).toBe(4);
    expect(delta.direction).toBe('improving');
    expect(delta.unit).toBe('pp');
  });

  it('detects declining delta (higher_is_better, negative diff)', () => {
    const delta = computeDelta(85, 90, higherIsBetter);
    expect(delta.value).toBe(-5);
    expect(delta.direction).toBe('declining');
  });

  it('detects improving delta (lower_is_better, negative diff)', () => {
    const delta = computeDelta(3, 5, lowerIsBetter);
    expect(delta.value).toBe(-2);
    expect(delta.direction).toBe('improving');
  });

  it('detects declining delta (lower_is_better, positive diff)', () => {
    const delta = computeDelta(8, 5, lowerIsBetter);
    expect(delta.value).toBe(3);
    expect(delta.direction).toBe('declining');
  });

  it('zero diff is improving', () => {
    const delta = computeDelta(90, 90, higherIsBetter);
    expect(delta.value).toBe(0);
    expect(delta.direction).toBe('improving');
  });
});

describe('classifyKPIScore', () => {
  it('classifies overall score with status and delta', () => {
    const score: KPIScoreResponse = {
      kpiId: kpiId('attendance'),
      value: 92,
      previousValue: 88,
    };
    const result = classifyKPIScore(score, higherIsBetter);
    expect(result.status.level).toBe('ok');
    expect(result.delta?.direction).toBe('improving');
    expect(result.delta?.value).toBe(4);
  });

  it('classifies breakdowns with per-breakdown overrides', () => {
    const kpiWithBreakdowns: KPIDefinition = {
      ...higherIsBetter,
      breakdowns: [
        { id: 'north', label: 'North', thresholdOverrides: { ok: 95 } },
        { id: 'south', label: 'South' },
      ],
    };
    const score: KPIScoreResponse = {
      kpiId: kpiId('attendance'),
      value: 92,
      breakdowns: [
        { breakdownId: 'north', value: 92 },
        { breakdownId: 'south', value: 92 },
      ],
    };
    const result = classifyKPIScore(score, kpiWithBreakdowns);
    // North has ok threshold 95, so 92 is warn
    expect(result.breakdowns?.[0].status.level).toBe('warn');
    // South uses default ok threshold 90, so 92 is ok
    expect(result.breakdowns?.[1].status.level).toBe('ok');
  });
});
