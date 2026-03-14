import { describe, it, expect } from 'vitest';
import {
  type ThumbnailEntry,
  type WidgetThumbnailState,
  createWidgetThumbnailState,
  getThumbnail,
  getThumbnailsByCategory,
  getVariantThumbnail,
  setCustomThumbnail,
  setThumbnailLoading,
  setThumbnailLoaded,
  setThumbnailError,
} from '../widget-thumbnail-state.js';

describe('widget-thumbnail-state', () => {
  // ── createWidgetThumbnailState ──

  describe('createWidgetThumbnailState', () => {
    it('creates state with all 13 default thumbnails', () => {
      const s = createWidgetThumbnailState();
      const types = Object.keys(s.thumbnails);
      expect(types).toHaveLength(13);
    });

    it('includes all expected widget types', () => {
      const s = createWidgetThumbnailState();
      const expectedTypes = [
        'kpi-card', 'kpi-scorecard',
        'bar-chart', 'line-chart', 'area-chart', 'pie-chart',
        'trend-line', 'bottom-n', 'gauge',
        'data-table', 'pivot-table', 'status-table',
        'drill-link',
      ];
      for (const type of expectedTypes) {
        expect(s.thumbnails[type]).toBeDefined();
        expect(s.thumbnails[type].type).toBe(type);
      }
    });

    it('each entry has svgPath, category, and label', () => {
      const s = createWidgetThumbnailState();
      for (const entry of Object.values(s.thumbnails)) {
        expect(typeof entry.svgPath).toBe('string');
        expect(entry.svgPath.length).toBeGreaterThan(0);
        expect(typeof entry.category).toBe('string');
        expect(entry.category.length).toBeGreaterThan(0);
        expect(typeof entry.label).toBe('string');
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it('starts with empty loading set and empty errors', () => {
      const s = createWidgetThumbnailState();
      expect(s.loading.size).toBe(0);
      expect(Object.keys(s.errors)).toHaveLength(0);
    });

    it('assigns correct categories to widget types', () => {
      const s = createWidgetThumbnailState();
      expect(s.thumbnails['kpi-card'].category).toBe('kpis');
      expect(s.thumbnails['kpi-scorecard'].category).toBe('kpis');
      expect(s.thumbnails['bar-chart'].category).toBe('charts');
      expect(s.thumbnails['line-chart'].category).toBe('charts');
      expect(s.thumbnails['area-chart'].category).toBe('charts');
      expect(s.thumbnails['pie-chart'].category).toBe('charts');
      expect(s.thumbnails['trend-line'].category).toBe('charts');
      expect(s.thumbnails['bottom-n'].category).toBe('charts');
      expect(s.thumbnails['gauge'].category).toBe('charts');
      expect(s.thumbnails['data-table'].category).toBe('tables');
      expect(s.thumbnails['pivot-table'].category).toBe('tables');
      expect(s.thumbnails['status-table'].category).toBe('tables');
      expect(s.thumbnails['drill-link'].category).toBe('navigation');
    });

    it('each entry has a variantThumbnails record', () => {
      const s = createWidgetThumbnailState();
      for (const entry of Object.values(s.thumbnails)) {
        expect(typeof entry.variantThumbnails).toBe('object');
        expect(entry.variantThumbnails).not.toBeNull();
      }
    });
  });

  // ── getThumbnail ──

  describe('getThumbnail', () => {
    it('returns entry for a known type', () => {
      const s = createWidgetThumbnailState();
      const entry = getThumbnail(s, 'bar-chart');
      expect(entry).not.toBeNull();
      expect(entry!.type).toBe('bar-chart');
      expect(entry!.category).toBe('charts');
    });

    it('returns null for an unknown type', () => {
      const s = createWidgetThumbnailState();
      const entry = getThumbnail(s, 'nonexistent-widget');
      expect(entry).toBeNull();
    });
  });

  // ── getThumbnailsByCategory ──

  describe('getThumbnailsByCategory', () => {
    it('returns kpi entries for "kpis" category', () => {
      const s = createWidgetThumbnailState();
      const kpis = getThumbnailsByCategory(s, 'kpis');
      expect(kpis).toHaveLength(2);
      const types = kpis.map(e => e.type);
      expect(types).toContain('kpi-card');
      expect(types).toContain('kpi-scorecard');
    });

    it('returns chart entries for "charts" category', () => {
      const s = createWidgetThumbnailState();
      const charts = getThumbnailsByCategory(s, 'charts');
      expect(charts).toHaveLength(7);
      const types = charts.map(e => e.type);
      expect(types).toContain('bar-chart');
      expect(types).toContain('line-chart');
      expect(types).toContain('area-chart');
      expect(types).toContain('pie-chart');
      expect(types).toContain('trend-line');
      expect(types).toContain('bottom-n');
      expect(types).toContain('gauge');
    });

    it('returns table entries for "tables" category', () => {
      const s = createWidgetThumbnailState();
      const tables = getThumbnailsByCategory(s, 'tables');
      expect(tables).toHaveLength(3);
      const types = tables.map(e => e.type);
      expect(types).toContain('data-table');
      expect(types).toContain('pivot-table');
      expect(types).toContain('status-table');
    });

    it('returns navigation entries for "navigation" category', () => {
      const s = createWidgetThumbnailState();
      const nav = getThumbnailsByCategory(s, 'navigation');
      expect(nav).toHaveLength(1);
      expect(nav[0].type).toBe('drill-link');
    });

    it('returns empty array for unknown category', () => {
      const s = createWidgetThumbnailState();
      const result = getThumbnailsByCategory(s, 'unknown-category');
      expect(result).toEqual([]);
    });
  });

  // ── getVariantThumbnail ──

  describe('getVariantThumbnail', () => {
    it('returns variant svg path when present', () => {
      const s = createWidgetThumbnailState();
      // Set up a state with a variant thumbnail
      const entry: ThumbnailEntry = {
        type: 'bar-chart',
        svgPath: 'M0 0',
        category: 'charts',
        label: 'Bar Chart',
        variantThumbnails: { stacked: 'M10 10 L20 20' },
      };
      const withVariant: WidgetThumbnailState = {
        ...s,
        thumbnails: { ...s.thumbnails, 'bar-chart': entry },
      };

      const result = getVariantThumbnail(withVariant, 'bar-chart', 'stacked');
      expect(result).toBe('M10 10 L20 20');
    });

    it('returns null when variant id does not exist', () => {
      const s = createWidgetThumbnailState();
      const result = getVariantThumbnail(s, 'bar-chart', 'nonexistent-variant');
      expect(result).toBeNull();
    });

    it('returns null for unknown widget type', () => {
      const s = createWidgetThumbnailState();
      const result = getVariantThumbnail(s, 'unknown-type', 'some-variant');
      expect(result).toBeNull();
    });
  });

  // ── setCustomThumbnail ──

  describe('setCustomThumbnail', () => {
    it('overrides svgPath for an existing type', () => {
      const s = createWidgetThumbnailState();
      const customPath = 'M99 99 L100 100 Z';
      const next = setCustomThumbnail(s, 'bar-chart', customPath);

      expect(next.thumbnails['bar-chart'].svgPath).toBe(customPath);
      // Other fields should be preserved
      expect(next.thumbnails['bar-chart'].category).toBe('charts');
      expect(next.thumbnails['bar-chart'].label).toBe(s.thumbnails['bar-chart'].label);
    });

    it('returns same state reference for unknown type (no-op)', () => {
      const s = createWidgetThumbnailState();
      const next = setCustomThumbnail(s, 'unknown-type', 'M0 0');
      expect(next).toBe(s);
    });

    it('does not mutate original state', () => {
      const s = createWidgetThumbnailState();
      const originalPath = s.thumbnails['bar-chart'].svgPath;
      setCustomThumbnail(s, 'bar-chart', 'M99 99');
      expect(s.thumbnails['bar-chart'].svgPath).toBe(originalPath);
    });
  });

  // ── setThumbnailLoading ──

  describe('setThumbnailLoading', () => {
    it('adds type to loading set', () => {
      const s = createWidgetThumbnailState();
      const next = setThumbnailLoading(s, 'custom-widget');
      expect(next.loading.has('custom-widget')).toBe(true);
    });

    it('preserves existing loading entries', () => {
      const s = createWidgetThumbnailState();
      const s1 = setThumbnailLoading(s, 'widget-a');
      const s2 = setThumbnailLoading(s1, 'widget-b');
      expect(s2.loading.has('widget-a')).toBe(true);
      expect(s2.loading.has('widget-b')).toBe(true);
    });

    it('does not mutate original state', () => {
      const s = createWidgetThumbnailState();
      setThumbnailLoading(s, 'custom-widget');
      expect(s.loading.size).toBe(0);
    });
  });

  // ── setThumbnailLoaded ──

  describe('setThumbnailLoaded', () => {
    it('sets entry in thumbnails', () => {
      const s = createWidgetThumbnailState();
      const entry: ThumbnailEntry = {
        type: 'custom-widget',
        svgPath: 'M0 0 L10 10',
        category: 'charts',
        label: 'Custom Widget',
        variantThumbnails: {},
      };
      const next = setThumbnailLoaded(s, 'custom-widget', entry);
      expect(next.thumbnails['custom-widget']).toEqual(entry);
    });

    it('removes type from loading set', () => {
      let s = createWidgetThumbnailState();
      s = setThumbnailLoading(s, 'custom-widget');
      expect(s.loading.has('custom-widget')).toBe(true);

      const entry: ThumbnailEntry = {
        type: 'custom-widget',
        svgPath: 'M0 0',
        category: 'charts',
        label: 'Custom',
        variantThumbnails: {},
      };
      const next = setThumbnailLoaded(s, 'custom-widget', entry);
      expect(next.loading.has('custom-widget')).toBe(false);
    });

    it('clears any existing error for the type', () => {
      let s = createWidgetThumbnailState();
      s = setThumbnailError(s, 'custom-widget', 'Failed to load');
      expect(s.errors['custom-widget']).toBe('Failed to load');

      const entry: ThumbnailEntry = {
        type: 'custom-widget',
        svgPath: 'M0 0',
        category: 'charts',
        label: 'Custom',
        variantThumbnails: {},
      };
      const next = setThumbnailLoaded(s, 'custom-widget', entry);
      expect(next.errors['custom-widget']).toBeUndefined();
    });

    it('does not mutate original state', () => {
      let s = createWidgetThumbnailState();
      s = setThumbnailLoading(s, 'custom-widget');

      const entry: ThumbnailEntry = {
        type: 'custom-widget',
        svgPath: 'M0 0',
        category: 'charts',
        label: 'Custom',
        variantThumbnails: {},
      };
      const before = s.loading.size;
      setThumbnailLoaded(s, 'custom-widget', entry);
      expect(s.loading.size).toBe(before);
    });
  });

  // ── setThumbnailError ──

  describe('setThumbnailError', () => {
    it('sets error message for the type', () => {
      const s = createWidgetThumbnailState();
      const next = setThumbnailError(s, 'custom-widget', 'Network error');
      expect(next.errors['custom-widget']).toBe('Network error');
    });

    it('removes type from loading set', () => {
      let s = createWidgetThumbnailState();
      s = setThumbnailLoading(s, 'custom-widget');
      expect(s.loading.has('custom-widget')).toBe(true);

      const next = setThumbnailError(s, 'custom-widget', 'Timeout');
      expect(next.loading.has('custom-widget')).toBe(false);
    });

    it('does not mutate original state', () => {
      const s = createWidgetThumbnailState();
      setThumbnailError(s, 'custom-widget', 'Error');
      expect(s.errors['custom-widget']).toBeUndefined();
      expect(s.loading.size).toBe(0);
    });
  });

  // ── Immutability ──

  describe('immutability', () => {
    it('all mutation functions return new state objects', () => {
      const s = createWidgetThumbnailState();

      const s1 = setCustomThumbnail(s, 'bar-chart', 'M99 99');
      expect(s1).not.toBe(s);

      const s2 = setThumbnailLoading(s, 'custom');
      expect(s2).not.toBe(s);

      const entry: ThumbnailEntry = {
        type: 'custom',
        svgPath: 'M0 0',
        category: 'charts',
        label: 'Custom',
        variantThumbnails: {},
      };
      const s3 = setThumbnailLoaded(s2, 'custom', entry);
      expect(s3).not.toBe(s2);

      const s4 = setThumbnailError(s, 'custom', 'err');
      expect(s4).not.toBe(s);

      // Original state unchanged
      expect(Object.keys(s.thumbnails)).toHaveLength(13);
      expect(s.loading.size).toBe(0);
      expect(Object.keys(s.errors)).toHaveLength(0);
    });

    it('no-op setCustomThumbnail returns same reference', () => {
      const s = createWidgetThumbnailState();
      const next = setCustomThumbnail(s, 'unknown-type', 'M0 0');
      expect(next).toBe(s);
    });
  });

  // ── SVG path distinctness ──

  describe('default SVG paths', () => {
    it('all 13 default thumbnails have distinct svgPath values', () => {
      const s = createWidgetThumbnailState();
      const paths = Object.values(s.thumbnails).map(e => e.svgPath);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(13);
    });
  });
});
