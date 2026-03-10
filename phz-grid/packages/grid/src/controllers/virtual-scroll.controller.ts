import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { RowData, AsyncDataSource, SortDirection } from '@phozart/phz-core';
import type { ScrollMode, Density } from '../types.js';
import { VirtualScroller } from '../virtual-scroller.js';
import { RemoteDataManager } from '../remote-data-manager.js';
import { dispatchGridEvent } from '../events.js';

export interface VirtualScrollHost extends ReactiveControllerHost, EventTarget {
  scrollMode: ScrollMode;
  virtualScrollThreshold: number;
  remoteDataSource?: AsyncDataSource;
  fetchPageSize: number;
  prefetchPages: number;
  virtualRowHeight?: number;
  density: Density;
  isConnected: boolean;
  renderRoot: Element | ShadowRoot | DocumentFragment;
  totalRowCount: number;
}

export class VirtualScrollController implements ReactiveController {
  private host: VirtualScrollHost;
  private virtualScroller: VirtualScroller | null = null;
  private remoteDataManager: RemoteDataManager | null = null;
  private _initScheduled = false;

  virtualStartIndex: number = 0;
  virtualEndIndex: number = 0;
  remoteLoading: boolean = false;
  remoteError: string | null = null;
  remoteTotalCount: number = 0;

  /** Callback to get filtered rows for client-side virtual scroll total */
  getFilteredRowCount?: () => number;

  get effectiveScrollMode(): ScrollMode {
    if (this.host.scrollMode === 'virtual') return 'virtual';
    if (this.host.virtualScrollThreshold > 0 && this.host.totalRowCount > this.host.virtualScrollThreshold) {
      return 'virtual';
    }
    return 'paginate';
  }

  get totalHeight(): number {
    return this.virtualScroller?.totalHeight ?? 0;
  }

  get isVirtual(): boolean {
    return this.effectiveScrollMode === 'virtual';
  }

  constructor(host: VirtualScrollHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {}

  hostDisconnected(): void {
    this.virtualScroller?.detach();
    this.virtualScroller = null;
    this.remoteDataManager?.destroy();
    this.remoteDataManager = null;
  }

  getDensityRowHeight(): number {
    if (this.host.virtualRowHeight) return this.host.virtualRowHeight;
    switch (this.host.density) {
      case 'comfortable': return 52;
      case 'compact': return 42;
      case 'dense': return 34;
    }
  }

  getRows(start: number, end: number): RowData[] {
    if (this.remoteDataManager) {
      return this.remoteDataManager.getRows(start, end) as RowData[];
    }
    return [];
  }

  setTotalRows(count: number): void {
    this.virtualScroller?.setTotalRows(count);
  }

  updateRowHeight(height: number): void {
    this.virtualScroller?.updateRowHeight(height);
  }

  initVirtualScroller(filteredRowCount: number): void {
    this.virtualScroller?.detach();
    const container = (this.host.renderRoot as Element).querySelector('.phz-grid__container') as HTMLElement;
    if (!container) return;

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
        dispatchGridEvent(this.host as unknown as HTMLElement, 'virtual-scroll', { startIndex: start, endIndex: end, totalCount: total });
      },
      onRender: () => this.host.requestUpdate(),
    });

    this.virtualScroller.attach(container);
  }

  initRemoteDataManager(): void {
    if (!this.host.remoteDataSource) return;
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
        dispatchGridEvent(this.host as unknown as HTMLElement, 'remote-data-load', { offset, count, totalCount });
      },
      onError: (error, offset) => {
        this.remoteError = error instanceof Error ? error.message : String(error);
        dispatchGridEvent(this.host as unknown as HTMLElement, 'remote-data-error', { error, offset });
        this.host.requestUpdate();
      },
    });

    this.remoteDataManager.ensureRange(0, this.host.fetchPageSize - 1);
  }

  applyEffectiveScrollMode(filteredRowCount: number): void {
    if (this.effectiveScrollMode === 'virtual') {
      if (!this.virtualScroller && !this._initScheduled) {
        this._initScheduled = true;
        if (this.host.remoteDataSource) this.initRemoteDataManager();
        this.host.updateComplete.then(() => {
          this._initScheduled = false;
          if (this.host.isConnected) this.initVirtualScroller(filteredRowCount);
        });
      }
    } else {
      this._initScheduled = false;
      this.virtualScroller?.detach();
      this.virtualScroller = null;
      this.remoteDataManager?.destroy();
      this.remoteDataManager = null;
      this.host.requestUpdate();
    }
  }

  destroyRemoteManager(): void {
    this.remoteDataManager?.destroy();
    this.remoteDataManager = null;
  }

  reinitRemoteManager(): void {
    this.remoteDataManager?.destroy();
    this.remoteDataManager = null;
    if (this.host.remoteDataSource) this.initRemoteDataManager();
  }

  ensureRange(start: number, end: number): void {
    this.remoteDataManager?.ensureRange(start, end);
  }

  retryLoad(): void {
    this.remoteError = null;
    this.remoteDataManager?.ensureRange(0, this.host.fetchPageSize - 1);
    this.host.requestUpdate();
  }

  setSortAndFilter(
    sort?: Array<{ field: string; direction: SortDirection }>,
    filter?: Array<{ field: string; operator: string; value: unknown }>,
  ): void {
    this.remoteDataManager?.setSortAndFilter(sort, filter);
  }

  get hasRemoteManager(): boolean {
    return this.remoteDataManager !== null;
  }
}
