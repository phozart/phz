/**
 * Tests for suggestWidgetForFieldDrop — dashboard field-drop to widget suggestion.
 *
 * TDD: Tests cover all logic branches: single measure, date field, categorical
 * dimension, context-aware with existing widgets, and fallback.
 */
import {
  suggestWidgetForFieldDrop,
  type WidgetSuggestion,
  type ExistingWidgetInfo,
} from '../explorer/widget-suggestion.js';
import type { FieldMetadata } from '@phozart/shared';

// ---- Helpers ----

function field(
  name: string,
  dataType: FieldMetadata['dataType'],
  semanticHint?: FieldMetadata['semanticHint'],
): FieldMetadata {
  return { name, dataType, nullable: false, semanticHint };
}

function existingWidget(
  type: string,
  dims: string[] = [],
  measures: string[] = [],
): ExistingWidgetInfo {
  return {
    type,
    dimensions: dims.map(f => ({ field: f })),
    measures: measures.map(f => ({ field: f })),
  };
}

describe('suggestWidgetForFieldDrop', () => {
  // ====================================================================
  // Single measure, no existing widgets → kpi-card
  // ====================================================================
  it('suggests kpi-card for a single numeric field with no existing widgets', () => {
    const result = suggestWidgetForFieldDrop(
      field('revenue', 'number', 'measure'),
      [],
      [field('revenue', 'number', 'measure')],
    );
    expect(result.widgetType).toBe('kpi-card');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('suggests kpi-card for a currency field with no existing widgets', () => {
    const result = suggestWidgetForFieldDrop(
      field('total_sales', 'number', 'currency'),
      [],
      [field('total_sales', 'number', 'currency')],
    );
    expect(result.widgetType).toBe('kpi-card');
  });

  it('suggests kpi-card for a percentage field with no existing widgets', () => {
    const result = suggestWidgetForFieldDrop(
      field('conversion_rate', 'number', 'percentage'),
      [],
      [field('conversion_rate', 'number', 'percentage')],
    );
    expect(result.widgetType).toBe('kpi-card');
  });

  // ====================================================================
  // Time/date field → trend-line
  // ====================================================================
  it('suggests trend-line for a date field', () => {
    const result = suggestWidgetForFieldDrop(
      field('created_at', 'date', 'timestamp'),
      [],
      [field('created_at', 'date', 'timestamp')],
    );
    expect(result.widgetType).toBe('trend-line');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('suggests trend-line for a date-named string field', () => {
    const result = suggestWidgetForFieldDrop(
      field('order_date', 'string'),
      [],
      [field('order_date', 'string')],
    );
    expect(result.widgetType).toBe('trend-line');
  });

  // ====================================================================
  // Categorical dimension → bar-chart
  // ====================================================================
  it('suggests bar-chart for a categorical dimension with measures available', () => {
    const result = suggestWidgetForFieldDrop(
      field('region', 'string', 'category'),
      [],
      [field('region', 'string', 'category'), field('revenue', 'number', 'measure')],
    );
    expect(result.widgetType).toBe('bar-chart');
  });

  it('suggests bar-chart for a plain string field with measures available', () => {
    const result = suggestWidgetForFieldDrop(
      field('status', 'string'),
      [],
      [field('status', 'string'), field('count', 'number')],
    );
    expect(result.widgetType).toBe('bar-chart');
  });

  it('suggests bar-chart for a dimension even without measures available', () => {
    const result = suggestWidgetForFieldDrop(
      field('region', 'string', 'category'),
      [],
      [field('region', 'string', 'category')],
    );
    expect(result.widgetType).toBe('bar-chart');
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  // ====================================================================
  // Boolean → data-table fallback
  // ====================================================================
  it('suggests data-table for a boolean field', () => {
    const result = suggestWidgetForFieldDrop(
      field('is_active', 'boolean'),
      [],
      [field('is_active', 'boolean')],
    );
    expect(result.widgetType).toBe('data-table');
  });

  // ====================================================================
  // Encoding populated
  // ====================================================================
  it('populates encoding.measureField for a numeric field', () => {
    const result = suggestWidgetForFieldDrop(
      field('revenue', 'number', 'measure'),
      [],
      [field('revenue', 'number', 'measure')],
    );
    expect(result.encoding.measureField).toBe('revenue');
  });

  it('populates encoding.dimensionField for a category field', () => {
    const result = suggestWidgetForFieldDrop(
      field('region', 'string', 'category'),
      [],
      [field('region', 'string', 'category'), field('revenue', 'number', 'measure')],
    );
    expect(result.encoding.dimensionField).toBe('region');
  });

  // ====================================================================
  // Context-aware: measure dropped alongside existing bar-chart → bar-chart
  // ====================================================================
  it('suggests bar-chart when dropping a measure and a chart with dimensions exists', () => {
    const existing = [existingWidget('bar-chart', ['region'], ['sales'])];
    const result = suggestWidgetForFieldDrop(
      field('profit', 'number', 'measure'),
      existing,
      [field('profit', 'number', 'measure'), field('region', 'string', 'category')],
    );
    expect(result.widgetType).toBe('bar-chart');
  });

  // ====================================================================
  // Context-aware: measure with existing kpi (no dims) → another kpi
  // ====================================================================
  it('suggests kpi-card when dropping measure and existing widgets have no dimensions', () => {
    const existing = [existingWidget('kpi-card', [], ['revenue'])];
    const result = suggestWidgetForFieldDrop(
      field('profit', 'number', 'measure'),
      existing,
      [field('profit', 'number', 'measure')],
    );
    expect(result.widgetType).toBe('kpi-card');
    expect(result.confidence).toBeLessThan(1.0);
  });

  // ====================================================================
  // Confidence values
  // ====================================================================
  it('returns confidence 1.0 for exact kpi-card match (single measure, no widgets)', () => {
    const result = suggestWidgetForFieldDrop(
      field('revenue', 'number', 'measure'),
      [],
      [field('revenue', 'number', 'measure')],
    );
    expect(result.confidence).toBe(1.0);
  });

  it('returns lower confidence for data-table fallback', () => {
    const result = suggestWidgetForFieldDrop(
      field('is_active', 'boolean'),
      [],
      [field('is_active', 'boolean')],
    );
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  // ====================================================================
  // Return type shape
  // ====================================================================
  it('returns a well-formed WidgetSuggestion', () => {
    const result: WidgetSuggestion = suggestWidgetForFieldDrop(
      field('revenue', 'number'),
      [],
      [],
    );
    expect(result).toHaveProperty('widgetType');
    expect(result).toHaveProperty('encoding');
    expect(result).toHaveProperty('confidence');
    expect(typeof result.widgetType).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  // ====================================================================
  // Multiple available measures heuristic
  // ====================================================================
  it('suggests bar-chart when dropping a dimension with multiple measures available', () => {
    const result = suggestWidgetForFieldDrop(
      field('region', 'string', 'category'),
      [],
      [
        field('region', 'string', 'category'),
        field('revenue', 'number', 'measure'),
        field('cost', 'number', 'measure'),
      ],
    );
    expect(result.widgetType).toBe('bar-chart');
  });
});
