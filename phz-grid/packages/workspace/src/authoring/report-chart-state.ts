/**
 * @phozart/workspace — Report Chart State
 *
 * Pure functions for managing chart toggle, chart type selection, and
 * visual encoding channels in the report editor.
 *
 * Chart types align with the WidgetType union from @phozart/engine/widget
 * and the suggestChartType output from @phozart/engine/explorer/chart-suggest.
 */

import type { FieldMetadata } from '@phozart/shared';
import { resolveSemanticRole } from '@phozart/shared';

// ========================================================================
// Types
// ========================================================================

export type ReportChartType =
  | 'bar-chart'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'gauge'
  | 'kpi-card'
  | 'trend-line';

export type EncodingChannel = 'category' | 'value' | 'color' | 'size' | 'detail' | 'tooltip';

export interface ChartEncoding {
  category?: string;
  value: string[];
  color?: string;
  size?: string;
  detail?: string;
  tooltip: string[];
}

export interface ReportChartState {
  previewMode: 'table' | 'chart';
  chartType: ReportChartType;
  chartOverride?: ReportChartType;
  encoding: ChartEncoding;
  chartStyleOverrides?: Record<string, unknown>;
}

// ========================================================================
// Factory
// ========================================================================

export function initialReportChartState(): ReportChartState {
  return {
    previewMode: 'table',
    chartType: 'bar-chart',
    encoding: { value: [], tooltip: [] },
  };
}

// ========================================================================
// Preview Mode
// ========================================================================

export function setPreviewMode(
  state: ReportChartState,
  mode: ReportChartState['previewMode'],
): ReportChartState {
  return { ...state, previewMode: mode };
}

// ========================================================================
// Chart Type
// ========================================================================

export function overrideChartType(
  state: ReportChartState,
  chartType: ReportChartType | undefined,
): ReportChartState {
  return { ...state, chartOverride: chartType };
}

export function getEffectiveChartType(state: ReportChartState): ReportChartType {
  return state.chartOverride ?? state.chartType ?? 'bar-chart';
}

// ========================================================================
// Encoding Channels
// ========================================================================

export function setEncoding(
  state: ReportChartState,
  channel: EncodingChannel,
  field: string,
): ReportChartState {
  const enc = { ...state.encoding };

  switch (channel) {
    case 'category':
      enc.category = field;
      break;
    case 'value':
      if (!enc.value.includes(field)) {
        enc.value = [...enc.value, field];
      }
      break;
    case 'color':
      enc.color = field;
      break;
    case 'size':
      enc.size = field;
      break;
    case 'detail':
      enc.detail = field;
      break;
    case 'tooltip':
      if (!enc.tooltip.includes(field)) {
        enc.tooltip = [...enc.tooltip, field];
      }
      break;
  }

  return { ...state, encoding: enc };
}

export function removeEncoding(
  state: ReportChartState,
  channel: EncodingChannel,
  field: string,
): ReportChartState {
  const enc = { ...state.encoding };

  switch (channel) {
    case 'category':
      if (enc.category === field) enc.category = undefined;
      break;
    case 'value':
      enc.value = enc.value.filter(v => v !== field);
      break;
    case 'color':
      if (enc.color === field) enc.color = undefined;
      break;
    case 'size':
      if (enc.size === field) enc.size = undefined;
      break;
    case 'detail':
      if (enc.detail === field) enc.detail = undefined;
      break;
    case 'tooltip':
      enc.tooltip = enc.tooltip.filter(t => t !== field);
      break;
  }

  return { ...state, encoding: enc };
}

// ========================================================================
// Auto-Mapping
// ========================================================================

export function autoMapColumnsToEncoding(
  state: ReportChartState,
  fields: readonly FieldMetadata[],
): ReportChartState {
  const dims: string[] = [];
  const measures: string[] = [];

  for (const f of fields) {
    const role = resolveSemanticRole(f);
    if (role === 'measure') {
      measures.push(f.name);
    } else if (role === 'dimension' || role === 'time') {
      dims.push(f.name);
    }
    // identifiers are skipped — not useful for chart encoding
  }

  const encoding: ChartEncoding = {
    category: dims[0],
    value: measures,
    color: dims[1],
    detail: dims[2],
    tooltip: [],
  };

  return { ...state, encoding };
}

// ========================================================================
// Chart Type Availability
// ========================================================================

export function getChartTypeAvailability(
  encoding: ChartEncoding,
): Record<ReportChartType, boolean> {
  const hasValue = encoding.value.length > 0;
  const hasCat = encoding.category != null;

  return {
    'bar-chart': hasValue && hasCat,
    line: hasValue && hasCat,
    area: hasValue && hasCat,
    pie: hasValue && hasCat,
    scatter: hasValue && hasCat,
    gauge: hasValue,
    'kpi-card': hasValue,
    'trend-line': hasValue,
  };
}
