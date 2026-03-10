import { useState, useEffect, useCallback } from 'react';
export function useGridSelection(gridRef) {
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectedCells, setSelectedCells] = useState([]);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid)
            return;
        const sync = () => {
            const sel = grid.getSelection();
            setSelectedRows(sel.rows);
            setSelectedCells(sel.cells);
        };
        sync();
        const unsub = grid.on('selection:change', sync);
        return unsub;
    }, [gridRef]);
    const select = useCallback((rowIds) => gridRef.current?.select(rowIds), [gridRef]);
    const deselect = useCallback((rowIds) => gridRef.current?.deselect(rowIds), [gridRef]);
    const selectAll = useCallback(() => gridRef.current?.selectAll(), [gridRef]);
    const deselectAll = useCallback(() => gridRef.current?.deselectAll(), [gridRef]);
    const selectRange = useCallback((start, end) => gridRef.current?.selectRange(start, end), [gridRef]);
    return { selectedRows, selectedCells, select, deselect, selectAll, deselectAll, selectRange };
}
//# sourceMappingURL=use-grid-selection.js.map