/**
 * @phozart/phz-workspace — Detail Source Loader (T.5)
 *
 * Loads detail data for drill-through, breach, and user-action triggers.
 * Maps dashboard filter context to detail source fields via filterMapping.
 * Fires preloadQuery + baseQuery in parallel when both are defined.
 */
import type { DetailSourceConfig, DetailTrigger } from '../types.js';
import type { DataAdapter, DataResult } from '../data-adapter.js';
export interface DetailLoadContext {
    currentFilters: Record<string, unknown>;
    clickedRow?: Record<string, unknown>;
    breachData?: unknown;
}
export interface DetailSourceLoader {
    loadDetail(sourceId: string, context: DetailLoadContext): Promise<DataResult>;
    getAvailableSources(trigger: DetailTrigger): DetailSourceConfig[];
    destroy(): void;
}
export declare function createDetailSourceLoader(sources: DetailSourceConfig[], dataAdapter: DataAdapter): DetailSourceLoader;
//# sourceMappingURL=detail-source-loader.d.ts.map