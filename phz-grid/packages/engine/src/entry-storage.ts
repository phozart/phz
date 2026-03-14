/**
 * @phozart/engine/storage — Storage-focused entry point
 *
 * Storage adapters for persisting engine state.
 */

// Storage Adapters
export { MemoryStorageAdapter, LocalStorageAdapter } from './storage-adapter.js';
export type { EngineStorageAdapter } from './storage-adapter.js';
