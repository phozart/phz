/**
 * @phozart/phz-grid — RemoteDataManager
 *
 * Manages async data fetching with page-based caching for remote data sources.
 * Works with the AsyncDataSource interface from @phozart/phz-core.
 */
import type { AsyncDataSource, DataFetchRequest } from '@phozart/phz-core';
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
export declare class RemoteDataManager {
    private dataSource;
    private pageSize;
    private prefetchPages;
    private maxCachedPages;
    private onDataUpdate;
    private onLoadingChange;
    private onTotalCountChange;
    private onPageLoad?;
    private onError?;
    private cache;
    private pageAccessOrder;
    private pendingPages;
    private totalCount;
    private sort?;
    private filter?;
    private destroyed;
    private activeRequests;
    constructor(options: RemoteDataManagerOptions);
    getTotalCount(): number;
    ensureRange(startRow: number, endRow: number): void;
    getRows(startRow: number, endRow: number): unknown[];
    setSortAndFilter(sort?: DataFetchRequest['sort'], filter?: DataFetchRequest['filter']): void;
    invalidateCache(): void;
    destroy(): void;
    private touchPage;
    private evictLRU;
    private fetchPage;
}
//# sourceMappingURL=remote-data-manager.d.ts.map