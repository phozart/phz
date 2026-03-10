/**
 * @phozart/phz-workspace — Query Layer Resolution (T.2)
 *
 * Determines whether a filter change should trigger a server reload
 * or a client-side re-query based on the filter's queryLayer config.
 */
import type { DashboardFilterDef } from '../types.js';
/**
 * Resolves a queryLayer value ('server' | 'client' | 'auto' | undefined)
 * to a concrete execution layer.
 *
 * - 'server' / 'client' → returned as-is.
 * - 'auto' → heuristic based on estimatedRows (> 10k → server, else client).
 * - undefined → defaults to 'server' (safe default).
 */
export declare function resolveQueryLayer(queryLayer: 'server' | 'client' | 'auto' | undefined, hints?: {
    estimatedRows?: number;
}): 'server' | 'client';
/**
 * Classifies a filter change as 'reload' (server filter changed → need full data reload)
 * or 'requery' (client filter changed → can filter locally).
 */
export declare function classifyFilterChange(filterDef: DashboardFilterDef): 'reload' | 'requery';
//# sourceMappingURL=query-layer.d.ts.map