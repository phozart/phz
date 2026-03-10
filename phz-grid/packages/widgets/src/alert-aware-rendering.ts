/**
 * @phozart/phz-widgets — Alert-Aware Rendering State Machine (7A-A)
 *
 * Pure functions that compute CSS custom property overrides for
 * alert-aware single-value widgets. No DOM, no Lit — just state -> CSS props.
 */

import type {
  SingleValueAlertConfig,
  AlertVisualState,
  AlertContainerSize,
  WidgetAlertSeverity,
} from '@phozart/phz-shared/types';
import { ALERT_WIDGET_TOKENS } from '@phozart/phz-shared/design-system';

// ========================================================================
// Token lookup
// ========================================================================

function tokenValue(key: string): string {
  return (ALERT_WIDGET_TOKENS as Record<string, string>)[key] ?? '';
}

// ========================================================================
// Indicator size by container
// ========================================================================

function indicatorSize(containerSize: AlertContainerSize): string {
  switch (containerSize) {
    case 'full': return '10px';
    case 'compact': return '8px';
    case 'minimal': return '6px';
  }
}

// ========================================================================
// Border width by container
// ========================================================================

function borderWidth(containerSize: AlertContainerSize): string {
  switch (containerSize) {
    case 'full': return '4px';
    case 'compact': return '3px';
    case 'minimal': return '2px';
  }
}

// ========================================================================
// computeAlertStyles
// ========================================================================

/**
 * Compute CSS custom property overrides for a widget based on its alert config,
 * current alert visual state, and container size.
 *
 * Returns a Record<string, string> where keys are CSS custom property names
 * (without `var()`) and values are the resolved token values.
 *
 * The caller applies these as inline style overrides on the widget host.
 */
export function computeAlertStyles(
  config: SingleValueAlertConfig,
  state: AlertVisualState,
  containerSize: AlertContainerSize,
): Record<string, string> {
  const result: Record<string, string> = {};

  // No visual rendering if mode is 'none' or severity is 'healthy'
  if (config.alertVisualMode === 'none') {
    return result;
  }

  const severity: WidgetAlertSeverity = state.severity;
  const mode = config.alertVisualMode;

  // Indicator mode
  if (mode === 'indicator') {
    const indicatorColor = tokenValue(`widget.alert.${severity}.indicator`);
    if (indicatorColor) {
      result['--phz-alert-indicator-color'] = indicatorColor;
    }
    result['--phz-alert-indicator-size'] = indicatorSize(containerSize);
    result['--phz-alert-indicator-display'] = 'inline-block';
  }

  // Background mode
  if (mode === 'background') {
    const bg = tokenValue(`widget.alert.${severity}.bg`);
    if (bg) {
      result['--phz-alert-bg'] = bg;
    }
    // Background mode also shows indicator
    const indicatorColor = tokenValue(`widget.alert.${severity}.indicator`);
    if (indicatorColor) {
      result['--phz-alert-indicator-color'] = indicatorColor;
    }
    result['--phz-alert-indicator-size'] = indicatorSize(containerSize);
    result['--phz-alert-indicator-display'] = 'inline-block';
  }

  // Border mode
  if (mode === 'border') {
    const borderColor = tokenValue(`widget.alert.${severity}.border`);
    if (borderColor) {
      result['--phz-alert-border-color'] = borderColor;
    }
    result['--phz-alert-border-width'] = borderWidth(containerSize);
    // Border mode also shows indicator
    const indicatorColor = tokenValue(`widget.alert.${severity}.indicator`);
    if (indicatorColor) {
      result['--phz-alert-indicator-color'] = indicatorColor;
    }
    result['--phz-alert-indicator-size'] = indicatorSize(containerSize);
    result['--phz-alert-indicator-display'] = 'inline-block';
  }

  // Pulse animation for non-healthy states when transitions are enabled
  if (config.alertAnimateTransition && severity !== 'healthy') {
    const duration = tokenValue('widget.alert.pulse.duration');
    if (duration) {
      result['--phz-alert-pulse-duration'] = duration;
    }
    const keyframes = tokenValue('widget.alert.pulse.keyframes');
    if (keyframes) {
      result['--phz-alert-pulse-animation'] = `${keyframes} ${duration} ease-in-out`;
    }
  }

  return result;
}
