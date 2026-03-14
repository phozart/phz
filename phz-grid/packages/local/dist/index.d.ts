/**
 * @phozart/local — Lightweight Local Server
 *
 * Node.js server with native DuckDB and filesystem persistence
 * for the phz-grid workspace.
 */
export { createLocalServer, resolveConfig, type LocalServer, type LocalServerConfig, } from './local-server.js';
export { FsWorkspaceAdapter } from './adapters/fs-workspace-adapter.js';
export { DuckDBNativeAdapter, buildQuerySQL, type DuckDBBinding, } from './adapters/duckdb-native-adapter.js';
export { createFileWatcher, deriveTableName, isImportable, type FileWatcher, type FileWatcherConfig, type ImportFunction, } from './watchers/file-watcher.js';
//# sourceMappingURL=index.d.ts.map