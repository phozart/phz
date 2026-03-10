/**
 * @phozart/phz-engine — Dashboard Configuration & Layout
 *
 * Dashboards are collections of widgets arranged in a responsive grid layout.
 */
import type { DashboardId, WidgetId, ValidationResult } from './types.js';
import type { WidgetPlacement } from './widget.js';
import type { CriteriaConfig } from '@phozart/phz-core';
import type { EnhancedDashboardConfig } from './dashboard-enhanced.js';
export interface DashboardLayout {
    columns: number;
    rowHeight: number;
    gap: number;
    responsive?: boolean;
}
export interface DashboardCrossFilterConfig {
    sourceWidget: WidgetId;
    targetWidgets: WidgetId[];
    filterField: string;
}
export interface ResolvedLayout {
    containerWidth: number;
    columnWidth: number;
    positions: Array<{
        widgetId: WidgetId;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}
/**
 * @deprecated Use `EnhancedDashboardConfig` (version 2) instead.
 * Call `upgradeDashboardConfig()` to convert.
 */
export interface DashboardConfig {
    id: DashboardId;
    name: string;
    description?: string;
    selectionFields?: string[];
    layout: DashboardLayout;
    widgets: WidgetPlacement[];
    crossFilter?: DashboardCrossFilterConfig;
    created: number;
    updated: number;
    createdBy?: string;
    permissions?: string[];
    autoRefreshInterval?: number;
    criteriaConfig?: CriteriaConfig;
}
export interface DashboardConfigStore {
    save(config: DashboardConfig): void;
    get(id: DashboardId): DashboardConfig | undefined;
    list(): DashboardConfig[];
    delete(id: DashboardId): void;
    validate(config: Partial<DashboardConfig>): ValidationResult;
    addWidget(dashboardId: DashboardId, widget: WidgetPlacement): void;
    removeWidget(dashboardId: DashboardId, widgetId: WidgetId): void;
    updateWidget(dashboardId: DashboardId, widgetId: WidgetId, updates: Partial<WidgetPlacement>): void;
    resolveLayout(config: DashboardConfig, containerWidth: number): ResolvedLayout;
}
export declare function createDashboardConfigStore(): DashboardConfigStore;
/**
 * Converts a legacy `DashboardConfig` (v1) to `EnhancedDashboardConfig` (v2).
 *
 * Mapping:
 * - `layout.columns` and `layout.gap` carry over directly
 * - Each `WidgetPlacement` becomes a `DashboardWidgetPlacement` with column/order derived from position
 * - `widgets` array is populated with minimal `EnhancedWidgetConfig` entries
 * - `created`/`updated` timestamps carry over into `metadata`
 * - `autoRefreshInterval` carries over
 * - `crossFilter` is dropped (no v2 equivalent — use globalFilters instead)
 */
export declare function upgradeDashboardConfig(legacy: DashboardConfig): EnhancedDashboardConfig;
//# sourceMappingURL=dashboard.d.ts.map