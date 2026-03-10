/**
 * @phozart/phz-workspace — Data Explorer Orchestrator (P.5)
 *
 * Main headless controller combining field palette, drop zones,
 * preview, chart suggest, and undo/redo.
 */
import { createDropZoneState, addFieldToZone, removeFieldFromZone } from './phz-drop-zones.js';
import { autoPlaceField } from './phz-field-palette.js';
import { toExploreQuery } from './phz-pivot-preview.js';
import { suggestChartType } from './chart-suggest.js';
// ========================================================================
// createDataExplorer
// ========================================================================
export function createDataExplorer() {
    let state = {
        fields: [],
        dropZones: createDropZoneState(),
    };
    // Undo/redo stacks store drop zone snapshots
    const undoStack = [];
    let redoStack = [];
    const listeners = new Set();
    function notify() {
        for (const listener of listeners) {
            listener();
        }
    }
    function pushUndo() {
        undoStack.push(cloneDropZones(state.dropZones));
        redoStack = []; // new action clears redo
    }
    function cloneDropZones(dz) {
        return {
            rows: [...dz.rows],
            columns: [...dz.columns],
            values: [...dz.values],
            filters: [...dz.filters],
        };
    }
    return {
        getState() {
            return { ...state, dropZones: cloneDropZones(state.dropZones) };
        },
        setDataSource(id, fields) {
            state = { dataSourceId: id, fields: [...fields], dropZones: createDropZoneState() };
            undoStack.length = 0;
            redoStack = [];
            notify();
        },
        autoPlaceField(field) {
            const zone = autoPlaceField(field);
            pushUndo();
            state = { ...state, dropZones: addFieldToZone(state.dropZones, zone, field) };
            notify();
        },
        addToZone(zone, field) {
            pushUndo();
            state = { ...state, dropZones: addFieldToZone(state.dropZones, zone, field) };
            notify();
        },
        removeFromZone(zone, fieldName) {
            pushUndo();
            state = { ...state, dropZones: removeFieldFromZone(state.dropZones, zone, fieldName) };
            notify();
        },
        toQuery() {
            return toExploreQuery(state.dropZones);
        },
        suggestChart() {
            return suggestChartType(toExploreQuery(state.dropZones));
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        undo() {
            if (undoStack.length === 0)
                return;
            redoStack.push(cloneDropZones(state.dropZones));
            state = { ...state, dropZones: undoStack.pop() };
            notify();
        },
        redo() {
            if (redoStack.length === 0)
                return;
            undoStack.push(cloneDropZones(state.dropZones));
            state = { ...state, dropZones: redoStack.pop() };
            notify();
        },
        canUndo() {
            return undoStack.length > 0;
        },
        canRedo() {
            return redoStack.length > 0;
        },
    };
}
//# sourceMappingURL=phz-data-explorer.js.map