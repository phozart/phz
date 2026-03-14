/**
 * @phozart/engine — Enhanced Widget Configuration Types
 *
 * Rich per-widget configuration: data bindings, appearance, behaviour.
 * These extend the existing WidgetConfig types without breaking them.
 */

import type { WidgetId, KPIId } from './types.js';
import type { WidgetType } from './widget.js';
import type { AggregationFunction } from '@phozart/core';

// --- Field References ---

export interface FieldRef {
  fieldKey: string;
  label?: string;
}

export interface MeasureRef {
  fieldKey: string;
  aggregation: AggregationFunction;
  label?: string;
}

export interface FieldFormat {
  type: 'number' | 'currency' | 'percent' | 'date' | 'text';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
}

// --- Filter Rules ---

export type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'in' | 'not_in' | 'between' | 'is_null' | 'is_not_null';

export interface WidgetFilterRule {
  field: string;
  operator: FilterOperator;
  value: unknown;
  /** Second value for 'between' operator */
  value2?: unknown;
}

// --- Thresholds ---

export interface Threshold {
  value: number;
  color: string;
  label?: string;
}

// --- Data Bindings (discriminated union by widget type) ---

export interface ChartBinding {
  type: 'chart';
  category: FieldRef;
  values: MeasureRef[];
}

export interface KpiBinding {
  type: 'kpi';
  kpiId: KPIId;
}

export interface ScorecardBinding {
  type: 'scorecard';
  kpiIds: KPIId[];
  breakdownDimension?: string;
}

export interface StatusTableBinding {
  type: 'status-table';
  entityField: FieldRef;
  kpiIds: KPIId[];
}

export interface DataTableBinding {
  type: 'data-table';
  columns: FieldRef[];
}

export interface DrillLinkBinding {
  type: 'drill-link';
  targetReportId: string;
  label: string;
  passFilters?: Record<string, string>;
}

export interface SlicerBinding {
  type: 'slicer';
  field: string;
  mode?: 'multi' | 'single' | 'range';
}

export type DataBinding =
  | ChartBinding
  | KpiBinding
  | ScorecardBinding
  | StatusTableBinding
  | DataTableBinding
  | DrillLinkBinding
  | SlicerBinding;

// --- Widget Data Config ---

