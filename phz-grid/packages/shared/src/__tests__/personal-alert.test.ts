/**
 * Tests for PersonalAlert types and helpers.
 */
import {
  createEmptyAlertSummary,
  createDefaultGracePeriodConfig,
  isGracePeriodValid,
  clampGracePeriod,
} from '@phozart/phz-shared/types';
import type { AlertGracePeriodConfig } from '@phozart/phz-shared/types';

const SYSTEM_MAX = 24 * 60 * 60 * 1000; // 24 hours
const MIN_GRACE = 1000; // 1 second

// ========================================================================
// createEmptyAlertSummary
// ========================================================================

describe('createEmptyAlertSummary', () => {
  it('creates a zeroed-out summary', () => {
    const result = createEmptyAlertSummary();
    expect(result.total).toBe(0);
    expect(result.byStatus).toEqual({ active: 0, acknowledged: 0, resolved: 0 });
    expect(result.bySeverity).toEqual({ info: 0, warning: 0, critical: 0 });
  });
});

// ========================================================================
// createDefaultGracePeriodConfig
// ========================================================================

describe('createDefaultGracePeriodConfig', () => {
  it('creates default config with grace period disabled', () => {
    const result = createDefaultGracePeriodConfig();
    expect(result.enabled).toBe(false);
    expect(result.durationMs).toBe(5 * 60 * 1000); // 5 minutes
    expect(result.minConsecutiveBreaches).toBe(3);
    expect(result.maxDurationMs).toBe(SYSTEM_MAX);
  });

  it('applies enabled override', () => {
    const result = createDefaultGracePeriodConfig({ enabled: true });
    expect(result.enabled).toBe(true);
  });

  it('applies durationMs override', () => {
    const result = createDefaultGracePeriodConfig({ durationMs: 60_000 });
    expect(result.durationMs).toBe(60_000);
  });

  it('applies minConsecutiveBreaches override', () => {
    const result = createDefaultGracePeriodConfig({ minConsecutiveBreaches: 5 });
    expect(result.minConsecutiveBreaches).toBe(5);
  });

  it('applies maxDurationMs override', () => {
    const result = createDefaultGracePeriodConfig({ maxDurationMs: 3_600_000 });
    expect(result.maxDurationMs).toBe(3_600_000);
  });
});

// ========================================================================
// isGracePeriodValid
// ========================================================================

describe('isGracePeriodValid', () => {
  it('returns true when grace period is disabled (regardless of values)', () => {
    const config: AlertGracePeriodConfig = {
      enabled: false,
      durationMs: 0,
      minConsecutiveBreaches: 0,
      maxDurationMs: 0,
    };
    expect(isGracePeriodValid(config)).toBe(true);
  });

  it('returns true for valid enabled config', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 60_000,
      minConsecutiveBreaches: 3,
      maxDurationMs: SYSTEM_MAX,
    };
    expect(isGracePeriodValid(config)).toBe(true);
  });

  it('returns false when durationMs < MIN_GRACE_PERIOD_MS (1000ms)', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 500,
      minConsecutiveBreaches: 1,
      maxDurationMs: SYSTEM_MAX,
    };
    expect(isGracePeriodValid(config)).toBe(false);
  });

  it('returns false when durationMs > maxDurationMs', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 7_200_000,
      minConsecutiveBreaches: 1,
      maxDurationMs: 3_600_000,
    };
    expect(isGracePeriodValid(config)).toBe(false);
  });

  it('returns false when maxDurationMs > system cap (24h)', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 60_000,
      minConsecutiveBreaches: 1,
      maxDurationMs: SYSTEM_MAX + 1,
    };
    expect(isGracePeriodValid(config)).toBe(false);
  });

  it('returns false when minConsecutiveBreaches < 1', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 60_000,
      minConsecutiveBreaches: 0,
      maxDurationMs: SYSTEM_MAX,
    };
    expect(isGracePeriodValid(config)).toBe(false);
  });

  it('returns true at boundary: durationMs equals MIN_GRACE', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: MIN_GRACE,
      minConsecutiveBreaches: 1,
      maxDurationMs: SYSTEM_MAX,
    };
    expect(isGracePeriodValid(config)).toBe(true);
  });

  it('returns true at boundary: durationMs equals maxDurationMs', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 3_600_000,
      minConsecutiveBreaches: 1,
      maxDurationMs: 3_600_000,
    };
    expect(isGracePeriodValid(config)).toBe(true);
  });
});

// ========================================================================
// clampGracePeriod
// ========================================================================

describe('clampGracePeriod', () => {
  it('clamps durationMs to MIN when too low', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 100,
      minConsecutiveBreaches: 3,
      maxDurationMs: SYSTEM_MAX,
    };
    const result = clampGracePeriod(config);
    expect(result.durationMs).toBe(MIN_GRACE);
  });

  it('clamps durationMs to maxDurationMs when too high', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 10_000_000,
      minConsecutiveBreaches: 3,
      maxDurationMs: 3_600_000,
    };
    const result = clampGracePeriod(config);
    expect(result.durationMs).toBe(3_600_000);
  });

  it('clamps maxDurationMs to system cap', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 60_000,
      minConsecutiveBreaches: 3,
      maxDurationMs: SYSTEM_MAX * 2,
    };
    const result = clampGracePeriod(config);
    expect(result.maxDurationMs).toBe(SYSTEM_MAX);
  });

  it('clamps minConsecutiveBreaches to at least 1', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 60_000,
      minConsecutiveBreaches: -5,
      maxDurationMs: SYSTEM_MAX,
    };
    const result = clampGracePeriod(config);
    expect(result.minConsecutiveBreaches).toBe(1);
  });

  it('preserves valid config unchanged', () => {
    const config: AlertGracePeriodConfig = {
      enabled: true,
      durationMs: 300_000,
      minConsecutiveBreaches: 5,
      maxDurationMs: SYSTEM_MAX,
    };
    const result = clampGracePeriod(config);
    expect(result).toEqual(config);
  });

  it('preserves enabled flag', () => {
    const config: AlertGracePeriodConfig = {
      enabled: false,
      durationMs: 100,
      minConsecutiveBreaches: 0,
      maxDurationMs: SYSTEM_MAX,
    };
    const result = clampGracePeriod(config);
    expect(result.enabled).toBe(false);
    expect(result.durationMs).toBe(MIN_GRACE);
    expect(result.minConsecutiveBreaches).toBe(1);
  });
});
