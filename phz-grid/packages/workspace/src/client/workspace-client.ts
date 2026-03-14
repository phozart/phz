/**
 * @phozart/workspace — Workspace Client
 *
 * Consumer-facing client that wraps a WorkspaceAdapter with optional
 * ConsumerCapabilities to constrain what artifacts/widgets are available.
 */

import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { PlacementRecord } from '../placement.js';
import type { ArtifactMeta, ArtifactFilter, PlacementFilter, ViewerContext } from '../types.js';
import type { I18nProvider } from '../i18n/i18n-provider.js';

export interface ConsumerCapabilities {
  widgetTypes: string[];
  interactions: string[];
  maxNestingDepth: number;
  supportedLayoutTypes: string[];
  maxDataSources?: number;                  // default 1
  supportsSourceRelationships?: boolean;    // default false
}

export interface WorkspaceClientOptions {
  adapter: WorkspaceAdapter;
  capabilities?: ConsumerCapabilities;
  i18n?: I18nProvider;
  viewerContext?: ViewerContext;
}

export interface WorkspaceClient {
  capabilities: ConsumerCapabilities | undefined;
  listArtifacts(filter?: ArtifactFilter): Promise<ArtifactMeta[]>;
  savePlacement(placement: PlacementRecord): Promise<PlacementRecord>;
  loadPlacements(filter?: PlacementFilter): Promise<PlacementRecord[]>;
  deletePlacement(id: string): Promise<void>;
}

export async function createWorkspaceClient(options: WorkspaceClientOptions): Promise<WorkspaceClient> {
  await options.adapter.initialize();

  return {
    capabilities: options.capabilities,
    listArtifacts: (filter) => options.adapter.listArtifacts(filter),
    savePlacement: (placement) => options.adapter.savePlacement(placement),
    loadPlacements: (filter) => options.adapter.loadPlacements(filter),
    deletePlacement: (id) => options.adapter.deletePlacement(id as any),
  };
}
