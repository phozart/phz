/**
 * @phozart/core — ServerDataOrchestrator
 *
 * Debounces rapid state changes and cancels superseded in-flight requests
 * via AbortController. Generates unique requestIds for deduplication.
 */
export class ServerDataOrchestrator {
    fetchFn;
    debounceMs;
    onRequest;
    onResponseCb;
    onErrorCb;
    debounceTimer = null;
    currentController = null;
    destroyed = false;
    constructor(options) {
        this.fetchFn = options.fetchFn;
        this.debounceMs = options.debounceMs ?? 300;
        this.onRequest = options.onRequest;
        this.onResponseCb = options.onResponse;
        this.onErrorCb = options.onError;
    }
    getDebounceMs() {
        return this.debounceMs;
    }
    requestData(request) {
        if (this.destroyed)
            return;
        // Clear any pending debounce
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            this.executeRequest(request);
        }, this.debounceMs);
    }
    destroy() {
        this.destroyed = true;
        if (this.debounceTimer !== null) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        if (this.currentController) {
            this.currentController.abort();
            this.currentController = null;
        }
    }
    async executeRequest(request) {
        if (this.destroyed)
            return;
        // Abort any previous in-flight request
        if (this.currentController) {
            this.currentController.abort();
        }
        const controller = new AbortController();
        this.currentController = controller;
        const requestId = crypto.randomUUID();
        this.onRequest?.(requestId);
        // Merge our signal into the request
        const requestWithSignal = {
            ...request,
            signal: controller.signal,
        };
        try {
            const response = await this.fetchFn(requestWithSignal);
            if (!this.destroyed && !controller.signal.aborted) {
                this.onResponseCb?.(response, requestId);
            }
        }
        catch (err) {
            if (this.destroyed)
                return;
            // Don't report abort errors
            if (err instanceof DOMException && err.name === 'AbortError')
                return;
            if (controller.signal.aborted)
                return;
            this.onErrorCb?.(err instanceof Error ? err : new Error(String(err)), requestId);
        }
    }
}
//# sourceMappingURL=server-data-orchestrator.js.map