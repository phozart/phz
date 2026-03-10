/**
 * @phozart/phz-engine — Resolution Cache
 *
 * Caches resolved widget props to avoid redundant computation.
 * Uses a compound key (widgetId + dataHash + filterHash) with TTL-based expiration.
 */

import type { ResolvedWidgetProps } from './widget-resolver.js';

export interface ResolutionCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

interface CacheEntry {
  widgetId: string;
  dataHash: string;
  filterHash: string;
  result: ResolvedWidgetProps;
  timestamp: number;
}

export class ResolutionCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly entries = new Map<string, CacheEntry>();
  private _hits = 0;
  private _misses = 0;

  constructor(options?: ResolutionCacheOptions) {
    this.ttlMs = options?.ttlMs ?? 30_000;
    this.maxEntries = options?.maxEntries ?? 100;
  }

  private makeKey(widgetId: string, dataHash: string, filterHash: string): string {
    return `${widgetId}::${dataHash}::${filterHash}`;
  }

  get size(): number {
    return this.entries.size;
  }

  get(widgetId: string, dataHash: string, filterHash: string): ResolvedWidgetProps | null {
    const key = this.makeKey(widgetId, dataHash, filterHash);
    const entry = this.entries.get(key);

    if (!entry) {
      this._misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.entries.delete(key);
      this._misses++;
      return null;
    }

    this._hits++;
    return entry.result;
  }

  set(widgetId: string, dataHash: string, filterHash: string, result: ResolvedWidgetProps): void {
    const key = this.makeKey(widgetId, dataHash, filterHash);

    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      // Evict oldest entry (first in insertion order)
      const firstKey = this.entries.keys().next().value!;
      this.entries.delete(firstKey);
    }

    this.entries.set(key, {
      widgetId,
      dataHash,
      filterHash,
      result,
      timestamp: Date.now(),
    });
  }

  invalidate(widgetId?: string): void {
    if (!widgetId) {
      this.entries.clear();
      return;
    }

    for (const [key, entry] of this.entries) {
      if (entry.widgetId === widgetId) {
        this.entries.delete(key);
      }
    }
  }

  invalidateByFilter(filterHash: string): void {
    for (const [key, entry] of this.entries) {
      if (entry.filterHash === filterHash) {
        this.entries.delete(key);
      }
    }
  }

  stats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this._hits + this._misses;
    return {
      size: this.entries.size,
      hits: this._hits,
      misses: this._misses,
      hitRate: total > 0 ? this._hits / total : 0,
    };
  }

  /**
   * Fast data hash: uses array length + sample values from first, middle, and last rows.
   * Not a deep hash — designed for quick change detection, not cryptographic integrity.
   */
  static computeDataHash(data: Record<string, unknown>[]): string {
    if (data.length === 0) return 'empty:0';

    const len = data.length;
    const first = data[0];
    const mid = data[Math.floor(len / 2)];
    const last = data[len - 1];

    const sample = [first, mid, last]
      .map(row => {
        const keys = Object.keys(row);
        const vals = keys.slice(0, 3).map(k => String(row[k] ?? ''));
        return vals.join(',');
      })
      .join('|');

    return `len:${len}|${sample}`;
  }

  /**
   * Filter hash: JSON.stringify of filter criteria object.
   */
  static computeFilterHash(filters: Record<string, unknown>): string {
    return JSON.stringify(filters);
  }
}
