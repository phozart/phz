import { VirtualScroller } from '../virtual-scroller.js';
import { RemoteDataManager } from '../remote-data-manager.js';
import { dispatchGridEvent } from '../events.js';
export class VirtualScrollController {
    get effectiveScrollMode() {
        if (this.host.scrollMode === 'virtual')
            return 'virtual';
        if (this.host.virtualScrollThreshold > 0 && this.host.totalRowCount > this.host.virtualScrollThreshold) {
            return 'virtual';
        }
        return 'paginate';
    }
    get totalHeight() {
        return this.virtualScroller?.totalHeight ?? 0;
    }
    get isVirtual() {
        return this.effectiveScrollMode === 'virtual';
    }
    constructor(host) {
        this.virtualScroller = null;
        this.remoteDataManager = null;
        this._initScheduled = false;
        this.virtualStartIndex = 0;
        this.virtualEndIndex = 0;
        this.remoteLoading = false;
        this.remoteError = null;
        this.remoteTotalCount = 0;
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() {
        this.virtualScroller?.detach();
        this.virtualScroller = null;
        this.remoteDataManager?.destroy();
        this.remoteDataManager = null;
    }
    getDensityRowHeight() {
        if (this.host.virtualRowHeight)
            return this.host.virtualRowHeight;
        switch (this.host.density) {
            case 'comfortable': return 52;
            case 'compact': return 42;
            case 'dense': return 34;
        }
    }
    getRows(start, end) {
        if (this.remoteDataManager) {
            return this.remoteDataManager.getRows(start, end);
        }
        return [];
    }
    setTotalRows(count) {
        this.virtualScroller?.setTotalRows(count);
    }
    updateRowHeight(height) {
        this.virtualScroller?.updateRowHeight(height);
    }
    initVirtualScroller(filteredRowCount) {
        this.virtualScroller?.detach();
        const container = this.host.renderRoot.querySelector('.phz-grid__container');
        if (!container)
            return;
        const totalRows = this.remoteDataManager ? this.remoteTotalCount : filteredRowCount;
        this.virtualScroller = new VirtualScroller({
            rowHeight: this.getDensityRowHeight(),
            overscan: 5,
            totalRows,
            onRangeChange: (start, end) => {
                this.virtualStartIndex = start;
                this.virtualEndIndex = end;
                if (this.remoteDataManager) {
                    this.remoteDataManager.ensureRange(start, end);
                }
                const total = this.remoteDataManager ? this.remoteTotalCount : filteredRowCount;
                dispatchGridEvent(this.host, 'virtual-scroll', { startIndex: start, endIndex: end, totalCount: total });
            },
            onRender: () => this.host.requestUpdate(),
        });
        this.virtualScroller.attach(container);
    }
    initRemoteDataManager() {
        if (!this.host.remoteDataSource)
            return;
        this.remoteDataManager?.destroy();
        this.remoteDataManager = new RemoteDataManager({
            dataSource: this.host.remoteDataSource,
            pageSize: this.host.fetchPageSize,
            prefetchPages: this.host.prefetchPages,
            onDataUpdate: () => { this.host.requestUpdate(); },
            onLoadingChange: (loading) => {
                this.remoteLoading = loading;
                this.host.requestUpdate();
            },
            onTotalCountChange: (count) => {
                this.remoteTotalCount = count;
                if (this.virtualScroller) {
                    this.virtualScroller.setTotalRows(count);
                }
                this.host.requestUpdate();
            },
            onPageLoad: (offset, count, totalCount) => {
                this.remoteError = null;
                dispatchGridEvent(this.host, 'remote-data-load', { offset, count, totalCount });
            },
            onError: (error, offset) => {
                this.remoteError = error instanceof Error ? error.message : String(error);
                dispatchGridEvent(this.host, 'remote-data-error', { error, offset });
                this.host.requestUpdate();
            },
        });
        this.remoteDataManager.ensureRange(0, this.host.fetchPageSize - 1);
    }
    applyEffectiveScrollMode(filteredRowCount) {
        if (this.effectiveScrollMode === 'virtual') {
            if (!this.virtualScroller && !this._initScheduled) {
                this._initScheduled = true;
                if (this.host.remoteDataSource)
                    this.initRemoteDataManager();
                this.host.updateComplete.then(() => {
                    this._initScheduled = false;
                    if (this.host.isConnected)
                        this.initVirtualScroller(filteredRowCount);
                });
            }
        }
        else {
            this._initScheduled = false;
            this.virtualScroller?.detach();
            this.virtualScroller = null;
            this.remoteDataManager?.destroy();
            this.remoteDataManager = null;
            this.host.requestUpdate();
        }
    }
    destroyRemoteManager() {
        this.remoteDataManager?.destroy();
        this.remoteDataManager = null;
    }
    reinitRemoteManager() {
        this.remoteDataManager?.destroy();
        this.remoteDataManager = null;
        if (this.host.remoteDataSource)
            this.initRemoteDataManager();
    }
    ensureRange(start, end) {
        this.remoteDataManager?.ensureRange(start, end);
    }
    retryLoad() {
        this.remoteError = null;
        this.remoteDataManager?.ensureRange(0, this.host.fetchPageSize - 1);
        this.host.requestUpdate();
    }
    setSortAndFilter(sort, filter) {
        this.remoteDataManager?.setSortAndFilter(sort, filter);
    }
    get hasRemoteManager() {
        return this.remoteDataManager !== null;
    }
}
//# sourceMappingURL=virtual-scroll.controller.js.map