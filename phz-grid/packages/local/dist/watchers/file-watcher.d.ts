/**
 * @phozart/phz-local — File Watcher (R.4)
 *
 * Watches a directory for CSV/Parquet/JSON files and auto-imports
 * them into DuckDB when they appear or change.
 * Debounces changes (500ms), ignores dot files.
 */
export type ImportFunction = (filePath: string, tableName: string) => Promise<void>;
export interface FileWatcherConfig {
    watchDir: string;
    importFn: ImportFunction;
    debounceMs?: number;
}
export interface FileWatcher {
    start(): Promise<void>;
    stop(): void;
    getWatchDir(): string;
}
declare function deriveTableName(filename: string): string;
declare function isImportable(filename: string): boolean;
export declare function createFileWatcher(config: FileWatcherConfig): FileWatcher;
export { deriveTableName, isImportable };
//# sourceMappingURL=file-watcher.d.ts.map