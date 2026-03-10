/**
 * @phozart/phz-workspace — Report Undo Integration
 *
 * Wraps UndoManager<ReportEditorState> with labeled actions for
 * human-readable undo/redo history.
 */

import { UndoManager } from '../engine-admin/undo-manager.js';
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

export function createReportUndoManager(
  initial: ReportEditorState,
  options?: { maxHistory?: number },
): ReportUndoManager {
  const undoManager = new UndoManager<ReportEditorState>({
    maxHistory: options?.maxHistory ?? 50,
  });
  undoManager.push(initial);

  const labels: ReportUndoEntry[] = [];

  return {
    execute(state: ReportEditorState, label: string): void {
      undoManager.push(state);
      labels.push({ label, timestamp: Date.now() });
    },

    undo(): ReportEditorState | null {
      return undoManager.undo();
    },

    redo(): ReportEditorState | null {
      return undoManager.redo();
    },

    get canUndo(): boolean {
      return undoManager.canUndo;
    },

    get canRedo(): boolean {
      return undoManager.canRedo;
    },

    get history(): ReportUndoEntry[] {
      return [...labels];
    },
  };
}
