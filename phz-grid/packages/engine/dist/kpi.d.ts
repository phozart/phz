/**
 * @phozart/phz-engine — KPI Definitions & Registry
 *
 * KPIs are first-class entities with targets, thresholds, status classification,
 * breakdowns, delta comparison, and visualization defaults.
 */
import type { KPIId, DashboardId, ReportId, MetricId, ValidationResult } from './types.js';
import type { DataProductRegistry } from './data-product.js';
import type { ThresholdBand } from './expression-types.js';
export type KPIUnit = 'percent' | 'count' | 'duration' | 'currency' | 'custom';
export type KPIDirection = 'higher_is_better' | 'lower_is_better';
export type KPIDeltaComparison = 'previous_period' | 'same_period_last_year' | 'target' | 'none';
export type KPICardStyle = 'compact' | 'expanded' | 'minimal';
export type KPIColorScheme = 'traffic' | 'sequential' | 'diverging';
export interface KPIThresholds {
    ok: number;
    warn: number;
}
export interface KPIBreakdown {
    id: string;
    label: string;
    shortLabel?: string;
    description?: string;
    targetOverride?: number;
    thresholdOverrides?: {
        ok?: number;
        warn?: number;
    };
}
export interface KPIDataSource {
    scoreEndpoint: string;
    trendEndpoint?: string;
    breakdownEndpoint?: string;
    detailEndpoint?: string;
}
export interface KPIAlertConfig {
    field: string;
    criticalThreshold?: number;
}
export interface KPIDefinition {
    id: KPIId;
    name: string;
    description?: string;
    category?: string;
    target: number;
    unit: KPIUnit;
    unitLabel?: string;
    direction: KPIDirection;
    thresholds: KPIThresholds;
    format?: string;
    colorScheme?: KPIColorScheme;
    deltaComparison: KPIDeltaComparison;
    deltaUnit?: string;
    dimensions: string[];
    breakdowns?: KPIBreakdown[];
    dashboardId?: DashboardId;
    drillDownReportId?: ReportId;
    dataSource: KPIDataSource;
    alerts?: KPIAlertConfig;
    sparkline?: {
        enabled: boolean;
        periods: number;
    };
    trend?: {
        enabled: boolean;
        periods: number;
    };
    breakdownDimensions?: string[];
    defaultCardStyle?: KPICardStyle;
    sortOrder?: number;
    permissions?: string[];
    /** Link KPI to a metric for data model integration */
    metricId?: MetricId;
    /** Custom threshold bands (overrides simple ok/warn when present) */
    bands?: ThresholdBand[];
}
/** Score response from API — per-breakdown values with optional trend */
export interface KPIScoreResponse {
    kpiId: KPIId;
    value: number;
    previousValue?: number;
    breakdowns?: KPIBreakdownScore[];
    trend?: number[];
}
export interface KPIBreakdownScore {
    breakdownId: string;
    value: number;
    previousValue?: number;
}
export interface KPIRegistry {
    register(kpi: KPIDefinition): void;
    get(id: KPIId): KPIDefinition | undefined;
    list(): KPIDefinition[];
    listByCategory(category: string): KPIDefinition[];
    remove(id: KPIId): void;
    validate(kpi: Partial<KPIDefinition>): ValidationResult;
    reorder(ids: KPIId[]): void;
}
export declare function createKPIRegistry(dataProducts?: DataProductRegistry): KPIRegistry;
//# sourceMappingURL=kpi.d.ts.map