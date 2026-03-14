import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { RowData, AsyncDataSource, SortDirection } from '@phozart/core';
import type { ScrollMode, Density } from '../types.js';
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
export declare class VirtualScrollController implements ReactiveController {
    private host;
    private virtualScroller;
    private remoteDataManager;
    private _initScheduled;
    virtualStartIndex: number;
    virtualEndIndex: number;
    remoteLoading: boolean;
    remoteError: string | null;
    remoteTotalCount: number;
    /** Callback to get filtered rows for client-side virtual scroll total */
    getFilteredRowCount?: () => number;
    get effectiveScrollMode(): ScrollMode;
    get totalHeight(): number;
    get isVirtual(): boolean;
    constructor(host: VirtualScrollHost);
    hostConnected(): void;
    hostDisconnected(): void;
    getDensityRowHeight(): number;
    getRows(start: number, end: number): RowData[];
    setTotalRows(count: number): void;
    updateRowHeight(height: number): void;
    initVirtualScroller(filteredRowCount: number): void;
    initRemoteDataManager(): void;
    applyEffectiveScrollMode(filteredRowCount: number): void;
    destroyRemoteManager(): void;
    reinitRemoteManager(): void;
    ensureRange(start: number, end: number): void;
    retryLoad(): void;
    setSortAndFilter(sort?: Array<{
        field: string;
        direction: SortDirection;
    }>, filter?: Array<{
        field: string;
        operator: string;
        value: unknown;
    }>): void;
    get hasRemoteManager(): boolean;
}
//# sourceMappingURL=virtual-scroll.controller.d.ts.map