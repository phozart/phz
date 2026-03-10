/**
 * @phozart/phz-ai — Schema Analyzer Tests
 *
 * Tests for field classification, widget suggestion, and layout generation.
 */

import { describe, it, expect } from 'vitest';
import { analyzeSchema, suggestWidgets, suggestLayout } from '../schema-analyzer.js';
import type { FieldAnalysis, SchemaAnalysis, WidgetSuggestion, LayoutSuggestion } from '../schema-analyzer.js';

describe('analyzeSchema', () => {
  it('classifies numeric fields as measures', () => {
    const result = analyzeSchema([
      { name: 'revenue', type: 'number' },
      { name: 'quantity', type: 'number' },
    ]);
    expect(result.measures).toHaveLength(2);
    expect(result.measures[0].name).toBe('revenue');
    expect(result.measures[1].name).toBe('quantity');
  });

  it('classifies string fields as dimensions', () => {
    const result = analyzeSchema([
      { name: 'region', type: 'string' },
      { name: 'product', type: 'string' },
    ]);
    expect(result.dimensions).toHaveLength(2);
  });

  it('classifies date fields as temporal', () => {
    const result = analyzeSchema([
      { name: 'created_at', type: 'date' },
      { name: 'order_date', type: 'date' },
    ]);
    expect(result.temporal).toHaveLength(2);
    expect(result.temporal[0].name).toBe('created_at');
  });

  it('classifies boolean fields as categorical', () => {
    const result = analyzeSchema([
      { name: 'active', type: 'boolean' },
    ]);
    expect(result.categorical).toHaveLength(1);
    expect(result.categorical[0].name).toBe('active');
  });

  it('detects identifier fields by name patterns', () => {
    const result = analyzeSchema([
      { name: 'id', type: 'number' },
      { name: 'user_id', type: 'string' },
      { name: 'orderId', type: 'string' },
    ]);
    expect(result.identifiers).toHaveLength(3);
    // identifiers should not appear as measures or dimensions
    expect(result.measures).toHaveLength(0);
    expect(result.dimensions).toHaveLength(0);
  });

  it('handles mixed field types', () => {
    const result = analyzeSchema([
      { name: 'id', type: 'number' },
      { name: 'name', type: 'string' },
      { name: 'revenue', type: 'number' },
      { name: 'created', type: 'date' },
      { name: 'active', type: 'boolean' },
    ]);
    expect(result.identifiers).toHaveLength(1);
    expect(result.measures).toHaveLength(1);
    expect(result.dimensions).toHaveLength(1);
    expect(result.temporal).toHaveLength(1);
    expect(result.categorical).toHaveLength(1);
  });

  it('returns empty analysis for empty input', () => {
    const result = analyzeSchema([]);
    expect(result.measures).toHaveLength(0);
    expect(result.dimensions).toHaveLength(0);
    expect(result.temporal).toHaveLength(0);
    expect(result.categorical).toHaveLength(0);
    expect(result.identifiers).toHaveLength(0);
  });

  it('classifies fields with cardinality hints', () => {
    const result = analyzeSchema([
      { name: 'status', type: 'string', cardinality: 3 },
      { name: 'description', type: 'string', cardinality: 500 },
    ]);
    // low cardinality string -> categorical
    expect(result.categorical).toHaveLength(1);
    expect(result.categorical[0].name).toBe('status');
    // high cardinality string -> dimension (or ignored)
    expect(result.dimensions).toHaveLength(1);
    expect(result.dimensions[0].name).toBe('description');
  });
});

