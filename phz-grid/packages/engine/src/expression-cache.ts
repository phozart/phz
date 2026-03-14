/**
 * @phozart/engine — Expression Cache
 *
 * LRU cache for compiled expression functions.
 * Keyed by expression string, with stats tracking and schema-change invalidation.
 */

import type { ExpressionNode } from './expression-types.js';
import { compileRowExpression, compileMetricExpression } from './expression-compiler.js';
import type { CompiledRowExpression, CompiledMetricExpression } from './expression-compiler.js';

export interface ExpressionCacheOptions {
  maxSize?: number;
}

interface CacheEntry {
  key: string;
  value: CompiledRowExpression | CompiledMetricExpression;
}

export class ExpressionCache {
  private readonly maxSize: number;
  private readonly cache = new Map<string, CacheEntry>();
  private _hits = 0;
  private _misses = 0;

  constructor(options?: ExpressionCacheOptions) {
    this.maxSize = options?.maxSize ?? 256;
  }

  get size(): number {
    return this.cache.size;
  }

  get hits(): number {
    return this._hits;
  }

  get misses(): number {
    return this._misses;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getOrCompileRow(key: string, ast: ExpressionNode): CompiledRowExpression {
    const existing = this.cache.get(key);
    if (existing) {
      this._hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, existing);
      return existing.value as CompiledRowExpression;
    }

    this._misses++;
    const compiled = compileRowExpression(ast);
    const entry: CacheEntry = { key, value: compiled };

    if (this.cache.size >= this.maxSize) {
      // Evict LRU (first entry in Map iteration order)
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, entry);
    return compiled;
  }

  getOrCompileMetric(key: string, ast: ExpressionNode): CompiledMetricExpression {
    const existing = this.cache.get(key);
    if (existing) {
      this._hits++;
      this.cache.delete(key);
      this.cache.set(key, existing);
      return existing.value as CompiledMetricExpression;
    }

    this._misses++;
    const compiled = compileMetricExpression(ast);
    const entry: CacheEntry = { key, value: compiled };

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, entry);
    return compiled;
  }

  invalidate(): void {
    this.cache.clear();
  }

  invalidateKey(key: string): void {
    this.cache.delete(key);
  }

  stats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this._hits + this._misses;
    return {
      hits: this._hits,
      misses: this._misses,
      size: this.cache.size,
      hitRate: total > 0 ? this._hits / total : 0,
    };
  }
}
