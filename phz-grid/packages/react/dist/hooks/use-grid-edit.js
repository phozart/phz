import { useState, useEffect, useCallback } from 'react';
export function useGridEdit(gridRef) {
    const [editState, setEditState] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [dirtyRows, setDirtyRows] = useState([]);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid)
            return;
        const sync = () => {
            setEditState(grid.getEditState());
            setIsDirty(grid.isDirty());
            setDirtyRows(grid.getDirtyRows());
        };
        sync();
        const unsub = grid.subscribe(sync);
        return unsub;
    }, [gridRef]);
    const startEdit = useCallback((position) => gridRef.current?.startEdit(position), [gridRef]);
    const commitEdit = useCallback((position, value) => gridRef.current?.commitEdit(position, value) ?? Promise.resolve(false), [gridRef]);
    const cancelEdit = useCallback((position) => gridRef.current?.cancelEdit(position), [gridRef]);
    return { editState, startEdit, commitEdit, cancelEdit, isDirty, dirtyRows };
}
//# sourceMappingURL=use-grid-edit.js.map