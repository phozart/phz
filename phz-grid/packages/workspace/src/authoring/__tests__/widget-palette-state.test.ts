import { describe, it, expect } from 'vitest';
import {
  type WidgetPaletteState,
  initialWidgetPaletteState,
  setPaletteTab,
  setWidgetSearch,
  toggleWidgetCategory,
  getFilteredWidgets,
} from '../widget-palette-state.js';
import type { WidgetManifest } from '../../types.js';

function makeManifest(overrides: Partial<WidgetManifest> & { type: string; category: string; name: string }): WidgetManifest {
  return {
    description: `A ${overrides.name}`,
    thumbnail: undefined,
    requiredFields: [],
    supportedAggregations: [],
    minSize: { cols: 1, rows: 1 },
    preferredSize: { cols: 4, rows: 3 },
    maxSize: { cols: 12, rows: 8 },
    supportedInteractions: [],
    variants: [],
    ...overrides,
  };
}

const MANIFESTS: WidgetManifest[] = [
  makeManifest({ type: 'bar-chart', category: 'category-chart', name: 'Bar Chart' }),
  makeManifest({ type: 'line-chart', category: 'category-chart', name: 'Line Chart' }),
  makeManifest({ type: 'kpi-card', category: 'single-value', name: 'KPI Card' }),
  makeManifest({ type: 'gauge', category: 'single-value', name: 'Gauge' }),
  makeManifest({ type: 'data-table', category: 'tabular', name: 'Data Table' }),
  makeManifest({ type: 'text-block', category: 'text', name: 'Text Block' }),
  makeManifest({ type: 'drill-link', category: 'navigation', name: 'Drill Link', description: 'Navigation link to another report' }),
];

describe('widget-palette-state', () => {
  describe('initialWidgetPaletteState', () => {
    it('defaults to fields tab with empty search', () => {
      const s = initialWidgetPaletteState();
      expect(s.activeTab).toBe('fields');
      expect(s.widgetSearchQuery).toBe('');
      expect(s.expandedCategories.size).toBe(0);
    });
  });

  describe('setPaletteTab', () => {
    it('switches to widgets tab', () => {
      const s = setPaletteTab(initialWidgetPaletteState(), 'widgets');
      expect(s.activeTab).toBe('widgets');
    });

    it('switches back to fields tab', () => {
      const s = setPaletteTab(initialWidgetPaletteState(), 'widgets');
      const s2 = setPaletteTab(s, 'fields');
      expect(s2.activeTab).toBe('fields');
    });

    it('returns same reference when tab is unchanged', () => {
      const s = initialWidgetPaletteState();
      const s2 = setPaletteTab(s, 'fields');
      expect(s2).toBe(s);
    });
  });

  describe('setWidgetSearch', () => {
    it('updates search query', () => {
      const s = setWidgetSearch(initialWidgetPaletteState(), 'bar');
      expect(s.widgetSearchQuery).toBe('bar');
    });

    it('returns same reference when query is unchanged', () => {
      const s = initialWidgetPaletteState();
      const s2 = setWidgetSearch(s, '');
      expect(s2).toBe(s);
    });
  });

  describe('toggleWidgetCategory', () => {
    it('expands a collapsed category', () => {
      const s = toggleWidgetCategory(initialWidgetPaletteState(), 'category-chart');
      expect(s.expandedCategories.has('category-chart')).toBe(true);
    });

    it('collapses an expanded category', () => {
      const s = toggleWidgetCategory(initialWidgetPaletteState(), 'category-chart');
      const s2 = toggleWidgetCategory(s, 'category-chart');
      expect(s2.expandedCategories.has('category-chart')).toBe(false);
    });

    it('does not mutate previous state', () => {
      const s = initialWidgetPaletteState();
      toggleWidgetCategory(s, 'tabular');
      expect(s.expandedCategories.size).toBe(0);
    });
  });

  describe('getFilteredWidgets', () => {
    it('returns all widgets grouped by category when no search query', () => {
      const s = initialWidgetPaletteState();
      const groups = getFilteredWidgets(MANIFESTS, s.widgetSearchQuery);
      expect(groups.size).toBe(5);
      expect(groups.get('category-chart')?.length).toBe(2);
      expect(groups.get('single-value')?.length).toBe(2);
      expect(groups.get('tabular')?.length).toBe(1);
      expect(groups.get('text')?.length).toBe(1);
      expect(groups.get('navigation')?.length).toBe(1);
    });

    it('filters by search query (case-insensitive)', () => {
      const groups = getFilteredWidgets(MANIFESTS, 'BAR');
      expect(groups.size).toBe(1);
      expect(groups.get('category-chart')?.length).toBe(1);
      expect(groups.get('category-chart')?.[0].type).toBe('bar-chart');
    });

    it('matches against name and type', () => {
      const groups = getFilteredWidgets(MANIFESTS, 'kpi');
      expect(groups.size).toBe(1);
      expect(groups.get('single-value')?.length).toBe(1);
    });

    it('matches against description', () => {
      const groups = getFilteredWidgets(MANIFESTS, 'navigation link');
      expect(groups.size).toBe(1);
      expect(groups.get('navigation')?.length).toBe(1);
    });

    it('returns empty map when no matches', () => {
      const groups = getFilteredWidgets(MANIFESTS, 'zzznotexist');
      expect(groups.size).toBe(0);
    });

    it('handles empty manifest array', () => {
      const groups = getFilteredWidgets([], '');
      expect(groups.size).toBe(0);
    });
  });
});
