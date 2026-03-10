/**
 * @phozart/phz-workspace — Auto-save Controller (L.12)
 *
 * Pure state machine for auto-saving drafts.
 * Saves after 30s of inactivity, with conflict detection.
 */
export declare const AUTO_SAVE_DELAY_MS = 30000;
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
export declare function createAutoSaveState(): AutoSaveState;
export declare function markDirty(state: AutoSaveState, data: unknown): AutoSaveState;
export declare function markSaved(state: AutoSaveState): AutoSaveState;
export declare function markConflict(state: AutoSaveState, message: string): AutoSaveState;
export declare function shouldAutoSave(state: AutoSaveState, now: number): boolean;
export declare function resumeDraft(state: AutoSaveState): unknown | undefined;
export declare function discardDraft(state: AutoSaveState): AutoSaveState;
//# sourceMappingURL=auto-save-controller.d.ts.map