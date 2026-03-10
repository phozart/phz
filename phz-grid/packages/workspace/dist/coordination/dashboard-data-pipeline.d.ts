/**
 * @phozart/phz-workspace — Dashboard Data Pipeline (T.4)
 *
 * Preload/full-load parallel data architecture:
 * - Fires preload query immediately for fast initial render.
 * - Fires full load in parallel for complete data.
 * - Distributes results to widgets based on dataTier.
 * - Supports invalidation (re-trigger on server filter change).
 * - Multi-source mode: tracks per-source loading states and results
 *   when `config.sources` is present and non-empty.
 */
import type { DashboardDataConfig, DashboardLoadingState } from '@phozart/phz-shared/coordination';
import type { DataAdapter, DataResult } from '../data-adapter.js';
import type { FilterContextManager } from '../filters/filter-context.js';
export interface DashboardDataPipeline {
    readonly state: DashboardLoadingState;
    readonly sourceStates: ReadonlyMap<string, DashboardLoadingState>;
    start(): Promise<void>;
    onStateChange(cb: (state: DashboardLoadingState) => void): () => void;
    getWidgetData(widgetId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
    getSourceData(sourceId: string, tier: 'preload' | 'full' | 'both'): DataResult | undefined;
    invalidate(sourceId?: string): Promise<void>;
    destroy(): void;
}
export declare function createDashboardDataPipeline(config: DashboardDataConfig, dataAdapter: DataAdapter, _filterContext: FilterContextManager, widgetSourceMap?: ReadonlyMap<string, string>): DashboardDataPipeline;
//# sourceMappingURL=dashboard-data-pipeline.d.ts.map