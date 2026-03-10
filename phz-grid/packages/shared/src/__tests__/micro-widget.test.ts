/**
 * Tests for MicroWidgetCellConfig types, SparklineDataBinding,
 * and CellRendererRegistry (7A-B).
 */
import { describe, it, expect } from 'vitest';
import {
  createCellRendererRegistry,
} from '@phozart/phz-shared/types';
import type {
  MicroWidgetDisplayMode,
  MicroWidgetType,
  MicroWidgetCellConfig,
  SparklineDataBinding,
  MicroWidgetRenderResult,
  MicroWidgetRenderer,
  CellRendererRegistry,
} from '@phozart/phz-shared/types';

// ========================================================================
// Type-level validation (compile-time checks via assignments)
// ========================================================================

describe('MicroWidgetDisplayMode', () => {
  it('accepts all four valid display modes', () => {
    const modes: MicroWidgetDisplayMode[] = ['value-only', 'sparkline', 'delta', 'gauge-arc'];
    expect(modes).toHaveLength(4);
  });

  it('each mode is a string', () => {
    const mode: MicroWidgetDisplayMode = 'value-only';
    expect(typeof mode).toBe('string');
  });
});

describe('MicroWidgetType', () => {
  it('accepts all four valid widget types', () => {
    const types: MicroWidgetType[] = ['trend-line', 'gauge', 'kpi-card', 'scorecard'];
    expect(types).toHaveLength(4);
  });

  it('each type is a string', () => {
    const t: MicroWidgetType = 'trend-line';
    expect(typeof t).toBe('string');
  });
});

describe('MicroWidgetCellConfig', () => {
  it('can be created with all required fields', () => {
    const config: MicroWidgetCellConfig = {
      widgetType: 'gauge',
      dataBinding: { valueField: 'revenue' },
      displayMode: 'gauge-arc',
    };
    expect(config.widgetType).toBe('gauge');
    expect(config.dataBinding.valueField).toBe('revenue');
    expect(config.displayMode).toBe('gauge-arc');
    expect(config.thresholds).toBeUndefined();
  });

  it('accepts optional compareField and sparklineField', () => {
    const config: MicroWidgetCellConfig = {
      widgetType: 'kpi-card',
      dataBinding: {
        valueField: 'current',
        compareField: 'previous',
        sparklineField: 'history',
      },
      displayMode: 'delta',
    };
    expect(config.dataBinding.compareField).toBe('previous');
    expect(config.dataBinding.sparklineField).toBe('history');
  });

  it('accepts optional thresholds with warning only', () => {
    const config: MicroWidgetCellConfig = {
      widgetType: 'scorecard',
      dataBinding: { valueField: 'score' },
      displayMode: 'value-only',
      thresholds: { warning: 70 },
    };
    expect(config.thresholds?.warning).toBe(70);
    expect(config.thresholds?.critical).toBeUndefined();
  });

  it('accepts optional thresholds with both warning and critical', () => {
    const config: MicroWidgetCellConfig = {
      widgetType: 'gauge',
      dataBinding: { valueField: 'cpu' },
      displayMode: 'gauge-arc',
      thresholds: { warning: 70, critical: 90 },
    };
    expect(config.thresholds?.warning).toBe(70);
    expect(config.thresholds?.critical).toBe(90);
  });
});

describe('SparklineDataBinding', () => {
  it('can specify inline-array source', () => {
    const binding: SparklineDataBinding = {
      source: 'inline-array',
      field: 'history',
    };
    expect(binding.source).toBe('inline-array');
    expect(binding.field).toBe('history');
    expect(binding.aggregation).toBeUndefined();
    expect(binding.points).toBeUndefined();
  });

  it('can specify group-aggregate source with aggregation', () => {
    const binding: SparklineDataBinding = {
      source: 'group-aggregate',
      field: 'revenue',
      aggregation: 'sum',
      points: 10,
    };
    expect(binding.source).toBe('group-aggregate');
    expect(binding.aggregation).toBe('sum');
    expect(binding.points).toBe(10);
  });

  it('defaults points to undefined (renderer uses 20)', () => {
    const binding: SparklineDataBinding = {
      source: 'inline-array',
      field: 'data',
    };
    expect(binding.points).toBeUndefined();
  });
});

describe('MicroWidgetRenderResult', () => {
  it('contains html, width, and height', () => {
    const result: MicroWidgetRenderResult = {
      html: '<svg></svg>',
      width: 100,
      height: 30,
    };
    expect(result.html).toBe('<svg></svg>');
    expect(result.width).toBe(100);
    expect(result.height).toBe(30);
  });
});

// ========================================================================
// CellRendererRegistry CRUD
// ========================================================================

describe('createCellRendererRegistry', () => {
  function makeMockRenderer(): MicroWidgetRenderer {
    return {
      render: (_config, _value, width, height) => ({
        html: '<svg>mock</svg>',
        width,
        height,
      }),
      canRender: () => true,
    };
  }

  it('creates an empty registry', () => {
    const registry = createCellRendererRegistry();
    expect(registry.getRegisteredTypes()).toEqual([]);
  });

  it('returns null for unregistered type', () => {
    const registry = createCellRendererRegistry();
    expect(registry.get('unknown')).toBeNull();
  });

  it('has() returns false for unregistered type', () => {
    const registry = createCellRendererRegistry();
    expect(registry.has('sparkline')).toBe(false);
  });

  it('can register and retrieve a renderer', () => {
    const registry = createCellRendererRegistry();
    const renderer = makeMockRenderer();
    registry.register('value-only', renderer);
    expect(registry.get('value-only')).toBe(renderer);
    expect(registry.has('value-only')).toBe(true);
  });

  it('lists registered types', () => {
    const registry = createCellRendererRegistry();
    registry.register('sparkline', makeMockRenderer());
    registry.register('delta', makeMockRenderer());
    const types = registry.getRegisteredTypes();
    expect(types).toContain('sparkline');
    expect(types).toContain('delta');
    expect(types).toHaveLength(2);
  });

  it('overwrites existing registration for same type', () => {
    const registry = createCellRendererRegistry();
    const r1 = makeMockRenderer();
    const r2 = makeMockRenderer();
    registry.register('gauge-arc', r1);
    registry.register('gauge-arc', r2);
    expect(registry.get('gauge-arc')).toBe(r2);
    expect(registry.getRegisteredTypes()).toHaveLength(1);
  });

  it('each call creates an independent registry', () => {
    const r1 = createCellRendererRegistry();
    const r2 = createCellRendererRegistry();
    r1.register('sparkline', makeMockRenderer());
    expect(r1.has('sparkline')).toBe(true);
    expect(r2.has('sparkline')).toBe(false);
  });

  it('registered renderer render() is callable', () => {
    const registry = createCellRendererRegistry();
    registry.register('test', makeMockRenderer());
    const renderer = registry.get('test')!;
    const config: MicroWidgetCellConfig = {
      widgetType: 'kpi-card',
      dataBinding: { valueField: 'v' },
      displayMode: 'value-only',
    };
    const result = renderer.render(config, 42, 100, 30);
    expect(result.html).toBe('<svg>mock</svg>');
    expect(result.width).toBe(100);
    expect(result.height).toBe(30);
  });
});
