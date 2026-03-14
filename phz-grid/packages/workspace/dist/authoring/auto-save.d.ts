/**
 * @phozart/workspace — Auto-Save Controller
 *
 * Debounced auto-save with status tracking.
 * Usable for both report and dashboard editors.
 */
export type AutoSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
export interface AutoSaveController {
    markDirty(): void;
    onSave(handler: (state: unknown) => Promise<void>): void;
    pause(): void;
    resume(): void;
    dispose(): void;
    readonly status: AutoSaveStatus;
    readonly lastSavedAt: number | undefined;
}
export interface AutoSaveOptions {
    debounceMs?: number;
    getState: () => unknown;
}
export declare function createAutoSave(options: AutoSaveOptions): AutoSaveController;
//# sourceMappingURL=auto-save.d.ts.map