describe('suggestWidgets', () => {
  it('suggests KPI cards for measures', () => {
    const analysis: SchemaAnalysis = {
      measures: [{ name: 'revenue', type: 'number', role: 'measure' }],
      dimensions: [],
      temporal: [],
      categorical: [],
      identifiers: [],
    };
    const suggestions = suggestWidgets(analysis);
    const kpiCards = suggestions.filter(s => s.widgetType === 'kpi-card');
    expect(kpiCards.length).toBeGreaterThan(0);
    expect(kpiCards[0].fields).toContain('revenue');
  });

  it('suggests bar charts when measures + dimensions exist', () => {
    const analysis: SchemaAnalysis = {
      measures: [{ name: 'revenue', type: 'number', role: 'measure' }],
      dimensions: [{ name: 'region', type: 'string', role: 'dimension' }],
      temporal: [],
      categorical: [],
      identifiers: [],
    };
    const suggestions = suggestWidgets(analysis);
    const barCharts = suggestions.filter(s => s.widgetType === 'bar-chart');
    expect(barCharts.length).toBeGreaterThan(0);
    expect(barCharts[0].fields).toContain('revenue');
    expect(barCharts[0].fields).toContain('region');
  });

  it('suggests trend lines when measures + temporal fields exist', () => {
    const analysis: SchemaAnalysis = {
      measures: [{ name: 'revenue', type: 'number', role: 'measure' }],
      dimensions: [],
      temporal: [{ name: 'date', type: 'date', role: 'temporal' }],
      categorical: [],
      identifiers: [],
    };
    const suggestions = suggestWidgets(analysis);
    const trendLines = suggestions.filter(s => s.widgetType === 'trend-line');
    expect(trendLines.length).toBeGreaterThan(0);
  });

  it('suggests data table as fallback', () => {
    const analysis: SchemaAnalysis = {
      measures: [],
      dimensions: [
        { name: 'name', type: 'string', role: 'dimension' },
        { name: 'email', type: 'string', role: 'dimension' },
      ],
      temporal: [],
      categorical: [],
      identifiers: [],
    };
    const suggestions = suggestWidgets(analysis);
    const dataTables = suggestions.filter(s => s.widgetType === 'data-table');
    expect(dataTables.length).toBeGreaterThan(0);
  });

  it('returns empty suggestions for empty analysis', () => {
    const analysis: SchemaAnalysis = {
      measures: [],
      dimensions: [],
      temporal: [],
      categorical: [],
      identifiers: [],
    };
    const suggestions = suggestWidgets(analysis);
    expect(suggestions).toHaveLength(0);
  });

  it('suggests bottom-n for measure + dimension', () => {
    const analysis: SchemaAnalysis = {
      measures: [{ name: 'score', type: 'number', role: 'measure' }],
      dimensions: [{ name: 'student', type: 'string', role: 'dimension' }],
      temporal: [],
      categorical: [],
      identifiers: [],
    };
    const suggestions = suggestWidgets(analysis);
    const bottomN = suggestions.filter(s => s.widgetType === 'bottom-n');
    expect(bottomN.length).toBeGreaterThan(0);
  });
});

describe('suggestLayout', () => {
  it('arranges widgets in a grid', () => {
    const widgets: WidgetSuggestion[] = [
      { widgetType: 'kpi-card', title: 'Revenue', fields: ['revenue'], priority: 1 },
      { widgetType: 'bar-chart', title: 'Revenue by Region', fields: ['revenue', 'region'], priority: 2 },
      { widgetType: 'trend-line', title: 'Revenue Trend', fields: ['revenue', 'date'], priority: 3 },
    ];
    const layout = suggestLayout(widgets);
    expect(layout.columns).toBeGreaterThanOrEqual(1);
    expect(layout.placements).toHaveLength(3);
    // Each placement has valid grid position
    for (const p of layout.placements) {
      expect(p.column).toBeGreaterThanOrEqual(0);
      expect(p.colSpan).toBeGreaterThanOrEqual(1);
      expect(p.order).toBeGreaterThanOrEqual(0);
    }
  });

  it('gives KPI cards smaller spans than charts', () => {
    const widgets: WidgetSuggestion[] = [
      { widgetType: 'kpi-card', title: 'Revenue', fields: ['revenue'], priority: 1 },
      { widgetType: 'bar-chart', title: 'Revenue by Region', fields: ['revenue', 'region'], priority: 2 },
    ];
    const layout = suggestLayout(widgets);
    const kpiPlacement = layout.placements.find(p => p.widgetType === 'kpi-card');
    const chartPlacement = layout.placements.find(p => p.widgetType === 'bar-chart');
    expect(kpiPlacement!.colSpan).toBeLessThanOrEqual(chartPlacement!.colSpan);
  });

  it('returns empty layout for no widgets', () => {
    const layout = suggestLayout([]);
    expect(layout.columns).toBe(3);
    expect(layout.placements).toHaveLength(0);
  });
});
