/**
 * @phozart/phz-engine — Enhanced Widget Configuration Types
 *
 * Rich per-widget configuration: data bindings, appearance, behaviour.
 * These extend the existing WidgetConfig types without breaking them.
 */
import type { WidgetId, KPIId } from './types.js';
import type { WidgetType } from './widget.js';
import type { AggregationFunction } from '@phozart/phz-core';
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
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'between' | 'is_null' | 'is_not_null';
export interface WidgetFilterRule {
    field: string;
    operator: FilterOperator;
    value: unknown;
    /** Second value for 'between' operator */
    value2?: unknown;
}
export interface Threshold {
    value: number;
    color: string;
    label?: string;
}
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
export type DataBinding = ChartBinding | KpiBinding | ScorecardBinding | StatusTableBinding | DataTableBinding | DrillLinkBinding;
export interface WidgetDataConfig {
    bindings: DataBinding;
    filters?: WidgetFilterRule[];
    sort?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
    groupOthers?: boolean;
}
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
    bar?: {
        orientation: 'horizontal' | 'vertical';
        barWidth?: number;
        gap?: number;
        stacked?: boolean;
    };
    line?: {
        curve: 'linear' | 'smooth';
        strokeWidth?: number;
        showDots?: boolean;
        fill?: boolean;
    };
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
export interface EnhancedWidgetConfig {
    id: WidgetId;
    type: WidgetType;
    name: string;
    data: WidgetDataConfig;
    appearance: WidgetAppearanceConfig;
    behaviour: WidgetBehaviourConfig;
}
export declare const SMART_DEFAULTS: Record<WidgetType, () => Omit<EnhancedWidgetConfig, 'id'>>;
//# sourceMappingURL=widget-config-enhanced.d.ts.map