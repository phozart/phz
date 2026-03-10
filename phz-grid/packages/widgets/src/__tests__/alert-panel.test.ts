import { describe, it, expect } from 'vitest';

/**
 * Tests for KPI Alert Notification UI logic.
 * Types re-exported from engine; UI logic tested without DOM.
 */

// Alert types matching engine's kpi-alerting.ts
interface AlertNotification {
  id: string;
  ruleId: string;
  kpiId: string;
  type: 'threshold_breach' | 'anomaly_detected' | 'trend_reversal' | 'consecutive_decline';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  currentValue: number;
  acknowledged: boolean;
  snoozedUntil?: Date;
}

// Import the logic we'll create
import {
  createAlertStore,
  filterAlerts,
  computeBadgeCount,
  severityRank,
  alertTypeIcon,
} from '../components/phz-alert-panel.js';

describe('Alert Store', () => {
  function makeAlert(overrides: Partial<AlertNotification> = {}): AlertNotification {
    return {
      id: 'alert-1',
      ruleId: 'rule-1',
      kpiId: 'kpi-revenue',
      type: 'threshold_breach',
      severity: 'critical',
      message: 'Revenue dropped below threshold',
      timestamp: new Date('2026-03-01T10:00:00Z'),
      currentValue: 42,
      acknowledged: false,
      ...overrides,
    };
  }

  it('adds alerts to the store', () => {
    const store = createAlertStore();
    const alert = makeAlert();
    store.add(alert);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].id).toBe('alert-1');
  });

  it('acknowledges an alert', () => {
    const store = createAlertStore();
    store.add(makeAlert());
    store.acknowledge('alert-1');
    expect(store.getAll()[0].acknowledged).toBe(true);
  });

  it('snoozes an alert for a duration', () => {
    const store = createAlertStore();
    store.add(makeAlert());
    const until = new Date('2026-03-01T11:00:00Z');
    store.snooze('alert-1', until);
    const alert = store.getAll()[0];
    expect(alert.snoozedUntil).toEqual(until);
  });

  it('removes an alert', () => {
    const store = createAlertStore();
    store.add(makeAlert({ id: 'a1' }));
    store.add(makeAlert({ id: 'a2' }));
    store.remove('a1');
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].id).toBe('a2');
  });

  it('returns empty array when store is empty', () => {
    const store = createAlertStore();
    expect(store.getAll()).toEqual([]);
  });
});

describe('filterAlerts', () => {
  const now = new Date('2026-03-01T10:30:00Z');

  function makeAlert(overrides: Partial<AlertNotification> = {}): AlertNotification {
    return {
      id: 'alert-1',
      ruleId: 'rule-1',
      kpiId: 'kpi-revenue',
      type: 'threshold_breach',
      severity: 'critical',
      message: 'Revenue below threshold',
      timestamp: new Date('2026-03-01T10:00:00Z'),
      currentValue: 42,
      acknowledged: false,
      ...overrides,
    };
  }

  it('filters by severity', () => {
    const alerts = [
      makeAlert({ id: 'a1', severity: 'critical' }),
      makeAlert({ id: 'a2', severity: 'warning' }),
    ];
    const result = filterAlerts(alerts, { severity: 'critical' }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('filters by kpiId', () => {
    const alerts = [
      makeAlert({ id: 'a1', kpiId: 'kpi-revenue' }),
      makeAlert({ id: 'a2', kpiId: 'kpi-cost' }),
    ];
    const result = filterAlerts(alerts, { kpiId: 'kpi-revenue' }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('filters active only (not acknowledged)', () => {
    const alerts = [
      makeAlert({ id: 'a1', acknowledged: false }),
      makeAlert({ id: 'a2', acknowledged: true }),
    ];
    const result = filterAlerts(alerts, { showAcknowledged: false }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('shows both active and acknowledged', () => {
    const alerts = [
      makeAlert({ id: 'a1', acknowledged: false }),
      makeAlert({ id: 'a2', acknowledged: true }),
    ];
    const result = filterAlerts(alerts, { showAcknowledged: true }, now);
    expect(result).toHaveLength(2);
  });

  it('excludes snoozed alerts when snooze is in the future', () => {
    const alerts = [
      makeAlert({ id: 'a1' }),
      makeAlert({ id: 'a2', snoozedUntil: new Date('2026-03-01T11:00:00Z') }),
    ];
    const result = filterAlerts(alerts, {}, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('includes alerts whose snooze has expired', () => {
    const alerts = [
      makeAlert({ id: 'a1', snoozedUntil: new Date('2026-03-01T09:00:00Z') }),
    ];
    const result = filterAlerts(alerts, {}, now);
    expect(result).toHaveLength(1);
  });

  it('returns all when no filters applied', () => {
    const alerts = [
      makeAlert({ id: 'a1' }),
      makeAlert({ id: 'a2' }),
    ];
    const result = filterAlerts(alerts, {}, now);
    expect(result).toHaveLength(2);
  });
});

describe('computeBadgeCount', () => {
  function makeAlert(overrides: Partial<AlertNotification> = {}): AlertNotification {
    return {
      id: 'alert-1',
      ruleId: 'rule-1',
      kpiId: 'kpi-revenue',
      type: 'threshold_breach',
      severity: 'critical',
      message: 'test',
      timestamp: new Date(),
      currentValue: 0,
      acknowledged: false,
      ...overrides,
    };
  }

  it('counts unacknowledged, non-snoozed alerts', () => {
    const now = new Date('2026-03-01T10:00:00Z');
    const alerts = [
      makeAlert({ id: 'a1' }),
      makeAlert({ id: 'a2', acknowledged: true }),
      makeAlert({ id: 'a3', snoozedUntil: new Date('2026-03-01T12:00:00Z') }),
      makeAlert({ id: 'a4' }),
    ];
    expect(computeBadgeCount(alerts, now)).toBe(2);
  });

  it('returns 0 for empty alerts', () => {
    expect(computeBadgeCount([], new Date())).toBe(0);
  });

  it('returns highest severity among active alerts', () => {
    const now = new Date('2026-03-01T10:00:00Z');
    const alerts = [
      makeAlert({ id: 'a1', severity: 'warning' }),
      makeAlert({ id: 'a2', severity: 'critical' }),
    ];
    const count = computeBadgeCount(alerts, now);
    expect(count).toBe(2);
  });
});

describe('severityRank', () => {
  it('ranks critical higher than warning', () => {
    expect(severityRank('critical')).toBeGreaterThan(severityRank('warning'));
  });
});

describe('alertTypeIcon', () => {
  it('returns icon name for threshold_breach', () => {
    expect(alertTypeIcon('threshold_breach')).toBe('threshold');
  });

  it('returns icon name for anomaly_detected', () => {
    expect(alertTypeIcon('anomaly_detected')).toBe('anomaly');
  });

  it('returns icon name for trend_reversal', () => {
    expect(alertTypeIcon('trend_reversal')).toBe('trend');
  });

  it('returns icon name for consecutive_decline', () => {
    expect(alertTypeIcon('consecutive_decline')).toBe('decline');
  });
});
