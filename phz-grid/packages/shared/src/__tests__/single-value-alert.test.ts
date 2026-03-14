/**
 * Tests for SingleValueAlertConfig types and pure functions.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveAlertVisualState,
  getAlertTokens,
  degradeAlertMode,
  createDefaultAlertConfig,
} from '@phozart/shared/types';
import type {
  SingleValueAlertConfig,
  AlertVisualMode,
  WidgetAlertSeverity,
  AlertContainerSize,
} from '@phozart/shared/types';

// ========================================================================
// resolveAlertVisualState
// ========================================================================

describe('resolveAlertVisualState', () => {
  it('returns healthy when no alertRuleBinding is set', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: undefined,
      alertVisualMode: 'indicator',
      alertAnimateTransition: true,
    };
    const events = new Map<string, WidgetAlertSeverity>();
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('healthy');
    expect(result.ruleId).toBeUndefined();
  });

  it('returns healthy when bound rule has no event', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: 'rule-1',
      alertVisualMode: 'indicator',
      alertAnimateTransition: true,
    };
    const events = new Map<string, WidgetAlertSeverity>();
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('healthy');
  });

  it('returns warning when bound rule has warning event', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: 'rule-1',
      alertVisualMode: 'background',
      alertAnimateTransition: false,
    };
    const events = new Map<string, WidgetAlertSeverity>([['rule-1', 'warning']]);
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('warning');
    expect(result.ruleId).toBe('rule-1');
    expect(result.lastTransition).toBeDefined();
    expect(typeof result.lastTransition).toBe('number');
  });

  it('returns critical when bound rule has critical event', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: 'rule-42',
      alertVisualMode: 'border',
      alertAnimateTransition: true,
    };
    const events = new Map<string, WidgetAlertSeverity>([['rule-42', 'critical']]);
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('critical');
    expect(result.ruleId).toBe('rule-42');
  });

  it('returns healthy when bound rule is not in the events map (unknown rule)', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: 'rule-unknown',
      alertVisualMode: 'indicator',
      alertAnimateTransition: true,
    };
    const events = new Map<string, WidgetAlertSeverity>([['rule-1', 'critical']]);
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('healthy');
  });

  it('returns healthy severity from events map when event is healthy', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: 'rule-1',
      alertVisualMode: 'indicator',
      alertAnimateTransition: true,
    };
    const events = new Map<string, WidgetAlertSeverity>([['rule-1', 'healthy']]);
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('healthy');
    expect(result.ruleId).toBe('rule-1');
  });

  it('ignores events for other rules', () => {
    const config: SingleValueAlertConfig = {
      alertRuleBinding: 'rule-A',
      alertVisualMode: 'indicator',
      alertAnimateTransition: true,
    };
    const events = new Map<string, WidgetAlertSeverity>([
      ['rule-B', 'critical'],
      ['rule-C', 'warning'],
    ]);
    const result = resolveAlertVisualState(config, events);
    expect(result.severity).toBe('healthy');
  });
});

// ========================================================================
// getAlertTokens
// ========================================================================

describe('getAlertTokens', () => {
  // mode = 'none'
  it('returns empty object for mode none, regardless of severity', () => {
    const severities: WidgetAlertSeverity[] = ['healthy', 'warning', 'critical'];
    for (const sev of severities) {
      const tokens = getAlertTokens(sev, 'none');
      expect(tokens).toEqual({});
    }
  });

  // mode = 'indicator'
  it('returns indicator token for healthy + indicator', () => {
    const tokens = getAlertTokens('healthy', 'indicator');
    expect(tokens.indicator).toBe('widget.alert.healthy.indicator');
    expect(tokens.bg).toBeUndefined();
    expect(tokens.border).toBeUndefined();
  });

  it('returns indicator token for warning + indicator', () => {
    const tokens = getAlertTokens('warning', 'indicator');
    expect(tokens.indicator).toBe('widget.alert.warning.indicator');
  });

  it('returns indicator token for critical + indicator', () => {
    const tokens = getAlertTokens('critical', 'indicator');
    expect(tokens.indicator).toBe('widget.alert.critical.indicator');
  });

  // mode = 'background'
  it('returns bg + indicator tokens for healthy + background', () => {
    const tokens = getAlertTokens('healthy', 'background');
    expect(tokens.bg).toBe('widget.alert.healthy.bg');
    expect(tokens.indicator).toBe('widget.alert.healthy.indicator');
    expect(tokens.border).toBeUndefined();
  });

  it('returns bg + indicator tokens for warning + background', () => {
    const tokens = getAlertTokens('warning', 'background');
    expect(tokens.bg).toBe('widget.alert.warning.bg');
    expect(tokens.indicator).toBe('widget.alert.warning.indicator');
  });

  it('returns bg + indicator tokens for critical + background', () => {
    const tokens = getAlertTokens('critical', 'background');
    expect(tokens.bg).toBe('widget.alert.critical.bg');
    expect(tokens.indicator).toBe('widget.alert.critical.indicator');
  });

  // mode = 'border'
  it('returns border + indicator tokens for healthy + border', () => {
    const tokens = getAlertTokens('healthy', 'border');
    expect(tokens.border).toBe('widget.alert.healthy.border');
    expect(tokens.indicator).toBe('widget.alert.healthy.indicator');
    expect(tokens.bg).toBeUndefined();
  });

  it('returns border + indicator tokens for warning + border', () => {
    const tokens = getAlertTokens('warning', 'border');
    expect(tokens.border).toBe('widget.alert.warning.border');
    expect(tokens.indicator).toBe('widget.alert.warning.indicator');
  });

  it('returns border + indicator tokens for critical + border', () => {
    const tokens = getAlertTokens('critical', 'border');
    expect(tokens.border).toBe('widget.alert.critical.border');
    expect(tokens.indicator).toBe('widget.alert.critical.indicator');
  });
});

// ========================================================================
// degradeAlertMode
// ========================================================================

describe('degradeAlertMode', () => {
  // mode = 'none'
  it('returns no rendering for mode none at any size', () => {
    const sizes: AlertContainerSize[] = ['full', 'compact', 'minimal'];
    for (const size of sizes) {
      const params = degradeAlertMode('none', size);
      expect(params.showIndicator).toBe(false);
      expect(params.indicatorSize).toBe(0);
      expect(params.borderWidth).toBe(0);
      expect(params.showBackground).toBe(false);
    }
  });

  // mode = 'indicator' x sizes
  it('indicator mode at full size: 10px indicator, no border, no background', () => {
    const params = degradeAlertMode('indicator', 'full');
    expect(params.showIndicator).toBe(true);
    expect(params.indicatorSize).toBe(10);
    expect(params.borderWidth).toBe(0);
    expect(params.showBackground).toBe(false);
  });

  it('indicator mode at compact size: 8px indicator', () => {
    const params = degradeAlertMode('indicator', 'compact');
    expect(params.showIndicator).toBe(true);
    expect(params.indicatorSize).toBe(8);
    expect(params.borderWidth).toBe(0);
  });

  it('indicator mode at minimal size: 6px indicator', () => {
    const params = degradeAlertMode('indicator', 'minimal');
    expect(params.showIndicator).toBe(true);
    expect(params.indicatorSize).toBe(6);
    expect(params.borderWidth).toBe(0);
  });

  // mode = 'background' x sizes
  it('background mode at full size: showBackground true', () => {
    const params = degradeAlertMode('background', 'full');
    expect(params.showBackground).toBe(true);
    expect(params.showIndicator).toBe(true);
    expect(params.indicatorSize).toBe(10);
  });

  it('background mode at compact size: showBackground true', () => {
    const params = degradeAlertMode('background', 'compact');
    expect(params.showBackground).toBe(true);
    expect(params.indicatorSize).toBe(8);
  });

  it('background mode at minimal size: showBackground true', () => {
    const params = degradeAlertMode('background', 'minimal');
    expect(params.showBackground).toBe(true);
    expect(params.indicatorSize).toBe(6);
  });

  // mode = 'border' x sizes
  it('border mode at full size: 4px border', () => {
    const params = degradeAlertMode('border', 'full');
    expect(params.borderWidth).toBe(4);
    expect(params.showIndicator).toBe(true);
    expect(params.indicatorSize).toBe(10);
    expect(params.showBackground).toBe(false);
  });

  it('border mode at compact size: 3px border', () => {
    const params = degradeAlertMode('border', 'compact');
    expect(params.borderWidth).toBe(3);
    expect(params.indicatorSize).toBe(8);
  });

  it('border mode at minimal size: 2px border', () => {
    const params = degradeAlertMode('border', 'minimal');
    expect(params.borderWidth).toBe(2);
    expect(params.indicatorSize).toBe(6);
  });
});

// ========================================================================
// createDefaultAlertConfig
// ========================================================================

describe('createDefaultAlertConfig', () => {
  it('creates config with no binding', () => {
    const config = createDefaultAlertConfig();
    expect(config.alertRuleBinding).toBeUndefined();
  });

  it('defaults to indicator mode', () => {
    const config = createDefaultAlertConfig();
    expect(config.alertVisualMode).toBe('indicator');
  });

  it('enables animate transition by default', () => {
    const config = createDefaultAlertConfig();
    expect(config.alertAnimateTransition).toBe(true);
  });

  it('returns a new object each time', () => {
    const a = createDefaultAlertConfig();
    const b = createDefaultAlertConfig();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
