/**
 * @phozart/grid — RemoteDataManager
 *
 * Manages async data fetching with page-based caching for remote data sources.
 * Works with the AsyncDataSource interface from @phozart/core.
 */
export class RemoteDataManager {
    constructor(options) {
        this.cache = new Map();
        this.pageAccessOrder = [];
        this.pendingPages = new Set();
        this.totalCount = 0;
        this.destroyed = false;
        this.activeRequests = 0;
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
    getTotalCount() {
        return this.totalCount;
    }
    ensureRange(startRow, endRow) {
        const startPage = Math.floor(startRow / this.pageSize);
        const endPage = Math.floor(endRow / this.pageSize);
        // Fetch visible pages plus prefetch ahead
        for (let p = startPage; p <= endPage + this.prefetchPages; p++) {
            if (p < 0)
                continue;
            if (!this.cache.has(p) && !this.pendingPages.has(p)) {
                this.fetchPage(p);
            }
        }
    }
    getRows(startRow, endRow) {
        const result = [];
        const touchedPages = new Set();
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
            }
            else {
                result.push({ __skeleton: true, __index: i });
            }
        }
        return result;
    }
    setSortAndFilter(sort, filter) {
        this.sort = sort;
        this.filter = filter;
        this.invalidateCache();
    }
    invalidateCache() {
        this.cache.clear();
        this.pageAccessOrder = [];
        this.pendingPages.clear();
        this.onDataUpdate();
    }
    destroy() {
        this.destroyed = true;
        this.cache.clear();
        this.pageAccessOrder = [];
        this.pendingPages.clear();
    }
    touchPage(pageNumber) {
        const idx = this.pageAccessOrder.indexOf(pageNumber);
        if (idx !== -1) {
            this.pageAccessOrder.splice(idx, 1);
        }
        this.pageAccessOrder.push(pageNumber);
    }
    evictLRU() {
        while (this.cache.size > this.maxCachedPages && this.pageAccessOrder.length > 0) {
            const evictPage = this.pageAccessOrder.shift();
            this.cache.delete(evictPage);
        }
    }
    async fetchPage(pageNumber) {
        if (this.destroyed)
            return;
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
            if (this.destroyed)
                return;
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
        }
        catch (err) {
            if (this.destroyed)
                return;
            this.onError?.(err instanceof Error ? err : new Error(String(err)), offset);
        }
        finally {
            this.pendingPages.delete(pageNumber);
            this.activeRequests--;
            if (this.activeRequests === 0 && !this.destroyed) {
                this.onLoadingChange(false);
            }
        }
    }
}
//# sourceMappingURL=remote-data-manager.js.map