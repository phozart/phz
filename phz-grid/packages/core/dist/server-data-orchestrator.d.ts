/**
 * @phozart/core — ServerDataOrchestrator
 *
 * Debounces rapid state changes and cancels superseded in-flight requests
 * via AbortController. Generates unique requestIds for deduplication.
 */
import type { ServerDataRequest, ServerDataResponse } from './types/server.js';
export interface ServerDataOrchestratorOptions {
    fetchFn: (request: ServerDataRequest) => Promise<ServerDataResponse>;
    debounceMs?: number;
    onRequest?: (requestId: string) => void;
    onResponse?: (response: ServerDataResponse, requestId: string) => void;
    onError?: (error: Error, requestId: string) => void;
}
export declare class ServerDataOrchestrator {
    private fetchFn;
    private debounceMs;
    private onRequest?;
    private onResponseCb?;
    private onErrorCb?;
    private debounceTimer;
    private currentController;
    private destroyed;
    constructor(options: ServerDataOrchestratorOptions);
    getDebounceMs(): number;
    requestData(request: ServerDataRequest): void;
    destroy(): void;
    private executeRequest;
}
//# sourceMappingURL=server-data-orchestrator.d.ts.map