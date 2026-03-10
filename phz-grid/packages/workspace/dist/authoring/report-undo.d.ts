/**
 * @phozart/phz-workspace — Report Undo Integration
 *
 * Wraps UndoManager<ReportEditorState> with labeled actions for
 * human-readable undo/redo history.
 */
import type { ReportEditorState } from './report-editor-state.js';
export interface ReportUndoEntry {
    label: string;
    timestamp: number;
}
export interface ReportUndoManager {
    execute(state: ReportEditorState, label: string): void;
    undo(): ReportEditorState | null;
    redo(): ReportEditorState | null;
    canUndo: boolean;
    canRedo: boolean;
    history: ReportUndoEntry[];
}
export declare function createReportUndoManager(initial: ReportEditorState, options?: {
    maxHistory?: number;
}): ReportUndoManager;
//# sourceMappingURL=report-undo.d.ts.map