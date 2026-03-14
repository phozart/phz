import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { GridApi, GridState, SerializedGridState } from '@phozart/core';

export function useGridState(gridRef: RefObject<GridApi | null>) {
  const [state, setState] = useState<GridState | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    setState(grid.getState() as GridState);
    const unsub = grid.subscribe((s) => setState(s as GridState));
    return unsub;
  }, [gridRef]);

  const setPartialState = useCallback(
    (partial: Partial<GridState>) => {
      const grid = gridRef.current;
      if (!grid) return;
      const current = grid.exportState();
      grid.importState({ ...current, ...partial } as unknown as SerializedGridState);
    },
    [gridRef],
  );

  const exportState = useCallback((): SerializedGridState | null => {
    return gridRef.current?.exportState() ?? null;
  }, [gridRef]);

  const importState = useCallback(
    (s: SerializedGridState) => {
      gridRef.current?.importState(s);
    },
    [gridRef],
  );

  return { state, setState: setPartialState, exportState, importState };
}
