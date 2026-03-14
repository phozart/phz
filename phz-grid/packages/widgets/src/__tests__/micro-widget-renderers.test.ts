/**
 * Tests for micro-widget cell renderers (7A-B).
 *
 * Each renderer produces SVG/HTML strings — pure functions, no DOM.
 */
import { describe, it, expect } from 'vitest';
import {
  createValueOnlyRenderer,
  createSparklineRenderer,
  createDeltaRenderer,
  createGaugeArcRenderer,
  registerAllMicroWidgetRenderers,
} from '@phozart/widgets';
import { createCellRendererRegistry } from '@phozart/shared/types';
import type { MicroWidgetCellConfig } from '@phozart/shared/types';

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

// ========================================================================
// value-only renderer
// ========================================================================

describe('createValueOnlyRenderer', () => {
  const renderer = createValueOnlyRenderer();

  it('renders an SVG string with status dot and value', () => {
    const result = renderer.render(makeConfig(), 42, 100, 30);
    expect(result.html).toContain('<svg');
    expect(result.html).toContain('</svg>');
    expect(result.html).toContain('circle');
    expect(result.html).toContain('42');
  });

  it('uses green color when below warning threshold', () => {
    const config = makeConfig({ thresholds: { warning: 70, critical: 90 } });
    const result = renderer.render(config, 50, 100, 30);
    expect(result.html).toContain('#22c55e');
  });

  it('uses amber color when at warning threshold', () => {
    const config = makeConfig({ thresholds: { warning: 70, critical: 90 } });
    const result = renderer.render(config, 70, 100, 30);
    expect(result.html).toContain('#f59e0b');
  });

  it('uses red color when at critical threshold', () => {
    const config = makeConfig({ thresholds: { warning: 70, critical: 90 } });
    const result = renderer.render(config, 95, 100, 30);
    expect(result.html).toContain('#ef4444');
  });

  it('handles null value gracefully', () => {
    const result = renderer.render(makeConfig(), null, 100, 30);
    expect(result.html).toContain('—');
  });

  it('handles undefined value gracefully', () => {
    const result = renderer.render(makeConfig(), undefined, 100, 30);
    expect(result.html).toContain('—');
  });

  it('formats large numbers compactly', () => {
    const result = renderer.render(makeConfig(), 1500000, 100, 30);
    expect(result.html).toContain('1.5M');
  });

  it('formats thousands compactly', () => {
    const result = renderer.render(makeConfig(), 5200, 100, 30);
    expect(result.html).toContain('5.2K');
  });

  it('returns correct dimensions', () => {
    const result = renderer.render(makeConfig(), 42, 120, 24);
    expect(result.width).toBe(120);
    expect(result.height).toBe(24);
  });

  it('canRender returns true at 60px', () => {
    expect(renderer.canRender(makeConfig(), 60)).toBe(true);
  });

  it('canRender returns false below 60px', () => {
    expect(renderer.canRender(makeConfig(), 59)).toBe(false);
  });

  it('handles string numeric value', () => {
    const result = renderer.render(makeConfig(), '123', 100, 30);
    expect(result.html).toContain('123');
  });
});

// ========================================================================
// sparkline renderer
// ========================================================================

