/**
 * @phozart/phz-engine — Config Merge / Layering
 *
 * 3-layer merge: Admin (L0) → Super User (L1) → Personal User View (L2).
 */
import type { ConfigLayer } from './types.js';
import type { ReportConfig } from './report.js';
import type { DashboardConfig } from './dashboard.js';
export interface UserViewConfig {
    id: string;
    userId: string;
    sourceType: 'report' | 'dashboard';
    sourceId: string;
    overrides: {
        selection?: Record<string, string | string[] | null>;
        sort?: {
            columns: Array<{
                field: string;
                direction: 'asc' | 'desc';
            }>;
        };
        columnWidths?: Record<string, number>;
        expandedGroups?: string[];
        visualization?: Record<string, unknown>;
    };
    name?: string;
    isDefault?: boolean;
}
export interface ConfigLayerDef<T> {
    layer: ConfigLayer;
    config: Partial<T>;
}
export declare function deepMerge<T>(base: T, override: Partial<T>): T;
export declare function mergeReportConfigs(layers: ConfigLayerDef<ReportConfig>[]): ReportConfig;
export declare function mergeDashboardConfigs(layers: ConfigLayerDef<DashboardConfig>[]): DashboardConfig;
export interface ConfigLayerManager<T> {
    setLayer(layer: ConfigLayer, config: Partial<T>): void;
    getLayer(layer: ConfigLayer): Partial<T> | undefined;
    removeLayer(layer: ConfigLayer): void;
    getMerged(): T;
    getLayers(): ConfigLayerDef<T>[];
}
export declare function createConfigLayerManager<T>(): ConfigLayerManager<T>;
//# sourceMappingURL=config-merge.d.ts.map