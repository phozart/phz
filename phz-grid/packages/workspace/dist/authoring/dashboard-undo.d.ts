/**
 * @phozart/workspace — Dashboard Undo Integration
 *
 * Wraps UndoManager<DashboardEditorState> with labeled actions.
 */
import type { DashboardEditorState } from './dashboard-editor-state.js';
export interface DashboardUndoEntry {
    label: string;
    timestamp: number;
}
export interface DashboardUndoManager {
    execute(state: DashboardEditorState, label: string): void;
    undo(): DashboardEditorState | null;
    redo(): DashboardEditorState | null;
    canUndo: boolean;
    canRedo: boolean;
    history: DashboardUndoEntry[];
}
export declare function createDashboardUndoManager(initial: DashboardEditorState, options?: {
    maxHistory?: number;
}): DashboardUndoManager;
//# sourceMappingURL=dashboard-undo.d.ts.map