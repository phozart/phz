/**
 * Cross-Filtering between Dashboard Widgets — TDD RED phase
 *
 * Tests pure cross-filter logic: event creation, filter application
 * to non-source widgets, filter clearing, and multi-widget scenarios.
 */
import { describe, it, expect } from 'vitest';
import {
  createCrossFilterEvent,
  applyCrossFilter,
  clearCrossFilter,
  isCrossFilterSource,
} from '../cross-filter.js';
import type { CrossFilterState, CrossFilterEvent } from '../cross-filter.js';

// --- createCrossFilterEvent ---

describe('createCrossFilterEvent', () => {
  it('creates a cross-filter event from a widget click', () => {
    const event = createCrossFilterEvent({
      sourceWidgetId: 'w-bar-1',
      field: 'department',
      value: 'Engineering',
    });
    expect(event.sourceWidgetId).toBe('w-bar-1');
    expect(event.field).toBe('department');
    expect(event.value).toBe('Engineering');
  });

  it('supports array values for multi-select filters', () => {
    const event = createCrossFilterEvent({
      sourceWidgetId: 'w-pie-1',
      field: 'region',
      value: ['North', 'South'],
    });
    expect(event.value).toEqual(['North', 'South']);
  });
});

// --- applyCrossFilter ---

describe('applyCrossFilter', () => {
  const testData = [
    { name: 'Alice', department: 'Engineering', score: 95 },
    { name: 'Bob', department: 'Engineering', score: 85 },
    { name: 'Carol', department: 'Sales', score: 90 },
    { name: 'Dave', department: 'HR', score: 72 },
  ];

  it('returns a CrossFilterState with filter applied', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-bar-1',
      field: 'department',
      value: 'Engineering',
    };
    const state = applyCrossFilter(event);
    expect(state.active).toBe(true);
    expect(state.sourceWidgetId).toBe('w-bar-1');
    expect(state.field).toBe('department');
    expect(state.value).toBe('Engineering');
  });

  it('getFilteredData filters data for non-source widgets', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-bar-1',
      field: 'department',
      value: 'Engineering',
    };
    const state = applyCrossFilter(event);
    const filtered = state.getFilteredData(testData, 'w-other');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(r => r.department === 'Engineering')).toBe(true);
  });

  it('returns unfiltered data for the source widget', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-bar-1',
      field: 'department',
      value: 'Engineering',
    };
    const state = applyCrossFilter(event);
    const unfiltered = state.getFilteredData(testData, 'w-bar-1');
    expect(unfiltered).toHaveLength(4);
  });

  it('supports array value with "in" semantics', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-pie-1',
      field: 'department',
      value: ['Engineering', 'Sales'],
    };
    const state = applyCrossFilter(event);
    const filtered = state.getFilteredData(testData, 'w-other');
    expect(filtered).toHaveLength(3);
    expect(filtered.map(r => r.name).sort()).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('handles string comparison correctly', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-1',
      field: 'department',
      value: 'HR',
    };
    const state = applyCrossFilter(event);
    const filtered = state.getFilteredData(testData, 'w-2');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Dave');
  });
});

// --- clearCrossFilter ---

describe('clearCrossFilter', () => {
  it('returns inactive CrossFilterState', () => {
    const state = clearCrossFilter();
    expect(state.active).toBe(false);
    expect(state.sourceWidgetId).toBeUndefined();
    expect(state.field).toBeUndefined();
    expect(state.value).toBeUndefined();
  });

  it('getFilteredData returns unfiltered data when cleared', () => {
    const data = [
      { name: 'Alice', department: 'Engineering' },
      { name: 'Bob', department: 'Sales' },
    ];
    const state = clearCrossFilter();
    const result = state.getFilteredData(data, 'any-widget');
    expect(result).toHaveLength(2);
  });
});

// --- isCrossFilterSource ---

describe('isCrossFilterSource', () => {
  it('returns true when widgetId matches the source', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-bar-1',
      field: 'department',
      value: 'Engineering',
    };
    const state = applyCrossFilter(event);
    expect(isCrossFilterSource(state, 'w-bar-1')).toBe(true);
  });

  it('returns false when widgetId does not match the source', () => {
    const event: CrossFilterEvent = {
      sourceWidgetId: 'w-bar-1',
      field: 'department',
      value: 'Engineering',
    };
    const state = applyCrossFilter(event);
    expect(isCrossFilterSource(state, 'w-other')).toBe(false);
  });

  it('returns false when cross-filter is cleared', () => {
    const state = clearCrossFilter();
    expect(isCrossFilterSource(state, 'w-bar-1')).toBe(false);
  });
});

// --- Multi-widget scenario ---

describe('cross-filter multi-widget scenario', () => {
  const data = [
    { id: 1, region: 'North', product: 'A', revenue: 100 },
    { id: 2, region: 'North', product: 'B', revenue: 200 },
    { id: 3, region: 'South', product: 'A', revenue: 150 },
    { id: 4, region: 'South', product: 'B', revenue: 300 },
    { id: 5, region: 'East', product: 'A', revenue: 50 },
  ];

  it('applies cross-filter from bar chart to all other widgets', () => {
    const event = createCrossFilterEvent({
      sourceWidgetId: 'bar-chart',
      field: 'region',
      value: 'North',
    });
    const state = applyCrossFilter(event);

    // Bar chart (source) gets all data
    expect(state.getFilteredData(data, 'bar-chart')).toHaveLength(5);

    // KPI card gets filtered data
    const kpiData = state.getFilteredData(data, 'kpi-card');
    expect(kpiData).toHaveLength(2);
    expect(kpiData.every(r => r.region === 'North')).toBe(true);

    // Trend line gets filtered data
    const trendData = state.getFilteredData(data, 'trend-line');
    expect(trendData).toHaveLength(2);
    expect(trendData.every(r => r.region === 'North')).toBe(true);
  });

  it('clears cross-filter restores all data to all widgets', () => {
    const event = createCrossFilterEvent({
      sourceWidgetId: 'bar-chart',
      field: 'region',
      value: 'North',
    });
    const activeState = applyCrossFilter(event);
    expect(activeState.getFilteredData(data, 'kpi-card')).toHaveLength(2);

    const clearedState = clearCrossFilter();
    expect(clearedState.getFilteredData(data, 'kpi-card')).toHaveLength(5);
    expect(clearedState.getFilteredData(data, 'bar-chart')).toHaveLength(5);
  });

  it('replacing cross-filter switches the filter context', () => {
    const event1 = createCrossFilterEvent({
      sourceWidgetId: 'bar-chart',
      field: 'region',
      value: 'North',
    });
    const state1 = applyCrossFilter(event1);
    expect(state1.getFilteredData(data, 'kpi')).toHaveLength(2);

    // User clicks a different bar
    const event2 = createCrossFilterEvent({
      sourceWidgetId: 'bar-chart',
      field: 'region',
      value: 'South',
    });
    const state2 = applyCrossFilter(event2);
    expect(state2.getFilteredData(data, 'kpi')).toHaveLength(2);
    expect(state2.getFilteredData(data, 'kpi').every(r => r.region === 'South')).toBe(true);
  });
});
