import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { GridApi, SortState } from '@phozart/core';

export function useGridSort(gridRef: RefObject<GridApi | null>) {
  const [sortState, setSortState] = useState<SortState | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    setSortState(grid.getSortState());
    const unsub = grid.on('sort:change', () => setSortState(grid.getSortState()));
    return unsub;
  }, [gridRef]);

  const sort = useCallback(
    (field: string, direction: 'asc' | 'desc' | null) => gridRef.current?.sort(field, direction),
    [gridRef],
  );

  const multiSort = useCallback(
    (sorts: Array<{ field: string; direction: 'asc' | 'desc' }>) => gridRef.current?.multiSort(sorts),
    [gridRef],
  );

  const clearSort = useCallback(() => gridRef.current?.clearSort(), [gridRef]);

  return { sortState, sort, multiSort, clearSort };
}