describe('createSparklineRenderer', () => {
  const renderer = createSparklineRenderer();

  it('renders SVG polyline from array data', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      [10, 20, 15, 25, 30],
      100,
      30,
    );
    expect(result.html).toContain('<svg');
    expect(result.html).toContain('polyline');
  });

  it('returns empty html for empty array', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      [],
      100,
      30,
    );
    expect(result.html).toBe('');
  });

  it('handles non-array value gracefully', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      42,
      100,
      30,
    );
    expect(result.html).toBe('');
  });

  it('handles null value gracefully', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      null,
      100,
      30,
    );
    expect(result.html).toBe('');
  });

  it('limits to 20 data points', () => {
    const data = Array.from({ length: 50 }, (_, i) => i);
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      data,
      100,
      30,
    );
    // Should contain polyline points — count commas to verify limited points
    expect(result.html).toContain('polyline');
    const pointsMatch = result.html.match(/points="([^"]+)"/);
    expect(pointsMatch).not.toBeNull();
    const pointCount = pointsMatch![1].split(' ').length;
    expect(pointCount).toBeLessThanOrEqual(20);
  });

  it('uses blue for upward trend', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      [10, 20, 30],
      100,
      30,
    );
    expect(result.html).toContain('#3B82F6');
  });

  it('uses red for downward trend', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      [30, 20, 10],
      100,
      30,
    );
    expect(result.html).toContain('#EF4444');
  });

  it('parses JSON string arrays', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      '[5, 10, 15]',
      100,
      30,
    );
    expect(result.html).toContain('polyline');
  });

  it('canRender returns true at 80px', () => {
    expect(renderer.canRender(makeConfig({ displayMode: 'sparkline' }), 80)).toBe(true);
  });

  it('canRender returns false below 80px', () => {
    expect(renderer.canRender(makeConfig({ displayMode: 'sparkline' }), 79)).toBe(false);
  });

  it('returns correct dimensions', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'sparkline' }),
      [10, 20],
      150,
      28,
    );
    expect(result.width).toBe(150);
    expect(result.height).toBe(28);
  });
});

// ========================================================================
// delta renderer
// ========================================================================

describe('createDeltaRenderer', () => {
  const renderer = createDeltaRenderer();

  it('renders SVG with value and arrow for positive delta', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      { current: 120, previous: 100 },
      120,
      30,
    );
    expect(result.html).toContain('<svg');
    expect(result.html).toContain('120');
    expect(result.html).toContain('\u25B2'); // ▲
    expect(result.html).toContain('#22c55e');
  });

  it('renders down arrow for negative delta', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      { current: 80, previous: 100 },
      120,
      30,
    );
    expect(result.html).toContain('\u25BC'); // ▼
    expect(result.html).toContain('#ef4444');
  });

  it('calculates correct percentage change', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      { current: 110, previous: 100 },
      120,
      30,
    );
    expect(result.html).toContain('+10.0%');
  });

  it('calculates negative percentage change', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      { current: 90, previous: 100 },
      120,
      30,
    );
    expect(result.html).toContain('-10.0%');
  });

  it('handles array input [current, previous]', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      [150, 100],
      120,
      30,
    );
    expect(result.html).toContain('150');
    expect(result.html).toContain('+50.0%');
  });

  it('handles null value gracefully', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      null,
      120,
      30,
    );
    expect(result.html).toBe('');
  });

  it('handles non-delta value gracefully', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'delta' }),
      'not a delta',
      120,
      30,
    );
    expect(result.html).toBe('');
  });

  it('canRender returns true at 100px', () => {
    expect(renderer.canRender(makeConfig({ displayMode: 'delta' }), 100)).toBe(true);
  });

  it('canRender returns false below 100px', () => {
    expect(renderer.canRender(makeConfig({ displayMode: 'delta' }), 99)).toBe(false);
  });
});

// ========================================================================
// gauge-arc renderer
// ========================================================================

