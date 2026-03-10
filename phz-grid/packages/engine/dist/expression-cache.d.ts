/**
 * @phozart/phz-engine — Expression Cache
 *
 * LRU cache for compiled expression functions.
 * Keyed by expression string, with stats tracking and schema-change invalidation.
 */
import type { ExpressionNode } from './expression-types.js';
import type { CompiledRowExpression, CompiledMetricExpression } from './expression-compiler.js';
export interface ExpressionCacheOptions {
    maxSize?: number;
}
export declare class ExpressionCache {
    private readonly maxSize;
    private readonly cache;
    private _hits;
    private _misses;
    constructor(options?: ExpressionCacheOptions);
    get size(): number;
    get hits(): number;
    get misses(): number;
    has(key: string): boolean;
    getOrCompileRow(key: string, ast: ExpressionNode): CompiledRowExpression;
    getOrCompileMetric(key: string, ast: ExpressionNode): CompiledMetricExpression;
    invalidate(): void;
    invalidateKey(key: string): void;
    stats(): {
        hits: number;
        misses: number;
        size: number;
        hitRate: number;
    };
}
//# sourceMappingURL=expression-cache.d.ts.map