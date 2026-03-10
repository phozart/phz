/**
 * Tests for alert-aware rendering state machine.
 */
import { describe, it, expect } from 'vitest';
import { computeAlertStyles } from '../alert-aware-rendering.js';
import type {
  SingleValueAlertConfig,
  AlertVisualState,
  AlertContainerSize,
  WidgetAlertSeverity,
} from '@phozart/phz-shared/types';

// ========================================================================
// Helpers
// ========================================================================

function makeConfig(overrides?: Partial<SingleValueAlertConfig>): SingleValueAlertConfig {
  return {
    alertRuleBinding: 'rule-1',
    alertVisualMode: 'indicator',
    alertAnimateTransition: true,
    ...overrides,
  };
}

function makeState(overrides?: Partial<AlertVisualState>): AlertVisualState {
  return {
    severity: 'healthy',
    ...overrides,
  };
}

// ========================================================================
// computeAlertStyles — mode 'none'
// ========================================================================

describe('computeAlertStyles — mode none', () => {
  it('returns empty object when mode is none', () => {
    const config = makeConfig({ alertVisualMode: 'none' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result).toEqual({});
  });

  it('returns empty object for mode none regardless of container size', () => {
    const config = makeConfig({ alertVisualMode: 'none' });
    const sizes: AlertContainerSize[] = ['full', 'compact', 'minimal'];
    for (const size of sizes) {
      const result = computeAlertStyles(config, makeState({ severity: 'warning' }), size);
      expect(result).toEqual({});
    }
  });
});

// ========================================================================
// computeAlertStyles — mode 'indicator'
// ========================================================================

describe('computeAlertStyles — mode indicator', () => {
  it('sets indicator color for healthy severity', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'healthy' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-indicator-color']).toBe('#22c55e');
    expect(result['--phz-alert-indicator-display']).toBe('inline-block');
  });

  it('sets indicator color for warning severity', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-indicator-color']).toBe('#f59e0b');
  });

  it('sets indicator color for critical severity', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-indicator-color']).toBe('#ef4444');
  });

  it('sets indicator size to 10px for full container', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-indicator-size']).toBe('10px');
  });

  it('sets indicator size to 8px for compact container', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'compact');
    expect(result['--phz-alert-indicator-size']).toBe('8px');
  });

  it('sets indicator size to 6px for minimal container', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'minimal');
    expect(result['--phz-alert-indicator-size']).toBe('6px');
  });

  it('does not set border or background properties', () => {
    const config = makeConfig({ alertVisualMode: 'indicator' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-bg']).toBeUndefined();
    expect(result['--phz-alert-border-color']).toBeUndefined();
    expect(result['--phz-alert-border-width']).toBeUndefined();
  });
});

// ========================================================================
// computeAlertStyles — mode 'background'
// ========================================================================

describe('computeAlertStyles — mode background', () => {
  it('sets background color for warning', () => {
    const config = makeConfig({ alertVisualMode: 'background' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-bg']).toBe('rgba(245, 158, 11, 0.08)');
  });

  it('sets background color for critical', () => {
    const config = makeConfig({ alertVisualMode: 'background' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-bg']).toBe('rgba(239, 68, 68, 0.08)');
  });

  it('sets transparent background for healthy', () => {
    const config = makeConfig({ alertVisualMode: 'background' });
    const state = makeState({ severity: 'healthy' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-bg']).toBe('transparent');
  });

  it('also sets indicator color in background mode', () => {
    const config = makeConfig({ alertVisualMode: 'background' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-indicator-color']).toBe('#f59e0b');
    expect(result['--phz-alert-indicator-display']).toBe('inline-block');
  });

  it('does not set border properties in background mode', () => {
    const config = makeConfig({ alertVisualMode: 'background' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-border-color']).toBeUndefined();
    expect(result['--phz-alert-border-width']).toBeUndefined();
  });
});

// ========================================================================
// computeAlertStyles — mode 'border'
// ========================================================================

describe('computeAlertStyles — mode border', () => {
  it('sets border color for warning', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-border-color']).toBe('#f59e0b');
  });

  it('sets border color for critical', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-border-color']).toBe('#ef4444');
  });

  it('sets border width to 4px for full container', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-border-width']).toBe('4px');
  });

  it('sets border width to 3px for compact container', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'compact');
    expect(result['--phz-alert-border-width']).toBe('3px');
  });

  it('sets border width to 2px for minimal container', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'minimal');
    expect(result['--phz-alert-border-width']).toBe('2px');
  });

  it('also sets indicator in border mode', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-indicator-color']).toBe('#ef4444');
    expect(result['--phz-alert-indicator-size']).toBe('10px');
  });
});

// ========================================================================
// computeAlertStyles — animation
// ========================================================================

describe('computeAlertStyles — animation', () => {
  it('sets pulse animation for non-healthy severity when transitions enabled', () => {
    const config = makeConfig({ alertVisualMode: 'indicator', alertAnimateTransition: true });
    const state = makeState({ severity: 'warning' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-pulse-duration']).toBe('2s');
    expect(result['--phz-alert-pulse-animation']).toContain('alertPulse');
  });

  it('does not set pulse animation for healthy severity', () => {
    const config = makeConfig({ alertVisualMode: 'indicator', alertAnimateTransition: true });
    const state = makeState({ severity: 'healthy' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-pulse-duration']).toBeUndefined();
    expect(result['--phz-alert-pulse-animation']).toBeUndefined();
  });

  it('does not set pulse animation when transitions disabled', () => {
    const config = makeConfig({ alertVisualMode: 'indicator', alertAnimateTransition: false });
    const state = makeState({ severity: 'critical' });
    const result = computeAlertStyles(config, state, 'full');
    expect(result['--phz-alert-pulse-duration']).toBeUndefined();
    expect(result['--phz-alert-pulse-animation']).toBeUndefined();
  });
});

// ========================================================================
// computeAlertStyles — edge cases
// ========================================================================

describe('computeAlertStyles — edge cases', () => {
  it('handles healthy severity with border mode (no warning/critical border token)', () => {
    const config = makeConfig({ alertVisualMode: 'border' });
    const state = makeState({ severity: 'healthy' });
    const result = computeAlertStyles(config, state, 'full');
    // healthy has no border token defined, so --phz-alert-border-color should not be set
    // (ALERT_WIDGET_TOKENS does not have 'widget.alert.healthy.border')
    expect(result['--phz-alert-border-color']).toBeUndefined();
    expect(result['--phz-alert-border-width']).toBe('4px');
  });

  it('returns styles across all severity x mode x container combinations without throwing', () => {
    const severities: WidgetAlertSeverity[] = ['healthy', 'warning', 'critical'];
    const modes: SingleValueAlertConfig['alertVisualMode'][] = ['none', 'indicator', 'background', 'border'];
    const sizes: AlertContainerSize[] = ['full', 'compact', 'minimal'];

    for (const sev of severities) {
      for (const mode of modes) {
        for (const size of sizes) {
          const config = makeConfig({ alertVisualMode: mode });
          const state = makeState({ severity: sev });
          expect(() => computeAlertStyles(config, state, size)).not.toThrow();
        }
      }
    }
  });
});
