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

export class VirtualScroller {
  private container: HTMLElement | null = null;
  private rowHeight: number;
  private overscan: number;
  private totalRows: number;
  private onRangeChange: (startIndex: number, endIndex: number) => void;
  private onRender: () => void;

  private startIndex = 0;
  private endIndex = 0;
  private rafId: number | null = null;
  private scrollHandler: (() => void) | null = null;

  constructor(options: VirtualScrollerOptions) {
    this.rowHeight = options.rowHeight;
    this.overscan = options.overscan ?? 5;
    this.totalRows = options.totalRows;
    this.onRangeChange = options.onRangeChange;
    this.onRender = options.onRender;
  }

  attach(container: HTMLElement): void {
    this.container = container;
    this.scrollHandler = () => this.scheduleUpdate();
    container.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.calculateRange();
  }

  detach(): void {
    if (this.container && this.scrollHandler) {
      this.container.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.container = null;
    this.scrollHandler = null;
  }

  setTotalRows(count: number): void {
    this.totalRows = count;
    this.calculateRange();
  }

  updateRowHeight(height: number): void {
    this.rowHeight = height;
    this.calculateRange();
  }

  get totalHeight(): number {
    return this.totalRows * this.rowHeight;
  }

  getRange(): { startIndex: number; endIndex: number } {
    return { startIndex: this.startIndex, endIndex: this.endIndex };
  }

  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
    if (!this.container) return;
    const top = Math.max(0, index * this.rowHeight);
    this.container.scrollTo({ top, behavior });
  }

  private scheduleUpdate(): void {
    if (this.rafId != null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.calculateRange();
    });
  }

  private pendingRecalc = false;

  private calculateRange(): void {
    if (!this.container) return;

    const scrollTop = this.container.scrollTop;
    const viewportHeight = this.container.clientHeight;

    if (this.totalRows === 0 || this.rowHeight <= 0) {
      if (this.startIndex !== 0 || this.endIndex !== 0) {
        this.startIndex = 0;
        this.endIndex = 0;
        this.onRangeChange(0, 0);
        this.onRender();
      }
      return;
    }

    // Container not laid out yet — retry on next animation frame
    if (viewportHeight === 0) {
      if (!this.pendingRecalc) {
        this.pendingRecalc = true;
        requestAnimationFrame(() => {
          this.pendingRecalc = false;
          this.calculateRange();
        });
      }
      return;
    }

    const rawStart = Math.floor(scrollTop / this.rowHeight);
    const visibleCount = Math.ceil(viewportHeight / this.rowHeight);
    const rawEnd = rawStart + visibleCount;

    const newStart = Math.max(0, rawStart - this.overscan);
    const newEnd = Math.min(this.totalRows - 1, rawEnd + this.overscan);

    if (newStart !== this.startIndex || newEnd !== this.endIndex) {
      this.startIndex = newStart;
      this.endIndex = newEnd;
      this.onRangeChange(newStart, newEnd);
      this.onRender();
    }
  }
}
