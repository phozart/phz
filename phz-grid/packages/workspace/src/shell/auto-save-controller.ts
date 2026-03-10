/**
 * @phozart/phz-workspace — Auto-save Controller (L.12)
 *
 * Pure state machine for auto-saving drafts.
 * Saves after 30s of inactivity, with conflict detection.
 */

export const AUTO_SAVE_DELAY_MS = 30_000;

export interface DraftEntry {
  data: unknown;
  dirtyAt: number;
}

export interface AutoSaveState {
  dirty: boolean;
  draft?: DraftEntry;
  lastSavedAt?: number;
  conflict: boolean;
  conflictMessage?: string;
}

export function createAutoSaveState(): AutoSaveState {
  return {
    dirty: false,
    conflict: false,
  };
}

export function markDirty(state: AutoSaveState, data: unknown): AutoSaveState {
  return {
    ...state,
    dirty: true,
    draft: {
      data,
      dirtyAt: Date.now(),
    },
  };
}

export function markSaved(state: AutoSaveState): AutoSaveState {
  return {
    ...state,
    dirty: false,
    draft: undefined,
    lastSavedAt: Date.now(),
    conflict: false,
    conflictMessage: undefined,
  };
}

export function markConflict(state: AutoSaveState, message: string): AutoSaveState {
  return {
    ...state,
    conflict: true,
    conflictMessage: message,
  };
}

export function shouldAutoSave(state: AutoSaveState, now: number): boolean {
  if (!state.dirty || !state.draft) return false;
  if (state.conflict) return false;
  return now - state.draft.dirtyAt >= AUTO_SAVE_DELAY_MS;
}

export function resumeDraft(state: AutoSaveState): unknown | undefined {
  return state.draft?.data;
}

export function discardDraft(state: AutoSaveState): AutoSaveState {
  return {
    ...state,
    dirty: false,
    draft: undefined,
  };
}
