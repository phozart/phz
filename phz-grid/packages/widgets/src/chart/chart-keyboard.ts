/**
 * @phozart/widgets — Chart Keyboard Navigation
 *
 * Pure function state machine for keyboard navigation through chart marks.
 * WCAG 2.2 AA: Tab enters chart, arrows navigate, Enter/Space activates,
 * Escape exits, Home/End jump to first/last point.
 */

export interface FocusedMark {
  seriesIndex: number;
  dataIndex: number;
}

/**
 * Compute the next focused mark based on a keyboard event.
 * Returns null to indicate "exit chart focus" (e.g., Tab/Escape from last mark).
 *
 * @param current - Currently focused mark (null if nothing focused)
 * @param key - Keyboard event key
 * @param seriesCount - Total number of series
 * @param pointCounts - Number of data points per series (indexed by series index)
 * @param hiddenSeries - Set of hidden series indices to skip
 */
export function nextFocusedMark(
  current: FocusedMark | null,
  key: string,
  seriesCount: number,
  pointCounts: number[],
  hiddenSeries: Set<number>,
): FocusedMark | null {
  const visibleSeries = getVisibleSeriesIndices(seriesCount, hiddenSeries);
  if (visibleSeries.length === 0) return null;

  // No current focus — Tab enters the chart at the first mark
  if (current === null) {
    if (key === 'Tab') {
      const first = visibleSeries[0];
      return pointCounts[first] > 0 ? { seriesIndex: first, dataIndex: 0 } : null;
    }
    return null;
  }

  const currentVisibleIdx = visibleSeries.indexOf(current.seriesIndex);
  const currentPoints = pointCounts[current.seriesIndex] ?? 0;

  switch (key) {
    case 'ArrowRight': {
      // Move to next data point within series
      if (current.dataIndex < currentPoints - 1) {
        return { seriesIndex: current.seriesIndex, dataIndex: current.dataIndex + 1 };
      }
      return current; // Stay at last point
    }

    case 'ArrowLeft': {
      // Move to previous data point within series
      if (current.dataIndex > 0) {
        return { seriesIndex: current.seriesIndex, dataIndex: current.dataIndex - 1 };
      }
      return current; // Stay at first point
    }

    case 'ArrowDown': {
      // Move to same x-position in next visible series
      if (currentVisibleIdx < visibleSeries.length - 1) {
        const nextSeries = visibleSeries[currentVisibleIdx + 1];
        const nextPoints = pointCounts[nextSeries] ?? 0;
        const dataIdx = Math.min(current.dataIndex, nextPoints - 1);
        return dataIdx >= 0 ? { seriesIndex: nextSeries, dataIndex: dataIdx } : current;
      }
      return current;
    }

    case 'ArrowUp': {
      // Move to same x-position in previous visible series
      if (currentVisibleIdx > 0) {
        const prevSeries = visibleSeries[currentVisibleIdx - 1];
        const prevPoints = pointCounts[prevSeries] ?? 0;
        const dataIdx = Math.min(current.dataIndex, prevPoints - 1);
        return dataIdx >= 0 ? { seriesIndex: prevSeries, dataIndex: dataIdx } : current;
      }
      return current;
    }

    case 'Home': {
      // Jump to first point in current series
      return { seriesIndex: current.seriesIndex, dataIndex: 0 };
    }

    case 'End': {
      // Jump to last point in current series
      return { seriesIndex: current.seriesIndex, dataIndex: currentPoints - 1 };
    }

    case 'Escape': {
      // Exit chart focus
      return null;
    }

    default:
      return current;
  }
}

function getVisibleSeriesIndices(
  seriesCount: number,
  hiddenSeries: Set<number>,
): number[] {
  const visible: number[] = [];
  for (let i = 0; i < seriesCount; i++) {
    if (!hiddenSeries.has(i)) visible.push(i);
  }
  return visible;
}

/**
 * Build an accessible announcement string for a focused mark.
 * Used for ARIA live region updates.
 */
export function buildMarkAnnouncement(
  seriesName: string,
  label: string,
  value: number,
  dataIndex: number,
  totalPoints: number,
): string {
  return `${seriesName}, ${label}: ${value.toLocaleString()}. Point ${dataIndex + 1} of ${totalPoints}.`;
}
