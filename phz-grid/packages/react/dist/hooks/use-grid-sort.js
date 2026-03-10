import { useState, useEffect, useCallback } from 'react';
export function useGridSort(gridRef) {
    const [sortState, setSortState] = useState(null);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid)
            return;
        setSortState(grid.getSortState());
        const unsub = grid.on('sort:change', () => setSortState(grid.getSortState()));
        return unsub;
    }, [gridRef]);
    const sort = useCallback((field, direction) => gridRef.current?.sort(field, direction), [gridRef]);
    const multiSort = useCallback((sorts) => gridRef.current?.multiSort(sorts), [gridRef]);
    const clearSort = useCallback(() => gridRef.current?.clearSort(), [gridRef]);
    return { sortState, sort, multiSort, clearSort };
}
//# sourceMappingURL=use-grid-sort.js.map