import { describe, it, expect } from 'vitest';
import type { WidgetCommonConfig } from '../types.js';
import { isWidgetCommonConfig, defaultWidgetCommonConfig } from '../types.js';

describe('WidgetCommonConfig', () => {
  describe('defaultWidgetCommonConfig', () => {
    it('provides sensible defaults', () => {
      const cfg = defaultWidgetCommonConfig();
      expect(cfg.title).toBe('');
      expect(cfg.padding).toBe('default');
      expect(cfg.loadingBehavior).toBe('skeleton');
      expect(cfg.clickAction).toBe('none');
      expect(cfg.highContrastMode).toBe('auto');
    });

    it('allows partial overrides', () => {
      const cfg = defaultWidgetCommonConfig({
        title: 'Revenue',
        padding: 'compact',
        enableDrillThrough: true,
      });
      expect(cfg.title).toBe('Revenue');
      expect(cfg.padding).toBe('compact');
      expect(cfg.enableDrillThrough).toBe(true);
      // defaults still in place
      expect(cfg.loadingBehavior).toBe('skeleton');
      expect(cfg.clickAction).toBe('none');
    });

    it('override does not mutate returned defaults', () => {
      const a = defaultWidgetCommonConfig();
      const b = defaultWidgetCommonConfig({ title: 'X' });
      expect(a.title).toBe('');
      expect(b.title).toBe('X');
    });
  });

  describe('isWidgetCommonConfig', () => {
    it('returns true for valid config', () => {
      const config: WidgetCommonConfig = {
        title: 'Test',
        padding: 'default',
        loadingBehavior: 'skeleton',
        clickAction: 'none',
        highContrastMode: 'auto',
      };
      expect(isWidgetCommonConfig(config)).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(isWidgetCommonConfig(null)).toBe(false);
      expect(isWidgetCommonConfig(undefined)).toBe(false);
    });

    it('returns false for non-object', () => {
      expect(isWidgetCommonConfig('str')).toBe(false);
    });

    it('returns false when required fields are missing', () => {
      expect(isWidgetCommonConfig({ title: 'Test' })).toBe(false);
    });

    it('returns true with optional fields', () => {
      const config: WidgetCommonConfig = {
        title: 'Revenue KPI',
        subtitle: 'Q4 2025',
        description: 'Quarterly revenue',
        colorOverride: '#ff0000',
        hideHeader: true,
        padding: 'none',
        emptyStateMessage: 'No data',
        loadingBehavior: 'spinner',
        enableDrillThrough: true,
        enableCrossFilter: false,
        enableExport: true,
        clickAction: 'drill',
        minHeight: 200,
        aspectRatio: 1.5,
        ariaLabel: 'Revenue KPI card',
        highContrastMode: 'force',
      };
      expect(isWidgetCommonConfig(config)).toBe(true);
    });
  });
});
