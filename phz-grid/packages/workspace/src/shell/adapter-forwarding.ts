/**
 * adapter-forwarding — Pure logic for forwarding adapters to panel components.
 *
 * Determines which adapter properties each panel type needs and applies
 * them to the panel element. This is extracted from PhzWorkspace so the
 * logic is testable in Node without DOM.
 *
 * Task 1.6 (WB-001)
 */

import type { DataAdapter } from '../data-adapter.js';
import type { WorkspaceAdapter } from '../workspace-adapter.js';

// ═══════════════════════════════════════════════════════════════════════
// Panel → Adapter Mappings
// ═══════════════════════════════════════════════════════════════════════

/** Panels that need a DataAdapter (for execute, getSchema, etc.) */
export const PANELS_NEEDING_DATA_ADAPTER: readonly string[] = [
  'data-sources',
  'explore',
  'authoring-report',
  'authoring-dashboard',
  'engine-admin',
  'connectors',
];

/** Panels that need a WorkspaceAdapter (for CRUD on artifacts) */
export const PANELS_NEEDING_WORKSPACE_ADAPTER: readonly string[] = [
  'catalog',
  'authoring-catalog',
  'authoring-report',
  'authoring-dashboard',
  'alerts',
  'permissions',
];

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

export interface AdapterConfig {
  dataAdapter?: DataAdapter;
  workspaceAdapter?: WorkspaceAdapter;
}

export interface PanelBindings {
  [propName: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════
// Pure Functions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Determine which adapter properties to set on a panel component
 * based on the panel ID. Returns only the bindings that are defined
 * (skips undefined adapters).
 *
 * Naming convention:
 *  - `.adapter` is the primary adapter each component expects on its
 *    `@property({ attribute: false }) adapter` field.
 *    For data-centric panels this is the DataAdapter; for catalog-only
 *    panels this is the WorkspaceAdapter (ArtifactListProvider).
 *  - `.workspaceAdapter` is the secondary binding set when a panel
 *    needs *both* adapters (e.g. authoring editors that query data
 *    AND save artifacts).
 */
export function getAdapterBindings(
  panelId: string,
  config: AdapterConfig,
): PanelBindings {
  const bindings: PanelBindings = {};

  const needsData = PANELS_NEEDING_DATA_ADAPTER.includes(panelId);
  const needsWorkspace = PANELS_NEEDING_WORKSPACE_ADAPTER.includes(panelId);

  if (needsData && config.dataAdapter) {
    // Primary adapter = DataAdapter for data-centric panels
    bindings.adapter = config.dataAdapter;
  }

  if (needsWorkspace && config.workspaceAdapter) {
    bindings.workspaceAdapter = config.workspaceAdapter;

    // When no DataAdapter is needed, the component's `.adapter` property
    // expects the WorkspaceAdapter directly (e.g. phz-catalog-browser).
    if (!needsData) {
      bindings.adapter = config.workspaceAdapter;
    }
  }

  return bindings;
}

/**
 * Apply adapter bindings to a panel element imperatively.
 * Used when the workspace creates panel elements dynamically.
 */
export function forwardAdaptersToElement(
  el: HTMLElement,
  bindings: PanelBindings,
): void {
  for (const [key, value] of Object.entries(bindings)) {
    (el as unknown as Record<string, unknown>)[key] = value;
  }
}
