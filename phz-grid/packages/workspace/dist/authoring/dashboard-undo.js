/**
 * @phozart/workspace — Dashboard Undo Integration
 *
 * Wraps UndoManager<DashboardEditorState> with labeled actions.
 */
import { UndoManager } from '../engine-admin/undo-manager.js';
export function createDashboardUndoManager(initial, options) {
    const undoManager = new UndoManager({
        maxHistory: options?.maxHistory ?? 50,
    });
    undoManager.push(initial);
    const labels = [];
    return {
        execute(state, label) {
            undoManager.push(state);
            labels.push({ label, timestamp: Date.now() });
        },
        undo() {
            return undoManager.undo();
        },
        redo() {
            return undoManager.redo();
        },
        get canUndo() {
            return undoManager.canUndo;
        },
        get canRedo() {
            return undoManager.canRedo;
        },
        get history() {
            return [...labels];
        },
    };
}
//# sourceMappingURL=dashboard-undo.js.map