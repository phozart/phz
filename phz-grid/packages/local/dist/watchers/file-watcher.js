/**
 * @phozart/phz-local — File Watcher (R.4)
 *
 * Watches a directory for CSV/Parquet/JSON files and auto-imports
 * them into DuckDB when they appear or change.
 * Debounces changes (500ms), ignores dot files.
 */
import { watch } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
const SUPPORTED_EXTENSIONS = new Set(['.csv', '.parquet', '.json']);
const DEBOUNCE_MS = 500;
function deriveTableName(filename) {
    // Strip extension, replace non-alphanumeric with underscore
    const base = basename(filename, extname(filename));
    return base.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').toLowerCase();
}
function isImportable(filename) {
    if (filename.startsWith('.'))
        return false;
    return SUPPORTED_EXTENSIONS.has(extname(filename).toLowerCase());
}
export function createFileWatcher(config) {
    const debounceMs = config.debounceMs ?? DEBOUNCE_MS;
    let watcher = null;
    const debounceTimers = new Map();
    function scheduleImport(filename) {
        // Clear existing timer for this file
        const existing = debounceTimers.get(filename);
        if (existing)
            clearTimeout(existing);
        debounceTimers.set(filename, setTimeout(async () => {
            debounceTimers.delete(filename);
            const filePath = join(config.watchDir, filename);
            const tableName = deriveTableName(filename);
            try {
                await config.importFn(filePath, tableName);
            }
            catch {
                // Silently ignore import errors (file may be mid-write)
            }
        }, debounceMs));
    }
    return {
        async start() {
            // Import existing files on startup
            const entries = await readdir(config.watchDir).catch(() => []);
            for (const entry of entries) {
                if (isImportable(entry)) {
                    scheduleImport(entry);
                }
            }
            // Watch for changes
            watcher = watch(config.watchDir, (eventType, filename) => {
                if (!filename || !isImportable(filename))
                    return;
                scheduleImport(filename);
            });
        },
        stop() {
            if (watcher) {
                watcher.close();
                watcher = null;
            }
            // Clear all pending debounce timers
            for (const timer of debounceTimers.values()) {
                clearTimeout(timer);
            }
            debounceTimers.clear();
        },
        getWatchDir() {
            return config.watchDir;
        },
    };
}
export { deriveTableName, isImportable };
//# sourceMappingURL=file-watcher.js.map