export interface WidgetDataConfig {
  bindings: DataBinding;
  filters?: WidgetFilterRule[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  groupOthers?: boolean;
}

// --- Widget Appearance Config ---

export interface ContainerAppearance {
  shadow: 'none' | 'sm' | 'md' | 'lg';
  borderRadius: number;
  background?: string;
  border?: boolean;
  borderColor?: string;
}

export interface TitleBarAppearance {
  show: boolean;
  title?: string;
  subtitle?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  icon?: string;
}

export interface AxisAppearance {
  show: boolean;
  label?: string;
  gridLines?: boolean;
  min?: number;
  max?: number;
}

export interface LegendAppearance {
  show: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface DataLabelAppearance {
  show: boolean;
  position: 'inside' | 'outside' | 'top';
  format?: FieldFormat;
}

export interface TooltipAppearance {
  enabled: boolean;
  format?: FieldFormat;
}

export interface ChartAppearance {
  height?: number;
  padding?: number;
  xAxis?: AxisAppearance;
  yAxis?: AxisAppearance;
  legend?: LegendAppearance;
  dataLabels?: DataLabelAppearance;
  tooltip?: TooltipAppearance;
  colors?: string[];
  palette?: string;
  bar?: { orientation: 'horizontal' | 'vertical'; barWidth?: number; gap?: number; stacked?: boolean };
  line?: { curve: 'linear' | 'smooth'; strokeWidth?: number; showDots?: boolean; fill?: boolean };
}

export interface KpiAppearance {
  valueSize?: number;
  layout?: 'vertical' | 'horizontal';
  alignment?: 'left' | 'center' | 'right';
  showTrend?: boolean;
  showTarget?: boolean;
  showSparkline?: boolean;
}

export interface ScorecardAppearance {
  density?: 'comfortable' | 'compact' | 'dense';
  rowBanding?: boolean;
  stickyHeader?: boolean;
}

export interface BottomNAppearance {
  mode?: 'bottom' | 'top';
  count?: number;
  showRankNumber?: boolean;
  highlightFirst?: boolean;
}

export interface WidgetAppearanceConfig {
  container: ContainerAppearance;
  titleBar: TitleBarAppearance;
  chart?: ChartAppearance;
  kpi?: KpiAppearance;
  scorecard?: ScorecardAppearance;
  bottomN?: BottomNAppearance;
}

// --- Widget Behaviour Config ---

export type ClickAction = 'none' | 'filter-others' | 'open-detail' | 'custom-url';

export interface WidgetBehaviourConfig {
  onClick: ClickAction;
  clickTargetField?: string;
  clickUrl?: string;
  exportPng: boolean;
  exportCsv: boolean;
  autoRefresh: boolean;
  refreshInterval?: number;
}

// --- Enhanced Widget Config (wrapper) ---

export interface EnhancedWidgetConfig {
  id: WidgetId;
  type: WidgetType;
  name: string;
  data: WidgetDataConfig;
  appearance: WidgetAppearanceConfig;
  behaviour: WidgetBehaviourConfig;
}

// --- Smart Defaults per Widget Type ---

function defaultContainer(): ContainerAppearance {
  return { shadow: 'sm', borderRadius: 8, background: '#FFFFFF', border: false };
}

function defaultTitleBar(title: string): TitleBarAppearance {
  return { show: true, title, fontSize: 14, fontWeight: 600, color: '#1C1917' };
}

function defaultBehaviour(): WidgetBehaviourConfig {
  return { onClick: 'none', exportPng: true, exportCsv: false, autoRefresh: false };
}

export const SMART_DEFAULTS: Record<WidgetType, () => Omit<EnhancedWidgetConfig, 'id'>> = {
  'kpi-card': () => ({
    type: 'kpi-card',
    name: 'KPI Card',
    data: { bindings: { type: 'kpi', kpiId: '' as KPIId } },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('KPI Card'),
      kpi: { valueSize: 28, layout: 'vertical', alignment: 'center', showTrend: true, showTarget: true, showSparkline: true },
    },
    behaviour: defaultBehaviour(),
  }),
  'kpi-scorecard': () => ({
    type: 'kpi-scorecard',
    name: 'Scorecard',
    data: { bindings: { type: 'scorecard', kpiIds: [] } },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('KPI Scorecard'),
      scorecard: { density: 'compact', rowBanding: true, stickyHeader: true },
    },
    behaviour: defaultBehaviour(),
  }),
  'bar-chart': () => ({
    type: 'bar-chart',
    name: 'Bar Chart',
    data: {
      bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: '', aggregation: 'avg' }] },
      sort: { field: '', direction: 'desc' },
      limit: 10,
      groupOthers: false,
    },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Bar Chart'),
      chart: {
        height: 300, padding: 16,
        xAxis: { show: true, gridLines: false },
        yAxis: { show: true, gridLines: true },
        legend: { show: false, position: 'top' },
        dataLabels: { show: true, position: 'outside' },
        tooltip: { enabled: true },
        palette: 'phz-default',
        bar: { orientation: 'horizontal', gap: 4 },
      },
    },
    behaviour: { ...defaultBehaviour(), onClick: 'filter-others' },
  }),
  'trend-line': () => ({
    type: 'trend-line',
    name: 'Trend Line',
    data: {
      bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: '', aggregation: 'avg' }] },
    },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Trend Line'),
      chart: {
        height: 200, padding: 16,
        xAxis: { show: true, gridLines: false },
        yAxis: { show: true, gridLines: true },
        legend: { show: false, position: 'top' },
        dataLabels: { show: false, position: 'top' },
        tooltip: { enabled: true },
        palette: 'phz-default',
        line: { curve: 'smooth', strokeWidth: 2, showDots: true, fill: false },
      },
    },
    behaviour: defaultBehaviour(),
  }),
  'bottom-n': () => ({
    type: 'bottom-n',
    name: 'Bottom N',
    data: {
      bindings: { type: 'chart', category: { fieldKey: '' }, values: [{ fieldKey: '', aggregation: 'avg' }] },
      limit: 5,
    },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Bottom N'),
      bottomN: { mode: 'bottom', count: 5, showRankNumber: true, highlightFirst: true },
    },
    behaviour: defaultBehaviour(),
  }),
  'pivot-table': () => ({
    type: 'pivot-table',
    name: 'Pivot Table',
    data: {
      bindings: { type: 'data-table', columns: [] },
    },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Pivot Table'),
    },
    behaviour: defaultBehaviour(),
  }),
  'data-table': () => ({
    type: 'data-table',
    name: 'Data Table',
    data: {
      bindings: { type: 'data-table', columns: [] },
    },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Data Table'),
    },
    behaviour: { ...defaultBehaviour(), exportCsv: true },
  }),
  'status-table': () => ({
    type: 'status-table',
    name: 'Status Table',
    data: { bindings: { type: 'status-table', entityField: { fieldKey: '' }, kpiIds: [] } },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Status Table'),
      scorecard: { density: 'compact', rowBanding: true, stickyHeader: true },
    },
    behaviour: defaultBehaviour(),
  }),
  'drill-link': () => ({
    type: 'drill-link',
    name: 'Drill Link',
    data: { bindings: { type: 'drill-link', targetReportId: '', label: 'View Details' } },
    appearance: {
      container: { shadow: 'none', borderRadius: 8, background: 'transparent', border: true, borderColor: '#D6D3D1' },
      titleBar: { show: false },
    },
    behaviour: { ...defaultBehaviour(), onClick: 'open-detail' },
  }),
  'slicer': () => ({
    type: 'slicer',
    name: 'Slicer',
    data: { bindings: { type: 'slicer' as const, field: '', mode: 'multi' as const } },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Slicer'),
    },
    behaviour: defaultBehaviour(),
  }),
  'custom': () => ({
    type: 'custom',
    name: 'Custom Widget',
    data: { bindings: { type: 'data-table', columns: [] } },
    appearance: {
      container: defaultContainer(),
      titleBar: defaultTitleBar('Custom'),
    },
    behaviour: defaultBehaviour(),
  }),
};
