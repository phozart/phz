/**
 * @phozart/phz-grid — VirtualScroller Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VirtualScroller } from '../virtual-scroller.js';

function createMockContainer(scrollTop = 0, clientHeight = 400) {
  return {
    scrollTop,
    clientHeight,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
  } as unknown as HTMLElement;
}

describe('VirtualScroller', () => {
  let onRangeChange: ReturnType<typeof vi.fn>;
  let onRender: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRangeChange = vi.fn();
    onRender = vi.fn();
  });

  it('calculates initial range on attach', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 5,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);

    // scrollTop=0, viewportHeight=400, rowHeight=40 → 10 visible rows
    // rawStart=0, rawEnd=10, overscan=5
    // startIndex = max(0, 0-5) = 0
    // endIndex = min(99, 10+5) = 15
    expect(onRangeChange).toHaveBeenCalledWith(0, 15);
    expect(onRender).toHaveBeenCalled();
  });

  it('applies overscan correctly', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 3,
      totalRows: 200,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(400, 400);
    scroller.attach(container);

    // scrollTop=400, rowHeight=40 → rawStart=10
    // visibleCount = ceil(400/40) = 10
    // rawEnd = 10 + 10 = 20
    // startIndex = max(0, 10-3) = 7
    // endIndex = min(199, 20+3) = 23
    expect(onRangeChange).toHaveBeenCalledWith(7, 23);
  });

  it('clamps to total rows boundary', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 5,
      totalRows: 20,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(600, 400);
    scroller.attach(container);

    // scrollTop=600, rowHeight=40 → rawStart=15
    // visibleCount = 10, rawEnd = 25
    // startIndex = max(0, 15-5) = 10
    // endIndex = min(19, 25+5) = 19
    expect(onRangeChange).toHaveBeenCalledWith(10, 19);
  });

  it('clamps start index to zero', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 10,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(40, 400);
    scroller.attach(container);

    // scrollTop=40, rawStart=1, startIndex = max(0, 1-10) = 0
    expect(onRangeChange).toHaveBeenCalledWith(0, expect.any(Number));
    const [start] = onRangeChange.mock.calls[0];
    expect(start).toBe(0);
  });

  it('calculates totalHeight', () => {
    const scroller = new VirtualScroller({
      rowHeight: 42,
      totalRows: 1000,
      onRangeChange,
      onRender,
    });

    expect(scroller.totalHeight).toBe(42000);
  });

  it('updates totalHeight when totalRows changes', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    expect(scroller.totalHeight).toBe(4000);

    const container = createMockContainer(0, 400);
    scroller.attach(container);
    onRangeChange.mockClear();
    onRender.mockClear();

    scroller.setTotalRows(500);
    expect(scroller.totalHeight).toBe(20000);
  });

  it('scrollToIndex calls scrollTo on container', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);

    scroller.scrollToIndex(50);
    expect(container.scrollTo).toHaveBeenCalledWith({ top: 2000, behavior: 'auto' });
  });

  it('scrollToIndex with smooth behavior', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);

    scroller.scrollToIndex(25, 'smooth');
    expect(container.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });
  });

  it('updateRowHeight recalculates range', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 5,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);
    onRangeChange.mockClear();
    onRender.mockClear();

    // Change from 40px to 34px rows → more visible
    scroller.updateRowHeight(34);
    // visibleCount = ceil(400/34) = 12, rawEnd = 12
    // startIndex = 0, endIndex = min(99, 12+5) = 17
    expect(onRangeChange).toHaveBeenCalledWith(0, 17);
  });

  it('getRange returns current start/end indices', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 5,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(200, 400);
    scroller.attach(container);

    const range = scroller.getRange();
    expect(range.startIndex).toBe(0);
    // rawStart = 5, rawEnd = 15, endIndex = min(99, 15+5) = 20
    expect(range.endIndex).toBe(20);
  });

  it('detach removes event listener and cleans up', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);
    scroller.detach();

    expect(container.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

    // scrollToIndex should no-op after detach
    scroller.scrollToIndex(10);
    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it('does not call onRangeChange when range is unchanged', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 5,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);

    expect(onRangeChange).toHaveBeenCalledTimes(1);
    onRangeChange.mockClear();
    onRender.mockClear();

    // Re-set same total rows — range should not change
    scroller.setTotalRows(100);
    expect(onRangeChange).not.toHaveBeenCalled();
  });

  it('handles zero total rows', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 0,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);

    expect(scroller.totalHeight).toBe(0);
    // Should still call with 0,0 since initial values are 0,0
    // The calculateRange sees totalRows=0, so won't call since start/end already 0,0
  });

  it('handles viewport larger than all rows', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      overscan: 5,
      totalRows: 5,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 1000);
    scroller.attach(container);

    // 5 rows total, viewport can show 25 rows
    // rawStart=0, rawEnd=25, startIndex=0, endIndex=min(4, 30)=4
    expect(onRangeChange).toHaveBeenCalledWith(0, 4);
  });

  it('uses default overscan of 5 when not specified', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(400, 400);
    scroller.attach(container);

    // rawStart=10, rawEnd=20
    // startIndex = max(0, 10-5) = 5
    // endIndex = min(99, 20+5) = 25
    expect(onRangeChange).toHaveBeenCalledWith(5, 25);
  });

  it('registers scroll event listener on attach', () => {
    const scroller = new VirtualScroller({
      rowHeight: 40,
      totalRows: 100,
      onRangeChange,
      onRender,
    });

    const container = createMockContainer(0, 400);
    scroller.attach(container);

    expect(container.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });
});
