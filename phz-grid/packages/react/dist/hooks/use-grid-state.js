import { useState, useEffect, useCallback } from 'react';
export function useGridState(gridRef) {
    const [state, setState] = useState(null);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid)
            return;
        setState(grid.getState());
        const unsub = grid.subscribe((s) => setState(s));
        return unsub;
    }, [gridRef]);
    const setPartialState = useCallback((partial) => {
        const grid = gridRef.current;
        if (!grid)
            return;
        const current = grid.exportState();
        grid.importState({ ...current, ...partial });
    }, [gridRef]);
    const exportState = useCallback(() => {
        return gridRef.current?.exportState() ?? null;
    }, [gridRef]);
    const importState = useCallback((s) => {
        gridRef.current?.importState(s);
    }, [gridRef]);
    return { state, setState: setPartialState, exportState, importState };
}
//# sourceMappingURL=use-grid-state.js.map