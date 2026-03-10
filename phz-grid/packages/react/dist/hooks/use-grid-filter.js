import { useState, useEffect, useCallback } from 'react';
export function useGridFilter(gridRef) {
    const [filterState, setFilterState] = useState(null);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid)
            return;
        setFilterState(grid.getFilterState());
        const unsub = grid.on('filter:change', () => setFilterState(grid.getFilterState()));
        return unsub;
    }, [gridRef]);
    const addFilter = useCallback((field, operator, value) => gridRef.current?.addFilter(field, operator, value), [gridRef]);
    const removeFilter = useCallback((field) => gridRef.current?.removeFilter(field), [gridRef]);
    const clearFilters = useCallback(() => gridRef.current?.clearFilters(), [gridRef]);
    const savePreset = useCallback((name) => gridRef.current?.saveFilterPreset(name), [gridRef]);
    const loadPreset = useCallback((name) => gridRef.current?.loadFilterPreset(name), [gridRef]);
    return { filterState, addFilter, removeFilter, clearFilters, savePreset, loadPreset };
}
//# sourceMappingURL=use-grid-filter.js.map