describe('createGaugeArcRenderer', () => {
  const renderer = createGaugeArcRenderer();

  it('renders SVG arc with fill and track', () => {
    const config = makeConfig({
      displayMode: 'gauge-arc',
      thresholds: { warning: 70, critical: 90 },
    });
    const result = renderer.render(config, 50, 80, 30);
    expect(result.html).toContain('<svg');
    expect(result.html).toContain('path');
    expect(result.html).toContain('#E7E5E4'); // track color
  });

  it('uses green fill for healthy value', () => {
    const config = makeConfig({
      displayMode: 'gauge-arc',
      thresholds: { warning: 70, critical: 90 },
    });
    const result = renderer.render(config, 50, 80, 30);
    expect(result.html).toContain('#22c55e');
  });

  it('uses amber fill for warning value', () => {
    const config = makeConfig({
      displayMode: 'gauge-arc',
      thresholds: { warning: 70, critical: 90 },
    });
    const result = renderer.render(config, 75, 80, 30);
    expect(result.html).toContain('#f59e0b');
  });

  it('uses red fill for critical value', () => {
    const config = makeConfig({
      displayMode: 'gauge-arc',
      thresholds: { warning: 70, critical: 90 },
    });
    const result = renderer.render(config, 95, 80, 30);
    expect(result.html).toContain('#ef4444');
  });

  it('handles NaN value gracefully', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'gauge-arc' }),
      'invalid',
      80,
      30,
    );
    expect(result.html).toBe('');
  });

  it('clamps value to 0-100 range', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'gauge-arc' }),
      150,
      80,
      30,
    );
    // Should contain the arc path (value clamped to 100)
    expect(result.html).toContain('path');
  });

  it('displays formatted value text', () => {
    const result = renderer.render(
      makeConfig({ displayMode: 'gauge-arc' }),
      42,
      80,
      30,
    );
    expect(result.html).toContain('42');
  });

  it('canRender returns true at 60px', () => {
    expect(renderer.canRender(makeConfig({ displayMode: 'gauge-arc' }), 60)).toBe(true);
  });

  it('canRender returns false below 60px', () => {
    expect(renderer.canRender(makeConfig({ displayMode: 'gauge-arc' }), 59)).toBe(false);
  });
});

// ========================================================================
// registerAllMicroWidgetRenderers
// ========================================================================

describe('registerAllMicroWidgetRenderers', () => {
  it('registers all 4 renderer types', () => {
    const registry = createCellRendererRegistry();
    registerAllMicroWidgetRenderers(registry);
    const types = registry.getRegisteredTypes();
    expect(types).toContain('value-only');
    expect(types).toContain('sparkline');
    expect(types).toContain('delta');
    expect(types).toContain('gauge-arc');
    expect(types).toHaveLength(4);
  });

  it('all registered renderers are functional', () => {
    const registry = createCellRendererRegistry();
    registerAllMicroWidgetRenderers(registry);
    for (const type of registry.getRegisteredTypes()) {
      const renderer = registry.get(type)!;
      expect(renderer).not.toBeNull();
      expect(typeof renderer.render).toBe('function');
      expect(typeof renderer.canRender).toBe('function');
    }
  });
});

// ========================================================================
// Performance sanity check
// ========================================================================

describe('renderer performance', () => {
  it('value-only renderer completes in under 2ms', () => {
    const renderer = createValueOnlyRenderer();
    const config = makeConfig();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      renderer.render(config, i * 10, 100, 30);
    }
    const elapsed = performance.now() - start;
    const perCall = elapsed / 100;
    expect(perCall).toBeLessThan(2);
  });

  it('sparkline renderer completes in under 2ms', () => {
    const renderer = createSparklineRenderer();
    const config = makeConfig({ displayMode: 'sparkline' });
    const data = Array.from({ length: 20 }, (_, i) => Math.random() * 100);
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      renderer.render(config, data, 100, 30);
    }
    const elapsed = performance.now() - start;
    const perCall = elapsed / 100;
    expect(perCall).toBeLessThan(2);
  });

  it('delta renderer completes in under 2ms', () => {
    const renderer = createDeltaRenderer();
    const config = makeConfig({ displayMode: 'delta' });
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      renderer.render(config, { current: 100 + i, previous: 100 }, 120, 30);
    }
    const elapsed = performance.now() - start;
    const perCall = elapsed / 100;
    expect(perCall).toBeLessThan(2);
  });

  it('gauge-arc renderer completes in under 2ms', () => {
    const renderer = createGaugeArcRenderer();
    const config = makeConfig({ displayMode: 'gauge-arc' });
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      renderer.render(config, i, 80, 30);
    }
    const elapsed = performance.now() - start;
    const perCall = elapsed / 100;
    expect(perCall).toBeLessThan(2);
  });
});
