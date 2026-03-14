import { describe, it, expect } from 'vitest';
import { nextFocusedMark, buildMarkAnnouncement } from '../chart/chart-keyboard.js';

// ========================================================================
// nextFocusedMark
// ========================================================================

describe('Chart Keyboard — nextFocusedMark', () => {
  const pointCounts = [5, 3, 4]; // 3 series with 5, 3, 4 points
  const noHidden = new Set<number>();

  it('Tab enters chart at first mark when nothing focused', () => {
    const result = nextFocusedMark(null, 'Tab', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 0 });
  });

  it('returns null for non-Tab key when nothing focused', () => {
    expect(nextFocusedMark(null, 'ArrowRight', 3, pointCounts, noHidden)).toBeNull();
  });

  it('ArrowRight advances within series', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 2 }, 'ArrowRight', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 3 });
  });

  it('ArrowRight stays at last point', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 4 }, 'ArrowRight', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 4 });
  });

  it('ArrowLeft goes back within series', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 2 }, 'ArrowLeft', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 1 });
  });

  it('ArrowLeft stays at first point', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 0 }, 'ArrowLeft', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 0 });
  });

  it('ArrowDown moves to next series', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 2 }, 'ArrowDown', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 1, dataIndex: 2 });
  });

  it('ArrowDown clamps dataIndex to target series length', () => {
    // Series 1 has only 3 points, current is at index 4 in series 0
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 4 }, 'ArrowDown', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 1, dataIndex: 2 }); // clamped to last index of series 1
  });

  it('ArrowDown stays at last series', () => {
    const result = nextFocusedMark({ seriesIndex: 2, dataIndex: 0 }, 'ArrowDown', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 2, dataIndex: 0 });
  });

  it('ArrowUp moves to previous series', () => {
    const result = nextFocusedMark({ seriesIndex: 1, dataIndex: 1 }, 'ArrowUp', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 1 });
  });

  it('ArrowUp stays at first series', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 0 }, 'ArrowUp', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 0 });
  });

  it('Home jumps to first point', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 3 }, 'Home', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 0 });
  });

  it('End jumps to last point', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 1 }, 'End', 3, pointCounts, noHidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 4 });
  });

  it('Escape exits chart focus', () => {
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 2 }, 'Escape', 3, pointCounts, noHidden);
    expect(result).toBeNull();
  });

  it('unknown key returns current', () => {
    const current = { seriesIndex: 0, dataIndex: 2 };
    const result = nextFocusedMark(current, 'a', 3, pointCounts, noHidden);
    expect(result).toEqual(current);
  });

  // Hidden series skipping
  it('Tab skips hidden first series', () => {
    const hidden = new Set([0]);
    const result = nextFocusedMark(null, 'Tab', 3, pointCounts, hidden);
    expect(result).toEqual({ seriesIndex: 1, dataIndex: 0 });
  });

  it('ArrowDown skips hidden series', () => {
    const hidden = new Set([1]);
    const result = nextFocusedMark({ seriesIndex: 0, dataIndex: 0 }, 'ArrowDown', 3, pointCounts, hidden);
    expect(result).toEqual({ seriesIndex: 2, dataIndex: 0 });
  });

  it('ArrowUp skips hidden series', () => {
    const hidden = new Set([1]);
    const result = nextFocusedMark({ seriesIndex: 2, dataIndex: 0 }, 'ArrowUp', 3, pointCounts, hidden);
    expect(result).toEqual({ seriesIndex: 0, dataIndex: 0 });
  });

  it('returns null when all series hidden', () => {
    const hidden = new Set([0, 1, 2]);
    const result = nextFocusedMark(null, 'Tab', 3, pointCounts, hidden);
    expect(result).toBeNull();
  });

  it('returns null for Tab on empty pointCounts', () => {
    const result = nextFocusedMark(null, 'Tab', 1, [0], noHidden);
    expect(result).toBeNull();
  });
});

// ========================================================================
// buildMarkAnnouncement
// ========================================================================

describe('Chart Keyboard — buildMarkAnnouncement', () => {
  it('builds descriptive announcement', () => {
    const result = buildMarkAnnouncement('Revenue', 'January', 42500, 0, 12);
    expect(result).toContain('Revenue');
    expect(result).toContain('January');
    expect(result).toContain('42,500');
    expect(result).toContain('Point 1 of 12');
  });

  it('handles middle point', () => {
    const result = buildMarkAnnouncement('Cost', 'Q2', 1500, 5, 10);
    expect(result).toContain('Point 6 of 10');
  });
});
