import { describe, it, expect } from 'vitest';
import type { KPIDefinition } from '@phozart/engine';
import { kpiId, computeStatus, computeDelta } from '@phozart/engine';

// Test the logic used by the KPI card (no DOM in vitest)

function makeKPI(): KPIDefinition {
  return {
    id: kpiId('attendance'),
    name: 'Attendance',
    target: 95,
    unit: 'percent',
    direction: 'higher_is_better',
    thresholds: { ok: 90, warn: 75 },
    deltaComparison: 'previous_period',
    dimensions: [],
    dataSource: { scoreEndpoint: '/api/kpi/attendance' },
  };
}

describe('KPI Card logic', () => {
  it('computes status for above-ok value', () => {
    const status = computeStatus(92, makeKPI());
    expect(status.level).toBe('ok');
    expect(status.color).toBe('#16A34A');
  });

  it('computes status for warn value', () => {
    const status = computeStatus(80, makeKPI());
    expect(status.level).toBe('warn');
  });

  it('computes status for critical value', () => {
    const status = computeStatus(60, makeKPI());
    expect(status.level).toBe('crit');
  });

  it('computes improving delta', () => {
    const delta = computeDelta(92, 88, makeKPI());
    expect(delta.direction).toBe('improving');
    expect(delta.value).toBe(4);
    expect(delta.unit).toBe('pp');
  });

  it('computes declining delta', () => {
    const delta = computeDelta(85, 90, makeKPI());
    expect(delta.direction).toBe('declining');
    expect(delta.value).toBe(-5);
  });

  it('handles null value gracefully', () => {
    const status = computeStatus(null, makeKPI());
    expect(status.level).toBe('unknown');
  });

  it('formats percent values', () => {
    const kpi = makeKPI();
    // Simulate the card's formatValue logic
    const val = 92.5;
    const formatted = kpi.unit === 'percent' ? `${val.toFixed(1)}%` : String(val);
    expect(formatted).toBe('92.5%');
  });
});
