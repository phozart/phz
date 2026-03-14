/**
 * @phozart/grid — VirtualScroller
 *
 * Encapsulates scroll mechanics for virtual scroll mode.
 * Attaches to a scroll container, calculates visible row range
 * with overscan, and notifies the grid when the range changes.
 */
export interface VirtualScrollerOptions {
    rowHeight: number;
    overscan?: number;
    totalRows: number;
    onRangeChange: (startIndex: number, endIndex: number) => void;
    onRender: () => void;
}
export declare class VirtualScroller {
    private container;
    private rowHeight;
    private overscan;
    private totalRows;
    private onRangeChange;
    private onRender;
    private startIndex;
    private endIndex;
    private rafId;
    private scrollHandler;
    constructor(options: VirtualScrollerOptions);
    attach(container: HTMLElement): void;
    detach(): void;
    setTotalRows(count: number): void;
    updateRowHeight(height: number): void;
    get totalHeight(): number;
    getRange(): {
        startIndex: number;
        endIndex: number;
    };
    scrollToIndex(index: number, behavior?: ScrollBehavior): void;
    private scheduleUpdate;
    private pendingRecalc;
    private calculateRange;
}
//# sourceMappingURL=virtual-scroller.d.ts.map