/**
 * @phozart/phz-core — ServerExportManager
 *
 * Orchestrates server-side export: sync (immediate URL) or async (poll for progress).
 */
export class ServerExportManager {
    provider;
    pollIntervalMs;
    currentJobId = null;
    pollTimer = null;
    cancelled = false;
    cancelResolver = null;
    constructor(provider, options) {
        this.provider = provider;
        this.pollIntervalMs = options?.pollIntervalMs ?? 2000;
    }
    hasServerExport() {
        return this.provider !== undefined;
    }
    async startExport(request, onProgress) {
        if (!this.provider) {
            throw new Error('No server export provider');
        }
        this.cancelled = false;
        const response = await this.provider.requestExport(request);
        if (response.type === 'sync') {
            return { status: 'completed', downloadUrl: response.downloadUrl };
        }
        // Async export — poll for progress
        this.currentJobId = response.jobId;
        return this.pollProgress(response.jobId, onProgress);
    }
    async cancelExport() {
        this.cancelled = true;
        if (this.pollTimer !== null) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        if (this.currentJobId && this.provider?.cancelExport) {
            await this.provider.cancelExport(this.currentJobId);
        }
        this.currentJobId = null;
        if (this.cancelResolver) {
            this.cancelResolver({ status: 'cancelled' });
            this.cancelResolver = null;
        }
    }
    pollProgress(jobId, onProgress) {
        return new Promise((resolve) => {
            this.cancelResolver = resolve;
            const poll = async () => {
                if (this.cancelled) {
                    resolve({ status: 'cancelled' });
                    return;
                }
                if (!this.provider?.getExportStatus) {
                    resolve({ status: 'failed', error: 'No getExportStatus method' });
                    return;
                }
                try {
                    const progress = await this.provider.getExportStatus(jobId);
                    onProgress?.(progress);
                    if (progress.status === 'completed') {
                        this.currentJobId = null;
                        resolve({
                            status: 'completed',
                            downloadUrl: progress.downloadUrl,
                        });
                        return;
                    }
                    if (progress.status === 'failed') {
                        this.currentJobId = null;
                        resolve({ status: 'failed', error: progress.error });
                        return;
                    }
                    if (progress.status === 'cancelled') {
                        this.currentJobId = null;
                        resolve({ status: 'cancelled' });
                        return;
                    }
                    // Continue polling
                    this.pollTimer = setTimeout(poll, this.pollIntervalMs);
                }
                catch (err) {
                    this.currentJobId = null;
                    resolve({
                        status: 'failed',
                        error: err instanceof Error ? err.message : String(err),
                    });
                }
            };
            this.pollTimer = setTimeout(poll, this.pollIntervalMs);
        });
    }
}
//# sourceMappingURL=server-export-manager.js.map