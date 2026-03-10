import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { GridApi, EditState, CellPosition, RowId } from '@phozart/phz-core';

export function useGridEdit(gridRef: RefObject<GridApi | null>) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyRows, setDirtyRows] = useState<RowId[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const sync = () => {
      setEditState(grid.getEditState());
      setIsDirty(grid.isDirty());
      setDirtyRows(grid.getDirtyRows());
    };
    sync();
    const unsub = grid.subscribe(sync);
    return unsub;
  }, [gridRef]);

  const startEdit = useCallback(
    (position: CellPosition) => gridRef.current?.startEdit(position),
    [gridRef],
  );

  const commitEdit = useCallback(
    (position: CellPosition, value: unknown) =>
      gridRef.current?.commitEdit(position, value) ?? Promise.resolve(false),
    [gridRef],
  );

  const cancelEdit = useCallback(
    (position: CellPosition) => gridRef.current?.cancelEdit(position),
    [gridRef],
  );

  return { editState, startEdit, commitEdit, cancelEdit, isDirty, dirtyRows };
}
