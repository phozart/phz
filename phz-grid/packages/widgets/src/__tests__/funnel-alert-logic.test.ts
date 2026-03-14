/**
 * @phozart/widgets — Funnel Chart + Alert Panel Pure Logic Tests
 */
import { describe, it, expect } from 'vitest';
import {
  computeFunnelStages,
  computeOverallConversion,
  buildFunnelAccessibleDescription,
  type FunnelDatum,
} from '../components/phz-funnel-chart.js';
import {
  severityRank,
  alertTypeIcon,
  filterAlerts,
  computeBadgeCount,
  createAlertStore,
  type AlertNotification,
  type AlertFilter,
} from '../components/phz-alert-panel.js';

// --- Funnel ---

describe('computeFunnelStages', () => {
  it('computes stages with percentages and conversion rates', () => {
    const data: FunnelDatum[] = [
      { stage: 'Visit', value: 1000 },
      { stage: 'Signup', value: 500 },
      { stage: 'Purchase', value: 100 },
    ];
    const stages = computeFunnelStages(data);
    expect(stages).toHaveLength(3);

    expect(stages[0].percentage).toBe(100);
    expect(stages[0].conversionRate).toBeNull();

    expect(stages[1].percentage).toBe(50);
    expect(stages[1].conversionRate).toBe(50);

    expect(stages[2].percentage).toBe(10);
    expect(stages[2].conversionRate).toBe(20); // 100/500 * 100
  });

  it('widthPercent is at least 5', () => {
    const data: FunnelDatum[] = [
      { stage: 'A', value: 10000 },
      { stage: 'B', value: 1 },
    ];
    const stages = computeFunnelStages(data);
    expect(stages[1].widthPercent).toBeGreaterThanOrEqual(5);
  });

  it('handles empty data', () => {
    expect(computeFunnelStages([])).toEqual([]);
  });

  it('uses custom colors when provided', () => {
    const data: FunnelDatum[] = [
      { stage: 'A', value: 100, color: '#FF0000' },
    ];
    const stages = computeFunnelStages(data);
    expect(stages[0].color).toBe('#FF0000');
  });
});

describe('computeOverallConversion', () => {
  it('computes conversion from first to last stage', () => {
    const data: FunnelDatum[] = [
      { stage: 'A', value: 200 },
      { stage: 'B', value: 100 },
      { stage: 'C', value: 50 },
    ];
    expect(computeOverallConversion(data)).toBe(25); // 50/200 * 100
  });

  it('returns 0 for single-stage data', () => {
    expect(computeOverallConversion([{ stage: 'A', value: 100 }])).toBe(0);
  });

  it('returns 0 when first value is 0', () => {
    expect(computeOverallConversion([
      { stage: 'A', value: 0 },
      { stage: 'B', value: 50 },
    ])).toBe(0);
  });
});

describe('buildFunnelAccessibleDescription', () => {
  it('describes stages with conversion rates', () => {
    const stages = computeFunnelStages([
      { stage: 'Visit', value: 1000 },
      { stage: 'Signup', value: 500 },
    ]);
    const desc = buildFunnelAccessibleDescription(stages);
    expect(desc).toContain('Stage 1 Visit');
    expect(desc).toContain('100%');
    expect(desc).toContain('Stage 2 Signup');
    expect(desc).toContain('50%');
  });
});

// --- Alert Panel ---

function makeAlert(overrides: Partial<AlertNotification> = {}): AlertNotification {
  return {
    id: 'a1',
    ruleId: 'r1',
    kpiId: 'kpi-1',
    type: 'threshold_breach',
    severity: 'critical',
    message: 'KPI exceeded threshold',
    timestamp: new Date('2026-03-05T10:00:00Z'),
    currentValue: 95,
    acknowledged: false,
    ...overrides,
  };
}

describe('severityRank', () => {
  it('ranks critical higher than warning', () => {
    expect(severityRank('critical')).toBeGreaterThan(severityRank('warning'));
  });
});

describe('alertTypeIcon', () => {
  it('returns icon string for each type', () => {
    expect(alertTypeIcon('threshold_breach')).toBe('threshold');
    expect(alertTypeIcon('anomaly_detected')).toBe('anomaly');
    expect(alertTypeIcon('trend_reversal')).toBe('trend');
    expect(alertTypeIcon('consecutive_decline')).toBe('decline');
  });
});

describe('filterAlerts', () => {
  const now = new Date('2026-03-05T12:00:00Z');

  it('filters by severity', () => {
    const alerts = [makeAlert({ severity: 'critical' }), makeAlert({ id: 'a2', severity: 'warning' })];
    const result = filterAlerts(alerts, { severity: 'critical' }, now);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('critical');
  });

  it('filters by kpiId', () => {
    const alerts = [makeAlert({ kpiId: 'kpi-1' }), makeAlert({ id: 'a2', kpiId: 'kpi-2' })];
    const result = filterAlerts(alerts, { kpiId: 'kpi-1' }, now);
    expect(result).toHaveLength(1);
  });

  it('hides acknowledged alerts when showAcknowledged is false', () => {
    const alerts = [makeAlert({ acknowledged: false }), makeAlert({ id: 'a2', acknowledged: true })];
    const result = filterAlerts(alerts, { showAcknowledged: false }, now);
    expect(result).toHaveLength(1);
  });

  it('hides snoozed alerts', () => {
    const alerts = [
      makeAlert({ snoozedUntil: new Date('2026-03-05T13:00:00Z') }),
    ];
    const result = filterAlerts(alerts, {}, now);
    expect(result).toHaveLength(0);
  });

  it('shows alert when snooze has expired', () => {
    const alerts = [
      makeAlert({ snoozedUntil: new Date('2026-03-05T11:00:00Z') }),
    ];
    const result = filterAlerts(alerts, {}, now);
    expect(result).toHaveLength(1);
  });
});

describe('computeBadgeCount', () => {
  const now = new Date('2026-03-05T12:00:00Z');

  it('counts unacknowledged, unsnoozed alerts', () => {
    const alerts = [
      makeAlert({ acknowledged: false }),
      makeAlert({ id: 'a2', acknowledged: true }),
      makeAlert({ id: 'a3', snoozedUntil: new Date('2026-03-05T13:00:00Z') }),
    ];
    expect(computeBadgeCount(alerts, now)).toBe(1);
  });
});

describe('createAlertStore', () => {
  it('adds and retrieves alerts', () => {
    const store = createAlertStore();
    store.add(makeAlert());
    expect(store.getAll()).toHaveLength(1);
  });

  it('removes alerts', () => {
    const store = createAlertStore();
    store.add(makeAlert());
    store.remove('a1');
    expect(store.getAll()).toHaveLength(0);
  });

  it('acknowledges alerts', () => {
    const store = createAlertStore();
    store.add(makeAlert());
    store.acknowledge('a1');
    expect(store.getAll()[0].acknowledged).toBe(true);
  });

  it('snoozes alerts', () => {
    const store = createAlertStore();
    store.add(makeAlert());
    const until = new Date('2026-03-06T00:00:00Z');
    store.snooze('a1', until);
    expect(store.getAll()[0].snoozedUntil).toEqual(until);
  });
});
