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

export function createAutoSave(options: AutoSaveOptions): AutoSaveController {
  const debounceMs = options.debounceMs ?? 2000;
  let status: AutoSaveStatus = 'idle';
  let lastSavedAt: number | undefined;
  let saveHandler: ((state: unknown) => Promise<void>) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let paused = false;

  function clearTimer(): void {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  async function doSave(): Promise<void> {
    if (!saveHandler) return;
    status = 'saving';
    try {
      await saveHandler(options.getState());
      status = 'saved';
      lastSavedAt = Date.now();
    } catch {
      status = 'error';
    }
  }

  function scheduleSave(): void {
    if (paused) return;
    clearTimer();
    timer = setTimeout(() => { void doSave(); }, debounceMs);
  }

  return {
    markDirty(): void {
      status = 'dirty';
      scheduleSave();
    },

    onSave(handler: (state: unknown) => Promise<void>): void {
      saveHandler = handler;
    },

    pause(): void {
      paused = true;
      clearTimer();
    },

    resume(): void {
      paused = false;
      if (status === 'dirty') scheduleSave();
    },

    dispose(): void {
      clearTimer();
      saveHandler = undefined;
    },

    get status(): AutoSaveStatus {
      return status;
    },

    get lastSavedAt(): number | undefined {
      return lastSavedAt;
    },
  };
}
