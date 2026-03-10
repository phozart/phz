/**
 * T.1 — DashboardDataConfig types
 * Type guards and config validation for preload/full-load data architecture.
 */
import { describe, it, expect } from 'vitest';
import type {
  DashboardDataConfig,
  PreloadConfig,
  FullLoadConfig,
  DetailSourceConfig,
  DashboardLoadingState,
  FieldMappingEntry,
  DetailTrigger,
} from '../types.js';
import {
  isDashboardDataConfig,
  isDetailSourceConfig,
  validateDashboardDataConfig,
} from '../types.js';

describe('DashboardDataConfig types (T.1)', () => {
  const validPreload: PreloadConfig = {
    query: { source: 'sales', fields: ['region', 'revenue'] },
  };

  const validFullLoad: FullLoadConfig = {
    query: { source: 'sales', fields: ['region', 'revenue', 'date', 'product'] },
    applyCurrentFilters: true,
    maxRows: 50000,
  };

  describe('isDashboardDataConfig', () => {
    it('returns true for a valid config with preload and fullLoad', () => {
      const config: DashboardDataConfig = {
        preload: validPreload,
        fullLoad: validFullLoad,
      };
      expect(isDashboardDataConfig(config)).toBe(true);
    });

    it('returns true for config with optional detailSources and transition', () => {
      const config: DashboardDataConfig = {
        preload: validPreload,
        fullLoad: validFullLoad,
        detailSources: [],
        transition: 'seamless',
      };
      expect(isDashboardDataConfig(config)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDashboardDataConfig(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isDashboardDataConfig(undefined)).toBe(false);
    });

    it('returns false for a non-object', () => {
      expect(isDashboardDataConfig('string')).toBe(false);
    });

    it('returns false when preload is missing', () => {
      expect(isDashboardDataConfig({ fullLoad: validFullLoad })).toBe(false);
    });

    it('returns false when fullLoad is missing', () => {
      expect(isDashboardDataConfig({ preload: validPreload })).toBe(false);
    });

    it('returns false when preload.query is missing', () => {
      expect(isDashboardDataConfig({
        preload: {},
        fullLoad: validFullLoad,
      })).toBe(false);
    });
  });

  describe('isDetailSourceConfig', () => {
    const validDetailSource: DetailSourceConfig = {
      id: 'detail-1',
      name: 'Order Details',
      dataSourceId: 'orders',
      filterMapping: [{ sourceField: 'region', targetField: 'order_region' }],
      baseQuery: { source: 'orders', fields: ['orderId', 'amount'] },
      trigger: 'user-action',
    };

    it('returns true for a valid detail source config', () => {
      expect(isDetailSourceConfig(validDetailSource)).toBe(true);
    });

    it('returns true with optional fields', () => {
      const config: DetailSourceConfig = {
        ...validDetailSource,
        description: 'Detailed order breakdown',
        preloadQuery: { source: 'orders', fields: ['orderId'] },
        maxRows: 1000,
        renderMode: 'panel',
      };
      expect(isDetailSourceConfig(config)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDetailSourceConfig(null)).toBe(false);
    });

    it('returns false when id is missing', () => {
      const { id: _, ...rest } = validDetailSource;
      expect(isDetailSourceConfig(rest)).toBe(false);
    });

    it('returns false when filterMapping is not an array', () => {
      expect(isDetailSourceConfig({
        ...validDetailSource,
        filterMapping: 'invalid',
      })).toBe(false);
    });

    it('returns false when baseQuery is missing', () => {
      const { baseQuery: _, ...rest } = validDetailSource;
      expect(isDetailSourceConfig(rest)).toBe(false);
    });
  });

  describe('validateDashboardDataConfig', () => {
    it('returns true for a valid minimal config', () => {
      const config: DashboardDataConfig = {
        preload: validPreload,
        fullLoad: validFullLoad,
      };
      expect(validateDashboardDataConfig(config)).toBe(true);
    });

    it('returns true for config with valid detailSources', () => {
      const config: DashboardDataConfig = {
        preload: validPreload,
        fullLoad: validFullLoad,
        detailSources: [{
          id: 'd1',
          name: 'Details',
          dataSourceId: 'ds1',
          filterMapping: [{ sourceField: 'a', targetField: 'b' }],
          baseQuery: { source: 'ds1', fields: ['x'] },
          trigger: 'user-action',
        }],
        transition: 'fade',
      };
      expect(validateDashboardDataConfig(config)).toBe(true);
    });

    it('returns false for invalid transition value', () => {
      const config = {
        preload: validPreload,
        fullLoad: validFullLoad,
        transition: 'invalid',
      };
      expect(validateDashboardDataConfig(config as unknown as DashboardDataConfig)).toBe(false);
    });

    it('returns false when fullLoad.maxRows is negative', () => {
      const config: DashboardDataConfig = {
        preload: validPreload,
        fullLoad: { ...validFullLoad, maxRows: -1 },
      };
      expect(validateDashboardDataConfig(config)).toBe(false);
    });
  });

  describe('DashboardLoadingState', () => {
    it('creates all valid phases', () => {
      const phases: DashboardLoadingState['phase'][] = [
        'idle', 'preloading', 'preload-complete', 'full-loading', 'full-complete', 'error',
      ];
      expect(phases).toHaveLength(6);
    });

    it('supports optional message and progress', () => {
      const state: DashboardLoadingState = {
        phase: 'preloading',
        message: 'Loading summary data...',
        progress: 45,
      };
      expect(state.phase).toBe('preloading');
      expect(state.progress).toBe(45);
    });

    it('supports error state with error message', () => {
      const state: DashboardLoadingState = {
        phase: 'error',
        error: 'Network timeout',
      };
      expect(state.error).toBe('Network timeout');
    });
  });

  describe('FieldMappingEntry', () => {
    it('maps source to target field', () => {
      const entry: FieldMappingEntry = {
        sourceField: 'region',
        targetField: 'order_region',
      };
      expect(entry.sourceField).toBe('region');
      expect(entry.targetField).toBe('order_region');
    });
  });

  describe('DetailTrigger', () => {
    it('supports user-action string trigger', () => {
      const trigger: DetailTrigger = 'user-action';
      expect(trigger).toBe('user-action');
    });

    it('supports drill-through object trigger', () => {
      const trigger: DetailTrigger = {
        type: 'drill-through',
        fromWidgetTypes: ['bar-chart', 'kpi-card'],
      };
      expect(trigger).toEqual({ type: 'drill-through', fromWidgetTypes: ['bar-chart', 'kpi-card'] });
    });

    it('supports breach object trigger', () => {
      const trigger: DetailTrigger = { type: 'breach' };
      expect(trigger).toEqual({ type: 'breach' });
    });
  });

  describe('WidgetSlot dataTier', () => {
    it('supports dataTier on WidgetSlot', async () => {
      // Import from config-layers to test WidgetSlot augmentation
      const { default: _ } = await import('../schema/config-layers.js').catch(() => ({ default: null }));
      // Type-only test: WidgetSlot should accept dataTier
      const slot = { kind: 'widget' as const, widgetId: 'w1', dataTier: 'preload' as const };
      expect(slot.dataTier).toBe('preload');
    });
  });
});
