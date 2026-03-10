import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { GridApi, RowId, CellPosition } from '@phozart/phz-core';

export function useGridSelection(gridRef: RefObject<GridApi | null>) {
  const [selectedRows, setSelectedRows] = useState<RowId[]>([]);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const sync = () => {
      const sel = grid.getSelection();
      setSelectedRows(sel.rows);
      setSelectedCells(sel.cells);
    };
    sync();
    const unsub = grid.on('selection:change', sync);
    return unsub;
  }, [gridRef]);

  const select = useCallback(
    (rowIds: RowId | RowId[]) => gridRef.current?.select(rowIds),
    [gridRef],
  );

  const deselect = useCallback(
    (rowIds: RowId | RowId[]) => gridRef.current?.deselect(rowIds),
    [gridRef],
  );

  const selectAll = useCallback(() => gridRef.current?.selectAll(), [gridRef]);
  const deselectAll = useCallback(() => gridRef.current?.deselectAll(), [gridRef]);

  const selectRange = useCallback(
    (start: CellPosition, end: CellPosition) => gridRef.current?.selectRange(start, end),
    [gridRef],
  );

  return { selectedRows, selectedCells, select, deselect, selectAll, deselectAll, selectRange };
}
