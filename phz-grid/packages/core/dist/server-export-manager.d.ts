/**
 * @phozart/core — ServerExportManager
 *
 * Orchestrates server-side export: sync (immediate URL) or async (poll for progress).
 */
import type { ServerExportProvider, ServerExportRequest, ExportProgress } from './types/server.js';
export interface ExportResult {
    status: 'completed' | 'cancelled' | 'failed';
    downloadUrl?: string;
    error?: string;
}
export interface ServerExportManagerOptions {
    pollIntervalMs?: number;
}
export declare class ServerExportManager {
    private provider;
    private pollIntervalMs;
    private currentJobId;
    private pollTimer;
    private cancelled;
    private cancelResolver;
    constructor(provider: ServerExportProvider | undefined, options?: ServerExportManagerOptions);
    hasServerExport(): boolean;
    startExport(request: ServerExportRequest, onProgress?: (progress: ExportProgress) => void): Promise<ExportResult>;
    cancelExport(): Promise<void>;
    private pollProgress;
}
//# sourceMappingURL=server-export-manager.d.ts.map