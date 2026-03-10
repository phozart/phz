/**
 * @phozart/phz-engine — Enhanced Dashboard Configuration Types
 *
 * Extends existing DashboardConfig with global filters, themes,
 * and full serialization format.
 */
import type { DashboardId, WidgetId } from './types.js';
import type { EnhancedWidgetConfig } from './widget-config-enhanced.js';
import type { KPIDefinition } from './kpi.js';
import type { MetricDef } from './metric.js';
import type { DashboardDataModel } from './expression-types.js';
export type GlobalFilterType = 'select' | 'multi-select' | 'date-range' | 'text-search' | 'number-range';
export interface GlobalFilter {
    id: string;
    label: string;
    fieldKey: string;
    filterType: GlobalFilterType;
    defaultValue?: unknown;
    /** If empty, filter applies to all widgets */
    targetWidgetIds?: WidgetId[];
}
export interface DashboardTheme {
    mode: 'light' | 'dark';
    background: string;
    cardBackground: string;
    textColor: string;
    mutedColor: string;
    borderColor: string;
    accentColor: string;
}
export declare const DEFAULT_DASHBOARD_THEME: DashboardTheme;
export interface DashboardWidgetPlacement {
    widgetId: WidgetId;
    column: number;
    order: number;
    colSpan: number;
    heightOverride?: number;
}
export interface EnhancedDashboardConfig {
    version: 2;
    id: DashboardId;
    name: string;
    description?: string;
    layout: {
        columns: number;
        gap: number;
    };
    widgets: EnhancedWidgetConfig[];
    placements: DashboardWidgetPlacement[];
    globalFilters: GlobalFilter[];
    theme: DashboardTheme;
    metadata: {
        created: number;
        updated: number;
        createdBy?: string;
    };
    autoRefreshInterval?: number;
    /** Optional data model for expression-based computed metrics/KPIs */
    dataModel?: DashboardDataModel;
}
export interface DashboardSerializationFormat {
    version: 2;
    dashboard: {
        id: string;
        name: string;
        description?: string;
        layout: {
            columns: number;
            gap: number;
        };
        theme: DashboardTheme;
        autoRefreshInterval?: number;
    };
    widgets: EnhancedWidgetConfig[];
    placements: DashboardWidgetPlacement[];
    globalFilters: GlobalFilter[];
    kpis: KPIDefinition[];
    metrics: MetricDef[];
    datasetSchema: {
        fieldKey: string;
        type: string;
    }[];
}
export declare function createEnhancedDashboardConfig(id: DashboardId, name: string): EnhancedDashboardConfig;
export declare function serializeDashboard(config: EnhancedDashboardConfig, kpis: KPIDefinition[], metrics: MetricDef[], datasetSchema: {
    fieldKey: string;
    type: string;
}[]): DashboardSerializationFormat;
/**
 * Detect whether a config object is an enhanced (v2) dashboard.
 */
export declare function isEnhancedDashboard(config: unknown): config is EnhancedDashboardConfig;
//# sourceMappingURL=dashboard-enhanced.d.ts.map