/**
 * @phozart/phz-engine — Base Types
 *
 * Branded ID types, config layers, and shared types for the BI engine.
 */
export type KPIId = string & {
    readonly __brand: 'KPIId';
};
export type MetricId = string & {
    readonly __brand: 'MetricId';
};
export type ReportId = string & {
    readonly __brand: 'ReportId';
};
export type DashboardId = string & {
    readonly __brand: 'DashboardId';
};
export type WidgetId = string & {
    readonly __brand: 'WidgetId';
};
export type DataProductId = string & {
    readonly __brand: 'DataProductId';
};
export declare function kpiId(id: string): KPIId;
export declare function metricId(id: string): MetricId;
export declare function reportId(id: string): ReportId;
export declare function dashboardId(id: string): DashboardId;
export declare function widgetId(id: string): WidgetId;
export declare function dataProductId(id: string): DataProductId;
export type ConfigLayer = 'system' | 'admin' | 'user';
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    path: string;
    message: string;
}
export type StatusLevel = 'ok' | 'warn' | 'crit' | 'unknown';
import type { ArtefactId } from '@phozart/phz-core';
export declare function reportArtefactId(id: ReportId): ArtefactId;
export declare function dashboardArtefactId(id: DashboardId): ArtefactId;
export declare function widgetArtefactId(id: WidgetId): ArtefactId;
export declare function parseArtefactId(id: ArtefactId): {
    type: 'report' | 'dashboard' | 'widget' | 'unknown';
    rawId: string;
};
//# sourceMappingURL=types.d.ts.map