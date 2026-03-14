/**
 * @phozart/workspace — Workspace Client
 *
 * Consumer-facing client that wraps a WorkspaceAdapter with optional
 * ConsumerCapabilities to constrain what artifacts/widgets are available.
 */
export async function createWorkspaceClient(options) {
    await options.adapter.initialize();
    return {
        capabilities: options.capabilities,
        listArtifacts: (filter) => options.adapter.listArtifacts(filter),
        savePlacement: (placement) => options.adapter.savePlacement(placement),
        loadPlacements: (filter) => options.adapter.loadPlacements(filter),
        deletePlacement: (id) => options.adapter.deletePlacement(id),
    };
}
//# sourceMappingURL=workspace-client.js.map