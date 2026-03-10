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
/** Panels that need a DataAdapter (for execute, getSchema, etc.) */
export declare const PANELS_NEEDING_DATA_ADAPTER: readonly string[];
/** Panels that need a WorkspaceAdapter (for CRUD on artifacts) */
export declare const PANELS_NEEDING_WORKSPACE_ADAPTER: readonly string[];
export interface AdapterConfig {
    dataAdapter?: DataAdapter;
    workspaceAdapter?: WorkspaceAdapter;
}
export interface PanelBindings {
    [propName: string]: unknown;
}
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
export declare function getAdapterBindings(panelId: string, config: AdapterConfig): PanelBindings;
/**
 * Apply adapter bindings to a panel element imperatively.
 * Used when the workspace creates panel elements dynamically.
 */
export declare function forwardAdaptersToElement(el: HTMLElement, bindings: PanelBindings): void;
//# sourceMappingURL=adapter-forwarding.d.ts.map