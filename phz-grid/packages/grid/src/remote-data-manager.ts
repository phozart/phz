/**
 * @phozart/grid — RemoteDataManager
 *
 * Manages async data fetching with page-based caching for remote data sources.
 * Works with the AsyncDataSource interface from @phozart/core.
 */

import type { AsyncDataSource, DataFetchRequest } from '@phozart/core';

export interface RemoteDataManagerOptions {
  dataSource: AsyncDataSource;
  pageSize?: number;
  prefetchPages?: number;
  maxCachedPages?: number;
  onDataUpdate: () => void;
  onLoadingChange: (loading: boolean) => void;
  onTotalCountChange: (totalCount: number) => void;
  onPageLoad?: (offset: number, count: number, totalCount: number) => void;
  onError?: (error: Error, offset: number) => void;
}

interface CachedPage {
  data: unknown[];
  timestamp: number;
}

export class RemoteDataManager {
  private dataSource: AsyncDataSource;
  private pageSize: number;
  private prefetchPages: number;
  private maxCachedPages: number;
  private onDataUpdate: () => void;
  private onLoadingChange: (loading: boolean) => void;
  private onTotalCountChange: (totalCount: number) => void;
  private onPageLoad?: (offset: number, count: number, totalCount: number) => void;
  private onError?: (error: Error, offset: number) => void;

  private cache = new Map<number, CachedPage>();
  private pageAccessOrder: number[] = [];
  private pendingPages = new Set<number>();
  private totalCount = 0;
  private sort?: DataFetchRequest['sort'];
  private filter?: DataFetchRequest['filter'];
  private destroyed = false;
  private activeRequests = 0;

  constructor(options: RemoteDataManagerOptions) {
    this.dataSource = options.dataSource;
    this.pageSize = options.pageSize ?? 100;
    this.prefetchPages = options.prefetchPages ?? 2;
    this.maxCachedPages = options.maxCachedPages ?? 100;
    this.onDataUpdate = options.onDataUpdate;
    this.onLoadingChange = options.onLoadingChange;
    this.onTotalCountChange = options.onTotalCountChange;
    this.onPageLoad = options.onPageLoad;
    this.onError = options.onError;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  ensureRange(startRow: number, endRow: number): void {
    const startPage = Math.floor(startRow / this.pageSize);
    const endPage = Math.floor(endRow / this.pageSize);

    // Fetch visible pages plus prefetch ahead
    for (let p = startPage; p <= endPage + this.prefetchPages; p++) {
      if (p < 0) continue;
      if (!this.cache.has(p) && !this.pendingPages.has(p)) {
        this.fetchPage(p);
      }
    }
  }

  getRows(startRow: number, endRow: number): unknown[] {
    const result: unknown[] = [];
    const touchedPages = new Set<number>();
    for (let i = startRow; i <= endRow; i++) {
      const page = Math.floor(i / this.pageSize);
      const indexInPage = i % this.pageSize;
      const cached = this.cache.get(page);
      if (cached && indexInPage < cached.data.length) {
        result.push(cached.data[indexInPage]);
        if (!touchedPages.has(page)) {
          touchedPages.add(page);
          this.touchPage(page);
        }
      } else {
        result.push({ __skeleton: true, __index: i });
      }
    }
    return result;
  }

  setSortAndFilter(
    sort?: DataFetchRequest['sort'],
    filter?: DataFetchRequest['filter'],
  ): void {
    this.sort = sort;
    this.filter = filter;
    this.invalidateCache();
  }

  invalidateCache(): void {
    this.cache.clear();
    this.pageAccessOrder = [];
    this.pendingPages.clear();
    this.onDataUpdate();
  }

  destroy(): void {
    this.destroyed = true;
    this.cache.clear();
    this.pageAccessOrder = [];
    this.pendingPages.clear();
  }

  private touchPage(pageNumber: number): void {
    const idx = this.pageAccessOrder.indexOf(pageNumber);
    if (idx !== -1) {
      this.pageAccessOrder.splice(idx, 1);
    }
    this.pageAccessOrder.push(pageNumber);
  }

  private evictLRU(): void {
    while (this.cache.size > this.maxCachedPages && this.pageAccessOrder.length > 0) {
      const evictPage = this.pageAccessOrder.shift()!;
      this.cache.delete(evictPage);
    }
  }

  private async fetchPage(pageNumber: number): Promise<void> {
    if (this.destroyed) return;

    this.pendingPages.add(pageNumber);
    this.activeRequests++;
    if (this.activeRequests === 1) {
      this.onLoadingChange(true);
    }

    const offset = pageNumber * this.pageSize;

    try {
      const response = await this.dataSource.fetch({
        offset,
        limit: this.pageSize,
        sort: this.sort,
        filter: this.filter,
      });

      if (this.destroyed) return;

      this.cache.set(pageNumber, {
        data: response.data,
        timestamp: Date.now(),
      });
      this.touchPage(pageNumber);
      this.evictLRU();

      if (response.totalCount !== this.totalCount) {
        this.totalCount = response.totalCount;
        this.onTotalCountChange(response.totalCount);
      }

      this.onPageLoad?.(offset, response.data.length, response.totalCount);
      this.onDataUpdate();
    } catch (err) {
      if (this.destroyed) return;
      this.onError?.(err instanceof Error ? err : new Error(String(err)), offset);
    } finally {
      this.pendingPages.delete(pageNumber);
      this.activeRequests--;
      if (this.activeRequests === 0 && !this.destroyed) {
        this.onLoadingChange(false);
      }
    }
  }
}
