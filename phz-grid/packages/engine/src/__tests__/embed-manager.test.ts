import { describe, it, expect } from 'vitest';
import {
  EmbedManager,
  type EmbedOptions,
} from '../embed-manager.js';
import { dashboardId } from '../types.js';
import { createEnhancedDashboardConfig } from '../dashboard-enhanced.js';

function makeDashboard() {
  return createEnhancedDashboardConfig(
    dashboardId('dash-1'),
    'Test Dashboard',
  );
}

describe('EmbedManager', () => {
  describe('generateEmbedCode', () => {
    it('generates valid HTML embed snippet', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      mgr.registerDashboard(dashboard);

      const code = mgr.generateEmbedCode('dash-1');
      expect(code).toContain('<phz-dashboard');
      expect(code).toContain('</phz-dashboard>');
    });

    it('includes config attribute in embed code', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      mgr.registerDashboard(dashboard);

      const code = mgr.generateEmbedCode('dash-1');
      expect(code).toContain('config=');
    });

    it('applies width and height options', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      mgr.registerDashboard(dashboard);

      const options: EmbedOptions = { width: '800px', height: '600px' };
      const code = mgr.generateEmbedCode('dash-1', options);
      expect(code).toContain('width: 800px');
      expect(code).toContain('height: 600px');
    });

    it('applies theme option', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      mgr.registerDashboard(dashboard);

      const code = mgr.generateEmbedCode('dash-1', { theme: 'dark' });
      expect(code).toContain('theme="dark"');
    });

    it('applies hideControls option', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      mgr.registerDashboard(dashboard);

      const code = mgr.generateEmbedCode('dash-1', { hideControls: true });
      expect(code).toContain('hide-controls');
    });

    it('throws for unknown dashboard', () => {
      const mgr = new EmbedManager();
      expect(() => mgr.generateEmbedCode('unknown')).toThrow('Dashboard not found');
    });
  });

  describe('config serialization roundtrip', () => {
    it('serializes and deserializes config perfectly', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      dashboard.description = 'A test dashboard';
      dashboard.layout.columns = 4;
      dashboard.layout.gap = 12;
      mgr.registerDashboard(dashboard);

      const json = mgr.generateShareableConfig('dash-1');
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe(2);
      expect(parsed.id).toBe('dash-1');
      expect(parsed.name).toBe('Test Dashboard');
      expect(parsed.description).toBe('A test dashboard');
      expect(parsed.layout.columns).toBe(4);
      expect(parsed.layout.gap).toBe(12);
    });

    it('roundtrips through serialize/deserialize', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      dashboard.layout.columns = 5;
      mgr.registerDashboard(dashboard);

      const json = mgr.generateShareableConfig('dash-1');
      const restored = mgr.loadFromShareableConfig(json);

      expect(restored.id).toBe(dashboard.id);
      expect(restored.name).toBe(dashboard.name);
      expect(restored.layout.columns).toBe(5);
      expect(restored.version).toBe(2);
    });

    it('preserves widgets in roundtrip', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      dashboard.widgets = [
        {
          id: 'w1' as any,
          type: 'kpi-card',
          name: 'Revenue',
          data: {} as any,
          appearance: {} as any,
          behaviour: {} as any,
        },
      ];
      dashboard.placements = [
        { widgetId: 'w1' as any, column: 0, order: 0, colSpan: 1 },
      ];
      mgr.registerDashboard(dashboard);

      const json = mgr.generateShareableConfig('dash-1');
      const restored = mgr.loadFromShareableConfig(json);

      expect(restored.widgets).toHaveLength(1);
      expect(restored.widgets[0].name).toBe('Revenue');
      expect(restored.placements).toHaveLength(1);
    });

    it('preserves global filters in roundtrip', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      dashboard.globalFilters = [
        { id: 'f1', label: 'Region', fieldKey: 'region', filterType: 'select' },
      ];
      mgr.registerDashboard(dashboard);

      const json = mgr.generateShareableConfig('dash-1');
      const restored = mgr.loadFromShareableConfig(json);

      expect(restored.globalFilters).toHaveLength(1);
      expect(restored.globalFilters[0].label).toBe('Region');
    });

    it('throws for invalid JSON in loadFromShareableConfig', () => {
      const mgr = new EmbedManager();
      expect(() => mgr.loadFromShareableConfig('not json')).toThrow();
    });

    it('throws for missing version in loadFromShareableConfig', () => {
      const mgr = new EmbedManager();
      const invalid = JSON.stringify({ id: 'x', name: 'x' });
      expect(() => mgr.loadFromShareableConfig(invalid)).toThrow('Invalid config');
    });

    it('throws for unknown dashboard in generateShareableConfig', () => {
      const mgr = new EmbedManager();
      expect(() => mgr.generateShareableConfig('unknown')).toThrow('Dashboard not found');
    });
  });

  describe('embed options with filterDefaults', () => {
    it('includes filter defaults in embed code', () => {
      const mgr = new EmbedManager();
      const dashboard = makeDashboard();
      mgr.registerDashboard(dashboard);

      const defaults = { region: 'US', year: 2025 };
      const code = mgr.generateEmbedCode('dash-1', { filterDefaults: defaults });
      expect(code).toContain('filter-defaults=');
      // Verify the base64-encoded value decodes to the original defaults
      const match = code.match(/filter-defaults="([^"]+)"/);
      expect(match).not.toBeNull();
      const decoded = JSON.parse(decodeURIComponent(escape(atob(match![1]))));
      expect(decoded).toEqual(defaults);
    });
  });
});
