import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { GridApi, FilterState, FilterOperator } from '@phozart/core';

export function useGridFilter(gridRef: RefObject<GridApi | null>) {
  const [filterState, setFilterState] = useState<FilterState | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    setFilterState(grid.getFilterState());
    const unsub = grid.on('filter:change', () => setFilterState(grid.getFilterState()));
    return unsub;
  }, [gridRef]);

  const addFilter = useCallback(
    (field: string, operator: FilterOperator, value: unknown) =>
      gridRef.current?.addFilter(field, operator, value),
    [gridRef],
  );

  const removeFilter = useCallback(
    (field: string) => gridRef.current?.removeFilter(field),
    [gridRef],
  );

  const clearFilters = useCallback(() => gridRef.current?.clearFilters(), [gridRef]);

  const savePreset = useCallback(
    (name: string) => gridRef.current?.saveFilterPreset(name),
    [gridRef],
  );

  const loadPreset = useCallback(
    (name: string) => gridRef.current?.loadFilterPreset(name),
    [gridRef],
  );

  return { filterState, addFilter, removeFilter, clearFilters, savePreset, loadPreset };
}
