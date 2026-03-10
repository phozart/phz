/**
 * @phozart/phz-engine — Expression Cache
 *
 * LRU cache for compiled expression functions.
 * Keyed by expression string, with stats tracking and schema-change invalidation.
 */
import { compileRowExpression, compileMetricExpression } from './expression-compiler.js';
export class ExpressionCache {
    maxSize;
    cache = new Map();
    _hits = 0;
    _misses = 0;
    constructor(options) {
        this.maxSize = options?.maxSize ?? 256;
    }
    get size() {
        return this.cache.size;
    }
    get hits() {
        return this._hits;
    }
    get misses() {
        return this._misses;
    }
    has(key) {
        return this.cache.has(key);
    }
    getOrCompileRow(key, ast) {
        const existing = this.cache.get(key);
        if (existing) {
            this._hits++;
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, existing);
            return existing.value;
        }
        this._misses++;
        const compiled = compileRowExpression(ast);
        const entry = { key, value: compiled };
        if (this.cache.size >= this.maxSize) {
            // Evict LRU (first entry in Map iteration order)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, entry);
        return compiled;
    }
    getOrCompileMetric(key, ast) {
        const existing = this.cache.get(key);
        if (existing) {
            this._hits++;
            this.cache.delete(key);
            this.cache.set(key, existing);
            return existing.value;
        }
        this._misses++;
        const compiled = compileMetricExpression(ast);
        const entry = { key, value: compiled };
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, entry);
        return compiled;
    }
    invalidate() {
        this.cache.clear();
    }
    invalidateKey(key) {
        this.cache.delete(key);
    }
    stats() {
        const total = this._hits + this._misses;
        return {
            hits: this._hits,
            misses: this._misses,
            size: this.cache.size,
            hitRate: total > 0 ? this._hits / total : 0,
        };
    }
}
//# sourceMappingURL=expression-cache.js.map