/**
 * Tests for micro-widget cell resolver (7A-B).
 *
 * resolveCellRenderer with registry populated and empty,
 * fallback to text, and column width checks.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveCellRenderer,
  getMicroWidgetFallbackText,
} from '../formatters/micro-widget-cell.js';
import { createCellRendererRegistry } from '@phozart/shared/types';
import type {
  MicroWidgetCellConfig,
  MicroWidgetRenderer,
  CellRendererRegistry,
} from '@phozart/shared/types';

// ========================================================================
// Helpers
// ========================================================================

function makeConfig(
  overrides: Partial<MicroWidgetCellConfig> = {},
): MicroWidgetCellConfig {
  return {
    widgetType: 'kpi-card',
    dataBinding: { valueField: 'value' },
    displayMode: 'value-only',
    ...overrides,
  };
}

function makeMockRenderer(canRenderResult = true): MicroWidgetRenderer {
  return {
    render: (_config, _value, width, height) => ({
      html: '<svg>rendered</svg>',
      width,
      height,
    }),
    canRender: () => canRenderResult,
  };
}

function makePopulatedRegistry(): CellRendererRegistry {
  const registry = createCellRendererRegistry();
  registry.register('value-only', makeMockRenderer());
  registry.register('sparkline', makeMockRenderer());
  registry.register('delta', makeMockRenderer());
  registry.register('gauge-arc', makeMockRenderer());
  return registry;
}

// ========================================================================
// resolveCellRenderer
// ========================================================================

describe('resolveCellRenderer', () => {
  it('returns render result when registry has matching renderer', () => {
    const registry = makePopulatedRegistry();
    const result = resolveCellRenderer(makeConfig(), 42, 100, 30, registry);
    expect(result).not.toBeNull();
    expect(result!.html).toBe('<svg>rendered</svg>');
    expect(result!.width).toBe(100);
    expect(result!.height).toBe(30);
  });

  it('returns null when registry is empty', () => {
    const registry = createCellRendererRegistry();
    const result = resolveCellRenderer(makeConfig(), 42, 100, 30, registry);
    expect(result).toBeNull();
  });

  it('returns null when display mode is not registered', () => {
    const registry = createCellRendererRegistry();
    registry.register('sparkline', makeMockRenderer());
    // Config asks for 'value-only' but only 'sparkline' is registered
    const result = resolveCellRenderer(makeConfig(), 42, 100, 30, registry);
    expect(result).toBeNull();
  });

  it('returns null when column width is below 60px', () => {
    const registry = makePopulatedRegistry();
    const result = resolveCellRenderer(makeConfig(), 42, 50, 30, registry);
    expect(result).toBeNull();
  });

  it('returns null when renderer canRender returns false', () => {
    const registry = createCellRendererRegistry();
    registry.register('value-only', makeMockRenderer(false));
    const result = resolveCellRenderer(makeConfig(), 42, 100, 30, registry);
    expect(result).toBeNull();
  });

  it('works with different display modes', () => {
    const registry = makePopulatedRegistry();
    const sparklineConfig = makeConfig({ displayMode: 'sparkline' });
    const result = resolveCellRenderer(sparklineConfig, [10, 20], 100, 30, registry);
    expect(result).not.toBeNull();
  });

  it('returns null at exactly 59px column width', () => {
    const registry = makePopulatedRegistry();
    const result = resolveCellRenderer(makeConfig(), 42, 59, 30, registry);
    expect(result).toBeNull();
  });

  it('succeeds at exactly 60px column width', () => {
    const registry = makePopulatedRegistry();
    const result = resolveCellRenderer(makeConfig(), 42, 60, 30, registry);
    expect(result).not.toBeNull();
  });
});

// ========================================================================
// getMicroWidgetFallbackText
// ========================================================================

describe('getMicroWidgetFallbackText', () => {
  it('returns empty string for null value', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), null)).toBe('');
  });

  it('returns empty string for undefined value', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), undefined)).toBe('');
  });

  it('formats numeric value', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), 42)).toBe('42');
  });

  it('formats large numbers compactly', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), 2500000)).toBe('2.5M');
  });

  it('formats thousands compactly', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), 3400)).toBe('3.4K');
  });

  it('extracts current value from delta object', () => {
    const config = makeConfig({ displayMode: 'delta' });
    expect(getMicroWidgetFallbackText(config, { current: 150, previous: 100 })).toBe('150');
  });

  it('extracts first value from delta array', () => {
    const config = makeConfig({ displayMode: 'delta' });
    expect(getMicroWidgetFallbackText(config, [250, 200])).toBe('250');
  });

  it('shows last value for sparkline array', () => {
    const config = makeConfig({ displayMode: 'sparkline' });
    expect(getMicroWidgetFallbackText(config, [10, 20, 30])).toBe('30');
  });

  it('falls back to string representation', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), 'hello')).toBe('hello');
  });

  it('formats decimal numbers with 2 decimal places', () => {
    expect(getMicroWidgetFallbackText(makeConfig(), 3.14159)).toBe('3.14');
  });
});
