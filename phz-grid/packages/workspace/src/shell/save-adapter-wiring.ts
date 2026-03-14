/**
 * @phozart/workspace — Save Adapter Wiring (L.4)
 *
 * Routes artifact saves to the correct WorkspaceAdapter method based on type.
 */

import type { WorkspaceAdapter } from '../workspace-adapter.js';
import type { ArtifactType } from '../types.js';

export async function saveToAdapter(
  adapter: WorkspaceAdapter,
  artifactType: ArtifactType,
  artifact: unknown,
): Promise<void> {
  switch (artifactType) {
    case 'report':
      await adapter.saveReport(artifact as any);
      break;
    case 'dashboard':
      await adapter.saveDashboard(artifact as any);
      break;
    case 'kpi':
      await adapter.saveKPI(artifact as any);
      break;
    case 'metric':
      await adapter.saveMetric(artifact as any);
      break;
    case 'grid-definition':
      await adapter.save(artifact as any);
      break;
    case 'filter-preset':
      await adapter.save(artifact as any);
      break;
    case 'alert-rule':
      if (!adapter.saveAlertRule) {
        throw new Error('Adapter does not support saveAlertRule');
      }
      await adapter.saveAlertRule(artifact as any);
      break;
    default:
      throw new Error(`Unknown artifact type: ${artifactType}`);
  }
}
