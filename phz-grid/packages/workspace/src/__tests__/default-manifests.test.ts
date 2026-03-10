import { describe, it, expect } from 'vitest';
import { createManifestRegistry } from '../registry/widget-registry.js';
import { registerDefaultManifests, DEFAULT_WIDGET_TYPES } from '../registry/default-manifests.js';
import { isWidgetManifest, validateWidgetSizeBounds, validateWidgetVariants } from '../types.js';

describe('Default Manifests', () => {
  function createPopulatedRegistry() {
    const registry = createManifestRegistry();
    registerDefaultManifests(registry);
    return registry;
  }

  it('registers all 13 widget types', () => {
    const registry = createPopulatedRegistry();
    const manifests = registry.listManifests();
    expect(manifests.length).toBe(13);
  });

  it('DEFAULT_WIDGET_TYPES lists all 13 type strings', () => {
    expect(DEFAULT_WIDGET_TYPES).toHaveLength(13);
    expect(DEFAULT_WIDGET_TYPES).toContain('kpi-card');
    expect(DEFAULT_WIDGET_TYPES).toContain('kpi-scorecard');
    expect(DEFAULT_WIDGET_TYPES).toContain('bar-chart');
    expect(DEFAULT_WIDGET_TYPES).toContain('pie-chart');
    expect(DEFAULT_WIDGET_TYPES).toContain('trend-line');
    expect(DEFAULT_WIDGET_TYPES).toContain('bottom-n');
    expect(DEFAULT_WIDGET_TYPES).toContain('gauge');
    expect(DEFAULT_WIDGET_TYPES).toContain('line-chart');
    expect(DEFAULT_WIDGET_TYPES).toContain('area-chart');
    expect(DEFAULT_WIDGET_TYPES).toContain('data-table');
    expect(DEFAULT_WIDGET_TYPES).toContain('pivot-table');
    expect(DEFAULT_WIDGET_TYPES).toContain('status-table');
    expect(DEFAULT_WIDGET_TYPES).toContain('drill-link');
  });

  it('every manifest passes isWidgetManifest', () => {
    const registry = createPopulatedRegistry();
    for (const m of registry.listManifests()) {
      expect(isWidgetManifest(m), `${m.type} should be a valid WidgetManifest`).toBe(true);
    }
  });

  it('every manifest has valid size bounds', () => {
    const registry = createPopulatedRegistry();
    for (const m of registry.listManifests()) {
      expect(
        validateWidgetSizeBounds(m.minSize, m.preferredSize, m.maxSize),
        `${m.type} size bounds invalid`,
      ).toBe(true);
    }
  });

  it('every manifest has unique variant IDs', () => {
    const registry = createPopulatedRegistry();
    for (const m of registry.listManifests()) {
      expect(
        validateWidgetVariants(m.variants),
        `${m.type} has duplicate variant IDs`,
      ).toBe(true);
    }
  });

  describe('kpi-card', () => {
    it('has 4 variants', () => {
      const registry = createPopulatedRegistry();
      expect(registry.getVariants('kpi-card')).toHaveLength(4);
    });

    it('is in kpis category', () => {
      const registry = createPopulatedRegistry();
      expect(registry.getManifest('kpi-card')!.category).toBe('kpis');
    });
  });

  describe('bar-chart', () => {
    it('has 4 variants', () => {
      const registry = createPopulatedRegistry();
      expect(registry.getVariants('bar-chart')).toHaveLength(4);
    });

    it('is in charts category', () => {
      const registry = createPopulatedRegistry();
      expect(registry.getManifest('bar-chart')!.category).toBe('charts');
    });
  });

  describe('pie-chart', () => {
    it('has 3 variants', () => {
      const registry = createPopulatedRegistry();
      expect(registry.getVariants('pie-chart')).toHaveLength(3);
    });
  });

  describe('categories', () => {
    it('lists charts category', () => {
      const registry = createPopulatedRegistry();
      const charts = registry.listByCategory('charts');
      expect(charts.length).toBeGreaterThanOrEqual(5);
    });

    it('lists kpis category', () => {
      const registry = createPopulatedRegistry();
      const kpis = registry.listByCategory('kpis');
      expect(kpis.length).toBeGreaterThanOrEqual(2);
    });

    it('lists tables category', () => {
      const registry = createPopulatedRegistry();
      const tables = registry.listByCategory('tables');
      expect(tables.length).toBeGreaterThanOrEqual(3);
    });
  });
});
