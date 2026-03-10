import { describe, it, expect, vi } from 'vitest';
import { createManifestRegistry } from '../registry/widget-registry.js';
import type { WidgetManifest, WidgetVariant } from '../types.js';

function makeManifest(overrides: Partial<WidgetManifest> = {}): WidgetManifest {
  return {
    type: 'bar-chart',
    category: 'charts',
    name: 'Bar Chart',
    description: 'A bar chart widget',
    requiredFields: [
      { name: 'value', dataType: 'number', role: 'measure', required: true },
    ],
    supportedAggregations: ['sum', 'avg'],
    minSize: { cols: 2, rows: 2 },
    preferredSize: { cols: 4, rows: 3 },
    maxSize: { cols: 12, rows: 8 },
    supportedInteractions: ['drill-through', 'cross-filter'],
    variants: [
      { id: 'stacked', name: 'Stacked', description: 'Stacked bars', presetConfig: { stacked: true } },
      { id: 'grouped', name: 'Grouped', description: 'Grouped bars', presetConfig: { grouped: true } },
    ],
    ...overrides,
  };
}

describe('ManifestRegistry', () => {
  describe('registerManifest / getManifest', () => {
    it('registers and retrieves a manifest', () => {
      const registry = createManifestRegistry();
      const manifest = makeManifest();
      registry.registerManifest(manifest);
      expect(registry.getManifest('bar-chart')).toBe(manifest);
    });

    it('returns undefined for unknown type', () => {
      const registry = createManifestRegistry();
      expect(registry.getManifest('nonexistent')).toBeUndefined();
    });

    it('allows overriding a manifest', () => {
      const registry = createManifestRegistry();
      const m1 = makeManifest();
      const m2 = makeManifest({ name: 'Bar Chart v2' });
      registry.registerManifest(m1);
      registry.registerManifest(m2);
      expect(registry.getManifest('bar-chart')!.name).toBe('Bar Chart v2');
    });
  });

  describe('listManifests', () => {
    it('lists all registered manifests', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest({ type: 'bar-chart' }));
      registry.registerManifest(makeManifest({ type: 'pie-chart', category: 'charts' }));
      registry.registerManifest(makeManifest({ type: 'kpi-card', category: 'kpis' }));
      const all = registry.listManifests();
      expect(all).toHaveLength(3);
      expect(all.map(m => m.type)).toContain('bar-chart');
      expect(all.map(m => m.type)).toContain('pie-chart');
      expect(all.map(m => m.type)).toContain('kpi-card');
    });

    it('returns empty array when no manifests registered', () => {
      const registry = createManifestRegistry();
      expect(registry.listManifests()).toEqual([]);
    });
  });

  describe('listByCategory', () => {
    it('filters manifests by category', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest({ type: 'bar-chart', category: 'charts' }));
      registry.registerManifest(makeManifest({ type: 'pie-chart', category: 'charts' }));
      registry.registerManifest(makeManifest({ type: 'kpi-card', category: 'kpis' }));
      const charts = registry.listByCategory('charts');
      expect(charts).toHaveLength(2);
      expect(charts.every(m => m.category === 'charts')).toBe(true);
    });

    it('returns empty array for unknown category', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest());
      expect(registry.listByCategory('unknown')).toEqual([]);
    });
  });

  describe('findByCapabilities', () => {
    it('finds manifests that support specific interactions', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest({
        type: 'bar-chart',
        supportedInteractions: ['drill-through', 'cross-filter'],
      }));
      registry.registerManifest(makeManifest({
        type: 'kpi-card',
        supportedInteractions: ['click-detail'],
      }));
      const drillable = registry.findByCapabilities({ interactions: ['drill-through'] });
      expect(drillable).toHaveLength(1);
      expect(drillable[0].type).toBe('bar-chart');
    });

    it('finds manifests that support required field roles', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest({
        type: 'bar-chart',
        requiredFields: [
          { name: 'value', dataType: 'number', role: 'measure', required: true },
          { name: 'cat', dataType: 'string', role: 'dimension', required: true },
        ],
      }));
      registry.registerManifest(makeManifest({
        type: 'kpi-card',
        requiredFields: [
          { name: 'value', dataType: 'number', role: 'measure', required: true },
        ],
      }));
      const withDimension = registry.findByCapabilities({ fieldRoles: ['dimension'] });
      expect(withDimension).toHaveLength(1);
      expect(withDimension[0].type).toBe('bar-chart');
    });

    it('returns all manifests when no constraints given', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest({ type: 'a' }));
      registry.registerManifest(makeManifest({ type: 'b' }));
      expect(registry.findByCapabilities({})).toHaveLength(2);
    });
  });

  describe('getVariants / resolveVariant', () => {
    it('returns variants for a manifest type', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest());
      const variants = registry.getVariants('bar-chart');
      expect(variants).toHaveLength(2);
      expect(variants[0].id).toBe('stacked');
    });

    it('returns empty array for unknown type', () => {
      const registry = createManifestRegistry();
      expect(registry.getVariants('nonexistent')).toEqual([]);
    });

    it('resolves a specific variant by id', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest());
      const variant = registry.resolveVariant('bar-chart', 'stacked');
      expect(variant).toBeDefined();
      expect(variant!.id).toBe('stacked');
      expect(variant!.presetConfig).toEqual({ stacked: true });
    });

    it('returns undefined for unknown variant id', () => {
      const registry = createManifestRegistry();
      registry.registerManifest(makeManifest());
      expect(registry.resolveVariant('bar-chart', 'nonexistent')).toBeUndefined();
    });

    it('returns undefined for unknown type', () => {
      const registry = createManifestRegistry();
      expect(registry.resolveVariant('nonexistent', 'any')).toBeUndefined();
    });
  });

  describe('backward compatibility', () => {
    it('createWidgetRegistry still works independently', async () => {
      // Imported separately to prove no breaking changes
      const { createWidgetRegistry } = await import('../registry/widget-registry.js');
      const registry = createWidgetRegistry();
      const renderer = { type: 'test', render: vi.fn() };
      registry.register('test', renderer);
      expect(registry.get('test')).toBe(renderer);
      expect(registry.has('test')).toBe(true);
      expect(registry.list()).toEqual(['test']);
    });
  });
});
