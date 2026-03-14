/**
 * @phozart/workspace — Save Adapter Wiring (L.4)
 *
 * Routes artifact saves to the correct WorkspaceAdapter method based on type.
 */
import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { ArtifactType } from '../types.js';
export declare function saveToAdapter(adapter: WorkspaceAdapter, artifactType: ArtifactType, artifact: unknown): Promise<void>;
//# sourceMappingURL=save-adapter-wiring.d.ts.map