import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { GridApi, RowData, RowId } from '@phozart/phz-core';

export function useGridData(gridRef: RefObject<GridApi | null>) {
  const [data, setData] = useState<RowData[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    setData([...grid.getData()]);
    const unsub = grid.subscribe(() => setData([...grid.getData()]));
    return unsub;
  }, [gridRef]);

  const setGridData = useCallback(
    (newData: unknown[]) => gridRef.current?.setData(newData),
    [gridRef],
  );

  const addRow = useCallback(
    (rowData: Record<string, unknown>, position?: number): RowId => {
      return gridRef.current?.addRow(rowData, position) ?? '';
    },
    [gridRef],
  );

  const updateRow = useCallback(
    (id: RowId, rowData: Partial<Record<string, unknown>>) =>
      gridRef.current?.updateRow(id, rowData),
    [gridRef],
  );

  const deleteRow = useCallback(
    (id: RowId) => gridRef.current?.deleteRow(id),
    [gridRef],
  );

  return { data, setData: setGridData, addRow, updateRow, deleteRow };
}
