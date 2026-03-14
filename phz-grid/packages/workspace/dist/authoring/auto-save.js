/**
 * @phozart/workspace — Auto-Save Controller
 *
 * Debounced auto-save with status tracking.
 * Usable for both report and dashboard editors.
 */
export function createAutoSave(options) {
    const debounceMs = options.debounceMs ?? 2000;
    let status = 'idle';
    let lastSavedAt;
    let saveHandler;
    let timer;
    let paused = false;
    function clearTimer() {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    }
    async function doSave() {
        if (!saveHandler)
            return;
        status = 'saving';
        try {
            await saveHandler(options.getState());
            status = 'saved';
            lastSavedAt = Date.now();
        }
        catch {
            status = 'error';
        }
    }
    function scheduleSave() {
        if (paused)
            return;
        clearTimer();
        timer = setTimeout(() => { void doSave(); }, debounceMs);
    }
    return {
        markDirty() {
            status = 'dirty';
            scheduleSave();
        },
        onSave(handler) {
            saveHandler = handler;
        },
        pause() {
            paused = true;
            clearTimer();
        },
        resume() {
            paused = false;
            if (status === 'dirty')
                scheduleSave();
        },
        dispose() {
            clearTimer();
            saveHandler = undefined;
        },
        get status() {
            return status;
        },
        get lastSavedAt() {
            return lastSavedAt;
        },
    };
}
//# sourceMappingURL=auto-save.js.map