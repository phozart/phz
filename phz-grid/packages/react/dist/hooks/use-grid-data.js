import { useState, useEffect, useCallback } from 'react';
export function useGridData(gridRef) {
    const [data, setData] = useState([]);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid)
            return;
        setData([...grid.getData()]);
        const unsub = grid.subscribe(() => setData([...grid.getData()]));
        return unsub;
    }, [gridRef]);
    const setGridData = useCallback((newData) => gridRef.current?.setData(newData), [gridRef]);
    const addRow = useCallback((rowData, position) => {
        return gridRef.current?.addRow(rowData, position) ?? '';
    }, [gridRef]);
    const updateRow = useCallback((id, rowData) => gridRef.current?.updateRow(id, rowData), [gridRef]);
    const deleteRow = useCallback((id) => gridRef.current?.deleteRow(id), [gridRef]);
    return { data, setData: setGridData, addRow, updateRow, deleteRow };
}
//# sourceMappingURL=use-grid-data.js.map