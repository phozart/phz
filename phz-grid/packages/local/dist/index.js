/**
 * @phozart/phz-local — Lightweight Local Server
 *
 * Node.js server with native DuckDB and filesystem persistence
 * for the phz-grid workspace.
 */
// Server
export { createLocalServer, resolveConfig, } from './local-server.js';
// Adapters
export { FsWorkspaceAdapter } from './adapters/fs-workspace-adapter.js';
export { DuckDBNativeAdapter, buildQuerySQL, } from './adapters/duckdb-native-adapter.js';
// File watcher
export { createFileWatcher, deriveTableName, isImportable, } from './watchers/file-watcher.js';
//# sourceMappingURL=index.js.map