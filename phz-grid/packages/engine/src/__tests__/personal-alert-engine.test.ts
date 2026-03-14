/**
 * Tests for Personal Alert Engine (C-2.03)
 */
import { describe, it, expect } from 'vitest';
import {
  evaluateAlert,
  evaluateAllAlerts,
  shouldNotify,
  formatAlertMessage,
} from '../alerts/personal-alert-engine.js';
import type { PersonalAlert, PersonalAlertPreference } from '@phozart/shared/types';

// --- Test helpers ---

function makeAlert(overrides?: Partial<PersonalAlert>): PersonalAlert {
  return {
    id: 'alert_1',
    userId: 'user_1',
    name: 'Test Alert',
    alertRuleId: 'rule_1',
    channels: ['in-app'],
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makePreference(overrides?: Partial<PersonalAlertPreference>): PersonalAlertPreference {
  return {
    alertRuleId: 'rule_1',
    userId: 'user_1',
    channels: ['in-app'],
    ...overrides,
  };
}

describe('evaluateAlert', () => {
  it('triggers when value exceeds default threshold (100)', () => {
    const alert = makeAlert();
    const result = evaluateAlert(alert, 150);
    expect(result.triggered).toBe(true);
    expect(result.currentValue).toBe(150);
    expect(result.thresholdValue).toBe(100);
  });

  it('does not trigger when value is below threshold', () => {
    const alert = makeAlert();
    const result = evaluateAlert(alert, 50);
    expect(result.triggered).toBe(false);
  });

  it('triggers at exactly the threshold value', () => {
    const alert = makeAlert();
    const result = evaluateAlert(alert, 100);
    expect(result.triggered).toBe(true);
  });

  it('extracts threshold from description', () => {
    const alert = makeAlert({ description: 'Monitor when threshold: 75 is breached' });
    const result = evaluateAlert(alert, 80);
    expect(result.triggered).toBe(true);
    expect(result.thresholdValue).toBe(75);
  });

  it('uses highest severity from filter', () => {
    const alert = makeAlert({ severityFilter: ['critical', 'info'] });
    const result = evaluateAlert(alert, 150);
    expect(result.severity).toBe('critical');
  });

  it('defaults to warning severity', () => {
    const alert = makeAlert();
    const result = evaluateAlert(alert, 150);
    expect(result.severity).toBe('warning');
  });

  it('does not trigger when alert is disabled', () => {
    const alert = makeAlert({ enabled: false });
    const result = evaluateAlert(alert, 150);
    expect(result.triggered).toBe(false);
  });

  it('respects grace period', () => {
    const alert = makeAlert({
      gracePeriod: {
        enabled: true,
        durationMs: 60_000, // 1 minute
        minConsecutiveBreaches: 1,
        maxDurationMs: 86_400_000,
      },
    });
    const recentTimestamp = Date.now() - 30_000; // 30 seconds ago
    const result = evaluateAlert(alert, 150, recentTimestamp);
    expect(result.triggered).toBe(false);
    expect(result.withinGracePeriod).toBe(true);
  });

  it('triggers when grace period has elapsed', () => {
    const alert = makeAlert({
      gracePeriod: {
        enabled: true,
        durationMs: 60_000,
        minConsecutiveBreaches: 1,
        maxDurationMs: 86_400_000,
      },
    });
    const oldTimestamp = Date.now() - 120_000; // 2 minutes ago
    const result = evaluateAlert(alert, 150, oldTimestamp);
    expect(result.triggered).toBe(true);
    expect(result.withinGracePeriod).toBe(false);
  });

  it('ignores grace period when disabled', () => {
    const alert = makeAlert({
      gracePeriod: {
        enabled: false,
        durationMs: 60_000,
        minConsecutiveBreaches: 1,
        maxDurationMs: 86_400_000,
      },
    });
    const recentTimestamp = Date.now() - 30_000;
    const result = evaluateAlert(alert, 150, recentTimestamp);
    expect(result.triggered).toBe(true);
    expect(result.withinGracePeriod).toBe(false);
  });

  it('sets alertId on result', () => {
    const alert = makeAlert({ id: 'my_alert' });
    const result = evaluateAlert(alert, 50);
    expect(result.alertId).toBe('my_alert');
  });

  it('generates appropriate message for triggered alert', () => {
    const alert = makeAlert({ name: 'CPU Alert' });
    const result = evaluateAlert(alert, 150);
    expect(result.message).toContain('CPU Alert');
    expect(result.message).toContain('150');
    expect(result.message).toContain('exceeds');
  });

  it('generates appropriate message for non-triggered alert', () => {
    const alert = makeAlert({ name: 'CPU Alert' });
    const result = evaluateAlert(alert, 50);
    expect(result.message).toContain('CPU Alert');
    expect(result.message).toContain('within');
  });
});

describe('evaluateAllAlerts', () => {
  it('evaluates all alerts against values map', () => {
    const alerts = [
      makeAlert({ id: 'a1', alertRuleId: 'r1' }),
      makeAlert({ id: 'a2', alertRuleId: 'r2' }),
    ];
    const values = { r1: 150, r2: 50 };
    const results = evaluateAllAlerts(alerts, values);

    expect(results).toHaveLength(2);
    expect(results[0].alertId).toBe('a1');
    expect(results[0].triggered).toBe(true);
    expect(results[1].alertId).toBe('a2');
    expect(results[1].triggered).toBe(false);
  });

  it('defaults to 0 for missing values', () => {
    const alerts = [makeAlert({ id: 'a1', alertRuleId: 'r1' })];
    const results = evaluateAllAlerts(alerts, {});
    expect(results[0].currentValue).toBe(0);
    expect(results[0].triggered).toBe(false);
  });

  it('returns empty array for empty alerts', () => {
    const results = evaluateAllAlerts([], {});
    expect(results).toEqual([]);
  });
});

describe('shouldNotify', () => {
  it('returns true for triggered alert with matching preference', () => {
    const result = evaluateAlert(makeAlert(), 150);
    const pref = makePreference();
    expect(shouldNotify(result, pref)).toBe(true);
  });

  it('returns false for non-triggered alert', () => {
    const result = evaluateAlert(makeAlert(), 50);
    const pref = makePreference();
    expect(shouldNotify(result, pref)).toBe(false);
  });

  it('returns false when muted', () => {
    const result = evaluateAlert(makeAlert(), 150);
    const pref = makePreference({ muteUntil: Date.now() + 60_000 });
    expect(shouldNotify(result, pref)).toBe(false);
  });

  it('returns true when mute has expired', () => {
    const result = evaluateAlert(makeAlert(), 150);
    const pref = makePreference({ muteUntil: Date.now() - 60_000 });
    expect(shouldNotify(result, pref)).toBe(true);
  });

  it('respects severity filter', () => {
    const alert = makeAlert({ severityFilter: ['warning'] });
    const result = evaluateAlert(alert, 150);
    const pref = makePreference({ severityFilter: ['critical'] });
    expect(shouldNotify(result, pref)).toBe(false);
  });

  it('returns false when no channels configured', () => {
    const result = evaluateAlert(makeAlert(), 150);
    const pref = makePreference({ channels: [] });
    expect(shouldNotify(result, pref)).toBe(false);
  });
});

describe('formatAlertMessage', () => {
  it('formats triggered alert with severity label', () => {
    const result = evaluateAlert(makeAlert({ severityFilter: ['critical'] }), 150);
    const msg = formatAlertMessage(result);
    expect(msg).toContain('CRITICAL');
    expect(msg).toContain('150');
    expect(msg).toContain('exceeds');
  });

  it('formats non-triggered alert as OK', () => {
    const result = evaluateAlert(makeAlert(), 50);
    const msg = formatAlertMessage(result);
    expect(msg).toContain('[OK]');
    expect(msg).toContain('within');
  });
});
