/**
 * @phozart/phz-workspace — Dashboard Undo Integration
 *
 * Wraps UndoManager<DashboardEditorState> with labeled actions.
 */

import { UndoManager } from '../engine-admin/undo-manager.js';
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

export function createDashboardUndoManager(
  initial: DashboardEditorState,
  options?: { maxHistory?: number },
): DashboardUndoManager {
  const undoManager = new UndoManager<DashboardEditorState>({
    maxHistory: options?.maxHistory ?? 50,
  });
  undoManager.push(initial);

  const labels: DashboardUndoEntry[] = [];

  return {
    execute(state: DashboardEditorState, label: string): void {
      undoManager.push(state);
      labels.push({ label, timestamp: Date.now() });
    },

    undo(): DashboardEditorState | null {
      return undoManager.undo();
    },

    redo(): DashboardEditorState | null {
      return undoManager.redo();
    },

    get canUndo(): boolean {
      return undoManager.canUndo;
    },

    get canRedo(): boolean {
      return undoManager.canRedo;
    },

    get history(): DashboardUndoEntry[] {
      return [...labels];
    },
  };
}
