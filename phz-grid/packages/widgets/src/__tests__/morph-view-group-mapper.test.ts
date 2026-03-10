/**
 * @phozart/phz-widgets — Morph / View Group Mapper Tests
 */
import { describe, it, expect } from 'vitest';
import {
  getMorphGroupForType,
  getTypesInMorphGroup,
  morphGroupToViewGroup,
  allMorphGroupsToViewGroups,
  formatWidgetTypeLabel,
  canMorphBetween,
} from '../morph-view-group-mapper.js';

describe('getMorphGroupForType', () => {
  it('returns category-chart for bar-chart', () => {
    expect(getMorphGroupForType('bar-chart')).toBe('category-chart');
  });

  it('returns single-value for kpi-card', () => {
    expect(getMorphGroupForType('kpi-card')).toBe('single-value');
  });

  it('returns tabular for data-table', () => {
    expect(getMorphGroupForType('data-table')).toBe('tabular');
  });

  it('returns text for rich-text', () => {
    expect(getMorphGroupForType('rich-text')).toBe('text');
  });

  it('returns navigation for decision-tree', () => {
    expect(getMorphGroupForType('decision-tree')).toBe('navigation');
  });

  it('defaults to text for unknown types', () => {
    expect(getMorphGroupForType('unknown-widget')).toBe('text');
  });
});

describe('getTypesInMorphGroup', () => {
  it('returns all chart types', () => {
    const types = getTypesInMorphGroup('category-chart');
    expect(types).toContain('bar-chart');
    expect(types).toContain('line-chart');
    expect(types).toContain('pie-chart');
    expect(types).toContain('area-chart');
    expect(types).toContain('scatter-chart');
    expect(types).toContain('heatmap');
    expect(types).toContain('waterfall-chart');
    expect(types).toContain('funnel-chart');
  });

  it('returns all single-value types', () => {
    const types = getTypesInMorphGroup('single-value');
    expect(types).toContain('kpi-card');
    expect(types).toContain('gauge');
    expect(types).toContain('kpi-scorecard');
    expect(types).toContain('trend-line');
  });

  it('returns all tabular types', () => {
    const types = getTypesInMorphGroup('tabular');
    expect(types).toContain('data-table');
    expect(types).toContain('pivot-table');
    expect(types).toContain('status-table');
  });

  it('returns text types including rich-text', () => {
    const types = getTypesInMorphGroup('text');
    expect(types).toContain('text-block');
    expect(types).toContain('heading');
    expect(types).toContain('rich-text');
  });

  it('returns navigation types including decision-tree', () => {
    const types = getTypesInMorphGroup('navigation');
    expect(types).toContain('drill-link');
    expect(types).toContain('decision-tree');
  });
});

describe('morphGroupToViewGroup', () => {
  it('creates a WidgetViewGroup from a morph group', () => {
    const group = morphGroupToViewGroup('single-value');
    expect(group.id).toBe('group-single-value');
    expect(group.label).toBe('Metrics');
    expect(group.views.length).toBeGreaterThanOrEqual(4);
    expect(group.views[0].widgetType).toBe('kpi-card');
  });

  it('uses the currentType as the default view', () => {
    const group = morphGroupToViewGroup('single-value', 'gauge');
    expect(group.defaultViewId).toBe('view-gauge');
  });

  it('falls back to first view when currentType is not in group', () => {
    const group = morphGroupToViewGroup('single-value', 'bar-chart');
    expect(group.defaultViewId).toBe('view-kpi-card');
  });

  it('auto-selects switching mode based on view count', () => {
    const navGroup = morphGroupToViewGroup('navigation');
    // 2 types -> toggle
    expect(navGroup.switchingMode).toBe('toggle');

    const chartGroup = morphGroupToViewGroup('category-chart');
    // 8 types -> dropdown
    expect(chartGroup.switchingMode).toBe('dropdown');
  });

  it('applies config overrides per widget type', () => {
    const group = morphGroupToViewGroup('single-value', undefined, {
      'kpi-card': { color: 'blue' },
    });
    const kpiView = group.views.find(v => v.widgetType === 'kpi-card');
    expect(kpiView?.config).toEqual({ color: 'blue' });
  });
});

describe('allMorphGroupsToViewGroups', () => {
  it('returns all groups when no filter is provided', () => {
    const groups = allMorphGroupsToViewGroups();
    const ids = groups.map(g => g.id);
    expect(ids).toContain('group-category-chart');
    expect(ids).toContain('group-single-value');
    expect(ids).toContain('group-tabular');
    expect(ids).toContain('group-text');
    expect(ids).toContain('group-navigation');
  });

  it('filters to relevant groups when types are provided', () => {
    const groups = allMorphGroupsToViewGroups(['bar-chart', 'kpi-card']);
    const ids = groups.map(g => g.id);
    expect(ids).toContain('group-category-chart');
    expect(ids).toContain('group-single-value');
    expect(ids).not.toContain('group-tabular');
  });
});

describe('formatWidgetTypeLabel', () => {
  it('formats kebab-case to title case', () => {
    expect(formatWidgetTypeLabel('bar-chart')).toBe('Bar Chart');
    expect(formatWidgetTypeLabel('kpi-card')).toBe('Kpi Card');
    expect(formatWidgetTypeLabel('decision-tree')).toBe('Decision Tree');
  });

  it('handles single words', () => {
    expect(formatWidgetTypeLabel('gauge')).toBe('Gauge');
    expect(formatWidgetTypeLabel('heatmap')).toBe('Heatmap');
  });
});

describe('canMorphBetween', () => {
  it('returns true for types in the same group', () => {
    expect(canMorphBetween('bar-chart', 'line-chart')).toBe(true);
    expect(canMorphBetween('kpi-card', 'gauge')).toBe(true);
  });

  it('returns false for types in different groups', () => {
    expect(canMorphBetween('bar-chart', 'kpi-card')).toBe(false);
    expect(canMorphBetween('data-table', 'drill-link')).toBe(false);
  });

  it('returns false for same type', () => {
    expect(canMorphBetween('bar-chart', 'bar-chart')).toBe(false);
  });
});
