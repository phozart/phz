/**
 * @phozart/phz-workspace — Save Adapter Wiring (L.4)
 *
 * Routes artifact saves to the correct WorkspaceAdapter method based on type.
 */
export async function saveToAdapter(adapter, artifactType, artifact) {
    switch (artifactType) {
        case 'report':
            await adapter.saveReport(artifact);
            break;
        case 'dashboard':
            await adapter.saveDashboard(artifact);
            break;
        case 'kpi':
            await adapter.saveKPI(artifact);
            break;
        case 'metric':
            await adapter.saveMetric(artifact);
            break;
        case 'grid-definition':
            await adapter.save(artifact);
            break;
        case 'filter-preset':
            await adapter.save(artifact);
            break;
        case 'alert-rule':
            if (!adapter.saveAlertRule) {
                throw new Error('Adapter does not support saveAlertRule');
            }
            await adapter.saveAlertRule(artifact);
            break;
        default:
            throw new Error(`Unknown artifact type: ${artifactType}`);
    }
}
//# sourceMappingURL=save-adapter-wiring.js.map