/**
 * @phozart/phz-engine — Widget Configuration Types
 *
 * 10 widget types for dashboards: KPI cards, scorecards, charts, tables, and more.
 */
import type { WidgetId, KPIId, ReportId, DataProductId, ValidationResult } from './types.js';
import type { ChartOverlay } from './chart-overlays.js';
import type { ChartTooltipConfig } from './chart-tooltip.js';
export type WidgetType = 'kpi-card' | 'kpi-scorecard' | 'bar-chart' | 'trend-line' | 'bottom-n' | 'pivot-table' | 'data-table' | 'status-table' | 'drill-link' | 'custom';
export interface WidgetPosition {
    row: number;
    col: number;
    /** @default 1 */
    colSpan: number;
    /** @default 1 */
    rowSpan: number;
}
/** @deprecated Use colSpan/rowSpan on WidgetPosition directly */
export interface WidgetSize {
    rowSpan: number;
    colSpan: number;
}
export type VisibilityOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not-in' | 'is-set' | 'is-not-set';
export interface VisibilityExpression {
    field: string;
    operator: VisibilityOperator;
    value?: unknown;
}
export interface WidgetVisibilityCondition {
    expression: VisibilityExpression;
    evaluateAgainst: 'filter-state' | 'data-result';
    hiddenBehavior: 'collapse' | 'placeholder';
    transitionDuration?: number;
}
export interface BaseWidgetConfig {
    id: WidgetId;
    type: WidgetType;
    title?: string;
    position: WidgetPosition;
    /** @deprecated Span fields moved to WidgetPosition.colSpan/rowSpan */
    size?: WidgetSize;
    /** Optional condition that controls widget visibility at runtime */
    visibilityCondition?: WidgetVisibilityCondition;
}
export interface KPICardWidgetConfig extends BaseWidgetConfig {
    type: 'kpi-card';
    kpiId: KPIId;
    cardStyle?: 'compact' | 'expanded' | 'minimal';
}
export interface ScorecardWidgetConfig extends BaseWidgetConfig {
    type: 'kpi-scorecard';
    kpis: KPIId[];
    breakdowns?: string[];
    expandable: boolean;
    expandedWidgets?: WidgetId[];
}
export interface BarChartWidgetConfig extends BaseWidgetConfig {
    type: 'bar-chart';
    dataProductId: DataProductId;
    metricField: string;
    dimension: string;
    rankOrder?: 'asc' | 'desc';
    overlays?: ChartOverlay[];
    tooltipConfig?: ChartTooltipConfig;
}
export interface TrendLineWidgetConfig extends BaseWidgetConfig {
    type: 'trend-line';
    dataProductId: DataProductId;
    metricField: string;
    periods: number;
    showTarget?: boolean;
    overlays?: ChartOverlay[];
    tooltipConfig?: ChartTooltipConfig;
}
export interface BottomNWidgetConfig extends BaseWidgetConfig {
    type: 'bottom-n';
    dataProductId: DataProductId;
    metricField: string;
    dimension: string;
    n: number;
    direction?: 'bottom' | 'top';
    tooltipConfig?: ChartTooltipConfig;
}
export interface PivotTableWidgetConfig extends BaseWidgetConfig {
    type: 'pivot-table';
    reportId: ReportId;
}
export interface DataTableWidgetConfig extends BaseWidgetConfig {
    type: 'data-table';
    reportId: ReportId;
}
export interface StatusTableWidgetConfig extends BaseWidgetConfig {
    type: 'status-table';
    kpis: KPIId[];
    entityDimension: string;
}
export interface DrillLinkWidgetConfig extends BaseWidgetConfig {
    type: 'drill-link';
    label: string;
    targetReportId: ReportId;
    filters?: Record<string, string>;
}
export interface CustomWidgetConfig extends BaseWidgetConfig {
    type: 'custom';
    renderer: string;
}
export type WidgetConfig = KPICardWidgetConfig | ScorecardWidgetConfig | BarChartWidgetConfig | TrendLineWidgetConfig | BottomNWidgetConfig | PivotTableWidgetConfig | DataTableWidgetConfig | StatusTableWidgetConfig | DrillLinkWidgetConfig | CustomWidgetConfig;
export interface WidgetPlacement {
    id: WidgetId;
    widgetType: WidgetType;
    config: WidgetConfig;
    position: {
        row: number;
        col: number;
        rowSpan: number;
        colSpan: number;
    };
}
export declare function validateWidget(widget: Partial<BaseWidgetConfig>): ValidationResult;
//# sourceMappingURL=widget.d.ts.map