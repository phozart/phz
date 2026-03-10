/**
 * @phozart/phz-workspace — Loading Indicator State (T.6)
 *
 * Manages loading progress bar state: phase transitions, messages,
 * progress percentage, and auto-dismiss after completion.
 *
 * Note: The Lit component rendering is handled separately; this module
 * provides the pure state management and auto-dismiss timer logic.
 */
const AUTO_DISMISS_MS = 3000;
export function createLoadingIndicatorState() {
    let phase = 'idle';
    let message;
    let progress = 0;
    let visible = false;
    let dismissTimer = null;
    const listeners = new Set();
    function notify() {
        for (const listener of listeners) {
            listener();
        }
    }
    function clearDismissTimer() {
        if (dismissTimer !== null) {
            clearTimeout(dismissTimer);
            dismissTimer = null;
        }
    }
    function updateVisibility() {
        switch (phase) {
            case 'idle':
                visible = false;
                break;
            case 'preloading':
            case 'preload-complete':
            case 'full-loading':
            case 'error':
                visible = true;
                break;
            case 'full-complete':
                visible = true;
                // Auto-dismiss after 3s
                clearDismissTimer();
                dismissTimer = setTimeout(() => {
                    dismissTimer = null;
                    visible = false;
                    notify();
                }, AUTO_DISMISS_MS);
                break;
        }
    }
    return {
        getPhase() {
            return phase;
        },
        isVisible() {
            return visible;
        },
        getMessage() {
            if (phase === 'full-complete' && message === undefined)
                return 'Done';
            return message;
        },
        getProgress() {
            return progress;
        },
        setPhase(newPhase, newMessage) {
            clearDismissTimer();
            phase = newPhase;
            message = newMessage;
            updateVisibility();
            notify();
        },
        setProgress(p) {
            progress = Math.max(0, Math.min(100, p));
            notify();
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        destroy() {
            clearDismissTimer();
            listeners.clear();
        },
    };
}
//# sourceMappingURL=phz-loading-indicator.js.map