/**
 * @phozart/engine — Resolution Cache
 *
 * Caches resolved widget props to avoid redundant computation.
 * Uses a compound key (widgetId + dataHash + filterHash) with TTL-based expiration.
 */
import type { ResolvedWidgetProps } from './widget-resolver.js';
export interface ResolutionCacheOptions {
    ttlMs?: number;
    maxEntries?: number;
}
export declare class ResolutionCache {
    private readonly ttlMs;
    private readonly maxEntries;
    private readonly entries;
    private _hits;
    private _misses;
    constructor(options?: ResolutionCacheOptions);
    private makeKey;
    get size(): number;
    get(widgetId: string, dataHash: string, filterHash: string): ResolvedWidgetProps | null;
    set(widgetId: string, dataHash: string, filterHash: string, result: ResolvedWidgetProps): void;
    invalidate(widgetId?: string): void;
    invalidateByFilter(filterHash: string): void;
    stats(): {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
    };
    /**
     * Fast data hash: uses array length + sample values from first, middle, and last rows.
     * Not a deep hash — designed for quick change detection, not cryptographic integrity.
     */
    static computeDataHash(data: Record<string, unknown>[]): string;
    /**
     * Filter hash: JSON.stringify of filter criteria object.
     */
    static computeFilterHash(filters: Record<string, unknown>): string;
}
//# sourceMappingURL=resolution-cache.d.ts.map