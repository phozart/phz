/**
 * @phozart/workspace — composeWorkspaceAdapter
 *
 * Composes existing EngineStorageAdapter + AsyncDefinitionStore instances
 * into a unified WorkspaceAdapter, adding placement/catalog methods
 * via in-memory defaults.
 */
import type { EngineStorageAdapter } from '@phozart/engine';
import type { AsyncDefinitionStore } from '@phozart/shared/definitions';
import type { WorkspaceAdapter } from '../workspace-adapter.js';
export interface ComposeOptions {
    engine?: EngineStorageAdapter;
    definitions?: AsyncDefinitionStore;
}
export declare function composeWorkspaceAdapter(options: ComposeOptions): WorkspaceAdapter;
//# sourceMappingURL=compose.d.ts.map